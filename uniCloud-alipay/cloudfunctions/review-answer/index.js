'use strict'
const https = require('https')
const db = uniCloud.database()

const TYPE_LABELS = {
  comprehensive: '综合分析',
  organization: '组织协调',
  interpersonal: '人际沟通',
  emergency: '应急应变',
  self_awareness: '自我认知'
}

exports.main = async (event, context) => {
  const { question, questionType, answer, recordId } = event
  const username = event.username

  const settingsRes = await db.collection('interview_settings')
    .where({ username })
    .limit(1)
    .get()

  if (!settingsRes.data.length || !settingsRes.data[0].api_key) {
    return { code: -1, msg: '请先在设置页配置 DeepSeek API Key' }
  }

  const apiKey = settingsRes.data[0].api_key
  const typeLabel = TYPE_LABELS[questionType] || questionType

  const prompt = `你是一位经验丰富的公务员结构化面试考官和培训专家。

面试题目（${typeLabel}类）：
${question}

考生答案：
${answer}

请从以下五个维度对考生的答案进行专业点评，每个维度给出 1-10 分的评分和简要点评：

1. 答题框架（framework）：结构是否清晰、逻辑是否通顺、层次是否分明
2. 内容充实（content）：论点论据是否充分、有无具体措施、是否言之有物
3. 政治素养（politics）：立场是否正确、是否体现公务员思维、政策理解是否到位
4. 语言表达（expression）：用词是否得体、是否简洁有力、是否通顺流畅
5. 创新亮点（innovation）：有无独到见解、创新表述、或令人眼前一亮的角度

然后给出：
- 综合评分（五项均分，保留一位小数）
- 答案亮点（值得保持的地方）
- 改进建议（具体可操作的提升方向）
- 参考答题思路（给出一个高分答题框架）

请以 JSON 格式返回：
{
  "scores": {
    "framework": {"score": 8, "comment": "..."},
    "content": {"score": 7, "comment": "..."},
    "politics": {"score": 8, "comment": "..."},
    "expression": {"score": 7, "comment": "..."},
    "innovation": {"score": 6, "comment": "..."}
  },
  "total_score": 7.2,
  "highlights": "...",
  "suggestions": "...",
  "reference_approach": "..."
}

只返回 JSON，不要其他说明。`

  try {
    const aiResponse = await callDeepSeek(apiKey, prompt)
    const review = parseReview(aiResponse)
    const reviewText = formatReviewText(review, typeLabel)

    if (recordId) {
      await db.collection('interview_records').doc(recordId).update({
        review: reviewText,
        scores: extractScores(review.scores),
        total_score: review.total_score
      })
    }

    return {
      code: 0,
      data: {
        review: reviewText,
        scores: review.scores,
        total_score: review.total_score,
        highlights: review.highlights,
        suggestions: review.suggestions,
        reference_approach: review.reference_approach
      }
    }
  } catch (e) {
    console.error('点评失败', e)
    return { code: -2, msg: 'AI 服务暂时不可用，请稍后重试' }
  }
}

function callDeepSeek(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'lite',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })

    const options = {
      hostname: 'spark-api-open.xf-yun.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content)
          } else {
            reject(new Error('AI 返回格式异常'))
          }
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

function parseReview(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (e) {}
  }
  return {
    scores: {},
    total_score: 0,
    highlights: text,
    suggestions: '',
    reference_approach: ''
  }
}

function extractScores(scores) {
  const result = {}
  for (const [key, val] of Object.entries(scores || {})) {
    result[key] = typeof val === 'object' ? val.score : val
  }
  return result
}

function formatReviewText(review, typeLabel) {
  let text = `【${typeLabel}题 AI 点评】\n\n`

  const dims = [
    ['framework', '答题框架'],
    ['content', '内容充实'],
    ['politics', '政治素养'],
    ['expression', '语言表达'],
    ['innovation', '创新亮点']
  ]

  text += `综合评分：${review.total_score || '-'} / 10\n\n`

  for (const [key, label] of dims) {
    const s = review.scores && review.scores[key]
    if (s) {
      const score = typeof s === 'object' ? s.score : s
      const comment = typeof s === 'object' ? s.comment : ''
      text += `${label}：${score}/10 — ${comment}\n`
    }
  }

  if (review.highlights) {
    text += `\n亮点：\n${review.highlights}\n`
  }
  if (review.suggestions) {
    text += `\n改进建议：\n${review.suggestions}\n`
  }
  if (review.reference_approach) {
    text += `\n参考答题思路：\n${review.reference_approach}\n`
  }

  return text
}
