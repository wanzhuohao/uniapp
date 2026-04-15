const LEVEL_CONFIG = {
  1: { name: '20以内加减', max: 20 },
  2: { name: '100以内±整十', max: 100, step: 10 },
  3: { name: '100以内±一位数', max: 100 },
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randTens(max) {
  return rand(1, Math.floor(max / 10)) * 10
}

// 加法: Lv.2 must have one operand as multiple of 10, other as two-digit number
function genAdd(level) {
  const cfg = LEVEL_CONFIG[level]
  let a, b
  if (cfg.step === 10) {
    a = rand(10, cfg.max - 10)
    b = randTens(Math.min(cfg.max - a, 90))
    if (b === 0) b = 10
  } else {
    a = rand(1, cfg.max - 1)
    b = rand(1, cfg.max - a)
  }
  return { expr: `${a} + ${b}`, answer: String(a + b) }
}

// 减法: Lv.2 must have subtrahend as multiple of 10
function genSub(level) {
  const cfg = LEVEL_CONFIG[level]
  let a, b
  if (cfg.step === 10) {
    b = randTens(90)
    a = rand(Math.max(b, 10), cfg.max)
  } else {
    a = rand(2, cfg.max)
    b = rand(1, a - 1)
  }
  return { expr: `${a} - ${b}`, answer: String(a - b) }
}

// 比大小: two unequal numbers, answer is ＞ or ＜ only (no ＝)
function genCompare(level) {
  const cfg = LEVEL_CONFIG[level]
  let a, b
  do {
    a = rand(1, cfg.max)
    b = rand(1, cfg.max)
  } while (a === b)
  return { expr: `${a} ○ ${b}`, answer: a > b ? '＞' : '＜', type: 'compare' }
}

// 填空: a + __ = c or __ - b = c, blank is positive integer
function genFillBlank(level) {
  const cfg = LEVEL_CONFIG[level]
  const isAdd = Math.random() > 0.5
  let a, b
  if (isAdd) {
    a = rand(1, cfg.max - 1)
    b = rand(1, cfg.max - a)
    if (Math.random() > 0.5) {
      return { expr: `__ + ${b} = ${a + b}`, answer: String(a), type: 'fill' }
    } else {
      return { expr: `${a} + __ = ${a + b}`, answer: String(b), type: 'fill' }
    }
  } else {
    a = rand(2, cfg.max)
    b = rand(1, a - 1)
    if (Math.random() > 0.5) {
      return { expr: `__ - ${b} = ${a - b}`, answer: String(a), type: 'fill' }
    } else {
      return { expr: `${a} - __ = ${a - b}`, answer: String(b), type: 'fill' }
    }
  }
}

// 连加连减: a+b+c or a-b-c, intermediate and final results >= 0, total <= max
function genChain(level) {
  const cfg = LEVEL_CONFIG[level]
  const max = cfg.max
  for (let attempt = 0; attempt < 20; attempt++) {
    const isAdd = Math.random() > 0.5
    if (isAdd) {
      const a = rand(1, Math.floor(max / 3))
      const b = rand(1, Math.floor((max - a) / 2))
      const c = rand(1, max - a - b)
      return { expr: `${a} + ${b} + ${c}`, answer: String(a + b + c) }
    } else {
      const a = rand(3, max)
      const b = rand(1, a - 1)
      const c = rand(0, a - b)
      if (c > 0) {
        return { expr: `${a} - ${b} - ${c}`, answer: String(a - b - c) }
      }
    }
  }
  const a = rand(1, 5), b = rand(1, 5), c = rand(1, 5)
  return { expr: `${a} + ${b} + ${c}`, answer: String(a + b + c) }
}

const TYPE_GENERATORS = { add: genAdd, sub: genSub, compare: genCompare, fill: genFillBlank, chain: genChain }
const MIX_TYPES = ['add', 'add', 'sub', 'sub', 'compare', 'fill', 'chain']
const PRINT_TYPES = ['add', 'add', 'sub', 'sub', 'chain']
const PRINT_NO_CHAIN_TYPES = ['add', 'sub']

// Main export: generate questions
// questionType: 'add'/'sub'/'compare'/'fill'/'chain'/'mix'/'print'
// level: 1/2/3/'mix'
export function generateQuestions({ level, count, questionType = 'mix' }) {
  const levels = level === 'mix' ? [1, 2, 3] : [level]
  const seen = new Set()
  const questions = []

  let typePool
  if (questionType === 'mix') typePool = MIX_TYPES
  else if (questionType === 'print') typePool = PRINT_TYPES
  else if (questionType === 'print-no-chain') typePool = PRINT_NO_CHAIN_TYPES
  else typePool = [questionType]

  for (let i = 0; i < count; i++) {
    const lv = levels[Math.floor(Math.random() * levels.length)]
    let q = null
    for (let retry = 0; retry < 10; retry++) {
      const type = typePool[Math.floor(Math.random() * typePool.length)]
      const gen = TYPE_GENERATORS[type]
      q = gen(lv)
      if (!q.type) q.type = type
      if (!seen.has(q.expr)) { seen.add(q.expr); break }
    }
    questions.push(q)
  }
  return questions
}

export { LEVEL_CONFIG }
