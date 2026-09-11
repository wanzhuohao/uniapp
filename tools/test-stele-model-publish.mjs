import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { mkdtempSync } from 'node:fs'
import {
  buildGuard,
  countTopology,
  computeReportProjectionSha256,
  computeReleaseSetSha256,
  publishRelease,
  processMayBeAlive,
  requireOfficialValidatorVersion,
} from './stele-models/validate-and-publish.mjs'
import { createTemplateArtifacts } from './stele-models/generate-template.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function collectJsonStringsAndKeys(value, output = { strings: [], keys: [] }) {
  if (typeof value === 'string') {
    output.strings.push(value)
    return output
  }
  if (Array.isArray(value)) {
    for (const item of value) collectJsonStringsAndKeys(item, output)
    return output
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      output.keys.push(key)
      collectJsonStringsAndKeys(child, output)
    }
  }
  return output
}

function normalizedPathText(value) {
  return String(value).replaceAll('\\', '/').toLowerCase()
}

function assertNoPathOrDiagnosticLeak(value, sandboxRoot, message) {
  const output = collectJsonStringsAndKeys(value)
  const normalizedRoot = normalizedPathText(sandboxRoot)
  assert.equal(output.strings.some(item => normalizedPathText(item).includes(normalizedRoot)), false, message)
  assert.equal(output.keys.some(key => ['stack', 'detail'].includes(key.toLowerCase())), false, message)
}

async function waitForFile(path, timeoutMs = 5000) {
  const startedAt = Date.now()
  while (!existsSync(path)) {
    if (Date.now() - startedAt > timeoutMs) throw new Error(`等待文件超时: ${path}`)
    await new Promise(resolvePromise => setTimeout(resolvePromise, 20))
  }
}

async function waitForChild(child) {
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', chunk => { stdout += chunk })
  child.stderr.on('data', chunk => { stderr += chunk })
  const exitCode = await new Promise((resolvePromise, reject) => {
    child.once('error', reject)
    child.once('exit', resolvePromise)
  })
  return { exitCode, stdout, stderr }
}

function createSandbox() {
  const root = resolve(mkdtempSync(join(tmpdir(), 'stele-publish-test-')))
  const repoRoot = join(root, 'repo')
  const exportsDir = join(root, 'exports')
  const sourcePhotosDir = join(root, 'source-photos')
  mkdirSync(repoRoot, { recursive: true })
  mkdirSync(exportsDir, { recursive: true })
  mkdirSync(sourcePhotosDir, { recursive: true })
  const artifacts = createTemplateArtifacts()
  writeFileSync(join(exportsDir, `${artifacts.metrics.templateId}.glb`), artifacts.glb)
  writeFileSync(join(exportsDir, `${artifacts.metrics.templateId}.stl`), artifacts.stl)
  return { root, repoRoot, exportsDir, sourcePhotosDir, artifacts }
}

function rewriteGlbJson(glb, mutate) {
  const jsonLength = glb.readUInt32LE(12)
  const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'))
  mutate(json)
  let jsonBytes = Buffer.from(JSON.stringify(json), 'utf8')
  jsonBytes = Buffer.concat([jsonBytes, Buffer.alloc((4 - jsonBytes.length % 4) % 4, 0x20)])
  const oldBinHeader = 20 + jsonLength
  const binLength = glb.readUInt32LE(oldBinHeader)
  const bin = glb.subarray(oldBinHeader + 8, oldBinHeader + 8 + binLength)
  const rewritten = Buffer.alloc(12 + 8 + jsonBytes.length + 8 + bin.length)
  rewritten.writeUInt32LE(0x46546c67, 0)
  rewritten.writeUInt32LE(2, 4)
  rewritten.writeUInt32LE(rewritten.length, 8)
  rewritten.writeUInt32LE(jsonBytes.length, 12)
  rewritten.writeUInt32LE(0x4e4f534a, 16)
  jsonBytes.copy(rewritten, 20)
  const binHeader = 20 + jsonBytes.length
  rewritten.writeUInt32LE(bin.length, binHeader)
  rewritten.writeUInt32LE(0x004e4942, binHeader + 4)
  bin.copy(rewritten, binHeader + 8)
  return rewritten
}

async function withSandbox(fn) {
  const sandbox = createSandbox()
  try {
    await fn(sandbox)
  } finally {
    const safeRoot = resolve(tmpdir())
    assert.ok(sandbox.root.startsWith(`${safeRoot}\\`) || sandbox.root.startsWith(`${safeRoot}/`))
    rmSync(sandbox.root, { recursive: true, force: true })
  }
}

async function test(name, fn) {
  try {
    await fn()
    console.log(`✓ ${name}`)
    return true
  } catch (error) {
    console.error(`✗ ${name}: ${error.stack || error.message}`)
    return false
  }
}

const results = []

results.push(await test('脱敏断言能识别 Windows 路径转义和诊断字段', async () => {
  const sandboxRoot = 'C:\\Temp\\stele-publish-test-case'
  assert.throws(
    () => assertNoPathOrDiagnosticLeak({ error: { message: sandboxRoot } }, sandboxRoot, '路径泄漏'),
    /路径泄漏/,
  )
  assert.throws(
    () => assertNoPathOrDiagnosticLeak({ error: { stack: 'internal trace' } }, sandboxRoot, '诊断字段泄漏'),
    /诊断字段泄漏/,
  )
  assert.doesNotThrow(() => assertNoPathOrDiagnosticLeak({ error: { message: '输入文件不合法' } }, sandboxRoot, '安全输出'))
}))

results.push(await test('参数化生成结果可重复且不读取照片', async () => {
  const first = createTemplateArtifacts()
  const second = createTemplateArtifacts()
  assert.deepEqual(first.glb, second.glb)
  assert.deepEqual(first.stl, second.stl)
  assert.equal(first.metrics.sourcePhotosRead, false)
  assert.equal(first.metrics.triangleCount, 132)
  assert.deepEqual(first.metrics.boundsMm, { x: 140, y: 26, z: 160 })
  assert.equal(first.metrics.geometrySha256, 'c01194239cabd72ac659b6d919e5340b7eb498d3a66bf1373fad0b402c9cbcaa')
  assert.equal(first.metrics.glb.sha256, 'aa0a390b3f893d883ce33d878e283f45dc5bc29fd5e82fd0fd356de6a8a4f6bd')
  assert.equal(first.metrics.stl.sha256, '409a716fcd8be4bb2b2d179abac594829552d01870414f1ee9292159b4e9030d')
  assert.equal(readFileSync(join(REPO_ROOT, 'tools', 'stele-models', 'generate-template.mjs'), 'utf8').includes('source-photos'), false)
}))

results.push(await test('生成器 CLI 拒绝改写固定 exports 以外的目录', async () => {
  const result = spawnSync(process.execPath, [join(REPO_ROOT, 'tools', 'stele-models', 'generate-template.mjs'), join(REPO_ROOT, 'static')], { encoding: 'utf8' })
  assert.equal(result.status, 64)
  assert.match(result.stderr, /仅允许写入固定 exports 目录/)
}))

results.push(await test('官方校验器缺少版本证据时失败关闭', async () => {
  assert.throws(() => requireOfficialValidatorVersion({ validatorVersion: '' }), /glTF Validator 未返回可核验的版本号/)
  assert.throws(() => requireOfficialValidatorVersion({}), /glTF Validator 未返回可核验的版本号/)
}))

results.push(await test('格式正确但结构损坏的 policy 不会阻断失败报告输出', async () => {
  const fixtureRoot = mkdtempSync(join(REPO_ROOT, 'tools', '.stele-policy-test-'))
  try {
    for (const fileName of [
      'generate-template.mjs',
      'publish-report-v1.schema.json',
      'publish-errors-v1.json',
      'validate-and-publish.mjs',
    ]) {
      cpSync(join(REPO_ROOT, 'tools', 'stele-models', fileName), join(fixtureRoot, fileName))
    }
    writeFileSync(join(fixtureRoot, 'model-policy-v1.json'), '{"publishing":null}\n')
    const result = spawnSync(process.execPath, [join(fixtureRoot, 'validate-and-publish.mjs')], { encoding: 'utf8' })
    assert.equal(result.status, 4, result.stderr)
    const output = JSON.parse(result.stdout)
    assert.equal(output.exitCode, 4)
    assert.equal(output.error.code, 'BUILD_GUARD_FAILED')
    assert.equal(output.report.summary.failureCount, 1)
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
}))

results.push(await test('进程探测只有 ESRCH 可证明停止，EPERM 必须按可能存活处理', async () => {
  assert.equal(processMayBeAlive(123, () => { const error = new Error('missing'); error.code = 'ESRCH'; throw error }), false)
  assert.equal(processMayBeAlive(123, () => { const error = new Error('denied'); error.code = 'EPERM'; throw error }), true)
  assert.equal(processMayBeAlive(123, () => {}), true)
}))

results.push(await test('首次发布一次出现 GLB、STL 和完整报告', () => withSandbox(async sandbox => {
  const result = await publishRelease(sandbox)
  assert.equal(result.exitCode, 0)
  const releaseDir = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', result.releaseId)
  assert.equal(existsSync(join(releaseDir, `${sandbox.artifacts.metrics.templateId}.glb`)), true)
  assert.equal(existsSync(join(releaseDir, `${sandbox.artifacts.metrics.templateId}.stl`)), true)
  assert.equal(existsSync(join(releaseDir, 'publish-report.json')), true)
  const report = JSON.parse(readFileSync(join(releaseDir, 'publish-report.json'), 'utf8'))
  assert.match(report.toolVersions.gltfValidator, /^2\.0\.0/)
  assert.equal(existsSync(join(sandbox.repoRoot, '.stele-publish', 'active')), false)
})))

results.push(await test('相同 release 再发布在创建 active 前幂等 no-op', () => withSandbox(async sandbox => {
  const first = await publishRelease(sandbox)
  const reportPath = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', first.releaseId, 'publish-report.json')
  const before = readFileSync(reportPath)
  const second = await publishRelease(sandbox)
  assert.equal(second.exitCode, 0)
  assert.equal(second.idempotent, true)
  assert.deepEqual(readFileSync(reportPath), before)
  assert.equal(existsSync(join(sandbox.repoRoot, '.stele-publish', 'active')), false)
})))

results.push(await test('报告投影只排除 before/after 两个自引用字段', async () => {
  const report = {
    schemaVersion: 1,
    summary: {
      targetBeforeSha256: '0'.repeat(64),
      targetAfterSha256: '1'.repeat(64),
      assetSetSha256: '2'.repeat(64),
    },
    nested: { z: 1, a: '绑定内容' },
  }
  const original = computeReportProjectionSha256(report)
  const targetOnly = structuredClone(report)
  targetOnly.summary.targetBeforeSha256 = 'a'.repeat(64)
  targetOnly.summary.targetAfterSha256 = 'b'.repeat(64)
  assert.equal(computeReportProjectionSha256(targetOnly), original)
  const changed = structuredClone(report)
  changed.nested.a = '已篡改'
  assert.notEqual(computeReportProjectionSha256(changed), original)
}))

const modelFileNames = ['stele-template-classic-v1.glb', 'stele-template-classic-v1.stl']
const completeReleaseFileNames = ['publish-report.json', ...modelFileNames].sort()
const crashExpectations = {
  'after-first-copy': { journalState: 'PREPARING', stageFiles: [modelFileNames[0]], publicFiles: null, currentSet: 'before' },
  'after-report': { journalState: 'PREPARING', stageFiles: completeReleaseFileNames, publicFiles: null, currentSet: 'before' },
  'after-staged': { journalState: 'STAGED', stageFiles: completeReleaseFileNames, publicFiles: null, currentSet: 'before' },
  'after-rename': { journalState: 'STAGED', stageFiles: null, publicFiles: completeReleaseFileNames, currentSet: 'after' },
  'after-published': { journalState: 'PUBLISHED', stageFiles: null, publicFiles: completeReleaseFileNames, currentSet: 'after' },
}

for (const [faultAt, expected] of Object.entries(crashExpectations)) {
  results.push(await test(`${faultAt} 独立进程崩溃现场与恢复终态唯一可判定`, () => withSandbox(async sandbox => {
    const transactionId = `txn-fault-${faultAt}`
    const before = await computeReleaseSetSha256(sandbox.repoRoot)
    const childScript = `
      const { publishRelease } = await import(process.env.STELE_MODULE_URL)
      const options = JSON.parse(process.env.STELE_CHILD_OPTIONS)
      await publishRelease(options)
    `
    const crashed = spawnSync(process.execPath, ['--input-type=module', '-e', childScript], {
      env: {
        ...process.env,
        STELE_MODULE_URL: pathToFileURL(join(REPO_ROOT, 'tools', 'stele-models', 'validate-and-publish.mjs')).href,
        STELE_CHILD_OPTIONS: JSON.stringify({
          repoRoot: sandbox.repoRoot,
          exportsDir: sandbox.exportsDir,
          sourcePhotosDir: sandbox.sourcePhotosDir,
          faultAt,
          transactionId,
        }),
      },
      encoding: 'utf8',
    })
    assert.equal(crashed.status, 1, crashed.stderr)
    assert.equal(crashed.stdout, '')
    const crashMessage = crashed.stderr.match(/^Error: (SIMULATED_CRASH:[^\r\n]+)$/m)?.[1]
    assert.equal(crashMessage, `SIMULATED_CRASH:${faultAt}`)

    const activeRoot = join(sandbox.repoRoot, '.stele-publish', 'active')
    const owner = JSON.parse(readFileSync(join(activeRoot, 'owner.json'), 'utf8'))
    const journal = JSON.parse(readFileSync(join(activeRoot, 'journal.json'), 'utf8'))
    assert.equal(owner.transactionId, transactionId)
    assert.equal(Number.isInteger(owner.pid) && owner.pid > 0, true)
    assert.equal(journal.transactionId, transactionId)
    assert.equal(journal.state, expected.journalState)
    assert.equal(journal.targetBeforeSha256, before)
    const stageRelease = join(activeRoot, 'stage', journal.releaseId)
    const publicRelease = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', journal.releaseId)
    assert.deepEqual(existsSync(stageRelease) ? readdirSync(stageRelease).sort() : null, expected.stageFiles)
    assert.deepEqual(existsSync(publicRelease) ? readdirSync(publicRelease).sort() : null, expected.publicFiles)

    const visibleReportPath = existsSync(join(stageRelease, 'publish-report.json'))
      ? join(stageRelease, 'publish-report.json')
      : join(publicRelease, 'publish-report.json')
    const visibleReport = existsSync(visibleReportPath)
      ? JSON.parse(readFileSync(visibleReportPath, 'utf8'))
      : null
    const stagedAfter = visibleReport?.summary.targetAfterSha256 || null
    if (visibleReport) assert.equal(visibleReport.summary.targetBeforeSha256, before)
    const currentSet = await computeReleaseSetSha256(sandbox.repoRoot)
    assert.equal(currentSet, expected.currentSet === 'before' ? before : stagedAfter)
    if (expected.journalState === 'PREPARING') assert.equal(journal.targetAfterSha256, '0'.repeat(64))
    else assert.equal(journal.targetAfterSha256, stagedAfter)

    const recovered = await publishRelease({
      ...sandbox,
      recoveryTransactionId: transactionId,
      transactionId: `${transactionId}-recovery`,
    })
    assert.equal(recovered.exitCode, 0)
    assert.equal(recovered.idempotent, faultAt === 'after-published')
    assert.equal(existsSync(activeRoot), false)
    const finalRelease = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', recovered.releaseId)
    assert.deepEqual(readdirSync(finalRelease).sort(), completeReleaseFileNames)
    const finalReport = JSON.parse(readFileSync(join(finalRelease, 'publish-report.json'), 'utf8'))
    assert.equal(finalReport.summary.targetBeforeSha256, before)
    assert.equal(await computeReleaseSetSha256(sandbox.repoRoot), finalReport.summary.targetAfterSha256)
    const receiptsRoot = join(sandbox.repoRoot, '.stele-publish', 'receipts')
    const expectedReceiptTransactionId = faultAt === 'after-published' ? transactionId : `${transactionId}-recovery`
    const expectedReceiptName = `${recovered.releaseId}-${expectedReceiptTransactionId}`
    assert.deepEqual(readdirSync(receiptsRoot).sort(), [expectedReceiptName])
    const receiptRoot = join(receiptsRoot, expectedReceiptName)
    const receiptOwner = JSON.parse(readFileSync(join(receiptRoot, 'owner.json'), 'utf8'))
    const receiptJournal = JSON.parse(readFileSync(join(receiptRoot, 'journal.json'), 'utf8'))
    assert.equal(receiptOwner.transactionId, expectedReceiptTransactionId)
    assert.equal(receiptJournal.transactionId, expectedReceiptTransactionId)
    assert.equal(receiptJournal.state, 'PUBLISHED')
    assert.equal(receiptJournal.targetBeforeSha256, before)
    assert.equal(receiptJournal.targetAfterSha256, finalReport.summary.targetAfterSha256)
  })))
}

const controlledFailureExpectations = {
  'after-first-copy': 'STAGING_COPY_FAILED',
  'before-rename': 'TARGET_SWITCH_FAILED',
  'after-rename': 'TARGET_SWITCH_FAILED',
}

for (const [failureAt, expectedCode] of Object.entries(controlledFailureExpectations)) {
  results.push(await test(`${failureAt} 可恢复失败会输出闭合失败报告且公开集合不变`, () => withSandbox(async sandbox => {
    const before = await computeReleaseSetSha256(sandbox.repoRoot)
    const result = await publishRelease({ ...sandbox, failureAt, transactionId: `txn-failure-${failureAt}` })
    const after = await computeReleaseSetSha256(sandbox.repoRoot)
    assert.equal(result.exitCode, 3)
    assert.equal(result.error.code, expectedCode)
    assert.equal(result.report.summary.failureCount, 1)
    assert.equal(result.report.summary.targetBeforeSha256, before)
    assert.equal(result.report.summary.targetAfterSha256, before)
    assert.equal(after, before)
    const activeRoot = join(sandbox.repoRoot, '.stele-publish', 'active')
    assert.equal(existsSync(activeRoot), false)
    assert.equal(existsSync(join(activeRoot, 'stage')), false)
    assert.equal(existsSync(join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', result.report.releaseId)), false)
    assertNoPathOrDiagnosticLeak(result, sandbox.root, `${failureAt} 输出不得泄漏路径或诊断字段`)
  })))
}

results.push(await test('暂存复制发生原生文件错误时归类为 STAGING_COPY_FAILED', () => withSandbox(async sandbox => {
  const before = await computeReleaseSetSha256(sandbox.repoRoot)
  const result = await publishRelease({
    ...sandbox,
    afterOwnerAcquired: () => {
      rmSync(join(sandbox.exportsDir, `${sandbox.artifacts.metrics.templateId}.stl`))
    },
  })
  assert.equal(result.exitCode, 3)
  assert.equal(result.error.code, 'STAGING_COPY_FAILED')
  assert.equal(result.report.summary.targetBeforeSha256, before)
  assert.equal(result.report.summary.targetAfterSha256, before)
  assert.equal(existsSync(join(sandbox.repoRoot, '.stele-publish', 'active')), false)
})))

results.push(await test('报告原子写入发生原生文件错误时归类为 REPORT_WRITE_FAILED', () => withSandbox(async sandbox => {
  const before = await computeReleaseSetSha256(sandbox.repoRoot)
  const result = await publishRelease({
    ...sandbox,
    beforeReportWrite: ({ reportPath }) => {
      mkdirSync(reportPath)
    },
  })
  assert.equal(result.exitCode, 3)
  assert.equal(result.error.code, 'REPORT_WRITE_FAILED')
  assert.equal(result.report.summary.targetBeforeSha256, before)
  assert.equal(result.report.summary.targetAfterSha256, before)
  assert.equal(existsSync(join(sandbox.repoRoot, '.stele-publish', 'active')), false)
})))

results.push(await test('真实双进程发布时活事务不会被第二进程恢复或删除', () => withSandbox(async sandbox => {
  const readyPath = join(sandbox.root, 'owner-ready')
  const childOptions = {
    repoRoot: sandbox.repoRoot,
    exportsDir: sandbox.exportsDir,
    sourcePhotosDir: sandbox.sourcePhotosDir,
  }
  const childScript = `
    const { writeFileSync } = await import('node:fs')
    const { publishRelease } = await import(process.env.STELE_MODULE_URL)
    const options = JSON.parse(process.env.STELE_CHILD_OPTIONS)
    const result = await publishRelease({
      ...options,
      transactionId: 'txn-live-child',
      afterOwnerAcquired: async () => {
        writeFileSync(process.env.STELE_READY_PATH, 'ready')
        await new Promise(resolve => setTimeout(resolve, 1800))
      },
    })
    process.stdout.write(JSON.stringify(result))
    process.exitCode = result.exitCode
  `
  const child = spawn(process.execPath, ['--input-type=module', '-e', childScript], {
    env: {
      ...process.env,
      STELE_MODULE_URL: pathToFileURL(join(REPO_ROOT, 'tools', 'stele-models', 'validate-and-publish.mjs')).href,
      STELE_CHILD_OPTIONS: JSON.stringify(childOptions),
      STELE_READY_PATH: readyPath,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  await waitForFile(readyPath)
  const activeRoot = join(sandbox.repoRoot, '.stele-publish', 'active')
  const second = await publishRelease(sandbox)
  assert.equal(second.exitCode, 4)
  assert.equal(second.report.summary.failureCount, 1)
  assert.equal(existsSync(activeRoot), true)
  const childResult = await waitForChild(child)
  assert.equal(childResult.exitCode, 0, childResult.stderr)
  assert.equal(JSON.parse(childResult.stdout).exitCode, 0)
  assert.equal(existsSync(activeRoot), false)
  assert.equal((await publishRelease(sandbox)).idempotent, true)
})))

results.push(await test('共边共面三角形在共享边外重叠会计为自交', async () => {
  const left = [[0, 0, 0], [2, 0, 0], [0, 2, 0]]
  const overlapping = [[2, 0, 0], [0, 0, 0], [1, 1, 0]]
  const adjacent = [[2, 0, 0], [0, 0, 0], [1, -1, 0]]
  assert.equal(countTopology([left, overlapping]).selfIntersectionPairCount, 1)
  assert.equal(countTopology([left, adjacent]).selfIntersectionPairCount, 0)
  const outer = [[0, 0, 0], [2, 0, 0], [0, 2, 0]]
  const boundaryInset = [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  assert.equal(countTopology([outer, boundaryInset]).selfIntersectionPairCount, 1)
}))

results.push(await test('拓扑计数覆盖重复、边界、非流形、方向冲突和额外连通壳', async () => {
  const a = [0, 0, 0]
  const b = [1, 0, 0]
  const c = [0, 1, 0]
  const d = [0, -1, 0]
  const e = [0, 0, 1]
  const single = countTopology([[a, b, c]])
  assert.equal(single.boundaryEdgeCount, 3)
  assert.equal(countTopology([[a, b, c], [a, b, c]]).duplicateTriangleCount, 1)
  assert.ok(countTopology([[a, b, c], [a, b, d]]).orientationConflictCount > 0)
  assert.ok(countTopology([[a, b, c], [b, a, d], [a, b, e]]).nonManifoldEdgeCount > 0)
  assert.equal(countTopology([[a, b, c], [[10, 0, 0], [11, 0, 0], [10, 1, 0]]]).extraConnectedShellCount, 1)
}))

results.push(await test('GLB 闭合白名单逐类恶意样本均失败且不改变公开集合', async () => {
  const mutations = [
    ['未知 JSON 字符串', glb => rewriteGlbJson(glb, json => { json.asset.version = '2.0-private' })],
    ['自定义属性键', glb => rewriteGlbJson(glb, json => { json.meshes[0].primitives[0].attributes.COLOR_0 = 1 })],
    ['未知扩展', glb => rewriteGlbJson(glb, json => { json.extensionsUsed = ['KHR_private'] })],
    ['外链 URI', glb => rewriteGlbJson(glb, json => { json.buffers[0].uri = 'https://invalid.example/model.bin' })],
    ['未知 chunk', glb => {
      const result = Buffer.from(glb)
      const jsonLength = result.readUInt32LE(12)
      result.writeUInt32LE(0x12345678, 20 + jsonLength + 4)
      return result
    }],
    ['非零空洞', glb => rewriteGlbJson(glb, json => {
      json.bufferViews[1].byteOffset += 4
      json.bufferViews[1].byteLength -= 4
    })],
    ['不可达 bufferView', glb => rewriteGlbJson(glb, json => { json.bufferViews.push({ ...json.bufferViews[1] }) })],
    ['容器尾部', glb => Buffer.concat([glb, Buffer.alloc(4, 1)])],
  ]
  for (const [name, mutate] of mutations) {
    await withSandbox(async sandbox => {
      const glbPath = join(sandbox.exportsDir, `${sandbox.artifacts.metrics.templateId}.glb`)
      writeFileSync(glbPath, mutate(readFileSync(glbPath)))
      const before = await computeReleaseSetSha256(sandbox.repoRoot)
      const result = await publishRelease(sandbox)
      const after = await computeReleaseSetSha256(sandbox.repoRoot)
      assert.notEqual(result.exitCode, 0, name)
      assert.equal(result.report.summary.failureCount, 1, name)
      assert.equal(result.report.summary.targetBeforeSha256, before, name)
      assert.equal(result.report.summary.targetAfterSha256, before, name)
      assert.equal(after, before, name)
      assertNoPathOrDiagnosticLeak(result, sandbox.root, `${name} 输出不得泄漏路径或诊断字段`)
    })
  }
}))

results.push(await test('STAGED 时暂存和公开目录同时存在会失败关闭', () => withSandbox(async sandbox => {
  const transactionId = 'txn-impossible-staged-state'
  await assert.rejects(() => publishRelease({ ...sandbox, faultAt: 'after-staged', transactionId }), /SIMULATED_CRASH/)
  const activeRoot = join(sandbox.repoRoot, '.stele-publish', 'active')
  const journal = JSON.parse(readFileSync(join(activeRoot, 'journal.json'), 'utf8'))
  const stageRelease = join(activeRoot, 'stage', journal.releaseId)
  const publicRelease = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', journal.releaseId)
  cpSync(stageRelease, publicRelease, { recursive: true })
  const recovered = await publishRelease({ ...sandbox, recoveryTransactionId: transactionId })
  assert.equal(recovered.exitCode, 4)
  assert.equal(recovered.error.code, 'TRANSACTION_RECOVERY_FAILED')
  assert.equal(existsSync(activeRoot), true)
})))

results.push(await test('同 release 的公开内容被篡改时拒绝覆盖', () => withSandbox(async sandbox => {
  const first = await publishRelease(sandbox)
  const glbPath = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', first.releaseId, `${sandbox.artifacts.metrics.templateId}.glb`)
  const tampered = readFileSync(glbPath)
  tampered[tampered.length - 1] ^= 1
  writeFileSync(glbPath, tampered)
  const second = await publishRelease(sandbox)
  assert.equal(second.exitCode, 4)
  assert.equal(second.error.code, 'TRANSACTION_RECOVERY_FAILED')
})))

results.push(await test('GLB 未知元数据字段默认拒绝', () => withSandbox(async sandbox => {
  const glbPath = join(sandbox.exportsDir, `${sandbox.artifacts.metrics.templateId}.glb`)
  writeFileSync(glbPath, rewriteGlbJson(readFileSync(glbPath), json => { json.asset.generator = 'local-private-tool' }))
  const result = await publishRelease(sandbox)
  assert.equal(result.exitCode, 2)
  assert.equal(result.error.code, 'GLB_JSON_INVALID')
})))

results.push(await test('STL 非零 attribute byte count 默认拒绝', () => withSandbox(async sandbox => {
  const stlPath = join(sandbox.exportsDir, `${sandbox.artifacts.metrics.templateId}.stl`)
  const stl = readFileSync(stlPath)
  stl.writeUInt16LE(1, 84 + 48)
  writeFileSync(stlPath, stl)
  const result = await publishRelease(sandbox)
  assert.equal(result.exitCode, 2)
  assert.equal(result.error.code, 'MESH_TOPOLOGY_INVALID')
})))

results.push(await test('STL 文件名、长度、有限坐标和退化面反例均输出失败报告且不发布', async () => {
  const mutations = [
    ['非匿名文件名', sandbox => {
      const from = join(sandbox.exportsDir, `${sandbox.artifacts.metrics.templateId}.stl`)
      renameSync(from, join(sandbox.exportsDir, 'private-name.stl'))
    }],
    ['容器尾部', sandbox => {
      const path = join(sandbox.exportsDir, `${sandbox.artifacts.metrics.templateId}.stl`)
      writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.from([1])]))
    }],
    ['非有限坐标', sandbox => {
      const path = join(sandbox.exportsDir, `${sandbox.artifacts.metrics.templateId}.stl`)
      const stl = readFileSync(path)
      stl.writeFloatLE(Number.NaN, 84 + 12)
      writeFileSync(path, stl)
    }],
    ['退化面', sandbox => {
      const path = join(sandbox.exportsDir, `${sandbox.artifacts.metrics.templateId}.stl`)
      const stl = readFileSync(path)
      const firstPoint = Buffer.from(stl.subarray(84 + 12, 84 + 24))
      firstPoint.copy(stl, 84 + 24)
      firstPoint.copy(stl, 84 + 36)
      writeFileSync(path, stl)
    }],
  ]
  for (const [name, mutate] of mutations) {
    await withSandbox(async sandbox => {
      mutate(sandbox)
      const before = await computeReleaseSetSha256(sandbox.repoRoot)
      const result = await publishRelease(sandbox)
      const after = await computeReleaseSetSha256(sandbox.repoRoot)
      assert.notEqual(result.exitCode, 0, name)
      assert.equal(result.report.summary.failureCount, 1, name)
      assert.equal(result.report.summary.targetBeforeSha256, before, name)
      assert.equal(result.report.summary.targetAfterSha256, before, name)
      assert.equal(after, before, name)
    })
  }
}))

results.push(await test('GLB/STL 几何摘要不一致时整批拒绝', () => withSandbox(async sandbox => {
  const glbPath = join(sandbox.exportsDir, `${sandbox.artifacts.metrics.templateId}.glb`)
  const glb = readFileSync(glbPath)
  const jsonLength = glb.readUInt32LE(12)
  const positionOffset = 20 + jsonLength + 8
  glb.writeFloatLE(glb.readFloatLE(positionOffset) + 0.001, positionOffset)
  writeFileSync(glbPath, glb)
  const result = await publishRelease(sandbox)
  assert.equal(result.exitCode, 2)
  assert.ok(['GLB_CONTAINER_INVALID', 'GLB_BINARY_INVALID', 'GEOMETRY_MISMATCH'].includes(result.error.code))
})))

results.push(await test('exports 出现第三个文件时拒绝猜测输入', () => withSandbox(async sandbox => {
  writeFileSync(join(sandbox.exportsDir, 'notes.txt'), 'unexpected')
  const result = await publishRelease(sandbox)
  assert.equal(result.exitCode, 2)
  assert.equal(result.error.code, 'INPUT_SET_INVALID')
})))

results.push(await test('原生 ENOENT 按输入错误归类且失败报告不伪造集合哈希', () => withSandbox(async sandbox => {
  rmSync(sandbox.exportsDir, { recursive: true })
  const before = await computeReleaseSetSha256(sandbox.repoRoot)
  const result = await publishRelease(sandbox)
  assert.equal(result.exitCode, 2)
  assert.equal(result.error.code, 'INPUT_SET_INVALID')
  assert.equal(result.report.summary.targetBeforeSha256, before)
  assert.equal(result.report.summary.targetAfterSha256, before)
})))

results.push(await test('缺失 owner 的活动事务失败关闭并记录真实集合快照', () => withSandbox(async sandbox => {
  mkdirSync(join(sandbox.repoRoot, '.stele-publish', 'active'), { recursive: true })
  const before = await computeReleaseSetSha256(sandbox.repoRoot)
  const result = await publishRelease(sandbox)
  assert.equal(result.exitCode, 4)
  assert.equal(result.error.code, 'TRANSACTION_RECOVERY_FAILED')
  assert.equal(result.report.summary.targetBeforeSha256, before)
  assert.equal(result.report.summary.targetAfterSha256, before)
  assert.notEqual(before, '0'.repeat(64))
})))

results.push(await test('存在活动事务时构建门禁失败', () => withSandbox(async sandbox => {
  await publishRelease(sandbox)
  mkdirSync(join(sandbox.repoRoot, '.stele-publish', 'active'), { recursive: true })
  const result = await buildGuard(sandbox)
  assert.equal(result.exitCode, 4)
  assert.equal(result.error.code, 'BUILD_GUARD_FAILED')
})))

results.push(await test('构建门禁校验配置、报告、资产和空照片目录', () => withSandbox(async sandbox => {
  const published = await publishRelease(sandbox)
  const releaseDir = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', published.releaseId)
  const report = JSON.parse(readFileSync(join(releaseDir, 'publish-report.json'), 'utf8'))
  const template = report.templates[0]
  const configDir = join(sandbox.repoRoot, 'utils', 'stele')
  mkdirSync(configDir, { recursive: true })
  writeFileSync(join(configDir, 'model-templates.json'), `${JSON.stringify([{
    id: template.id,
    name: '经典圆拱碑型',
    description: '无字参数化范本',
    sourceKind: 'parametric-generic',
    sourceNotice: '参数化通用设计，非真实石碑或照片复刻',
    parameterVersion: template.parameterVersion,
    releaseId: published.releaseId,
    glbUrl: `/static/models/stele/releases/${published.releaseId}/${template.files.find(file => file.format === 'glb').name}`,
    stlUrl: `/static/models/stele/releases/${published.releaseId}/${template.files.find(file => file.format === 'stl').name}`,
    boundsMm: { x: template.boundsMm.x, y: template.boundsMm.y, z: template.boundsMm.z },
    triangleCount: sandbox.artifacts.metrics.triangleCount,
    geometrySha256: template.geometrySha256,
    sha256: {
      glb: template.files.find(file => file.format === 'glb').sha256,
      stl: template.files.find(file => file.format === 'stl').sha256,
    },
  }], null, 2)}\n`)
  assert.equal((await buildGuard(sandbox)).exitCode, 0)
  writeFileSync(join(sandbox.sourcePhotosDir, 'photo.jpg'), 'not-a-real-photo')
  assert.equal((await buildGuard(sandbox)).exitCode, 4)
})))

results.push(await test('构建产物只允许已报告的匿名模型与报告', () => withSandbox(async sandbox => {
  const published = await publishRelease(sandbox)
  const releaseSource = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', published.releaseId)
  const report = JSON.parse(readFileSync(join(releaseSource, 'publish-report.json'), 'utf8'))
  const template = report.templates[0]
  const configDir = join(sandbox.repoRoot, 'utils', 'stele')
  mkdirSync(configDir, { recursive: true })
  writeFileSync(join(configDir, 'model-templates.json'), `${JSON.stringify([{
    id: template.id,
    name: '经典圆拱碑型',
    description: '无字参数化范本',
    sourceKind: 'parametric-generic',
    sourceNotice: '参数化通用设计，非真实石碑或照片复刻',
    parameterVersion: template.parameterVersion,
    releaseId: published.releaseId,
    glbUrl: `/static/models/stele/releases/${published.releaseId}/${template.files.find(file => file.format === 'glb').name}`,
    stlUrl: `/static/models/stele/releases/${published.releaseId}/${template.files.find(file => file.format === 'stl').name}`,
    boundsMm: { x: template.boundsMm.x, y: template.boundsMm.y, z: template.boundsMm.z },
    triangleCount: sandbox.artifacts.metrics.triangleCount,
    geometrySha256: template.geometrySha256,
    sha256: { glb: template.files[0].sha256, stl: template.files[1].sha256 },
  }], null, 2)}\n`)
  const outputRelease = join(sandbox.root, 'web', 'static', 'models', 'stele', 'releases', published.releaseId)
  mkdirSync(outputRelease, { recursive: true })
  for (const fileName of readdirSync(releaseSource)) writeFileSync(join(outputRelease, fileName), readFileSync(join(releaseSource, fileName)))
  assert.equal((await buildGuard({ ...sandbox, buildOutputDir: join(sandbox.root, 'web') })).exitCode, 0)
  writeFileSync(join(outputRelease, 'stele-template-rogue.glb'), sandbox.artifacts.glb)
  assert.equal((await buildGuard({ ...sandbox, buildOutputDir: join(sandbox.root, 'web') })).exitCode, 4)
})))

results.push(await test('集合哈希会绑定报告非 target 内容', () => withSandbox(async sandbox => {
  const published = await publishRelease(sandbox)
  const before = await computeReleaseSetSha256(sandbox.repoRoot)
  const releasesRoot = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases')
  const reportPath = join(releasesRoot, published.releaseId, 'publish-report.json')
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  report.createdAt = '2026-09-03T00:00:01.000Z'
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  const after = await computeReleaseSetSha256(sandbox.repoRoot)
  assert.notEqual(after, before)
})))

results.push(await test('公开报告中的校验器版本被篡改时构建门禁拒绝', () => withSandbox(async sandbox => {
  const published = await publishRelease(sandbox)
  const releaseDir = join(sandbox.repoRoot, 'static', 'models', 'stele', 'releases', published.releaseId)
  const reportPath = join(releaseDir, 'publish-report.json')
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  const template = report.templates[0]
  const configDir = join(sandbox.repoRoot, 'utils', 'stele')
  mkdirSync(configDir, { recursive: true })
  writeFileSync(join(configDir, 'model-templates.json'), `${JSON.stringify([{
    id: template.id,
    name: '经典圆拱碑型',
    description: '无字参数化范本',
    sourceKind: 'parametric-generic',
    sourceNotice: '参数化通用设计，非真实石碑或照片复刻',
    parameterVersion: template.parameterVersion,
    releaseId: published.releaseId,
    glbUrl: `/static/models/stele/releases/${published.releaseId}/${template.files.find(file => file.format === 'glb').name}`,
    stlUrl: `/static/models/stele/releases/${published.releaseId}/${template.files.find(file => file.format === 'stl').name}`,
    boundsMm: { x: template.boundsMm.x, y: template.boundsMm.y, z: template.boundsMm.z },
    triangleCount: sandbox.artifacts.metrics.triangleCount,
    geometrySha256: template.geometrySha256,
    sha256: { glb: template.files.find(file => file.format === 'glb').sha256, stl: template.files.find(file => file.format === 'stl').sha256 },
  }], null, 2)}\n`)
  report.toolVersions.gltfValidator = '0.0.0-tampered'
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  const guarded = await buildGuard(sandbox)
  assert.equal(guarded.exitCode, 4)
  assert.equal(guarded.error.code, 'BUILD_GUARD_FAILED')
})))

results.push(await test('仓内发布资产、报告与页面配置哈希一致', async () => {
  const config = JSON.parse(readFileSync(join(REPO_ROOT, 'utils', 'stele', 'model-templates.json'), 'utf8'))[0]
  const releaseDir = join(REPO_ROOT, 'static', 'models', 'stele', 'releases', config.releaseId)
  const report = JSON.parse(readFileSync(join(releaseDir, 'publish-report.json'), 'utf8'))
  const template = report.templates[0]
  const glb = readFileSync(join(releaseDir, template.files.find(file => file.format === 'glb').name))
  const stl = readFileSync(join(releaseDir, template.files.find(file => file.format === 'stl').name))
  assert.equal(sha256(glb), config.sha256.glb)
  assert.equal(sha256(stl), config.sha256.stl)
  assert.equal(sha256(glb), template.files.find(file => file.format === 'glb').sha256)
  assert.equal(sha256(stl), template.files.find(file => file.format === 'stl').sha256)
  assert.equal(config.geometrySha256, template.geometrySha256)
}))

results.push(await test('配置三角面数与真实资产不一致时构建门禁拒绝', () => withSandbox(async sandbox => {
  const published = await publishRelease(sandbox)
  assert.equal(published.exitCode, 0)
  const config = JSON.parse(readFileSync(join(REPO_ROOT, 'utils', 'stele', 'model-templates.json'), 'utf8'))
  config[0].triangleCount += 1
  const configDir = join(sandbox.repoRoot, 'utils', 'stele')
  mkdirSync(configDir, { recursive: true })
  writeFileSync(join(configDir, 'model-templates.json'), `${JSON.stringify(config, null, 2)}\n`)
  const result = await buildGuard(sandbox)
  assert.equal(result.exitCode, 4)
  assert.equal(result.report.summary.failureCount, 1)
})))

const passed = results.filter(Boolean).length
const failed = results.length - passed
console.log(`\n=== ${passed} passed, ${failed} failed ===`)
if (failed) process.exitCode = 1
