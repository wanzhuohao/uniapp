// utils/study/wrongBook.js
import { queryCollection, addDocument, updateDocument } from '../common/cloudDb.js'

// Leitner box 间隔（天）
// box 1: 1 天 / box 2: 1 天 / box 3: 3 天 / box 4: 7 天 / box 5: 15 天
// 新错题和重练答错的 box=1 间隔也是 1 天（次日），避免当下立即循环
const BOX_INTERVALS_DAYS = [1, 1, 3, 7, 15]
const DAY_MS = 24 * 60 * 60 * 1000

function clampBox(b) {
  const n = Number(b ?? 1)
  if (!Number.isFinite(n) || n < 1) return 1
  if (n > 5) return 5
  return Math.floor(n)
}

function nextReviewFromBox(box) {
  const idx = clampBox(box) - 1
  return Date.now() + BOX_INTERVALS_DAYS[idx] * DAY_MS
}

// 老数据判断到期时间（兜底仅针对升级前的遗留数据）
// - 未 mastered 且无 nextReviewAt → 视为 0（1970-01-01，立即到期）
// - 已 mastered 且无 box → 视为 now + 15 天（避免一夜之间全部涌入）
// - 其他情况 → 读 record.nextReviewAt
function effectiveNextReviewAt(record, now = Date.now()) {
  if (record.nextReviewAt != null) return record.nextReviewAt
  if (record.mastered && record.box == null) {
    return now + 15 * DAY_MS
  }
  return 0
}

function effectiveBox(record) {
  if (record.box != null) return clampBox(record.box)
  if (record.mastered) return 5
  return 1
}

export async function recordWrong(username, { type, char, unit, question_id, qType }) {
  try {
    const records = await queryCollection('wrong_records', { username, question_id }, { limit: 1 })

    if (records.length > 0) {
      const record = records[0]
      // 新错一次：box 回到 1，wrongCount +1，次日再练
      const updateData = {
        wrongCount: (record.wrongCount || 0) + 1,
        correctCount: 0,
        box: 1,
        nextReviewAt: nextReviewFromBox(1),
        mastered: false,
        lastWrongAt: Date.now()
      }
      if (qType) updateData.qType = qType
      await updateDocument('wrong_records', record._id, updateData)
    } else {
      const insertData = {
        username, question_id, type, char, unit,
        wrongCount: 1, correctCount: 0,
        box: 1,
        nextReviewAt: nextReviewFromBox(1),
        mastered: false,
        lastWrongAt: Date.now(), createdAt: Date.now()
      }
      if (qType) insertData.qType = qType
      await addDocument('wrong_records', insertData)
    }
  } catch (e) {
    console.error('记录错题失败:', e)
  }
}

// 重练答对：box +1, nextReviewAt 推后
// 调用方传 currentBox（从 wrong record 取），内部 clamp
export async function recordCorrect(recordId, currentBox, currentCorrectCount) {
  try {
    const box = clampBox(currentBox)
    const newBox = Math.min(box + 1, 5)
    const nextReviewAt = nextReviewFromBox(newBox)
    const newCorrectCount = (currentCorrectCount || 0) + 1
    const mastered = newBox >= 5
    await updateDocument('wrong_records', recordId, {
      box: newBox,
      nextReviewAt,
      correctCount: newCorrectCount,
      mastered,
    })
    return { mastered, box: newBox, nextReviewAt, correctCount: newCorrectCount }
  } catch (e) {
    console.error('更新错题记录失败:', e)
    return { mastered: false, box: clampBox(currentBox), nextReviewAt: null, correctCount: currentCorrectCount }
  }
}

// 重练答错：box 回到 1, wrongCount +1, 次日再练
export async function recordWrongAgain(recordId, currentBox, currentWrongCount) {
  try {
    await updateDocument('wrong_records', recordId, {
      box: 1,
      nextReviewAt: nextReviewFromBox(1),
      wrongCount: (currentWrongCount || 0) + 1,
      correctCount: 0,
      mastered: false,
      lastWrongAt: Date.now()
    })
  } catch (e) {
    console.error('更新错题记录失败:', e)
  }
}

// 今日待复习：nextReviewAt <= now（含老数据兜底）
export async function getDueList(username, type) {
  const all = await getAllWrongList(username, type)
  const now = Date.now()
  return all.filter(r => effectiveNextReviewAt(r, now) <= now)
}

// 未掌握（兼容旧 API）：effectiveBox < 5
export async function getUnmasteredList(username, type) {
  const all = await getAllWrongList(username, type)
  return all.filter(r => effectiveBox(r) < 5)
}

export async function getAllWrongList(username, type) {
  const where = { username }
  if (type) where.type = type
  return queryCollection('wrong_records', where, {
    orderBy: { field: 'wrongCount', order: 'desc' }, limit: 200
  })
}

export async function getWrongStats(username) {
  const all = await getAllWrongList(username)
  const now = Date.now()
  const due = all.filter(r => effectiveNextReviewAt(r, now) <= now)
  return {
    total: all.length,
    pinyinCount: all.filter(r => r.type === 'pinyin').length,
    hanziCount: all.filter(r => r.type === 'stroke' || r.type === 'hanzi').length,
    strokeCount: all.filter(r => r.type === 'stroke' || r.type === 'hanzi').length, // 兼容旧字段
    unmasteredCount: all.filter(r => effectiveBox(r) < 5).length,
    masteredCount: all.filter(r => effectiveBox(r) >= 5).length,
    dueCount: due.length,
    pinyinDue: due.filter(r => r.type === 'pinyin').length,
    hanziDue: due.filter(r => r.type === 'stroke' || r.type === 'hanzi').length,
    top5: all.filter(r => effectiveBox(r) < 5).sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 5)
  }
}
