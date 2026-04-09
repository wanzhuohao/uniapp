'use strict'
const db = uniCloud.database()

const questionsData = [
  // 数据待用户提供，格式示例：
  // { type: 'pinyin', unit: '1-1', char: '花', pinyin: 'huā', distractors: ['huà', 'huá', 'hā'], char_distractors: ['化', '画', '话'] },
  // { type: 'stroke', unit: '1-1', char: '上', strokes: ['竖', '横', '横'], strokeCount: 3 },
]

async function seed() {
  if (questionsData.length === 0) {
    console.log('暂无题目数据，请先填入 questionsData 数组')
    return
  }

  console.log(`开始上传 ${questionsData.length} 道题目...`)

  let success = 0
  let skip = 0
  let fail = 0

  for (const q of questionsData) {
    try {
      const existing = await db.collection('questions')
        .where({ type: q.type, char: q.char })
        .limit(1)
        .get()

      if (existing.data && existing.data.length > 0) {
        skip++
        continue
      }

      await db.collection('questions').add(q)
      success++
    } catch (e) {
      console.error(`上传失败: ${q.char}`, e)
      fail++
    }
  }

  console.log(`上传完成：成功 ${success}，跳过 ${skip}，失败 ${fail}`)
}

exports.main = async (event, context) => {
  await seed()
  return { code: 0, msg: 'done' }
}
