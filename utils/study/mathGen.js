// utils/study/mathGen.js

import { shuffle } from './questionHelper.js'

const LEVEL_CONFIG = {
  1: { max: 10, label: '十以内' },
  2: { max: 20, label: '二十以内' },
  3: { max: 100, label: '百以内' },
}

// 生成单道算术题
export function generateMathQuestion(level) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1]
  const isAdd = Math.random() > 0.5

  let a, b, answer, expression

  if (isAdd) {
    answer = Math.floor(Math.random() * (config.max + 1))
    a = Math.floor(Math.random() * (answer + 1))
    b = answer - a
    expression = `${a} + ${b}`
  } else {
    a = Math.floor(Math.random() * (config.max + 1))
    b = Math.floor(Math.random() * (a + 1))
    answer = a - b
    expression = `${a} - ${b}`
  }

  // 生成 3 个干扰项：answer ±1~3
  const distractorSet = new Set()
  for (let offset = 1; offset <= 5 && distractorSet.size < 3; offset++) {
    if (answer + offset <= config.max + 10) distractorSet.add(answer + offset)
    if (answer - offset >= 0) distractorSet.add(answer - offset)
  }
  // 去掉正确答案（安全起见）
  distractorSet.delete(answer)
  const distractors = [...distractorSet].slice(0, 3)

  const options = shuffle([
    { label: String(answer), value: answer, isCorrect: true },
    ...distractors.map(d => ({ label: String(d), value: d, isCorrect: false })),
  ])

  return {
    question: `${expression} = ?`,
    questionType: 'text',
    options,
    answer,
  }
}

// 生成一轮 10 道题
export function generateMathRound(level) {
  return Array.from({ length: 10 }, () => generateMathQuestion(level))
}

export { LEVEL_CONFIG }
