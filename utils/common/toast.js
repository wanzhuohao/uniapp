// utils/common/toast.js
// H5 环境使用印章式 toast，非 H5 fallback 到 uni.showToast
// API 兼容：toast.success / error / info / loading / hideLoading

const DEFAULTS = {
  success: 1500,
  error: 2000,
  info: 1500,
}

const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

let currentHost = null
let currentTimer = null
let loadingHost = null

function ensureHost() {
  if (currentHost && document.body.contains(currentHost)) return currentHost
  const host = document.createElement('div')
  host.className = 'seal-toast-host'
  document.body.appendChild(host)
  currentHost = host
  return host
}

function clearCurrent() {
  if (currentTimer) { clearTimeout(currentTimer); currentTimer = null }
  if (currentHost && currentHost.firstChild) {
    const el = currentHost.firstChild
    el.classList.add('is-leaving')
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }, 200)
  }
}

function show({ msg, stamp, gold = false, duration }) {
  if (!isH5) {
    uni.showToast({
      title: String(msg ?? ''),
      icon: 'none',
      duration,
    })
    return
  }
  clearCurrent()
  const host = ensureHost()
  const wrap = document.createElement('div')
  wrap.className = 'seal-toast-wrap'
  wrap.innerHTML = `
    <div class="seal-toast">
      <div class="seal-toast-stamp${gold ? ' is-gold' : ''}">${stamp}</div>
      <div class="seal-toast-msg">${escapeHtml(String(msg ?? ''))}</div>
    </div>
  `
  host.appendChild(wrap)
  currentTimer = setTimeout(() => clearCurrent(), duration)
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}

export const toast = {
  success(msg, duration) {
    show({ msg, stamp: '成', gold: true, duration: duration ?? DEFAULTS.success })
  },
  error(msg, duration) {
    show({ msg, stamp: '误', gold: false, duration: duration ?? DEFAULTS.error })
  },
  info(msg, duration) {
    show({ msg, stamp: '告', gold: true, duration: duration ?? DEFAULTS.info })
  },
  loading(msg = '加载中', options = {}) {
    if (!isH5) {
      uni.showLoading({ title: String(msg), mask: options.mask === true })
      return
    }
    this.hideLoading()
    const host = document.createElement('div')
    host.className = 'seal-toast-host'
    if (options.mask) host.style.background = 'rgba(44, 36, 32, 0.25)'
    host.innerHTML = `
      <div class="seal-toast-wrap">
        <div class="seal-toast">
          <div class="seal-toast-stamp is-loading"></div>
          <div class="seal-toast-msg">${escapeHtml(String(msg))}</div>
        </div>
      </div>
    `
    document.body.appendChild(host)
    loadingHost = host
  },
  hideLoading() {
    if (!isH5) { uni.hideLoading(); return }
    if (loadingHost && loadingHost.parentNode) {
      loadingHost.parentNode.removeChild(loadingHost)
    }
    loadingHost = null
  },
}
