import assert from 'node:assert/strict'
import fs from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { randomUUID } from 'node:crypto'
import { generateSmall } from '../utils/stele/stele-utils.ts'

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`)
  if (start < 0) throw new Error(`找不到函数 ${name}`)
  const paramsStart = source.indexOf('(', start)
  let paramsDepth = 0
  let paramsEnd = -1
  for (let i = paramsStart; i < source.length; i++) {
    if (source[i] === '(') paramsDepth++
    if (source[i] === ')') {
      paramsDepth--
      if (paramsDepth === 0) {
        paramsEnd = i
        break
      }
    }
  }
  if (paramsEnd < 0) throw new Error(`函数 ${name} 参数列表不完整`)
  const bodyStart = source.indexOf('{', paramsEnd)
  let depth = 0
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  throw new Error(`函数 ${name} 大括号不完整`)
}

function extractConstFunction(source, name) {
  const start = source.indexOf(`const ${name} =`)
  if (start < 0) throw new Error(`找不到函数 ${name}`)
  const bodyStart = source.indexOf('{', start)
  let depth = 0
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  throw new Error(`函数 ${name} 大括号不完整`)
}

let passed = 0
let failed = 0
async function test(name, fn) {
  try {
    await fn()
    passed++
    console.log(`✓ ${name}`)
  } catch (error) {
    failed++
    console.error(`✗ ${name}: ${error.message}`)
  }
}

const composableSource = fs.readFileSync(new URL('../composables/stele/useOrderForm.ts', import.meta.url), 'utf8')
const mobilePageSource = fs.readFileSync(new URL('../pages/stele/index.vue', import.meta.url), 'utf8')
const detailPageSource = fs.readFileSync(new URL('../pages/stele/detail.vue', import.meta.url), 'utf8')
const previewPageSource = fs.readFileSync(new URL('../pages/stele/preview.vue', import.meta.url), 'utf8')
const listPageSource = fs.readFileSync(new URL('../pages/stele/list.vue', import.meta.url), 'utf8')
const helpPageSource = fs.readFileSync(new URL('../pages/stele/help.vue', import.meta.url), 'utf8')
const orderApiSource = fs.readFileSync(new URL('../utils/stele/order-api.ts', import.meta.url), 'utf8')

await test('syncDatesToForm: 空输入会清除四组旧生卒日期', () => {
  const functionSource = extractFunction(composableSource, 'syncDatesToForm')
    .replace(/: string/g, '')
    .replace(/: \{ year; month; day \}/g, '')
  const makeDate = () => ({ year: '1990', month: '01', day: '02' })
  const form = {
    father: { birth: makeDate(), death: makeDate() },
    mother: { birth: makeDate(), death: makeDate() },
    libei: ['', '', ''],
    dateQingming: false,
  }
  const emptyRef = { value: '' }
  const syncDatesToForm = new Function(
    'fatherBirth', 'fatherDeath', 'motherBirth', 'motherDeath',
    'libeiDate', 'qingmingYear', 'form', 'parseFlexibleDate', 'toStorageDate',
    `${functionSource}; return syncDatesToForm;`,
  )(
    emptyRef, emptyRef, emptyRef, emptyRef,
    emptyRef, { value: '' }, form,
    (value) => value ? String(value).split('-') : [],
    (parts) => [String(parts[0] || ''), String(parts[1] || ''), String(parts[2] || '')],
  )

  syncDatesToForm()
  for (const date of [form.father.birth, form.father.death, form.mother.birth, form.mother.death]) {
    assert.deepEqual(date, { year: '', month: '', day: '' })
  }
})

await test('手机编辑保存始终使用当前表单生成的大字', () => {
  assert.doesNotMatch(mobilePageSource, /savedBig/)
  assert.doesNotMatch(mobilePageSource, /payload\.big\s*=/)
})

await test('详情页返回时只为未保存的变更写入草稿', () => {
  assert.match(detailPageSource, /if \(hasUnsavedChanges\.value\) saveDraft\(\)/)
  assert.match(detailPageSource, /hasUnsavedChanges\.value = false/)
})

await test('结束预览区拖拽时恢复 body 的临时样式', () => {
  const cleanupSource = extractFunction(detailPageSource, 'cleanupResize')
  const body = { style: { cursor: 'nwse-resize', userSelect: 'none' } }
  const document = {
    body,
    removeEventListener() {},
  }
  const cleanupResize = new Function(
    'resizeMouseMove',
    'resizeMouseUp',
    'document',
    `${cleanupSource}; return cleanupResize`,
  )(() => {}, () => {}, document)

  cleanupResize()

  assert.equal(body.style.cursor, '')
  assert.equal(body.style.userSelect, '')
})

await test('3D 初始化在 try 内等待 DOM 更新并捕获渲染异常', () => {
  assert.match(
    previewPageSource,
    /onMounted\(async \(\) => \{[\s\S]*await nextTick\(\);\s*renderThreeStele\(data\);[\s\S]*\} catch/,
  )
})

await test('列表只接收最后一次查询的响应', () => {
  assert.match(listPageSource, /let fetchGeneration = 0/)
  assert.match(listPageSource, /const requestGeneration = \+\+fetchGeneration/)
  assert.match(listPageSource, /requestGeneration !== fetchGeneration/)
})

await test('首次创建确认客户标识时阻止重复提交', () => {
  assert.match(
    mobilePageSource,
    /function confirmPhoneAndSubmit\(\) \{\s*if \(submitting\.value\) return;/,
  )
})

function createOrderApiHarness({ answers = [], responses = [], storedToken = '' } = {}) {
  const storageKey = 'test-order-admin-token'
  const storage = new Map(storedToken ? [[storageKey, storedToken]] : [])
  const prompts = []
  const calls = []
  const source = stripTypeScriptTypes(orderApiSource.replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, ''))
  const api = new Function('ElMessageBox', 'STELE_STORAGE_KEYS', 'uniCloud', 'localStorage', `${source}; return { callOrderFunction, isOrderAdminPromptCancelled };`)(
    { async prompt(message, title, options) {
      prompts.push({ message, title, options })
      assert.equal(storage.has(storageKey), false, '输入前应清除旧的无效口令')
      assert.ok(answers.length, '不应额外弹出口令输入框')
      const answer = answers.shift()
      if (answer === 'cancel' || answer === 'close') throw answer
      return { value: answer }
    } },
    { adminToken: storageKey },
    { async callFunction(request) {
      calls.push(request)
      assert.ok(responses.length, '不应自动重发结果未知的请求')
      const response = responses.shift()
      if (response instanceof Error) throw response
      return response
    } },
    { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  )
  return { ...api, storage, storageKey, prompts, calls }
}

await test('连续输错后立即重新输入，成功才缓存并继续原查询', async () => {
  const accepted = randomUUID()
  const harness = createOrderApiHarness({
    answers: [randomUUID(), randomUUID(), accepted],
    responses: [{ result: { code: 401 } }, { result: { code: 401 } }, { result: { code: 0, data: [] } }, { result: { code: 0 } }],
  })
  const query = { pageNo: 2, keyword: '测试' }
  const response = await harness.callOrderFunction('order-query', query)
  assert.equal(response.result.code, 0)
  assert.equal(harness.prompts.length, 3)
  assert.match(harness.prompts[1].message, /口令.*重新输入/)
  assert.equal(harness.storage.get(harness.storageKey), accepted)
  assert.equal(harness.calls.every(call => call.name === 'order-query' && call.data.pageNo === 2 && call.data.keyword === '测试'), true)
  await harness.callOrderFunction('order-query')
  assert.equal(harness.prompts.length, 3)
  assert.equal(harness.calls[3].data.adminToken, accepted)
})

await test('旧口令失效后可取消重输，下一次操作仍能再次输入', async () => {
  const harness = createOrderApiHarness({
    storedToken: randomUUID(), answers: ['cancel', randomUUID()],
    responses: [{ result: { code: 401 } }, { result: { code: 0 } }],
  })
  await assert.rejects(harness.callOrderFunction('order-query'), error => harness.isOrderAdminPromptCancelled(error))
  assert.equal(harness.storage.size, 0)
  assert.equal(harness.calls.length, 1)
  assert.equal((await harness.callOrderFunction('order-query')).result.code, 0)
  assert.equal(harness.prompts.length, 2)
})

await test('网络或服务失败不缓存未验证口令，也不自动重发写请求', async () => {
  for (const result of [new Error('offline'), { result: { code: 503 } }]) {
    const harness = createOrderApiHarness({ answers: [randomUUID()], responses: [result] })
    if (result instanceof Error) await assert.rejects(harness.callOrderFunction('order-update', { id: '' }), /offline/)
    else assert.equal((await harness.callOrderFunction('order-update', { id: '' })).result.code, 503)
    assert.equal(harness.storage.size, 0)
    assert.equal(harness.calls.length, 1)
  }
})

await test('旧缓存遇到接口异常后清除，下次可重新输入', async () => {
  const harness = createOrderApiHarness({
    storedToken: randomUUID(), answers: [randomUUID()], responses: [new Error('offline'), { result: { code: 0 } }],
  })
  await assert.rejects(harness.callOrderFunction('order-query'), /offline/)
  assert.equal(harness.storage.size, 0)
  assert.equal((await harness.callOrderFunction('order-query')).result.code, 0)
  assert.equal(harness.prompts.length, 1)
})

await test('取消管理员口令不会被当作列表查询或删除失败', () => {
  const helperSource = extractFunction(orderApiSource, 'isOrderAdminPromptCancelled')
    .replace(': unknown', '')
    .replace(': boolean', '')
  const isCancelled = new Function(`${helperSource}; return isOrderAdminPromptCancelled`)()
  assert.equal(isCancelled('cancel'), true)
  assert.equal(isCancelled('close'), true)
  assert.equal(isCancelled(new Error('network')), false)

  const fetchSource = extractConstFunction(listPageSource, 'fetchList')
  const deleteSource = extractConstFunction(listPageSource, 'onDelete')
  assert.match(fetchSource, /catch \(e\) \{\s*if \(requestGeneration !== fetchGeneration\) return;\s*if \(isOrderAdminPromptCancelled\(e\)\) return;\s*toast\.error\('获取列表失败'\)/)
  assert.match(deleteSource, /catch \(e\) \{\s*if \(isOrderAdminPromptCancelled\(e\)\) return;\s*toast\.error\('移除失败'\)/)
})

await test('保存失败释放提交锁，删除 404 后刷新列表', () => {
  const submitSource = extractFunction(mobilePageSource, 'performSubmit')
  assert.match(
    submitSource,
    /(?:\.finally\(\(\) => \{ submitting\.value = false; \}\)|finally \{ submitting\.value = false; \})/
  )
  const phoneConfirmSource = extractFunction(mobilePageSource, 'confirmPhoneAndSubmit')
  assert.match(phoneConfirmSource, /await requestSave\(/)
  assert.doesNotMatch(phoneConfirmSource, /doSave\(/)
  const deleteSource = extractConstFunction(listPageSource, 'onDelete')
  assert.match(deleteSource, /if \(delResult\?\.code === 404\) \{\s*toast\.error\([^;]+;\s*fetchList\(\);\s*return;\s*\}/)
})

await test('帮助页移动端卷轴端头不越过视口', () => {
  const mobileStyles = helpPageSource.slice(helpPageSource.indexOf('@media (max-width: 768px)'))
  assert.match(mobileStyles, /\.scroll-rod::before\s*\{\s*left:\s*-2px;\s*\}/)
  assert.match(mobileStyles, /\.scroll-rod::after\s*\{\s*right:\s*-2px;\s*\}/)
})

await test('小字预览保留夫妻分排，同排必须由名单本身决定', () => {
  const names = [[['子', '甲'], ['女', '乙']], [['媳', '丙'], ['婿', '丁']]]
  const before = structuredClone(names)
  assert.equal(generateSmall({ names }), '女子\n乙甲\n婿媳\n丁丙')
  assert.deepEqual(names, before)
  assert.equal(generateSmall({ names: [[['子', '甲'], ['媳', '丙'], ['女', '乙'], ['婿', '丁']]] }), '婿女媳子\n丁乙丙甲')
})

await test('五排名单按五排预览，不隐藏合并两组夫妻或丢失空白姓名位置', () => {
  const titles = [
    ['子', '子', '子', '女', '女', '女'],
    ['媳', '媳', '媳', '婿', '婿', '婿'],
    ['孙子', '孙子', '孙子', '孙女'],
    ['孙媳', '孙媳', '孙媳', '孙婿'],
    ['重孙子', '重孙子', '重孙女', '重孙女'],
  ]
  let sequence = 0
  const names = titles.map(row => row.map(title => [title, title === '孙婿' ? '' : `测${String.fromCharCode(0x4e00 + sequence++)}`]))
  const before = structuredClone(names)
  const maxWidth = Math.max(...names.map(row => row.length))
  const expected = names.map(row => generateSmall({ names: [row] }).split('\n')
    .map(line => (' '.repeat(maxWidth - row.length) + line).trimEnd()).join('\n')).join('\n')
  assert.equal(generateSmall({ names }), expected)
  assert.deepEqual(names, before)
})

console.log(`\n=== ${passed} passed, ${failed} failed ===`)
if (failed) process.exitCode = 1
