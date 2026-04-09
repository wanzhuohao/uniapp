// utils/storage.js
const STORAGE_KEY = 'kids_learn_data'

export function loadState() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    if (!data) return null
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (e) {
    return null
  }
}

export function saveState(state) {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Save state failed:', e)
  }
}

export function clearState() {
  try {
    uni.removeStorageSync(STORAGE_KEY)
  } catch (e) {
    console.error('Clear state failed:', e)
  }
}
