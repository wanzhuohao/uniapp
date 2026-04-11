// composables/common/useRecentUsers.js
// 本地 localStorage 最近用户列表，最多 5 个，最新在前
const STORAGE_KEY = 'recent_users'
const MAX_SIZE = 5

export function useRecentUsers() {
  function getRecentUsers() {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY)
      if (!raw) return []
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
      return Array.isArray(arr) ? arr.filter(s => typeof s === 'string' && s) : []
    } catch (e) {
      return []
    }
  }

  function addRecentUser(name) {
    if (!name || typeof name !== 'string') return
    const trimmed = name.trim()
    if (!trimmed) return
    const current = getRecentUsers().filter(u => u !== trimmed)
    current.unshift(trimmed)
    const truncated = current.slice(0, MAX_SIZE)
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(truncated))
    } catch (e) {}
  }

  function removeRecentUser(name) {
    if (!name) return
    const next = getRecentUsers().filter(u => u !== name)
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(next))
    } catch (e) {}
  }

  return { getRecentUsers, addRecentUser, removeRecentUser }
}
