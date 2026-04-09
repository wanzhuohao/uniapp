<template>
  <view class="practice">
    <!-- 题目区 -->
    <view class="question-card">
      <view class="question-header">
        <text class="type-tag">{{ currentTypeLabel }}</text>
        <text v-if="isExam" class="progress">{{ currentIndex + 1 }} / {{ totalQuestions }}</text>
      </view>
      <text class="question-text">{{ currentQuestion }}</text>
    </view>

    <!-- 计时器（考场模式） -->
    <view v-if="isExam && !showReview" class="timer" :class="{ warning: timer.isWarning.value, danger: timer.isDanger.value }">
      <text>{{ timer.display.value }}</text>
    </view>

    <!-- 答题区 -->
    <view v-if="!showReview" class="answer-area">
      <textarea
        v-model="answer"
        placeholder="请输入你的答案..."
        :maxlength="-1"
        auto-height
        class="answer-input"
        :focus="!showReview"
      />
      <view class="answer-footer">
        <text class="word-count">{{ answer.length }} 字</text>
        <button class="btn-submit" @click="submitAnswer" :loading="submitting" :disabled="!answer.trim()">
          提交答案
        </button>
      </view>
    </view>

    <!-- AI 点评区 -->
    <view v-if="showReview" class="review-area">
      <view class="review-header">
        <text class="review-title">AI 点评</text>
        <text v-if="reviewData.total_score" class="total-score">
          {{ reviewData.total_score }} / 10
        </text>
      </view>

      <!-- 五维度评分 -->
      <view v-if="reviewData.scores" class="scores">
        <view v-for="dim in scoreDimensions" :key="dim.key" class="score-item">
          <view class="score-label">{{ dim.label }}</view>
          <view class="score-bar-bg">
            <view class="score-bar" :style="{ width: getScoreWidth(dim.key) }"></view>
          </view>
          <text class="score-value">{{ getScore(dim.key) }}</text>
        </view>
      </view>

      <!-- 点评文本（打字机效果） -->
      <view class="review-content">
        <text>{{ displayedReview }}</text>
        <text v-if="typing" class="cursor">|</text>
      </view>

      <!-- 操作按钮（仅自由模式，考场模式点评完直接跳转结果页） -->
      <view v-if="!typing && !isExam" class="actions">
        <button class="btn-next" @click="nextFreeQuestion" :loading="loading">下一题</button>
        <button class="btn-secondary" @click="finish">结束练习</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTimer } from '../../composables/interview/useTimer'
import { SCORE_DIMENSIONS, PRACTICE_MODES } from '../../utils/interview/constants'
import { useAuth } from '../../composables/common/useAuth'

const { getUsername } = useAuth()
const timer = useTimer()
const scoreDimensions = SCORE_DIMENSIONS

// 页面参数
const mode = ref('')
const isExam = computed(() => mode.value === PRACTICE_MODES.EXAM)
const allQuestions = ref([]) // 考场模式的所有题目
const currentIndex = ref(0)
const totalQuestions = computed(() => allQuestions.value.length)
const timePerQuestion = ref(300)

// 当前题目
const currentQuestion = ref('')
const currentTypeLabel = ref('')
const currentQuestionType = ref('')

// 答题
const answer = ref('')
const submitting = ref(false)
const loading = ref(false)

// 点评
const showReview = ref(false)
const reviewData = ref({})
const displayedReview = ref('')
const typing = ref(false)

// 考场模式记录
const examRecordIds = ref([])
const examAnswers = ref([]) // 保存每题答案，用于点评时传递
const examStartTime = ref(0)
const isReviewing = ref(false) // 考场模式点评中状态

onLoad((options) => {
  mode.value = options.mode || PRACTICE_MODES.FREE

  if (isExam.value) {
    // 考场模式：通过事件接收题目数据
    uni.$once('examQuestions', (data) => {
      allQuestions.value = data.questions
      timePerQuestion.value = data.timePerQuestion || 300
      examStartTime.value = Date.now()
      loadExamQuestion(0)
    })
  } else {
    // 自由模式
    currentQuestion.value = decodeURIComponent(options.question)
    currentTypeLabel.value = decodeURIComponent(options.typeLabel || '')
    currentQuestionType.value = options.type || ''
  }
})

function loadExamQuestion(index) {
  const q = allQuestions.value[index]
  currentQuestion.value = q.content
  currentTypeLabel.value = q.typeLabel
  currentQuestionType.value = q.type
  currentIndex.value = index
  answer.value = ''
  showReview.value = false
  displayedReview.value = ''

  // 开始倒计时
  timer.start(timePerQuestion.value, () => {
    // 时间到，自动提交
    submitAnswer()
  })
}

async function submitAnswer() {
  if (submitting.value) return
  timer.stop()
  submitting.value = true

  const db = uniCloud.database()

  try {
    // 创建练习记录
    const recordData = {
      username: getUsername(),
      mode: mode.value,
      question_type: currentQuestionType.value,
      question: currentQuestion.value,
      answer: answer.value || '（未作答）',
      review: '',
      scores: {},
      total_score: 0,
      duration: isExam.value ? (timePerQuestion.value - timer.remaining.value) : 0,
      create_time: Date.now()
    }

    const addRes = await db.collection('interview_records').add(recordData)
    const recordId = addRes.result.id

    if (isExam.value) {
      examRecordIds.value.push(recordId)
      examAnswers.value.push(answer.value || '（未作答）')
      // 考场模式不立即点评，继续下一题或结束
      if (currentIndex.value < totalQuestions.value - 1) {
        submitting.value = false
        loadExamQuestion(currentIndex.value + 1)
        return
      } else {
        // 最后一题，开始点评流程
        submitting.value = false
        await reviewAllExamAnswers()
        return
      }
    }

    // 自由模式：立即点评
    const res = await uniCloud.callFunction({
      name: 'review-answer',
      data: {
        username: getUsername(),
        question: currentQuestion.value,
        questionType: currentQuestionType.value,
        answer: answer.value,
        recordId
      }
    })

    if (res.result.code === 0) {
      reviewData.value = res.result.data
      showReview.value = true
      typewriterEffect(res.result.data.review)
    } else {
      uni.showToast({ title: res.result.msg || '点评失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function reviewAllExamAnswers() {
  if (isReviewing.value) return // 防止重复调用
  isReviewing.value = true

  // 显示专门的"点评中"状态（不复用 showReview）
  showReview.value = false
  uni.showLoading({ title: '正在 AI 点评中...', mask: true })

  const username = getUsername()

  // 逐题调用点评
  for (let i = 0; i < examRecordIds.value.length; i++) {
    const q = allQuestions.value[i]
    uni.showLoading({ title: `正在点评第${i + 1}/${examRecordIds.value.length}题...`, mask: true })
    try {
      await uniCloud.callFunction({
        name: 'review-answer',
        data: {
          username,
          question: q.content,
          questionType: q.type,
          answer: examAnswers.value[i],
          recordId: examRecordIds.value[i]
        }
      })
    } catch (e) {
      console.error(`第${i + 1}题点评失败`, e)
    }
  }

  // 生成总评
  uni.showLoading({ title: '生成总评...', mask: true })
  try {
    const summaryRes = await uniCloud.callFunction({
      name: 'exam-summary',
      data: { username, recordIds: examRecordIds.value }
    })

    uni.hideLoading()

    if (summaryRes.result.code === 0) {
      uni.redirectTo({
        url: `/pages/interview/exam-result?sessionId=${summaryRes.result.data.sessionId}`
      })
      return
    }
  } catch (e) {
    console.error('生成总评失败', e)
  }

  uni.hideLoading()
  uni.showToast({ title: '点评完成，请查看记录', icon: 'none' })
  isReviewing.value = false
}

function typewriterEffect(text) {
  typing.value = true
  displayedReview.value = ''
  let i = 0
  const interval = setInterval(() => {
    if (i < text.length) {
      displayedReview.value += text[i]
      i++
    } else {
      clearInterval(interval)
      typing.value = false
    }
  }, 30) // 每 30ms 一个字符
}

function getScore(key) {
  const s = reviewData.value.scores && reviewData.value.scores[key]
  if (!s) return '-'
  return typeof s === 'object' ? s.score : s
}

function getScoreWidth(key) {
  const score = getScore(key)
  if (score === '-') return '0%'
  return `${score * 10}%`
}

async function nextFreeQuestion() {
  loading.value = true
  try {
    const type = currentQuestionType.value || 'random'
    const res = await uniCloud.callFunction({
      name: 'generate-question',
      data: { username: getUsername(), type, count: 1 }
    })
    if (res.result.code === 0) {
      const q = res.result.data[0]
      currentQuestion.value = q.content
      currentTypeLabel.value = q.typeLabel
      currentQuestionType.value = q.type
      answer.value = ''
      showReview.value = false
      displayedReview.value = ''
      reviewData.value = {}
    } else {
      uni.showToast({ title: res.result.msg, icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '出题失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function finish() {
  uni.navigateTo({ url: '/pages/interview/records' })
}

</script>

<style scoped>
.practice { padding: 20rpx; min-height: 100vh; background: #f5f5f5; }
.question-card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.type-tag { background: #007AFF; color: #fff; padding: 6rpx 16rpx; border-radius: 20rpx; font-size: 24rpx; }
.progress { font-size: 26rpx; color: #999; }
.question-text { font-size: 32rpx; line-height: 1.6; }

.timer { text-align: center; font-size: 48rpx; font-weight: bold; padding: 16rpx; color: #333; }
.timer.warning { color: #FF9500; }
.timer.danger { color: #FF3B30; }

.answer-area { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.answer-input { width: 100%; min-height: 300rpx; font-size: 30rpx; line-height: 1.6; }
.answer-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; }
.word-count { font-size: 24rpx; color: #999; }
.btn-submit { background: #007AFF; color: #fff; border: none; border-radius: 8rpx; font-size: 28rpx; padding: 0 40rpx; }

.review-area { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.review-title { font-size: 32rpx; font-weight: bold; }
.total-score { font-size: 36rpx; font-weight: bold; color: #007AFF; }

.scores { margin-bottom: 20rpx; }
.score-item { display: flex; align-items: center; margin-bottom: 12rpx; }
.score-label { width: 140rpx; font-size: 26rpx; color: #666; }
.score-bar-bg { flex: 1; height: 16rpx; background: #f0f0f0; border-radius: 8rpx; overflow: hidden; }
.score-bar { height: 100%; background: #007AFF; border-radius: 8rpx; transition: width 0.5s; }
.score-value { width: 60rpx; text-align: right; font-size: 26rpx; font-weight: bold; }

.review-content { font-size: 28rpx; line-height: 1.8; white-space: pre-wrap; color: #333; }
.cursor { color: #007AFF; animation: blink 0.5s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.actions { display: flex; gap: 20rpx; margin-top: 30rpx; }
.actions button { flex: 1; }
.btn-next { background: #007AFF; color: #fff; border: none; border-radius: 8rpx; font-size: 28rpx; }
.btn-secondary { background: #fff; color: #666; border: 1rpx solid #ddd; border-radius: 8rpx; font-size: 28rpx; }
.btn-primary { background: #007AFF; color: #fff; border: none; border-radius: 8rpx; font-size: 28rpx; }
</style>
