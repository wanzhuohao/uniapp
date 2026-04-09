// uniCloud-alipay/cloudfunctions/exam-summary/index.js
'use strict'
const https = require('https')
const db = uniCloud.database()

exports.main = async (event, context) => {
  const { recordIds } = event
  const username = event.username

  // 获取 API Key
  const settingsRes = await db.collection('interview_settings')
    .where({ username })
    .limit(1)
    .get()

  if (!settingsRes.data.length || !settingsRes.data[0].api_key) {
    return { code: -1, msg: '未配置 API Key' }
  }

  const apiKey = settingsRes.data[0].api_key

  // 读取所有练习记录
  const records = []
  for (const id of recordIds) {
    const res = await db.collection('interview_records').doc(id).get()
    if (res.data.length > 0) {
      records.push(res.data[0])
    }
  }

  if (records.length === 0) {
    return { code: -2, msg: '未找到答题记录' }
  }

  // 计算平均分和总用时
  const scores = records.map(r => r.total_score).filter(s => s > 0)
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
    : 0
  const totalDuration = records.reduce((a, r) => a + (r.duration || 0), 0)

  // 构造总评 prompt
  const recordSummary = records.map((r, i) => {
    return `第${i + 1}题（${r.question_type}）：评分 ${r.total_score}/10
题目：${r.question}
答案摘要：${(r.answer || '').substring(0, 200)}...`
  }).join('\n\n')

  const prompt = `你是一位资深公务员面试培训专家。以下是一位考生在模拟考场中的表现：

${recordSummary}

平均分：${avgScore}/10

请给出整体评价，包括：
1. 总体表现评价（2-3句话）
2. 最突出的优势
3. 最需要改进的薄弱项
4. 下一步练习建议

简洁明了，300字以内。`

  let summary = ''
  try {
    summary = await callDeepSeek(apiKey, prompt)
  } catch (e) {
    summary = `平均分：${avgScore}/10。详细点评请查看各题记录。`
  }

  // 保存考场记录
  const sessionRes = await db.collection('exam_sessions').add({
    username,
    total_questions: records.length,
    avg_score: avgScore,
    total_duration: totalDuration,
    record_ids: recordIds,
    summary,
    create_time: Date.now()
  })

  return {
    code: 0,
    data: {
      sessionId: sessionRes.id,
      avgScore,
      totalDuration,
      totalQuestions: records.length,
      summary
    }
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
          resolve(json.choices[0].message.content)
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}
