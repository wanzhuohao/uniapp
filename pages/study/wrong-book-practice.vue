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

      <!-- 笔顺题 -->
      <view v-if="currentQuestion && currentQuestion.type === 'stroke'" class="question-block">
        <view class="stroke-top">
          <text class="char-display">{{ currentQuestion.char }}</text>
          <text class="stroke-count">{{ currentQuestion.strokeCount }} 画</text>
        </view>
        <text class="prompt">选择正确的笔顺</text>
        <view class="stroke-options">
          <view
            v-for="(opt, i) in currentOptions"
            :key="i"
            :class="['stroke-option', selectedAnswer === i && (isCorrect ? 'correct' : 'wrong')]"
            @click="checkStrokeAnswer(i, opt)"
          >
            <text>{{ opt.join(' → ') }}</text>
          </view>
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

const currentQuestion = computed(() => {
  if (currentIndex.value < questions.value.length) {
    const wrongRecord = questions.value[currentIndex.value]
    return {
      ...wrongRecord,
      ...(questionData.value[wrongRecord.question_id] || {})
    }
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

    // 按 unit + type 分组，批量拉取题目数据
    const groups = {}
    for (const w of wrongList) {
      const key = `${w.type}_${w.unit}`
      if (!groups[key]) groups[key] = { type: w.type, unit: w.unit }
    }

    for (const g of Object.values(groups)) {
      const data = await getQuestions(g.type, g.unit)
      if (data) {
        for (const q of data) {
          questionData.value[q._id] = q
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
    // 拼音题选项
    const opts = [q.pinyin, ...(q.distractors || [])]
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

function nextQuestion() {
  if (currentIndex.value >= questions.value.length - 1) {
    allMastered.value = true
    return
  }

  currentIndex.value++
  selectedAnswer.value = null
  isCorrect.value = false
  showFeedback.value = false
  justMastered.value = false
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
