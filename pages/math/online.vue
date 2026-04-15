<template>
  <view class="online-page">

    <!-- ===================== PHASE: SETUP ===================== -->
    <view v-if="phase === 'setup'" class="setup-area">
      <view class="setup-header">
        <view class="back-btn" @click="goBack">←</view>
        <text class="setup-title">在线练习</text>
        <view class="placeholder" />
      </view>

      <scroll-view scroll-y class="setup-scroll">
        <!-- 难度 -->
        <view class="setting-group">
          <text class="setting-label">难度</text>
          <view class="setting-tags">
            <view
              v-for="item in levelOptions"
              :key="item.value"
              :class="['setting-tag', selectedLevels.has(item.value) && 'active']"
              @click="toggleLevel(item.value)"
            >{{ item.label }}</view>
          </view>
        </view>

        <!-- 题型 -->
        <view class="setting-group">
          <text class="setting-label">题型</text>
          <view class="setting-tags">
            <view
              v-for="item in typeOptions"
              :key="item.value"
              :class="['setting-tag', selectedTypes.has(item.value) && 'active']"
              @click="toggleType(item.value)"
            >{{ item.label }}</view>
          </view>
        </view>

        <!-- 题量 -->
        <view class="setting-group">
          <text class="setting-label">题量</text>
          <view class="setting-tags">
            <view
              v-for="n in countPresets"
              :key="n"
              :class="['setting-tag', selectedCount === n && !customCountActive && 'active']"
              @click="pickPresetCount(n)"
            >{{ n }}</view>
            <view
              :class="['setting-tag', customCountActive && 'active']"
              @click="focusCustomCount"
            >自定义</view>
          </view>
          <view v-if="customCountActive" class="custom-count-row">
            <input
              class="custom-count-input"
              type="number"
              :value="customCountVal"
              placeholder="1~200"
              :focus="customInputFocus"
              @input="onCustomCountInput"
            />
            <text class="custom-count-unit">题</text>
          </view>
        </view>

        <!-- 计时 -->
        <view class="setting-group">
          <text class="setting-label">计时</text>
          <view class="setting-tags">
            <view
              :class="['setting-tag', !timerEnabled && 'active']"
              @click="timerEnabled = false"
            >关闭</view>
            <view
              v-for="t in timerOptions"
              :key="t.value"
              :class="['setting-tag', timerEnabled && timerMinutes === t.value && 'active']"
              @click="timerEnabled = true; timerMinutes = t.value"
            >{{ t.label }}</view>
          </view>
        </view>

        <!-- 说明 -->
        <view class="desc-area">
          <text class="desc">· 答完后统一交卷</text>
          <text class="desc">· 比大小题点击 ＞ 或 ＜ 按钮作答</text>
          <text v-if="timerEnabled" class="desc">· {{ timerMinutes }} 分钟时会有提醒</text>
          <text class="desc">· 结果自动保存到历史记录</text>
        </view>

        <view class="start-btn" @click="startQuiz">开始练习</view>
      </scroll-view>
    </view>

    <!-- ===================== PHASE: QUIZ ===================== -->
    <view v-if="phase === 'quiz'" class="quiz-area">
      <!-- 顶部栏 -->
      <view class="top-bar">
        <view class="back-btn" @click="confirmBack">←</view>
        <view v-if="timerEnabled" class="timer" :class="{ warn: timerWarn }">
          {{ formatTime(elapsed) }}
        </view>
        <view v-else class="timer-placeholder" />
        <view class="progress-text">{{ answeredCount }}/{{ questions.length }}</view>
      </view>

      <!-- 题目列表 -->
      <scroll-view scroll-y class="question-list" :scroll-into-view="scrollTarget">
        <view
          v-for="(q, i) in questions"
          :key="i"
          :id="'q-' + i"
          class="q-row"
          :class="{
            current: i === currentFocus,
            done: q.userAnswer !== '' && q.userAnswer !== undefined
          }"
        >
          <text class="q-index">{{ i + 1 }}.</text>

          <!-- 比大小: 数字 [＞＜] 数字 -->
          <template v-if="q.type === 'compare'">
            <text class="q-expr">{{ splitCompare(q.expr)[0] }}</text>
            <view class="compare-btns">
              <view
                :class="['cmp-btn', q.userAnswer === '＞' && 'selected']"
                @click="selectCompare(i, '＞')"
              >＞</view>
              <view
                :class="['cmp-btn', q.userAnswer === '＝' && 'selected']"
                @click="selectCompare(i, '＝')"
              >＝</view>
              <view
                :class="['cmp-btn', q.userAnswer === '＜' && 'selected']"
                @click="selectCompare(i, '＜')"
              >＜</view>
            </view>
            <text class="q-expr">{{ splitCompare(q.expr)[1] }}</text>
          </template>

          <!-- 填空: 把 __ 替换成输入框 -->
          <template v-else-if="q.type === 'fill'">
            <text v-for="(part, pi) in splitFill(q.expr)" :key="pi" class="q-expr">
              <template v-if="part === '__'">
                <input
                  class="q-input q-input-inline"
                  type="number"
                  :value="q.userAnswer"
                  :focus="i === currentFocus"
                  placeholder="?"
                  @input="onInput(i, $event)"
                  @confirm="onConfirm(i)"
                />
              </template>
              <template v-else>{{ part }}</template>
            </text>
          </template>

          <!-- 普通加减/连加减: 算式 = 输入框 -->
          <template v-else>
            <text class="q-expr">{{ q.expr }} =</text>
            <input
              class="q-input"
              type="number"
              :value="q.userAnswer"
              :focus="i === currentFocus"
              placeholder="?"
              @input="onInput(i, $event)"
              @confirm="onConfirm(i)"
            />
          </template>
        </view>
      </scroll-view>

      <!-- 提交按钮 -->
      <view class="submit-bar">
        <view class="submit-btn" @click="submitAll">交卷</view>
      </view>
    </view>

    <!-- ===================== PHASE: RESULT ===================== -->
    <view v-if="phase === 'result'" class="result-area">
      <view class="result-header">
        <text class="result-title">完成！</text>
        <text class="result-score">{{ correctCount }}/{{ questions.length }} 正确</text>
        <text class="result-accuracy">正确率：{{ accuracy }}%</text>
        <text v-if="timerEnabled" class="result-time">用时：{{ formatTime(finalTime) }}</text>
      </view>

      <view class="result-actions">
        <view class="action-btn primary" @click="restart">再来一次</view>
        <view class="action-btn" @click="goHome">回到首页</view>
      </view>

      <!-- 错题回顾 -->
      <view v-if="wrongList.length > 0" class="wrong-section">
        <text class="wrong-title">错题回顾（{{ wrongList.length }} 题）</text>
        <view v-for="(w, i) in wrongList" :key="i" class="wrong-item">
          <text class="wrong-expr">{{ w.index + 1 }}. {{ w.expr }} = {{ w.answer }}</text>
          <text class="wrong-answer">你答：{{ w.userAnswer !== '' && w.userAnswer !== undefined ? w.userAnswer : '未填' }}</text>
        </view>
      </view>

      <view v-else class="all-correct">
        <text class="all-correct-text">全部答对，太棒了！</text>
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
import { generateQuestions, LEVEL_CONFIG } from '../../utils/math/questionEngine.js'
import { saveRecord } from '../../utils/math/mathStorage.js'
import { toast } from '../../utils/common/toast.js'

// ---- 配置选项 ----
const levelOptions = [
  { value: 1, label: '20以内' },
  { value: 2, label: '±整十' },
  { value: 3, label: '±一位数' },
]
const typeOptions = [
  { value: 'add',     label: '加法' },
  { value: 'sub',     label: '减法' },
  { value: 'compare', label: '比大小' },
  { value: 'fill',    label: '填空' },
  { value: 'chain',   label: '连加连减' },
]
const countPresets = [20, 50, 100]

// ---- 设置状态（多选用 Set） ----
const selectedLevels = ref(new Set([1]))
const selectedTypes  = ref(new Set(['add', 'sub']))

function toggleLevel(val) {
  const s = selectedLevels.value
  if (s.has(val)) { if (s.size > 1) s.delete(val) } // 至少保留一个
  else s.add(val)
  selectedLevels.value = new Set(s) // 触发响应式
}
function toggleType(val) {
  const s = selectedTypes.value
  if (s.has(val)) { if (s.size > 1) s.delete(val) }
  else s.add(val)
  selectedTypes.value = new Set(s)
}

// 兼容旧接口
const selectedLevel = computed(() => {
  const arr = [...selectedLevels.value]
  return arr.length === 3 ? 'mix' : arr.length === 1 ? arr[0] : arr
})
const selectedType = computed(() => {
  const arr = [...selectedTypes.value]
  return arr.length === 5 ? 'mix' : arr.length === 1 ? arr[0] : arr
})
const selectedCount = ref(100)
const customCountActive = ref(false)
const customCountVal    = ref('')
const customInputFocus  = ref(false)
const timerEnabled      = ref(true)
const timerMinutes      = ref(8)
const timerOptions      = [
  { value: 5, label: '5分钟' },
  { value: 8, label: '8分钟' },
  { value: 10, label: '10分钟' },
  { value: 15, label: '15分钟' },
  { value: 20, label: '20分钟' },
]

// ---- 答题状态 ----
const phase        = ref('setup')   // 'setup' | 'quiz' | 'result'
const questions    = ref([])
const currentFocus = ref(0)
const scrollTarget = ref('')

// ---- 计时器状态 ----
const elapsed       = ref(0)
const finalTime     = ref(0)
const timerWarn     = ref(false)
const showTimeAlert = ref(false)
const timeAlertMsg  = ref('')
let timer    = null
let alerted = false

// ---- 计算属性 ----
const answeredCount = computed(() =>
  questions.value.filter(q => q.userAnswer !== '' && q.userAnswer !== undefined).length
)

const correctCount = computed(() =>
  questions.value.filter(q => String(q.userAnswer) === String(q.answer)).length
)

const accuracy = computed(() => {
  if (!questions.value.length) return 0
  return Math.round(correctCount.value / questions.value.length * 100)
})

const wrongList = computed(() =>
  questions.value
    .map((q, i) => ({ ...q, index: i }))
    .filter(q => String(q.userAnswer) !== String(q.answer))
)

// ---- 题量设置 ----
function pickPresetCount(n) {
  selectedCount.value = n
  customCountActive.value = false
  customCountVal.value = ''
}

function focusCustomCount() {
  customCountActive.value = true
  customInputFocus.value = true
  if (!customCountVal.value) {
    customCountVal.value = String(selectedCount.value)
  }
}

function onCustomCountInput(e) {
  customCountVal.value = e.detail.value
  const n = parseInt(e.detail.value)
  if (!isNaN(n) && n >= 1 && n <= 200) {
    selectedCount.value = n
  }
}

// ---- 开始练习 ----
function startQuiz() {
  let count = selectedCount.value
  if (customCountActive.value) {
    const n = parseInt(customCountVal.value)
    if (isNaN(n) || n < 1 || n > 200) {
      toast.error('题量需在 1~200 之间')
      return
    }
    count = n
  }

  const raw = generateQuestions({
    level: selectedLevel.value,
    count,
    questionType: selectedType.value,
  })

  // 每题附加 userAnswer 字段
  questions.value = raw.map(q => ({ ...q, userAnswer: '' }))

  currentFocus.value = 0
  scrollTarget.value = ''
  elapsed.value = 0
  finalTime.value = 0
  timerWarn.value = false
  alerted = false
  showTimeAlert.value = false

  phase.value = 'quiz'

  if (timerEnabled.value) {
    const alertSeconds = timerMinutes.value * 60
    timer = setInterval(() => {
      elapsed.value++
      if (elapsed.value === alertSeconds && !alerted) {
        alerted = true
        timerWarn.value = true
        timeAlertMsg.value = `已经 ${timerMinutes.value} 分钟了，加油！`
        showTimeAlert.value = true
      }
    }, 1000)
  }
}

// ---- 答题交互 ----
// 把比大小 "8 ○ 11" 拆成 ["8", "11"]
function splitCompare(expr) {
  const parts = expr.split('○').map(s => s.trim())
  return parts.length === 2 ? parts : [expr, '']
}

// 把填空题 "1 + __ = 42" 拆成 ["1 + ", "__", " = 42"]
function splitFill(expr) {
  const idx = expr.indexOf('__')
  if (idx === -1) return [expr]
  return [expr.slice(0, idx), '__', expr.slice(idx + 2)]
}

function onInput(index, e) {
  questions.value[index].userAnswer = e.detail.value
}

function onConfirm(index) {
  const total = questions.value.length
  if (index < total - 1) {
    currentFocus.value = index + 1
    scrollTarget.value = 'q-' + (index + 1)
  }
}

function selectCompare(index, symbol) {
  questions.value[index].userAnswer = symbol
  // 自动前进到下一题
  const total = questions.value.length
  if (index < total - 1) {
    currentFocus.value = index + 1
    scrollTarget.value = 'q-' + (index + 1)
  }
}

// ---- 交卷 ----
function submitAll() {
  uni.showModal({
    title: '确认交卷',
    content: `已答 ${answeredCount.value}/${questions.value.length} 题，确定交卷？`,
    success(res) {
      if (res.confirm) doSubmit()
    },
  })
}

function doSubmit() {
  stopTimer()
  finalTime.value = elapsed.value

  // 保存记录
  try {
    saveRecord({
      type: 'online',
      level: selectedLevel.value,
      questionType: selectedType.value,
      total: questions.value.length,
      correct: correctCount.value,
      elapsed: finalTime.value,
      questions: questions.value.map(q => ({
        expr: q.expr,
        answer: q.answer,
        userAnswer: q.userAnswer,
        isCorrect: q.userAnswer === q.answer,
      })),
    })
  } catch (e) {
    console.error('保存记录失败', e)
  }

  phase.value = 'result'
}

// ---- 结果页操作 ----
function restart() {
  phase.value = 'setup'
  questions.value = []
  elapsed.value = 0
}

function goHome() {
  stopTimer()
  uni.switchTab({ url: '/pages/index/index' })
}

// ---- 返回 ----
function goBack() {
  stopTimer()
  uni.navigateBack()
}

function confirmBack() {
  uni.showModal({
    title: '退出练习',
    content: '确定退出？当前进度不会保存。',
    success(res) {
      if (res.confirm) {
        stopTimer()
        phase.value = 'setup'
        questions.value = []
        elapsed.value = 0
      }
    },
  })
}

// ---- 工具 ----
function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
/* ===== 页面容器 ===== */
.online-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F7FA;
}

/* ===== SETUP ===== */
.setup-area {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.setup-header {
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
.setup-title {
  font-size: 36rpx;
  font-weight: bold;
}
.placeholder {
  width: 56rpx;
}

.setup-scroll {
  flex: 1;
  padding: 24rpx 32rpx 80rpx;
}

.setting-group {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 28rpx 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.setting-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 18rpx;
  display: block;
}
.setting-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}
.setting-tag {
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  background: #F5F7FA;
  color: #666;
  border: 3rpx solid #E0E0E0;
}
.setting-tag:active { transform: scale(0.95); }
.setting-tag.active {
  background: #42A5F5;
  color: #fff;
  border-color: #42A5F5;
  font-weight: bold;
}

.custom-count-row {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  gap: 12rpx;
}
.custom-count-input {
  width: 180rpx;
  height: 64rpx;
  border: 4rpx solid #42A5F5;
  border-radius: 12rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  background: #fff;
}
.custom-count-unit {
  font-size: 28rpx;
  color: #666;
}

.desc-area {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 2;
}

.start-btn {
  text-align: center;
  padding: 28rpx;
  background: linear-gradient(135deg, #42A5F5, #1E88E5);
  color: #fff;
  border-radius: 40rpx;
  font-size: 36rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(66,165,245,0.35);
  margin: 0 8rpx 40rpx;
}
.start-btn:active { transform: scale(0.97); }

/* ===== QUIZ ===== */
.quiz-area {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

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
  cursor: pointer;
}
.back-btn:active { transform: scale(0.9); }

.timer {
  font-size: 40rpx;
  font-weight: bold;
  font-family: monospace;
  color: #333;
}
.timer.warn { color: #F44336; }
.timer-placeholder {
  width: 120rpx;
}
.progress-text {
  font-size: 28rpx;
  color: #999;
  font-weight: bold;
}

.question-list {
  flex: 1;
  padding: 16rpx 24rpx;
  padding-bottom: 140rpx;
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
  border-left-color: #42A5F5;
  background: #E3F2FD;
}
.q-row.done {
  border-left-color: #42A5F5;
}

.q-index {
  font-size: 24rpx;
  color: #bbb;
  width: 56rpx;
  text-align: right;
  flex-shrink: 0;
}
.q-expr {
  font-size: 36rpx;
  font-weight: bold;
  min-width: 220rpx;
  flex-shrink: 0;
}
.q-input {
  width: 130rpx;
  height: 64rpx;
  border: 4rpx solid #E0E0E0;
  border-radius: 12rpx;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  background: #fff;
}
.q-input-inline {
  display: inline-block;
  width: 100rpx;
  height: 56rpx;
  margin: 0 4rpx;
  vertical-align: middle;
  border-bottom: 4rpx solid #42A5F5;
  border-top: none;
  border-left: none;
  border-right: none;
  border-radius: 0;
}

.compare-btns {
  display: flex;
  gap: 16rpx;
}
.cmp-btn {
  width: 80rpx;
  height: 64rpx;
  border: 4rpx solid #E0E0E0;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
  background: #fff;
  color: #555;
}
.cmp-btn:active { transform: scale(0.93); }
.cmp-btn.selected {
  background: #42A5F5;
  color: #fff;
  border-color: #42A5F5;
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
  background: #42A5F5;
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
}
.submit-btn:active { transform: scale(0.97); }

/* ===== RESULT ===== */
.result-area {
  flex: 1;
  padding: 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}
.result-title {
  font-size: 60rpx;
  font-weight: bold;
  color: #42A5F5;
  margin-bottom: 20rpx;
}
.result-score {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}
.result-accuracy {
  font-size: 30rpx;
  color: #999;
  margin-bottom: 8rpx;
}
.result-time {
  font-size: 32rpx;
  font-family: monospace;
  color: #666;
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
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  background: #fff;
  border: 4rpx solid #E0E0E0;
  color: #333;
}
.action-btn:active { transform: scale(0.97); }
.action-btn.primary {
  background: #42A5F5;
  color: #fff;
  border-color: #42A5F5;
}

.wrong-section {
  width: 100%;
  max-width: 680rpx;
}
.wrong-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #F44336;
  margin-bottom: 16rpx;
  display: block;
}
.wrong-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 20rpx;
  margin-bottom: 10rpx;
  background: #FFEBEE;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.wrong-expr {
  font-size: 28rpx;
  color: #333;
}
.wrong-answer {
  color: #F44336;
  font-size: 26rpx;
  flex-shrink: 0;
  margin-left: 12rpx;
}

.all-correct {
  margin-top: 24rpx;
  padding: 32rpx 48rpx;
  background: #E8F5E9;
  border-radius: 20rpx;
}
.all-correct-text {
  font-size: 32rpx;
  color: #388E3C;
  font-weight: bold;
}

/* ===== 时间提醒弹窗 ===== */
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
  color: #F44336;
}
.time-alert-btn {
  padding: 20rpx 48rpx;
  background: #42A5F5;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: inline-block;
}
.time-alert-btn:active { transform: scale(0.97); }

/* ===== 深色模式 ===== */
:global(html body.dark-mode) .online-page {
  background: #1A1A2E;
}
:global(html body.dark-mode) .setup-header,
:global(html body.dark-mode) .top-bar,
:global(html body.dark-mode) .setting-group,
:global(html body.dark-mode) .desc-area {
  background: #242440;
  box-shadow: none;
}
:global(html body.dark-mode) .setup-title,
:global(html body.dark-mode) .setting-label,
:global(html body.dark-mode) .result-score {
  color: #E0E0E0;
}
:global(html body.dark-mode) .setting-tag {
  background: #2A2A4A;
  color: #AAA;
  border-color: #444;
}
:global(html body.dark-mode) .setting-tag.active {
  background: #42A5F5;
  color: #fff;
  border-color: #42A5F5;
}
:global(html body.dark-mode) .desc {
  color: #888;
}
:global(html body.dark-mode) .q-row {
  background: #242440;
  box-shadow: none;
}
:global(html body.dark-mode) .q-row.current {
  background: #1A3A5C;
}
:global(html body.dark-mode) .q-expr {
  color: #E0E0E0;
}
:global(html body.dark-mode) .q-input,
:global(html body.dark-mode) .cmp-btn {
  background: #1A1A2E;
  border-color: #444;
  color: #E0E0E0;
}
:global(html body.dark-mode) .cmp-btn.selected {
  background: #42A5F5;
  color: #fff;
  border-color: #42A5F5;
}
:global(html body.dark-mode) .q-index {
  color: #666;
}
:global(html body.dark-mode) .submit-bar,
:global(html body.dark-mode) .submit-btn {
  background: #42A5F5;
}
:global(html body.dark-mode) .submit-bar {
  background: #242440;
  box-shadow: none;
}
:global(html body.dark-mode) .result-area {
  background: #1A1A2E;
}
:global(html body.dark-mode) .action-btn {
  background: #242440;
  border-color: #444;
  color: #E0E0E0;
}
:global(html body.dark-mode) .action-btn.primary {
  background: #42A5F5;
  color: #fff;
  border-color: #42A5F5;
}
:global(html body.dark-mode) .result-accuracy,
:global(html body.dark-mode) .result-time {
  color: #888;
}
:global(html body.dark-mode) .timer {
  color: #E0E0E0;
}
:global(html body.dark-mode) .progress-text {
  color: #888;
}
:global(html body.dark-mode) .time-alert-box {
  background: #242440;
}
:global(html body.dark-mode) .time-alert-text {
  color: #FF7043;
}
:global(html body.dark-mode) .wrong-item {
  background: #3A1A1A;
}
:global(html body.dark-mode) .wrong-expr {
  color: #E0E0E0;
}
:global(html body.dark-mode) .all-correct {
  background: #1A2E1A;
}
:global(html body.dark-mode) .all-correct-text {
  color: #81C784;
}
:global(html body.dark-mode) .custom-count-input {
  background: #1A1A2E;
  border-color: #42A5F5;
  color: #E0E0E0;
}
</style>
