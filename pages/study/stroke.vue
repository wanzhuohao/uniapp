<template>
  <view class="stroke-page">
    <StarBar :current="currentIndex + 1" :total="totalQuestions" :stars="store.totalStars" />

    <view v-if="totalQuestions === 0" class="empty-hint">
      <text>本单元暂无笔顺题目</text>
      <view class="back-btn" @click="goBack">返回主页</view>
    </view>

    <!-- 答题模式 -->
    <view v-if="!showAnim && currentChar" class="quiz-area">
      <!-- HanziWriter 汉字轮廓展示 -->
      <view class="char-outline-wrap">
        <view :id="outlineId" class="char-outline-target"></view>
      </view>
      <view class="speak-btn" @click="speakChar">🔊</view>
      <text class="hint-text">哪个是正确的笔顺？</text>

      <view class="stroke-options">
        <view
          v-for="(opt, i) in currentOptions"
          :key="i"
          class="stroke-option"
          :class="optionClass(i)"
          @click="handleSelect(i)"
        >
          <view class="stroke-seq">
            <view v-for="(s, j) in opt.strokes" :key="j" class="stroke-item">
              <text class="stroke-num">{{ j + 1 }}</text>
              <text>{{ s }}</text>
            </view>
          </view>
        </view>
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
import { ref, computed, watch, nextTick } from 'vue'
import { onShow, onMounted } from '@dcloudio/uni-app'
import HanziWriter from 'hanzi-writer'
import { useGameStore } from '../../store/game.js'
import { sampleWithout, shuffle, generateStrokeDistractors } from '../../utils/study/questionHelper.js'
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

// 初始化题干区域的 HanziWriter 轮廓展示
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

watch(currentIndex, () => {
  if (!showAnim.value) initOutline()
})

const answered = ref(false)
const selectedIndex = ref(-1)
const showAnim = ref(false)
const roundFinished = ref(false)

const roundChars = ref([])
const totalQuestions = computed(() => roundChars.value.length)

const currentChar = computed(() => roundChars.value[currentIndex.value] || null)

// 为当前字生成 4 个选项
const currentOptions = computed(() => {
  if (!currentChar.value) return []
  const correct = currentChar.value.strokes
  const distractors = generateStrokeDistractors(correct, 3)
  const options = [
    { strokes: correct, isCorrect: true },
    ...distractors.map(d => ({ strokes: d, isCorrect: false })),
  ]
  return shuffle(options)
})

function optionClass(i) {
  if (!answered.value) return ''
  if (currentOptions.value[i]?.isCorrect) return 'correct'
  if (i === selectedIndex.value && !currentOptions.value[i]?.isCorrect) return 'wrong'
  return ''
}

function handleSelect(i) {
  if (answered.value) return
  answered.value = true
  selectedIndex.value = i

  const isCorrect = currentOptions.value[i].isCorrect
  if (isCorrect) {
    correctCount.value++
  } else {
    // 答错：如果是云端数据且有 _id，异步记录错题
    const item = currentChar.value
    if (isCloudData.value && item?._id) {
      recordWrong(getUsername(), {
        type: 'stroke',
        char: item.char,
        unit: item.unit,
        question_id: item._id
      })
    }
  }

  const delay = isCorrect ? 800 : 1500

  setTimeout(() => {
    if (isCorrect) {
      showAnim.value = true
    } else {
      nextQuestion()
    }
  }, delay)
}

function speakChar() {
  if (currentChar.value) speak(currentChar.value.char)
}

function goBack() {
  uni.navigateBack()
}

function nextQuestion() {
  answered.value = false
  selectedIndex.value = -1

  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
  } else {
    const earned = correctCount.value + (correctCount.value === totalQuestions.value ? 3 : 0)
    const oldTotal = store.totalStars
    store.addStars(earned)
    roundFinished.value = true
    // 异步记录练习日志，不阻塞跳转
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

function onAnimComplete() {
  showAnim.value = false
  nextQuestion()
  initOutline()
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
  initOutline()
})

onShow(async () => {
  if (roundFinished.value) {
    await initRound()
    currentIndex.value = 0
    correctCount.value = 0
    answered.value = false
    selectedIndex.value = -1
    showAnim.value = false
    roundFinished.value = false
    roundKey.value++
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
  color: var(--color-text-light);
  font-size: 32rpx;
}
.back-btn {
  margin-top: 32rpx;
  padding: 20rpx 48rpx;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-btn);
  font-size: 28rpx;
}
.char-outline-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16rpx;
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
.char-outline-target {
  width: 150px;
  height: 150px;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.hint-text {
  display: block;
  text-align: center;
  color: var(--color-text-light);
  font-size: 28rpx;
  margin-bottom: 32rpx;
}
.stroke-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 0 16rpx;
}
.stroke-option {
  background: #fff;
  border: 4rpx solid #E0E0E0;
  border-radius: var(--radius-btn);
  padding: 24rpx;
  transition: all 0.2s;
}
.stroke-option:active { transform: scale(0.97); }
.stroke-option.correct { border-color: var(--color-primary); background: #E8F5E9; }
.stroke-option.wrong { border-color: var(--color-danger); background: #FFEBEE; }
.stroke-seq {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  align-items: center;
}
.stroke-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 28rpx;
}
.stroke-num {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: var(--color-stroke);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
}
</style>
