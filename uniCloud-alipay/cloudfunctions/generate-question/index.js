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
  const { type, count = 1 } = event
  const username = event.username

  if (!username) {
    return { code: -2, msg: '缺少用户名参数' }
  }
  if (!type) {
    return { code: -2, msg: '缺少题型参数' }
  }
  const safeCount = Math.max(1, Math.min(20, Number(count) || 1))

  const settingsRes = await db.collection('interview_settings')
    .where({ username })
    .limit(1)
    .get()

  if (!settingsRes.data.length || !settingsRes.data[0].api_key) {
    return { code: -1, msg: '请先在设置页配置 DeepSeek API Key' }
  }

  const apiKey = settingsRes.data[0].api_key

  let selectedType = type
  if (type === 'random') {
    const types = Object.keys(TYPE_LABELS)
    selectedType = types[Math.floor(Math.random() * types.length)]
  }

  const typeLabel = TYPE_LABELS[selectedType] || '综合分析'

  const prompt = `你是一位资深的公务员结构化面试命题专家。请生成${safeCount}道"${typeLabel}"类型的结构化面试题目。

要求：
1. 贴近真实公务员面试的风格和难度
2. 结合当前社会热点和实际工作场景
3. 题目表述清晰、完整

请以 JSON 数组格式返回，每个元素只包含一个 content 字段（题目文本）：
[{"content": "题目1"}, {"content": "题目2"}]

只返回 JSON，不要其他说明。`

  try {
    const aiResponse = await callDeepSeek(apiKey, prompt)
    const questions = parseQuestions(aiResponse, selectedType)

    const savedQuestions = []
    for (const q of questions) {
      const res = await db.collection('interview_questions').add({
        username,
        type: selectedType,
        content: q.content,
        source: 'ai-generated',
        used_count: 0,
        create_time: Date.now()
      })
      savedQuestions.push({
        _id: res.id,
        type: selectedType,
        typeLabel,
        content: q.content
      })
    }

    return { code: 0, data: savedQuestions }
  } catch (e) {
    console.error('生成题目失败', e)
    return { code: -2, msg: 'AI 服务暂时不可用，请稍后重试' }
  }
}

function callDeepSeek(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'lite',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
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
            console.error('星火 返回结构异常:', JSON.stringify(json).substring(0, 500))
            reject(new Error('AI 返回格式异常: ' + JSON.stringify(json).substring(0, 200)))
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

function parseQuestions(text, type) {
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (e) {}
  }
  return [{ content: text.trim() }]
}
