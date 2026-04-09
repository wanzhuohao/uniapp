// utils/interview/constants.js

// 五大题型
export const QUESTION_TYPES = [
  { value: 'comprehensive', label: '综合分析' },
  { value: 'organization', label: '组织协调' },
  { value: 'interpersonal', label: '人际沟通' },
  { value: 'emergency', label: '应急应变' },
  { value: 'self_awareness', label: '自我认知' }
]

// 评分维度
export const SCORE_DIMENSIONS = [
  { key: 'framework', label: '答题框架', desc: '结构清晰、逻辑通顺、层次分明' },
  { key: 'content', label: '内容充实', desc: '论点充分、有具体措施、言之有物' },
  { key: 'politics', label: '政治素养', desc: '立场正确、公务员思维、政策理解到位' },
  { key: 'expression', label: '语言表达', desc: '用词得体、简洁有力、通顺流畅' },
  { key: 'innovation', label: '创新亮点', desc: '独到见解、创新表述、令人眼前一亮' }
]

// 模拟考场默认参数
export const DEFAULT_EXAM_CONFIG = {
  questionCount: 4,
  timePerQuestion: 300 // 秒
}

// 练习模式
export const PRACTICE_MODES = {
  FREE: 'free',
  EXAM: 'exam'
}
