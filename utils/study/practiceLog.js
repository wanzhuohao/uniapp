// utils/study/practiceLog.js
import { addDocument, queryCollection } from '../common/cloudDb.js'

export async function recordPractice(username, { type, totalCount, correctCount }) {
  try {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    await addDocument('practice_logs', {
      username, type, date, totalCount, correctCount, createdAt: Date.now()
    })
  } catch (e) {
    console.error('记录练习日志失败:', e)
  }
}

export async function getRecentLogs(username, days = 7) {
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`

  const logs = await queryCollection('practice_logs', {
    username,
    date: uniCloud.database().command.gte(startStr)
  }, {
    orderBy: { field: 'date', order: 'asc' }, limit: 200
  })

  // 按日期聚合
  const dailyMap = {}
  for (const log of logs) {
    if (!dailyMap[log.date]) {
      dailyMap[log.date] = { total: 0, correct: 0 }
    }
    dailyMap[log.date].total += log.totalCount
    dailyMap[log.date].correct += log.correctCount
  }

  // 填充空日期
  const result = []
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const day = dailyMap[dateStr]
    result.push({
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      accuracy: day ? Math.round(day.correct / day.total * 100) : null
    })
  }

  return result
}
