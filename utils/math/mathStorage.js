import { useAuth } from '../../composables/common/useAuth.js'
import { toast } from '../common/toast.js'

const MAX_RECORDS = 50

function getKey() {
  const { getUsername } = useAuth()
  return `math_history_${getUsername()}`
}

export function getHistory() {
  try {
    return JSON.parse(uni.getStorageSync(getKey()) || '[]')
  } catch { return [] }
}

export function saveRecord(record) {
  try {
    const list = getHistory()
    record.id = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    record.createdAt = new Date().toISOString()
    list.unshift(record)
    if (list.length > MAX_RECORDS) list.length = MAX_RECORDS
    uni.setStorageSync(getKey(), JSON.stringify(list))
  } catch (e) {
    console.error('保存数学记录失败', e)
    toast.error('保存记录失败')
  }
}

export function getHistoryByType(type = 'all') {
  const list = getHistory()
  if (type === 'all') return list
  return list.filter(r => r.type === type)
}
