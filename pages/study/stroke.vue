<template>
  <view class="stroke-page">
    <StarBar :current="currentIndex + 1" :total="totalQuestions" :stars="store.totalStars" />

    <view v-if="totalQuestions === 0" class="empty-hint">
      <text>本单元暂无笔顺题目</text>
      <view class="back-btn" @click="goBack">返回主页</view>
    </view>

    <!-- 答题模式 -->
    <view v-if="!showAnim && currentChar" class="quiz-area">
      <!-- HanziWriter 汉字轮廓 -->
      <view class="char-outline-wrap">
        <view :id="outlineId" class="char-outline-target"></view>
      </view>
      <view class="speak-btn" @click="speakChar">🔊</view>
      <text class="hint-text">按正确笔顺依次点击笔画</text>

      <!-- 已选序列 -->
      <view class="selected-area">
        <view v-for="(s, i) in selectedStrokes" :key="i" class="selected-item">
          <text class="selected-num">{{ i + 1 }}</text>
          <text class="selected-name">{{ s }}</text>
        </view>
        <view v-if="selectedStrokes.length === 0" class="selected-placeholder">
          <text>点击下方笔画按钮</text>
        </view>
      </view>

      <!-- 反馈提示 -->
      <view v-if="feedback" class="feedback" :class="feedbackType">
        <text>{{ feedback }}</text>
      </view>

      <!-- 笔画按钮池 -->
      <view class="stroke-pool">
        <view
          v-for="(s, i) in shuffledStrokes"
          :key="'pool-' + i"
          class="stroke-btn"
          :class="{ used: usedIndexes.includes(i), wrong: wrongBtn === i }"
          @click="pickStroke(i)"
        >
          {{ s }}
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-row">
        <view class="clear-btn" @click="clearSelection">清空重选</view>
        <view
          v-if="selectedStrokes.length === correctStrokes.length"
          class="submit-btn"
          @click="checkAnswer"
        >确认提交</view>
      </view>
    </view>

    <!-- 答对后动画 -->
    <StrokeAnim
      v-if="showAnim && currentChar"
      :char="currentChar.char"
      :autoPlay="true"
      @complete="onAnimComplete"
    />
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import HanziWriter from 'hanzi-writer'
import { useGameStore } from '../../store/game.js'
import { sampleWithout, shuffle } from '../../utils/study/questionHelper.js'
import { speak } from '../../utils/common/speech.js'
import StarBar from '../../components/study/StarBar.vue'
import StrokeAnim from '../../components/study/StrokeAnim.vue'
import strokesData from '../../static/data/strokes.json'
import { getQuestions } from '../../utils/common/cloudDb.js'
import { recordWrong } from '../../utils/study/wrongBook.js'
import { recordPractice } from '../../utils/study/practiceLog.js'
import { useAuth } from '../../composables/common/useAuth.js'

const store = useGameStore()
const { getUsername } = useAuth()
const currentIndex = ref(0)
const correctCount = ref(0)
const roundKey = ref(0)
const isCloudData = ref(false)

const outlineId = ref('outline-' + Date.now())
let outlineWriter = null

// HanziWriter 轮廓
async function initOutline() {
  await nextTick()
  const el = document.getElementById(outlineId.value)
  if (!el || !currentChar.value) return
  el.innerHTML = ''
  try {
    outlineWriter = HanziWriter.create(outlineId.value, currentChar.value.char, {
      width: 150,
      height: 150,
      padding: 8,
      strokeColor: '#DDD',
      outlineColor: '#DDD',
      showCharacter: true,
      showOutline: false,
    })
  } catch (e) {
    el.innerHTML = `<span style="font-size:80px;font-weight:bold;color:#ccc">${currentChar.value.char}</span>`
  }
}

const showAnim = ref(false)
const roundFinished = ref(false)
const roundChars = ref([])
const totalQuestions = computed(() => roundChars.value.length)
const currentChar = computed(() => roundChars.value[currentIndex.value] || null)

// 正确笔顺
const correctStrokes = computed(() => currentChar.value?.strokes || [])

// 打乱后的笔画按钮池
const shuffledStrokes = ref([])

// 用户已选笔画序列
const selectedStrokes = ref([])
// 已选按钮的索引
const usedIndexes = ref([])
// 反馈
const feedback = ref('')
const feedbackType = ref('')
// 标记错误按钮
const wrongBtn = ref(-1)

// 当题目变化时，重新打乱按钮池
watch(currentChar, () => {
  resetSelection()
  if (currentChar.value) {
    shuffledStrokes.value = shuffle([...currentChar.value.strokes])
  }
}, { immediate: true })

watch(currentIndex, () => {
  if (!showAnim.value) initOutline()
})

function resetSelection() {
  selectedStrokes.value = []
  usedIndexes.value = []
  feedback.value = ''
  feedbackType.value = ''
  wrongBtn.value = -1
}

function clearSelection() {
  resetSelection()
}

// 点击一个笔画按钮
function pickStroke(poolIndex) {
  if (usedIndexes.value.includes(poolIndex)) return
  if (selectedStrokes.value.length >= correctStrokes.value.length) return

  const strokeName = shuffledStrokes.value[poolIndex]
  const nextCorrectIndex = selectedStrokes.value.length
  const expectedStroke = correctStrokes.value[nextCorrectIndex]

  // 实时校验：点错了立即提示
  if (strokeName !== expectedStroke) {
    wrongBtn.value = poolIndex
    feedback.value = `第 ${nextCorrectIndex + 1} 笔应该是「${expectedStroke}」`
    feedbackType.value = 'wrong'
    setTimeout(() => { wrongBtn.value = -1 }, 600)
    return
  }

  // 点对了
  selectedStrokes.value.push(strokeName)
  usedIndexes.value.push(poolIndex)
  feedback.value = ''
  feedbackType.value = ''

  // 全部选完自动检查
  if (selectedStrokes.value.length === correctStrokes.value.length) {
    handleCorrect()
  }
}

function checkAnswer() {
  // 比较顺序
  const isCorrect = selectedStrokes.value.every((s, i) => s === correctStrokes.value[i])
  if (isCorrect) {
    handleCorrect()
  } else {
    handleWrong()
  }
}

function handleCorrect() {
  correctCount.value++
  feedback.value = '正确！'
  feedbackType.value = 'correct'

  setTimeout(() => {
    showAnim.value = true
  }, 500)
}

function handleWrong() {
  feedback.value = '笔顺不对，再试一次'
  feedbackType.value = 'wrong'

  // 记录错题
  const item = currentChar.value
  if (isCloudData.value && item?._id) {
    recordWrong(getUsername(), {
      type: 'stroke',
      char: item.char,
      unit: item.unit,
      question_id: item._id
    })
  }

  setTimeout(() => {
    resetSelection()
  }, 1200)
}

function speakChar() {
  if (currentChar.value) speak(currentChar.value.char)
}

function goBack() {
  uni.navigateBack()
}

function onAnimComplete() {
  showAnim.value = false
  feedback.value = ''
  feedbackType.value = ''

  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    resetSelection()
    if (currentChar.value) {
      shuffledStrokes.value = shuffle([...currentChar.value.strokes])
    }
    initOutline()
  } else {
    // 轮次结束
    const earned = correctCount.value + (correctCount.value === totalQuestions.value ? 3 : 0)
    const oldTotal = store.totalStars
    store.addStars(earned)
    roundFinished.value = true
    recordPractice(getUsername(), {
      type: 'stroke',
      totalCount: totalQuestions.value,
      correctCount: correctCount.value
    })
    uni.navigateTo({
      url: `/pages/study/result?module=stroke&correct=${correctCount.value}&total=${totalQuestions.value}&earned=${earned}&oldTotal=${oldTotal}`
    })
  }
}

function buildRoundChars(dataSource) {
  const source = dataSource || strokesData.filter(d => d.unit === store.currentUnit)
  return sampleWithout(source, 10)
}

async function initRound() {
  let cloudList = null
  try {
    cloudList = await getQuestions('stroke', store.currentUnit)
  } catch (e) {
    cloudList = null
  }
  if (Array.isArray(cloudList) && cloudList.length > 0) {
    isCloudData.value = true
    roundChars.value = buildRoundChars(cloudList)
  } else {
    isCloudData.value = false
    roundChars.value = buildRoundChars(null)
  }
}

onMounted(async () => {
  await initRound()
  if (currentChar.value) {
    shuffledStrokes.value = shuffle([...currentChar.value.strokes])
  }
  initOutline()
})

onShow(async () => {
  if (roundFinished.value) {
    await initRound()
    currentIndex.value = 0
    correctCount.value = 0
    showAnim.value = false
    roundFinished.value = false
    roundKey.value++
    resetSelection()
    if (currentChar.value) {
      shuffledStrokes.value = shuffle([...currentChar.value.strokes])
    }
  }
})
</script>

<style scoped>
.stroke-page {
  min-height: 100vh;
}
.quiz-area {
  padding: 32rpx;
}
.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
  color: #888;
  font-size: 32rpx;
}
.back-btn {
  margin-top: 32rpx;
  padding: 20rpx 48rpx;
  background: #66BB6A;
  color: #fff;
  border-radius: 20rpx;
  font-size: 28rpx;
}
.char-outline-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16rpx;
}
.char-outline-target {
  width: 150px;
  height: 150px;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.speak-btn {
  margin: 12rpx auto;
  font-size: 44rpx;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E3F2FD;
  border-radius: 50%;
}
.speak-btn:active { transform: scale(0.9); }
.hint-text {
  display: block;
  text-align: center;
  color: #888;
  font-size: 28rpx;
  margin-bottom: 24rpx;
}

/* 已选序列 */
.selected-area {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: center;
  min-height: 80rpx;
  padding: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  border: 3rpx dashed #BDBDBD;
  margin-bottom: 24rpx;
}
.selected-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: #E3F2FD;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
}
.selected-num {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #42A5F5;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
}
.selected-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}
.selected-placeholder {
  color: #ccc;
  font-size: 26rpx;
}

/* 反馈 */
.feedback {
  text-align: center;
  font-size: 28rpx;
  font-weight: bold;
  padding: 12rpx;
  margin-bottom: 16rpx;
  border-radius: 12rpx;
}
.feedback.correct {
  color: #2E7D32;
  background: #E8F5E9;
}
.feedback.wrong {
  color: #C62828;
  background: #FFEBEE;
}

/* 笔画按钮池 */
.stroke-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  justify-content: center;
  margin-bottom: 32rpx;
}
.stroke-btn {
  padding: 20rpx 36rpx;
  background: #fff;
  border: 3rpx solid #BDBDBD;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  transition: all 0.2s;
}
.stroke-btn:active {
  transform: scale(0.95);
}
.stroke-btn.used {
  background: #E0E0E0;
  color: #aaa;
  border-color: #E0E0E0;
  box-shadow: none;
}
.stroke-btn.wrong {
  background: #FFEBEE;
  border-color: #EF5350;
  color: #C62828;
  animation: shake 0.3s;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8rpx); }
  75% { transform: translateX(8rpx); }
}

/* 操作按钮 */
.action-row {
  display: flex;
  gap: 24rpx;
  justify-content: center;
}
.clear-btn {
  padding: 20rpx 48rpx;
  background: #fff;
  border: 3rpx solid #BDBDBD;
  border-radius: 20rpx;
  font-size: 28rpx;
  color: #666;
}
.clear-btn:active { transform: scale(0.95); }
.submit-btn {
  padding: 20rpx 48rpx;
  background: #66BB6A;
  color: #fff;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: bold;
}
.submit-btn:active { transform: scale(0.95); }
</style>
