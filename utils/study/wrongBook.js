// utils/study/wrongBook.js
import { queryCollection, addDocument, updateDocument } from '../common/cloudDb.js'

export async function recordWrong(username, { type, char, unit, question_id }) {
  try {
    const records = await queryCollection('wrong_records', { username, question_id }, { limit: 1 })

    if (records.length > 0) {
      const record = records[0]
      await updateDocument('wrong_records', record._id, {
        wrongCount: (record.wrongCount || 0) + 1,
        correctCount: 0,
        mastered: false,
        lastWrongAt: Date.now()
      })
    } else {
      await addDocument('wrong_records', {
        username, question_id, type, char, unit,
        wrongCount: 1, correctCount: 0, mastered: false,
        lastWrongAt: Date.now(), createdAt: Date.now()
      })
    }
  } catch (e) {
    console.error('记录错题失败:', e)
  }
}

export async function recordCorrect(recordId, currentCorrectCount) {
  try {
    const newCount = currentCorrectCount + 1
    const mastered = newCount >= 2
    await updateDocument('wrong_records', recordId, { correctCount: newCount, mastered })
    return { mastered, correctCount: newCount }
  } catch (e) {
    console.error('更新错题记录失败:', e)
    return { mastered: false, correctCount: currentCorrectCount }
  }
}

export async function recordWrongAgain(recordId, currentWrongCount) {
  try {
    await updateDocument('wrong_records', recordId, {
      wrongCount: (currentWrongCount || 0) + 1,
      correctCount: 0, mastered: false, lastWrongAt: Date.now()
    })
  } catch (e) {
    console.error('更新错题记录失败:', e)
  }
}

export async function getUnmasteredList(username, type) {
  const where = { username, mastered: false }
  if (type) where.type = type
  return queryCollection('wrong_records', where, {
    orderBy: { field: 'wrongCount', order: 'desc' }, limit: 100
  })
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
  return {
    total: all.length,
    pinyinCount: all.filter(r => r.type === 'pinyin').length,
    hanziCount: all.filter(r => r.type === 'stroke' || r.type === 'hanzi').length,
    mathCount: all.filter(r => r.type === 'math').length,
    strokeCount: all.filter(r => r.type === 'stroke' || r.type === 'hanzi').length, // 兼容旧字段
    unmasteredCount: all.filter(r => !r.mastered).length,
    masteredCount: all.filter(r => r.mastered).length,
    top5: all.filter(r => !r.mastered).sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 5)
  }
}
