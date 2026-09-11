function modelHttpError(status) {
  const error = new Error(`模型加载失败（HTTP ${status}）`)
  error.code = 'MODEL_HTTP_ERROR'
  error.status = status
  return error
}

function isAbortError(error) {
  return error?.name === 'AbortError'
}

export function createModelLoadSession({
  fetchImpl = globalThis.fetch?.bind(globalThis),
  parse,
  dispose,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl 必须为函数')
  if (typeof parse !== 'function') throw new TypeError('parse 必须为函数')
  if (typeof dispose !== 'function') throw new TypeError('dispose 必须为函数')

  let requestGeneration = 0
  let controller = null
  let unmounted = false

  function invalidate() {
    requestGeneration += 1
    controller?.abort()
    controller = null
  }

  async function load(url) {
    if (unmounted) return { status: 'unmounted' }

    invalidate()
    const generation = requestGeneration
    const requestController = new AbortController()
    controller = requestController

    try {
      const response = await fetchImpl(url, { signal: requestController.signal })
      if (!response?.ok) throw modelHttpError(response?.status ?? 0)
      const bytes = await response.arrayBuffer()
      const model = await parse(bytes, url)
      if (unmounted || generation !== requestGeneration) {
        dispose(model)
        return { status: 'stale', generation }
      }
      controller = null
      return { status: 'ready', generation, model }
    } catch (error) {
      if (unmounted || generation !== requestGeneration || isAbortError(error)) {
        return { status: 'stale', generation }
      }
      controller = null
      return { status: 'error', generation, error }
    }
  }

  function unmount() {
    if (unmounted) return
    unmounted = true
    invalidate()
  }

  return Object.freeze({ load, invalidate, unmount })
}
