// utils/common/cloudDb.js
const db = uniCloud.database()

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 小时

export async function getQuestions(type, unit) {
  const cacheKey = `questions_${type}_${unit}`

  try {
    const cached = uni.getStorageSync(cacheKey)
    if (cached && cached.data && (Date.now() - cached.cachedAt < CACHE_TTL)) {
      return cached.data
    }
  } catch (e) {}

  try {
    const res = await db.collection('questions')
      .where({ type, unit })
      .get()

    if (res.result && res.result.data && res.result.data.length > 0) {
      const data = res.result.data
      uni.setStorageSync(cacheKey, { data, cachedAt: Date.now() })
      return data
    }
  } catch (e) {
    console.error('拉取题库失败:', e)
  }

  try {
    const cached = uni.getStorageSync(cacheKey)
    if (cached && cached.data) {
      return cached.data
    }
  } catch (e) {}

  return null
}

export async function queryCollection(name, where, options = {}) {
  const { limit = 100, orderBy, skip = 0 } = options
  let query = db.collection(name).where(where)
  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.order || 'desc')
  }
  if (skip > 0) query = query.skip(skip)
  query = query.limit(limit)
  const res = await query.get()
  return res.result ? res.result.data : []
}

export async function addDocument(name, data) {
  const res = await db.collection(name).add(data)
  return res.result || res
}

export async function updateDocument(name, docId, data) {
  const res = await db.collection(name).doc(docId).update(data)
  return res.result || res
}
