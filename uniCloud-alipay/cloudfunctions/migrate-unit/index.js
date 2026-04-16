'use strict'
const db = uniCloud.database()

// 字 → 新unit 映射
const charToUnit = {}
const lessons = {
  '2-4-7': '思床前地故乡',
  '2-4-8': '色把讲样笑再',
  '2-4-9': '节米间分吃肉',
  '2-4-0': '册支电衣',
  '2-5-5': '物造运欢房网',
  '2-5-6': '对今雪细夕语',
  '2-5-7': '打皮跑足沙包',
  '2-5-8': '近习远学玉义',
  '2-5-0': '饱抱',
  '2-6-10': '首池采尖角早',
  '2-6-11': '玩眼泪它贝气',
  '2-6-12': '机台唱伞朵美',
  '2-6-13': '这看鱼面问加',
  '2-6-0': '豆斗',
}
for (const [unit, chars] of Object.entries(lessons)) {
  for (const ch of chars) {
    charToUnit[ch] = unit
  }
}

exports.main = async (event, context) => {
  // 拉取全部题目（分页）
  const all = []
  let skip = 0
  while (true) {
    const res = await db.collection('questions').skip(skip).limit(500).get()
    const data = res.result?.data || res.data || []
    if (data.length === 0) break
    all.push(...data)
    skip += data.length
    if (data.length < 500) break
  }

  let updated = 0
  let skipped = 0
  let toDefault = 0

  for (const q of all) {
    const newUnit = charToUnit[q.char]
    if (newUnit) {
      if (q.unit !== newUnit) {
        await db.collection('questions').doc(q._id).update({ unit: newUnit })
        updated++
      } else {
        skipped++
      }
    } else {
      // 不在4/5/6单元的字，改为 2-0-0
      if (q.unit !== '2-0-0') {
        await db.collection('questions').doc(q._id).update({ unit: '2-0-0' })
        toDefault++
      } else {
        skipped++
      }
    }
  }

  const msg = `共 ${all.length} 条：更新 ${updated}，归为未分类 ${toDefault}，已是最新 ${skipped}`
  console.log(msg)
  return { code: 0, msg, total: all.length, updated, toDefault, skipped }
}
