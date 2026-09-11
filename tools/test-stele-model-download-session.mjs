import assert from 'node:assert/strict'
import { createModelDownloadSession } from '../utils/stele/model-download-session.js'

function deferred() {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

function response(bytes) {
  return { ok: true, arrayBuffer: async () => Uint8Array.from(bytes).buffer }
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

results.push(await test('切换范本会取消 A，且只保存 B 的冻结目标', async () => {
  const requests = new Map()
  const saved = []
  const session = createModelDownloadSession({
    fetchImpl: (url, options) => {
      const request = deferred()
      requests.set(url, { ...request, signal: options.signal })
      return request.promise
    },
    verify: async (bytes, expected) => assert.equal(new Uint8Array(bytes)[0], Number(expected)),
    save: value => saved.push(value),
  })
  const templateA = { id: 'a', stlUrl: '/a.stl', sha256: { stl: '1' } }
  const templateB = { id: 'b', stlUrl: '/b.stl', sha256: { stl: '2' } }
  const a = session.download(templateA)
  templateA.stlUrl = '/mutated.stl'
  templateA.sha256.stl = '9'
  const b = session.download(templateB)
  assert.equal(requests.get('/a.stl').signal.aborted, true)
  assert.equal(requests.get('/b.stl').signal.aborted, false)
  requests.get('/b.stl').resolve(response([2]))
  assert.equal((await b).status, 'saved')
  requests.get('/a.stl').resolve(response([1]))
  assert.equal((await a).status, 'stale')
  assert.equal(saved.length, 1)
  assert.equal(saved[0].fileName, 'b.stl')
}))

results.push(await test('页面卸载后完成的下载不会保存或更新为成功', async () => {
  const request = deferred()
  let signal
  const saved = []
  const session = createModelDownloadSession({
    fetchImpl: (_url, options) => {
      signal = options.signal
      return request.promise
    },
    verify: async () => {},
    save: value => saved.push(value),
  })
  const pending = session.download({ id: 'a', stlUrl: '/a.stl', sha256: { stl: 'hash' } })
  session.unmount()
  assert.equal(signal.aborted, true)
  request.resolve(response([1]))
  assert.equal((await pending).status, 'unmounted')
  assert.equal(saved.length, 0)
}))

results.push(await test('哈希失败不保存并返回当前可见错误', async () => {
  const saved = []
  const session = createModelDownloadSession({
    fetchImpl: async () => response([1]),
    verify: async () => { throw new Error('HASH_MISMATCH') },
    save: value => saved.push(value),
  })
  const result = await session.download({ id: 'a', stlUrl: '/a.stl', sha256: { stl: 'hash' } })
  assert.equal(result.status, 'error')
  assert.match(result.error.message, /HASH_MISMATCH/)
  assert.equal(saved.length, 0)
}))

const passed = results.filter(Boolean).length
const failed = results.length - passed
console.log(`\n=== ${passed} passed, ${failed} failed ===`)
if (failed) process.exitCode = 1
