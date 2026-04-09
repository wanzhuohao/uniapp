// composables/common/useAuth.js
export function useAuth() {
  function getUsername() {
    return uni.getStorageSync('username') || ''
  }
  function setUsername(name) {
    uni.setStorageSync('username', name)
  }
  function hasUsername() {
    return !!getUsername()
  }
  return { getUsername, setUsername, hasUsername }
}
