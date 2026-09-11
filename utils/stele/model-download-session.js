export function createModelDownloadSession({ fetchImpl = globalThis.fetch, verify, save }) {
  let generation = 0
  let currentController = null
  let unmounted = false

  function cancel() {
    generation += 1
    currentController?.abort()
    currentController = null
  }

  async function download(template) {
    cancel()
    const requestGeneration = generation
    const controller = new AbortController()
    currentController = controller
    const target = Object.freeze({
      url: template.stlUrl,
      sha256: template.sha256.stl,
      fileName: template.stlUrl.split('/').at(-1) || `${template.id}.stl`,
    })
    const isCurrent = () => !unmounted && generation === requestGeneration && currentController === controller

    try {
      const response = await fetchImpl(target.url, { signal: controller.signal })
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`)
        error.code = 'MODEL_HTTP_ERROR'
        throw error
      }
      const bytes = await response.arrayBuffer()
      if (!bytes.byteLength) throw new Error('EMPTY_FILE')
      await verify(bytes, target.sha256)
      if (!isCurrent()) return { status: unmounted ? 'unmounted' : 'stale' }
      save({ bytes, fileName: target.fileName, mimeType: 'model/stl' })
      return { status: 'saved', target }
    } catch (error) {
      if (!isCurrent() || error?.name === 'AbortError') return { status: unmounted ? 'unmounted' : 'stale' }
      return { status: 'error', error }
    } finally {
      if (currentController === controller) currentController = null
    }
  }

  function unmount() {
    unmounted = true
    cancel()
  }

  return { cancel, download, unmount }
}
