// utils/study/questionHelper.js

// Fisher-Yates shuffle
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 从数组中不放回抽取 n 个元素
export function sampleWithout(arr, n) {
  const shuffled = shuffle(arr)
  return shuffled.slice(0, Math.min(n, arr.length))
}

// 笔顺干扰项生成：打乱正确笔顺，确保与正确顺序不同
// 对重复笔画较多的字（如"上"=[竖,横,横]），唯一排列可能不足 3 个
// 此时通过交换相邻笔画对来补充干扰项
export function generateStrokeDistractors(correctStrokes, count = 3) {
  const key = correctStrokes.join(',')
  const distractors = []
  const seen = new Set([key])

  // 方法1：随机 shuffle 生成不同排列
  let attempts = 0
  while (distractors.length < count && attempts < 100) {
    const shuffled = shuffle(correctStrokes)
    const k = shuffled.join(',')
    if (!seen.has(k)) {
      seen.add(k)
      distractors.push([...shuffled])
    }
    attempts++
  }

  // 方法2：如果 shuffle 不够（重复笔画多），通过交换相邻对生成
  if (distractors.length < count) {
    for (let i = 0; i < correctStrokes.length - 1 && distractors.length < count; i++) {
      const swapped = [...correctStrokes]
      ;[swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]]
      const k = swapped.join(',')
      if (!seen.has(k)) {
        seen.add(k)
        distractors.push(swapped)
      }
    }
  }

  // 方法3：最后兜底，反转整个序列
  if (distractors.length < count) {
    const reversed = [...correctStrokes].reverse()
    const k = reversed.join(',')
    if (!seen.has(k)) {
      seen.add(k)
      distractors.push(reversed)
    }
  }

  return distractors
}
