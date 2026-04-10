// utils/common/storage.js
// 按用户隔离的本地状态存储
const STORAGE_KEY_PREFIX = 'kids_learn_data_'

function getKey() {
  const username = uni.getStorageSync('username') || '_guest'
  return STORAGE_KEY_PREFIX + username
}

export function loadState() {
  try {
    const data = uni.getStorageSync(getKey())
    if (!data) return null
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (e) {
    return null
  }
}

export function saveState(state) {
  try {
    uni.setStorageSync(getKey(), JSON.stringify(state))
  } catch (e) {
    console.error('Save state failed:', e)
  }
}

export function clearState() {
  try {
    uni.removeStorageSync(getKey())
  } catch (e) {
    console.error('Clear state failed:', e)
  }
}
