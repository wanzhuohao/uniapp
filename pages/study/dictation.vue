<template>
  <view class="dictation-page">
    <StarBar :current="started ? currentIndex + 1 : 0" :total="totalQuestions" :stars="store.totalStars" />

    <!-- 筛选页 -->
    <view v-if="!started" class="filter-area">
      <text class="filter-title">选择单元</text>
      <view class="unit-tags">
        <view v-for="u in 8" :key="u"
          :class="['unit-tag', store.currentUnit === '2-' + u && 'active']"
          @click="store.setUnit('2-' + u)"
        >第{{ u }}单元</view>
      </view>
      <view class="desc-area">
        <text class="desc">· 听声音写汉字（按笔顺描红）</text>
        <text class="desc">· 一共 10 题</text>
        <text class="desc">· 答错的字进错题本</text>
      </view>
      <view class="start-btn" @click="startRound">开始听写</view>
    </view>

    <!-- 空状态 -->
    <view v-if="started && totalQuestions === 0" class="empty-hint">
      <text>本单元暂无字词</text>
      <view class="back-btn" @click="started = false">返回</view>
    </view>

    <!-- 答题区 -->
    <view v-if="started && currentQ && !showResult" class="quiz-area">
      <view class="tts-btn" @click="onSpeakAgain">🔊 再念一遍</view>
      <view class="quiz-wrap">
        <view :id="QUIZ_ID" class="quiz-target"></view>
      </view>
      <view class="finish-btn" @click="onFinishWriting">我写完了</view>
    </view>

    <!-- 结算遮罩 -->
    <view v-if="showResult" class="result-mask">
      <view class="result-card">
        <text class="result-label">正确答案</text>
        <view :id="RESULT_ID" class="result-hanzi"></view>
        <view class="replay-btn" @click="replayResult">▶ 播放笔顺动画</view>
        <view class="judge-row">
          <view class="judge-btn wrong" @click="judgeSelf(false)">❌ 我写错了</view>
          <view class="judge-btn correct" @click="judgeSelf(true)">✅ 我写对了</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import HanziWriter from 'hanzi-writer'
import { isDark } from '../../utils/common/theme.js'
import { useGameStore } from '../../store/game.js'
import { useAuth } from '../../composables/common/useAuth.js'
import { getQuestions } from '../../utils/common/cloudDb.js'
import { sampleWithout } from '../../utils/study/questionHelper.js'
import { speak } from '../../utils/common/speech.js'
import { recordWrong } from '../../utils/study/wrongBook.js'
import { recordPractice } from '../../utils/study/practiceLog.js'
import StarBar from '../../components/study/StarBar.vue'
import pinyinData from '../../static/data/pinyin.json'

const store = useGameStore()
const { getUsername } = useAuth()

const started = ref(false)
const currentIndex = ref(0)
const correctCount = ref(0)
const showResult = ref(false)
const roundFinished = ref(false)

const questions = ref([])
const totalQuestions = computed(() => questions.value.length)
const currentQ = computed(() => questions.value[currentIndex.value] || null)

const QUIZ_ID = 'dictation-quiz-' + Date.now() + '-' + Math.floor(Math.random() * 1e6)
const RESULT_ID = 'dictation-result-' + Date.now() + '-' + Math.floor(Math.random() * 1e6)
let quizWriter = null
let resultWriter = null
let quizLoadToken = 0
let resultLoadToken = 0

function safeSpeak(char) {
  try { window.speechSynthesis?.cancel?.() } catch (e) {}
  setTimeout(() => {
    try { speak(char) } catch (e) {}
  }, 50)
}

function onSpeakAgain() {
  if (currentQ.value?.char) safeSpeak(currentQ.value.char)
}

async function startQuiz(char) {
  cleanupQuiz()
  await nextTick()
  const el = document.getElementById(QUIZ_ID)
  if (!el || !char) return
  el.innerHTML = ''
  const myToken = ++quizLoadToken
  try {
    const dark = isDark()
    quizWriter = HanziWriter.create(QUIZ_ID, char, {
      width: 280,
      height: 280,
      padding: 10,
      strokeColor: dark ? '#80cbc4' : '#2E7D32',
      // dictation 页字是空轮廓（showCharacter: false），outline 是主视觉，暗色下需要更亮
      outlineColor: dark ? '#888' : '#DDD',
      radicalColor: dark ? '#80cbc4' : '#168F16',
      showCharacter: false,
      showOutline: true,
      showHintAfterMisses: 2,
      onLoadCharDataSuccess: () => {
        if (myToken !== quizLoadToken) return
        try {
          quizWriter?.quiz({
            onComplete: () => {
              if (myToken !== quizLoadToken) return
              onFinishWriting()
            }
          })
        } catch (e) {}
      },
      onLoadCharDataError: () => {
        if (myToken === quizLoadToken) {
          console.warn('[dictation] 加载字符失败:', char)
        }
      }
    })
  } catch (e) {
    console.error('[dictation] HanziWriter.create 异常', e)
  }
}

function cleanupQuiz() {
  quizLoadToken++
  if (quizWriter) {
    try { quizWriter.cancelQuiz?.() } catch (e) {}
    quizWriter = null
  }
  const el = document.getElementById(QUIZ_ID)
  if (el) el.innerHTML = ''
}

async function showResultHanzi(char) {
  cleanupResult()
  await nextTick()
  const el = document.getElementById(RESULT_ID)
  if (!el || !char) return
  el.innerHTML = ''
  const myToken = ++resultLoadToken
  try {
    const dark = isDark()
    resultWriter = HanziWriter.create(RESULT_ID, char, {
      width: 200,
      height: 200,
      padding: 10,
      strokeColor: dark ? '#e0e0e0' : '#333',
      outlineColor: dark ? '#555' : '#DDD',
      radicalColor: dark ? '#80cbc4' : '#168F16',
      showCharacter: true,
      showOutline: true,
    })
    void myToken
  } catch (e) {
    console.error('[dictation] result HanziWriter 异常', e)
  }
}

function replayResult() {
  try { resultWriter?.animateCharacter() } catch (e) {}
}

function cleanupResult() {
  resultLoadToken++
  resultWriter = null
  const el = document.getElementById(RESULT_ID)
  if (el) el.innerHTML = ''
}

async function startRound() {
  let source = pinyinData
  try {
    const cloud = await getQuestions('pinyin', store.currentUnit)
    if (Array.isArray(cloud) && cloud.length > 0) {
      source = cloud
    }
  } catch (e) {
    console.error('云端题库拉取失败，降级本地', e)
  }
  const unitChars = source.filter(d => d.unit === store.currentUnit && d.char)
  // 去重：同字只取一条
  const seen = new Set()
  const unique = unitChars.filter(d => {
    if (seen.has(d.char)) return false
    seen.add(d.char)
    return true
  })
  questions.value = sampleWithout(unique, 10)
  currentIndex.value = 0
  correctCount.value = 0
  showResult.value = false
  started.value = true

  await nextTick()
  if (currentQ.value) {
    await startQuiz(currentQ.value.char)
    safeSpeak(currentQ.value.char)
  }
}

function onFinishWriting() {
  if (showResult.value) return
  showResult.value = true
  // 显示结算区的正确字
  nextTick(() => {
    if (currentQ.value?.char) {
      showResultHanzi(currentQ.value.char)
    }
  })
}

async function judgeSelf(isCorrect) {
  if (isCorrect) {
    correctCount.value++
  } else {
    const q = currentQ.value
    if (q?._id) {
      recordWrong(getUsername(), {
        type: 'hanzi',
        qType: 'dictation',
        char: q.char,
        unit: q.unit,
        question_id: q._id,
      })
    }
  }
  advanceQuestion()
}

async function advanceQuestion() {
  cleanupResult()
  showResult.value = false
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    await nextTick()
    if (currentQ.value) {
      await startQuiz(currentQ.value.char)
      safeSpeak(currentQ.value.char)
    }
  } else {
    // 轮次结束
    cleanupQuiz()
    const total = totalQuestions.value
    const earned = correctCount.value + (correctCount.value === total ? 3 : 0)
    const oldTotal = store.totalStars
    store.addStars(earned)
    roundFinished.value = true
    recordPractice(getUsername(), { type: 'hanzi', totalCount: total, correctCount: correctCount.value })
    uni.navigateTo({
      url: `/pages/study/result?module=dictation&correct=${correctCount.value}&total=${total}&earned=${earned}&oldTotal=${oldTotal}`
    })
  }
}

onBeforeUnmount(() => {
  cleanupQuiz()
  cleanupResult()
  try { window.speechSynthesis?.cancel?.() } catch (e) {}
})

onShow(() => {
  if (roundFinished.value) {
    started.value = false
    roundFinished.value = false
  }
})
</script>

<style scoped>
.dictation-page { min-height: 100vh; }

.filter-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
}
.unit-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: center;
  margin-bottom: 32rpx;
}
.unit-tag {
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  background: #fff;
  color: #666;
  border: 3rpx solid #E0E0E0;
}
.unit-tag:active { transform: scale(0.95); }
.unit-tag.active {
  background: #26A69A;
  color: #fff;
  border-color: #26A69A;
  font-weight: bold;
}
.filter-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 32rpx;
}
.desc-area {
  margin: 24rpx 0;
  text-align: center;
  background: #fff;
  padding: 24rpx 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}
.start-btn {
  padding: 24rpx 100rpx;
  background: linear-gradient(135deg, #26A69A, #00897B);
  color: #fff;
  border-radius: 40rpx;
  font-size: 34rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(38,166,154,0.3);
  margin-top: 24rpx;
}
.start-btn:active { transform: scale(0.97); }

.empty-hint {
  display: flex; flex-direction: column; align-items: center;
  padding: 120rpx 48rpx; color: #888; font-size: 32rpx;
}
.back-btn {
  margin-top: 32rpx; padding: 20rpx 48rpx;
  background: #26A69A; color: #fff; border-radius: 20rpx; font-size: 28rpx;
}

.quiz-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
}
.tts-btn {
  padding: 20rpx 60rpx;
  background: #E0F2F1;
  color: #00695C;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,105,92,0.15);
}
.tts-btn:active { transform: scale(0.95); }

.quiz-wrap {
  position: relative;
  width: 280px;
  height: 280px;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  overflow: hidden;
  margin-bottom: 32rpx;
}
.quiz-target {
  width: 280px;
  height: 280px;
  line-height: 0;
}
.quiz-target :deep(svg) { display: block; }

.finish-btn {
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #42A5F5, #1E88E5);
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(66,165,245,0.3);
}
.finish-btn:active { transform: scale(0.97); }

.result-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.result-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  min-width: 500rpx;
}
.result-label {
  font-size: 28rpx;
  color: #888;
}
.result-hanzi {
  width: 200px;
  height: 200px;
  line-height: 0;
}
.result-hanzi :deep(svg) { display: block; }
.replay-btn {
  padding: 16rpx 48rpx;
  background: #E3F2FD;
  color: #1565C0;
  border-radius: 24rpx;
  font-size: 28rpx;
}
.replay-btn:active { transform: scale(0.95); }

.judge-row {
  display: flex;
  gap: 32rpx;
  margin-top: 16rpx;
}
.judge-btn {
  padding: 28rpx 48rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: bold;
  border: 3rpx solid;
  box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08);
}
.judge-btn:active { transform: scale(0.95); }
.judge-btn.correct {
  background: #E8F5E9;
  color: #2E7D32;
  border-color: #66BB6A;
}
.judge-btn.wrong {
  background: #FFEBEE;
  color: #C62828;
  border-color: #EF5350;
}
</style>
