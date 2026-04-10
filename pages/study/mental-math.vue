<template>
  <view class="mental-page">
    <!-- 顶部栏 -->
    <view class="top-bar">
      <view class="back-btn" @click="goBack">←</view>
      <view class="timer" :class="{ warn: timerWarn }">{{ formatTime(elapsed) }}</view>
      <view class="progress-text">{{ answeredCount }}/100</view>
    </view>

    <!-- 难度选择（未开始时显示） -->
    <view v-if="!started && !finished" class="start-area">
      <text class="start-title">口算计时挑战</text>
      <text class="start-desc">100 道题，从 0 开始计时</text>

      <view class="level-select">
        <view
          v-for="lv in 3" :key="lv"
          class="level-opt"
          :class="{ active: selectedLevel === lv }"
          @click="selectedLevel = lv"
        >
          Lv.{{ lv }} {{ levelLabels[lv] }}
        </view>
      </view>

      <view class="start-btn" @click="startQuiz">开始</view>
    </view>

    <!-- 答题区（滚动列表） -->
    <scroll-view v-if="started && !finished" scroll-y class="question-list" :scroll-into-view="scrollTarget">
      <view
        v-for="(q, i) in questions"
        :key="i"
        :id="'q-' + i"
        class="q-row"
        :class="{ current: i === currentFocus, done: q.userAnswer !== '' }"
      >
        <text class="q-index">{{ i + 1 }}.</text>
        <text class="q-expr">{{ q.expression }} =</text>
        <input
          class="q-input"
          type="number"
          :value="q.userAnswer"
          :focus="i === currentFocus"
          placeholder="?"
          @input="onInput(i, $event)"
          @confirm="onConfirm(i)"
        />
        <!-- 提交后显示对错 -->
        <text v-if="q.checked" class="q-result">
          {{ q.userAnswer == q.answer ? '✓' : '✗ ' + q.answer }}
        </text>
      </view>
    </scroll-view>

    <!-- 提交按钮 -->
    <view v-if="started && !finished" class="submit-bar">
      <view class="submit-btn" @click="submitAll">交卷</view>
    </view>

    <!-- 结果页 -->
    <view v-if="finished" class="result-area">
      <text class="result-title">完成！</text>
      <text class="result-time">用时：{{ formatTime(finalTime) }}</text>
      <text class="result-score">{{ correctCount }}/100 正确</text>
      <text class="result-accuracy">正确率：{{ Math.round(correctCount) }}%</text>

      <view class="result-actions">
        <view class="action-btn primary" @click="restart">再来一次</view>
        <view class="action-btn" @click="goBack">回到主页</view>
      </view>

      <!-- 错题列表 -->
      <view v-if="wrongList.length > 0" class="wrong-section">
        <text class="wrong-title">错题回顾（{{ wrongList.length }} 题）</text>
        <view v-for="w in wrongList" :key="w.index" class="wrong-item">
          <text>{{ w.index + 1 }}. {{ w.expression }} = {{ w.answer }}</text>
          <text class="wrong-answer">你的答案：{{ w.userAnswer || '未填' }}</text>
        </view>
      </view>
    </view>

    <!-- 时间提醒弹窗 -->
    <view v-if="showTimeAlert" class="time-alert-mask" @click="showTimeAlert = false">
      <view class="time-alert-box" @click.stop>
        <text class="time-alert-text">{{ timeAlertMsg }}</text>
        <view class="time-alert-btn" @click="showTimeAlert = false">继续答题</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { LEVEL_CONFIG } from '../../utils/study/mathGen.js'
import { recordWrong } from '../../utils/study/wrongBook.js'
import { recordPractice } from '../../utils/study/practiceLog.js'
import { useAuth } from '../../composables/common/useAuth.js'

const { getUsername } = useAuth()

const levelLabels = { 1: '十以内', 2: '二十以内', 3: '百以内' }

const selectedLevel = ref(1)
const started = ref(false)
const finished = ref(false)
const elapsed = ref(0) // 秒
const finalTime = ref(0)
const currentFocus = ref(0)
const scrollTarget = ref('')
const showTimeAlert = ref(false)
const timeAlertMsg = ref('')
const timerWarn = ref(false)

let timer = null
let alerted8 = false
let alerted10 = false

const questions = ref([])

// 生成 100 道口算题
function generateQuestions(level) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1]
  const list = []
  for (let i = 0; i < 100; i++) {
    const isAdd = Math.random() > 0.5
    let a, b, answer, expression

    if (isAdd) {
      answer = Math.floor(Math.random() * config.max) + 1 // 至少为1
      a = Math.floor(Math.random() * answer) + (answer > 1 ? 1 : 0)
      b = answer - a
      expression = `${a} + ${b}`
    } else {
      a = Math.floor(Math.random() * config.max) + 1
      b = Math.floor(Math.random() * a) + (a > 1 ? 1 : 0)
      answer = a - b
      expression = `${a} - ${b}`
    }

    list.push({
      expression,
      answer,
      userAnswer: '',
      checked: false,
    })
  }
  return list
}

const answeredCount = computed(() => questions.value.filter(q => q.userAnswer !== '').length)
const correctCount = computed(() => questions.value.filter(q => q.checked && String(q.userAnswer) === String(q.answer)).length)
const wrongList = computed(() =>
  questions.value
    .map((q, i) => ({ ...q, index: i }))
    .filter(q => q.checked && String(q.userAnswer) !== String(q.answer))
)

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function startQuiz() {
  questions.value = generateQuestions(selectedLevel.value)
  started.value = true
  finished.value = false
  elapsed.value = 0
  currentFocus.value = 0
  alerted8 = false
  alerted10 = false
  timerWarn.value = false

  timer = setInterval(() => {
    elapsed.value++

    // 8 分钟提醒
    if (elapsed.value === 480 && !alerted8) {
      alerted8 = true
      timeAlertMsg.value = '已经 8 分钟了，加油！'
      showTimeAlert.value = true
      timerWarn.value = true
    }

    // 10 分钟提醒
    if (elapsed.value === 600 && !alerted10) {
      alerted10 = true
      timeAlertMsg.value = '已经 10 分钟了，抓紧时间！'
      showTimeAlert.value = true
    }
  }, 1000)
}

function onInput(index, e) {
  questions.value[index].userAnswer = e.detail.value
}

function onConfirm(index) {
  // 按回车/确认，跳到下一题
  if (index < 99) {
    currentFocus.value = index + 1
    scrollTarget.value = 'q-' + (index + 1)
  }
}

function submitAll() {
  uni.showModal({
    title: '确认交卷',
    content: `已答 ${answeredCount.value}/100 题，确定交卷？`,
    success: (res) => {
      if (res.confirm) {
        doSubmit()
      }
    }
  })
}

function doSubmit() {
  clearInterval(timer)
  timer = null
  finalTime.value = elapsed.value
  // 批改
  questions.value.forEach(q => { q.checked = true })
  finished.value = true
  started.value = false

  // 写错题本和练习日志
  const username = getUsername()
  if (username) {
    // 错题异步写入
    questions.value.forEach(q => {
      if (String(q.userAnswer) !== String(q.answer)) {
        recordWrong(username, {
          type: 'math',
          char: q.expression + ' = ' + q.answer,
          unit: 'lv' + selectedLevel.value,
          question_id: 'math_' + selectedLevel.value + '_' + q.expression.replace(/\s/g, '')
        })
      }
    })
    // 记录练习日志
    recordPractice(username, {
      type: 'math',
      totalCount: questions.value.length,
      correctCount: correctCount.value
    })
  }
}

function restart() {
  finished.value = false
  started.value = false
  elapsed.value = 0
  timerWarn.value = false
}

function goBack() {
  if (timer) clearInterval(timer)
  uni.navigateBack()
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.mental-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 10;
}
.back-btn {
  font-size: 36rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f0f0;
}
.back-btn:active { transform: scale(0.9); }
.timer {
  font-size: 40rpx;
  font-weight: bold;
  font-family: monospace;
  color: var(--color-text);
}
.timer.warn { color: var(--color-danger); }
.progress-text {
  font-size: 28rpx;
  color: var(--color-text-light);
  font-weight: bold;
}

/* 开始区域 */
.start-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64rpx 48rpx;
}
.start-title {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}
.start-desc {
  font-size: 28rpx;
  color: var(--color-text-light);
  margin-bottom: 48rpx;
}
.level-select {
  display: flex;
  gap: 20rpx;
  margin-bottom: 48rpx;
}
.level-opt {
  padding: 20rpx 36rpx;
  border-radius: 28rpx;
  font-size: 28rpx;
  background: #fff;
  color: #666;
  border: 3rpx solid #BDBDBD;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
}
.level-opt:active { transform: scale(0.95); }
.level-opt.active {
  background: #9C27B0;
  color: #fff;
  font-weight: bold;
  border-color: #9C27B0;
  box-shadow: 0 4rpx 16rpx rgba(156,39,176,0.3);
}
.start-btn {
  padding: 28rpx 120rpx;
  background: linear-gradient(135deg, #9C27B0, #7B1FA2);
  color: #fff;
  border-radius: 40rpx;
  font-size: 36rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(156,39,176,0.3);
}
.start-btn:active { transform: scale(0.97); opacity: 0.9; }

/* 答题列表 */
.question-list {
  flex: 1;
  padding: 16rpx 24rpx;
  padding-bottom: 120rpx;
}
.q-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 12rpx;
  background: #fff;
  border-radius: 16rpx;
  border-left: 6rpx solid transparent;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.q-row.current {
  border-left-color: #9C27B0;
  background: #F3E5F5;
}
.q-row.done {
  border-left-color: var(--color-primary);
}
.q-index {
  font-size: 24rpx;
  color: var(--color-text-light);
  width: 56rpx;
  text-align: right;
}
.q-expr {
  font-size: 36rpx;
  font-weight: bold;
  min-width: 200rpx;
}
.q-input {
  width: 120rpx;
  height: 64rpx;
  border: 4rpx solid #E0E0E0;
  border-radius: 12rpx;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
}
.q-result {
  font-size: 28rpx;
  margin-left: 12rpx;
}

/* 提交栏 */
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 48rpx;
  background: #fff;
  box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06);
  z-index: 10;
}
.submit-btn {
  text-align: center;
  padding: 24rpx;
  background: #9C27B0;
  color: #fff;
  border-radius: var(--radius-btn);
  font-size: 32rpx;
  font-weight: bold;
}
.submit-btn:active { transform: scale(0.97); }

/* 结果区域 */
.result-area {
  flex: 1;
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.result-title {
  font-size: 56rpx;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 24rpx;
}
.result-time {
  font-size: 40rpx;
  font-weight: bold;
  font-family: monospace;
  margin-bottom: 16rpx;
}
.result-score {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}
.result-accuracy {
  font-size: 28rpx;
  color: var(--color-text-light);
  margin-bottom: 32rpx;
}
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
  max-width: 500rpx;
  margin-bottom: 48rpx;
}
.action-btn {
  text-align: center;
  padding: 24rpx;
  border-radius: var(--radius-btn);
  font-size: 32rpx;
  font-weight: bold;
  background: #fff;
  border: 4rpx solid #E0E0E0;
}
.action-btn:active { transform: scale(0.97); }
.action-btn.primary {
  background: #9C27B0;
  color: #fff;
  border-color: #9C27B0;
}

/* 错题列表 */
.wrong-section {
  width: 100%;
  max-width: 600rpx;
}
.wrong-title {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-danger);
  margin-bottom: 16rpx;
  display: block;
}
.wrong-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  margin-bottom: 8rpx;
  background: #FFEBEE;
  border-radius: 8rpx;
  font-size: 28rpx;
}
.wrong-answer {
  color: var(--color-danger);
  font-size: 24rpx;
}

/* 时间提醒弹窗 */
.time-alert-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.time-alert-box {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx;
  text-align: center;
  width: 500rpx;
}
.time-alert-text {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 32rpx;
  color: var(--color-danger);
}
.time-alert-btn {
  padding: 20rpx 48rpx;
  background: #9C27B0;
  color: #fff;
  border-radius: var(--radius-btn);
  font-size: 28rpx;
  display: inline-block;
}
</style>
