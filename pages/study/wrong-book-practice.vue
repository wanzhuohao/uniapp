<template>
  <view class="container">
    <!-- 头部进度 -->
    <view class="header">
      <text class="back" @click="goBack">←</text>
      <text class="title">错题重练</text>
      <text class="progress">{{ currentIndex + 1 }} / {{ questions.length }}</text>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <!-- 无错题 -->
    <view v-else-if="questions.length === 0" class="empty-state">
      <text class="empty-icon">🎉</text>
      <text class="empty-text">太棒了！没有未掌握的错题！</text>
      <button class="back-btn" @click="goBack">返回错题本</button>
    </view>

    <!-- 全部掌握 -->
    <view v-else-if="allMastered" class="empty-state">
      <text class="empty-icon">🏆</text>
      <text class="empty-text">太棒了！全部掌握！</text>
      <text class="sub-text">本轮正确 {{ correctCount }} / {{ questions.length }}</text>
      <button class="back-btn" @click="goBack">返回错题本</button>
    </view>

    <!-- 答题区 -->
    <view v-else class="practice-area">
      <!-- 拼音题 -->
      <view v-if="currentQuestion && currentQuestion.type === 'pinyin'" class="question-block">
        <text class="char-display">{{ currentQuestion.char }}</text>
        <text class="prompt">选择正确的拼音</text>
        <view class="options">
          <view
            v-for="(opt, i) in currentOptions"
            :key="i"
            :class="['option', selectedAnswer === opt && (isCorrect ? 'correct' : 'wrong')]"
            @click="checkAnswer(opt)"
          >
            <text>{{ opt }}</text>
          </view>
        </view>
      </view>

      <!-- 汉字自测题（hanzi / 旧 stroke） -->
      <view v-if="currentQuestion && (currentQuestion.type === 'hanzi' || currentQuestion.type === 'stroke')" class="question-block">
        <text class="char-display">{{ currentQuestion.char }}</text>
        <text class="prompt">想一想：拼音、部首、结构、笔画</text>
        <view v-if="showAnswer" class="answer-box">
          <view v-if="currentQuestion.pinyin" class="answer-row"><text>拼音：{{ currentQuestion.pinyin }}</text></view>
          <view v-if="currentQuestion.radical" class="answer-row"><text>部首：{{ currentQuestion.radical }}</text></view>
          <view v-if="currentQuestion.structure" class="answer-row"><text>结构：{{ currentQuestion.structure }}</text></view>
          <view v-if="currentQuestion.strokeCount" class="answer-row"><text>笔画：{{ currentQuestion.strokeCount }} 画</text></view>
        </view>
        <view v-if="!showAnswer" class="show-answer-btn" @click="showAnswer = true">查看答案</view>
        <view v-if="showAnswer" class="self-judge">
          <view class="judge-btn wrong" @click="judgeSelf(false)">❌ 我不会</view>
          <view class="judge-btn correct" @click="judgeSelf(true)">✅ 我会了</view>
        </view>
      </view>

      <!-- 口算题 -->
      <view v-if="currentQuestion && currentQuestion.type === 'math'" class="question-block">
        <text class="char-display math-expr">{{ mathExpression }}</text>
        <text class="prompt">想出答案后查看</text>
        <view v-if="showAnswer" class="answer-box">
          <view class="answer-row"><text>答案：{{ mathAnswer }}</text></view>
        </view>
        <view v-if="!showAnswer" class="show-answer-btn" @click="showAnswer = true">查看答案</view>
        <view v-if="showAnswer" class="self-judge">
          <view class="judge-btn wrong" @click="judgeSelf(false)">❌ 我不会</view>
          <view class="judge-btn correct" @click="judgeSelf(true)">✅ 我会了</view>
        </view>
      </view>

      <!-- 反馈 -->
      <view v-if="showFeedback" class="feedback">
        <text v-if="isCorrect" class="feedback-correct">✓ 答对了！</text>
        <text v-if="isCorrect && justMastered" class="mastered-msg">已掌握此题！</text>
        <text v-if="!isCorrect" class="feedback-wrong">✗ 答错了</text>
        <button class="next-btn" @click="nextQuestion">
          {{ currentIndex < questions.length - 1 ? '下一题' : '查看结果' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../composables/common/useAuth.js'
import { getUnmasteredList, recordCorrect, recordWrongAgain } from '../../utils/study/wrongBook.js'
import { getQuestions } from '../../utils/common/cloudDb.js'
import { shuffle } from '../../utils/study/questionHelper.js'
import { generateStrokeDistractors } from '../../utils/study/questionHelper.js'

const { getUsername } = useAuth()

const loading = ref(true)
const questions = ref([])       // 错题 wrong_records 列表
const questionData = ref({})    // question_id -> 完整题目数据
const currentIndex = ref(0)
const currentOptions = ref([])
const selectedAnswer = ref(null)
const isCorrect = ref(false)
const showFeedback = ref(false)
const justMastered = ref(false)
const allMastered = ref(false)
const correctCount = ref(0)
const showAnswer = ref(false)

// 口算题：从 char 字段解析算式和答案
const mathExpression = computed(() => {
  const c = currentQuestion.value?.char || ''
  // 存储格式 "3 + 5 = 8"
  const m = c.match(/^(.+?)\s*=\s*/)
  return m ? m[1] + ' = ?' : c
})
const mathAnswer = computed(() => {
  const c = currentQuestion.value?.char || ''
  const m = c.match(/=\s*(.+)$/)
  return m ? m[1] : ''
})

const currentQuestion = computed(() => {
  if (currentIndex.value < questions.value.length) {
    const w = questions.value[currentIndex.value]
    // hanzi 类型按 char 查，其他按 question_id 查
    const extra = w.type === 'hanzi'
      ? (questionData.value['hanzi_' + w.char] || {})
      : (questionData.value[w.question_id] || {})
    return { ...extra, ...w }  // wrong 记录字段优先，云端补全
  }
  return null
})

async function loadQuestions() {
  loading.value = true
  const username = getUsername()
  if (!username) {
    loading.value = false
    return
  }

  try {
    // 获取未掌握的错题列表
    const wrongList = await getUnmasteredList(username)
    questions.value = wrongList

    if (wrongList.length === 0) {
      loading.value = false
      return
    }

    // 只有 pinyin/stroke 类型需要去云端拉完整题目数据
    // hanzi 类型统一按 char 查云端 pinyin 表补全答案
    // math 类型的 char 字段已包含完整表达式
    const groups = {}
    for (const w of wrongList) {
      if (w.type === 'pinyin' || w.type === 'stroke') {
        const key = `${w.type}_${w.unit}`
        if (!groups[key]) groups[key] = { type: w.type, unit: w.unit }
      } else if (w.type === 'hanzi') {
        // hanzi 自测需要拼音/部首/结构/笔画，走 pinyin 表
        const key = `pinyin_${w.unit}`
        if (!groups[key]) groups[key] = { type: 'pinyin', unit: w.unit, targetType: 'hanzi' }
      }
    }

    for (const g of Object.values(groups)) {
      const data = await getQuestions(g.type, g.unit)
      if (data) {
        for (const q of data) {
          // hanzi 类型用 char 作为 key（因为 question_id 对不上）
          if (g.targetType === 'hanzi') {
            questionData.value['hanzi_' + q.char] = q
          } else {
            questionData.value[q._id] = q
          }
        }
      }
    }

    // 准备第一题选项
    prepareOptions()
  } catch (e) {
    console.error('加载错题失败:', e)
  }
  loading.value = false
}

function prepareOptions() {
  const q = currentQuestion.value
  if (!q) return

  if (q.type === 'pinyin' && q.pinyin) {
    // 拼音题选项：优先用云端 distractors，为空则从同单元其他题拼音兜底
    let distractors = Array.isArray(q.distractors) ? q.distractors.slice() : []
    if (distractors.length < 3) {
      const pool = Object.values(questionData.value)
        .filter(item => item && item.pinyin && item.pinyin !== q.pinyin && !distractors.includes(item.pinyin))
        .map(item => item.pinyin)
      const unique = Array.from(new Set(pool))
      while (distractors.length < 3 && unique.length > 0) {
        const idx = Math.floor(Math.random() * unique.length)
        distractors.push(unique.splice(idx, 1)[0])
      }
    }
    const opts = [q.pinyin, ...distractors.slice(0, 3)]
    currentOptions.value = shuffle(opts)
  } else if (q.type === 'stroke' && q.strokes) {
    // 笔顺题选项
    const distractors = generateStrokeDistractors(q.strokes, 3)
    const opts = [q.strokes, ...distractors]
    currentOptions.value = shuffle(opts)
  }
}

function checkAnswer(answer) {
  if (showFeedback.value) return
  selectedAnswer.value = answer
  const q = currentQuestion.value

  if (q.type === 'pinyin') {
    isCorrect.value = answer === q.pinyin
  }

  handleResult()
}

function checkStrokeAnswer(index, answer) {
  if (showFeedback.value) return
  selectedAnswer.value = index
  const q = currentQuestion.value

  if (q.type === 'stroke') {
    isCorrect.value = answer.join(',') === q.strokes.join(',')
  }

  handleResult()
}

async function handleResult() {
  showFeedback.value = true
  const wrongRecord = questions.value[currentIndex.value]

  if (isCorrect.value) {
    correctCount.value++
    const result = await recordCorrect(wrongRecord._id, wrongRecord.correctCount || 0)
    justMastered.value = result.mastered
  } else {
    justMastered.value = false
    await recordWrongAgain(wrongRecord._id, wrongRecord.wrongCount || 0)
  }
}

// 自测模式（hanzi/math）的我会了/我不会
async function judgeSelf(correct) {
  isCorrect.value = correct
  await handleResult()
  setTimeout(() => advanceToNext(), 800)
}

function nextQuestion() {
  advanceToNext()
}

function advanceToNext() {
  if (currentIndex.value >= questions.value.length - 1) {
    allMastered.value = true
    return
  }
  currentIndex.value++
  selectedAnswer.value = null
  isCorrect.value = false
  showFeedback.value = false
  justMastered.value = false
  showAnswer.value = false
  prepareOptions()
}

function goBack() {
  uni.navigateBack()
}

onMounted(() => {
  loadQuestions()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
}

.back {
  font-size: 36rpx;
  margin-right: 20rpx;
  color: #333;
}

.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.progress {
  font-size: 26rpx;
  color: #999;
}

.loading, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.sub-text {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.back-btn {
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 50rpx;
  font-size: 28rpx;
  padding: 20rpx 60rpx;
  margin-top: 30rpx;
}

.practice-area {
  padding: 30rpx;
}

.question-block {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.char-display {
  display: block;
  font-size: 120rpx;
  font-weight: bold;
  text-align: center;
  color: #333;
  margin-bottom: 20rpx;
}

.stroke-top {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 20rpx;
}

.stroke-count {
  font-size: 28rpx;
  color: #999;
}

.prompt {
  display: block;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 30rpx;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  justify-content: center;
}

.option {
  padding: 24rpx 48rpx;
  border-radius: 16rpx;
  background: #f0f2ff;
  font-size: 32rpx;
  color: #333;
  min-width: 150rpx;
  text-align: center;
}

.option.correct {
  background: #d4edda;
  color: #155724;
}

.option.wrong {
  background: #f8d7da;
  color: #721c24;
}

.stroke-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.stroke-option {
  padding: 24rpx;
  border-radius: 16rpx;
  background: #f0f2ff;
  font-size: 26rpx;
  color: #333;
  text-align: center;
}

.stroke-option.correct {
  background: #d4edda;
  color: #155724;
}

.stroke-option.wrong {
  background: #f8d7da;
  color: #721c24;
}

.feedback {
  text-align: center;
  padding: 30rpx;
}

.feedback-correct {
  display: block;
  font-size: 36rpx;
  color: #52c41a;
  margin-bottom: 16rpx;
}

.feedback-wrong {
  display: block;
  font-size: 36rpx;
  color: #ff4d4f;
  margin-bottom: 16rpx;
}

.mastered-msg {
  display: block;
  font-size: 28rpx;
  color: #667eea;
  margin-bottom: 16rpx;
}

.next-btn {
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 50rpx;
  font-size: 28rpx;
  padding: 20rpx 60rpx;
  margin-top: 20rpx;
}
</style>
