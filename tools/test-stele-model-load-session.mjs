import assert from 'node:assert/strict'
import { createModelLoadSession } from '../utils/stele/model-load-session.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function response(bytes) {
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => Uint8Array.from(bytes).buffer,
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

results.push(await test('A 慢 B 快时只有 B 可以成为当前模型', async () => {
  const requests = new Map()
  const disposed = []
  const session = createModelLoadSession({
    fetchImpl: (url) => {
      const request = deferred()
      requests.set(url, request)
      return request.promise
    },
    parse: async bytes => ({ id: new Uint8Array(bytes)[0] }),
    dispose: model => disposed.push(model.id),
  })

  const slow = session.load('/a.glb')
  const fast = session.load('/b.glb')
  requests.get('/b.glb').resolve(response([2]))
  assert.deepEqual(await fast, { status: 'ready', generation: 2, model: { id: 2 } })
  requests.get('/a.glb').resolve(response([1]))
  assert.equal((await slow).status, 'stale')
  assert.deepEqual(disposed, [1])
}))

results.push(await test('卸载后才完成解析的模型只会自释放', async () => {
  const parsed = deferred()
  const disposed = []
  const session = createModelLoadSession({
    fetchImpl: async () => response([3]),
    parse: () => parsed.promise,
    dispose: model => disposed.push(model.id),
  })

  const pending = session.load('/late.glb')
  await Promise.resolve()
  session.unmount()
  parsed.resolve({ id: 3 })
  assert.equal((await pending).status, 'stale')
  assert.deepEqual(disposed, [3])
  assert.equal((await session.load('/after-unmount.glb')).status, 'unmounted')
}))

results.push(await test('连续重试会中止旧 fetch 且不把 AbortError 当当前错误', async () => {
  let firstSignal
  let calls = 0
  const session = createModelLoadSession({
    fetchImpl: async (_url, options) => {
      calls += 1
      if (calls === 1) {
        firstSignal = options.signal
        return await new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            const error = new Error('aborted')
            error.name = 'AbortError'
            reject(error)
          })
        })
      }
      return response([4])
    },
    parse: async bytes => ({ id: new Uint8Array(bytes)[0] }),
    dispose() {},
  })

  const first = session.load('/retry.glb')
  const second = session.load('/retry.glb')
  assert.equal(firstSignal.aborted, true)
  assert.equal((await first).status, 'stale')
  assert.equal((await second).status, 'ready')
}))

results.push(await test('当前请求的网络失败保持可重试错误', async () => {
  const session = createModelLoadSession({
    fetchImpl: async () => ({ ok: false, status: 503 }),
    parse: async () => { throw new Error('不应解析') },
    dispose() {},
  })
  const result = await session.load('/offline.glb')
  assert.equal(result.status, 'error')
  assert.equal(result.error.code, 'MODEL_HTTP_ERROR')
  assert.equal(result.error.status, 503)
}))

const passed = results.filter(Boolean).length
const failed = results.length - passed
console.log(`\n=== ${passed} passed, ${failed} failed ===`)
if (failed) process.exitCode = 1
