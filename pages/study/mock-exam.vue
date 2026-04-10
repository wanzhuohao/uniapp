<template>
  <view class="mock-page">
    <view class="top-bar">
      <view class="back-btn" @click="goBack">←</view>
      <text class="title">学习模考</text>
      <view class="progress">{{ currentIndex + 1 }}/{{ totalQuestions }}</view>
    </view>

    <!-- 筛选页 -->
    <view v-if="!started" class="filter-area">
      <text class="filter-title">选择单元</text>
      <view class="unit-tags">
        <view v-for="u in 8" :key="u"
          :class="['unit-tag', store.currentUnit === '2-' + u && 'active']"
          @click="store.setUnit('2-' + u)"
        >第{{ u }}单元</view>
      </view>

      <text class="filter-title" style="margin-top: 32rpx;">关注重点</text>
      <view class="filter-tags">
        <view :class="['filter-tag', focus === '' && 'active']" @click="focus = ''">综合</view>
        <view :class="['filter-tag', focus === 'pinyin' && 'active']" @click="focus = 'pinyin'">拼音</view>
        <view :class="['filter-tag', focus === 'radical' && 'active']" @click="focus = 'radical'">部首</view>
        <view :class="['filter-tag', focus === 'structure' && 'active']" @click="focus = 'structure'">结构</view>
        <view :class="['filter-tag', focus === 'strokeCount' && 'active']" @click="focus = 'strokeCount'">笔画</view>
      </view>

      <view class="desc-area">
        <text class="desc">· 看字自己说出答案</text>
        <text class="desc">· 点"查看答案"核对</text>
        <text class="desc">· 答错自动进错题本</text>
      </view>

      <view class="start-btn" @click="startRound">开始模考</view>
    </view>

    <!-- 空 -->
    <view v-if="started && totalQuestions === 0" class="empty-hint">
      <text>本单元暂无题目</text>
      <view class="back-inline-btn" @click="started = false">返回</view>
    </view>

    <!-- 答题区 -->
    <view v-if="started && currentQ" class="quiz-area">
      <!-- 汉字 -->
      <view class="char-outline-wrap">
        <view class="char-fallback" v-show="!outlineReady">{{ currentQ.char }}</view>
        <view :id="outlineId" class="char-outline-target" v-show="outlineReady"></view>
      </view>
      <view class="speak-btn" @click="speakChar">🔊</view>

      <!-- 提示 -->
      <text v-if="!showAnswer" class="hint-text">想一想：{{ focusHint }}</text>

      <!-- 答案区 -->
      <view v-if="showAnswer" class="answer-box">
        <view v-if="focus === '' || focus === 'pinyin'" class="answer-row" :class="{ highlight: focus === 'pinyin' }">
          <text class="answer-label">拼音</text>
          <text class="answer-value pinyin">{{ currentQ.pinyin }}</text>
        </view>
        <view v-if="focus === '' || focus === 'radical'" class="answer-row" :class="{ highlight: focus === 'radical' }">
          <text class="answer-label">部首</text>
          <text class="answer-value">{{ currentQ.radical }}</text>
        </view>
        <view v-if="focus === '' || focus === 'structure'" class="answer-row" :class="{ highlight: focus === 'structure' }">
          <text class="answer-label">结构</text>
          <text class="answer-value">{{ currentQ.structure }}</text>
        </view>
        <view v-if="focus === '' || focus === 'strokeCount'" class="answer-row" :class="{ highlight: focus === 'strokeCount' }">
          <text class="answer-label">笔画</text>
          <text class="answer-value">{{ currentQ.strokeCount }} 画</text>
        </view>
        <view class="answer-btn" @click="replayAnim">▶ 笔顺动画</view>
      </view>

      <!-- 按钮区 -->
      <view v-if="!showAnswer" class="show-answer-btn" @click="revealAnswer">查看答案</view>

      <view v-if="showAnswer" class="self-judge">
        <view class="judge-btn wrong" @click="judgeSelf(false)">❌ 我不会</view>
        <view class="judge-btn correct" @click="judgeSelf(true)">✅ 我会了</view>
      </view>

      <!-- 扩展学习 -->
      <view v-if="showAnswer" class="extend-area">
        <view class="extend-toggle" @click="showIframe = !showIframe">
          {{ showIframe ? '▲ 收起扩展学习' : '▼ 扩展学习（汉字皮）' }}
        </view>
        <view v-if="showIframe" class="iframe-wrap">
          <iframe
            :src="'https://www.hanzipi.com/' + currentQ.char + '.html'"
            class="extend-iframe"
            frameborder="0"
          ></iframe>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import HanziWriter from 'hanzi-writer'
import { useGameStore } from '../../store/game.js'
import { sampleWithout } from '../../utils/study/questionHelper.js'
import { speak } from '../../utils/common/speech.js'
import { recordWrong } from '../../utils/study/wrongBook.js'
import { recordPractice } from '../../utils/study/practiceLog.js'
import { useAuth } from '../../composables/common/useAuth.js'
import pinyinData from '../../static/data/pinyin.json'

const store = useGameStore()
const { getUsername } = useAuth()

const focus = ref('')
const started = ref(false)
const currentIndex = ref(0)
const correctCount = ref(0)
const roundFinished = ref(false)
const showAnswer = ref(false)
const showIframe = ref(false)

const outlineId = ref('mock-' + Date.now())
const outlineReady = ref(false)
let writerInstance = null

const questions = ref([])
const totalQuestions = computed(() => questions.value.length)
const currentQ = computed(() => questions.value[currentIndex.value] || null)

const focusHint = computed(() => {
  const map = {
    '': '拼音、部首、结构、笔画',
    pinyin: '这个字的拼音',
    radical: '这个字的部首',
    structure: '这个字的结构',
    strokeCount: '这个字有几画'
  }
  return map[focus.value] || map['']
})

async function initOutline() {
  outlineReady.value = false
  writerInstance = null
  await nextTick()
  const el = document.getElementById(outlineId.value)
  if (!el || !currentQ.value) return
  el.innerHTML = ''
  try {
    writerInstance = HanziWriter.create(outlineId.value, currentQ.value.char, {
      width: 200, height: 200, padding: 20,
      strokeColor: '#333', outlineColor: '#DDD',
      radicalColor: '#168F16',
      strokeAnimationSpeed: 1.5,
      delayBetweenStrokes: 400,
      showCharacter: true, showOutline: true,
      onLoadCharDataSuccess: () => { outlineReady.value = true },
      onLoadCharDataError: () => { outlineReady.value = false }
    })
  } catch (e) { outlineReady.value = false }
}

function startRound() {
  const filtered = pinyinData.filter(d => d.unit === store.currentUnit && d.radical && d.structure)
  questions.value = sampleWithout(filtered, 10)
  currentIndex.value = 0
  correctCount.value = 0
  started.value = true
  resetState()
  nextTick(() => initOutline())
}

function resetState() {
  showAnswer.value = false
  showIframe.value = false
}

function revealAnswer() {
  showAnswer.value = true
  if (writerInstance) {
    try { writerInstance.animateCharacter() } catch (e) {}
  }
}

function replayAnim() {
  if (writerInstance) {
    try { writerInstance.animateCharacter() } catch (e) {}
  }
}

function judgeSelf(isCorrect) {
  if (isCorrect) {
    correctCount.value++
  } else {
    const q = currentQ.value
    if (q._id) {
      recordWrong(getUsername(), {
        type: 'hanzi', char: q.char, unit: q.unit, question_id: q._id
      })
    }
  }
  advanceQuestion()
}

function advanceQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    resetState()
    nextTick(() => initOutline())
  } else {
    // 轮次结束
    const earned = correctCount.value
    store.addStars(earned)
    roundFinished.value = true
    recordPractice(getUsername(), {
      type: 'hanzi',
      totalCount: totalQuestions.value,
      correctCount: correctCount.value
    })
    uni.showToast({
      title: `完成！答对 ${correctCount.value}/${totalQuestions.value}`,
      icon: 'none',
      duration: 2000
    })
    setTimeout(() => {
      started.value = false
      roundFinished.value = false
    }, 2000)
  }
}

function speakChar() {
  if (currentQ.value) speak(currentQ.value.char)
}

function goBack() {
  if (started.value) {
    started.value = false
  } else {
    uni.navigateBack()
  }
}

onShow(() => {
  if (roundFinished.value) {
    started.value = false
    roundFinished.value = false
  }
})
</script>

<style scoped>
.mock-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F7FA;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
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
.title { font-size: 32rpx; font-weight: bold; }
.progress { font-size: 26rpx; color: #888; font-weight: bold; }

/* 筛选区 */
.filter-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
}
.filter-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  align-self: center;
}
.unit-tags, .filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: center;
  margin-bottom: 16rpx;
}
.unit-tag, .filter-tag {
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  background: #fff;
  color: #666;
  border: 3rpx solid #E0E0E0;
}
.unit-tag.active, .filter-tag.active {
  background: #00897B;
  color: #fff;
  border-color: #00897B;
  font-weight: bold;
}
.desc-area {
  margin: 40rpx 0;
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
  padding: 28rpx 120rpx;
  background: linear-gradient(135deg, #00897B, #00695C);
  color: #fff;
  border-radius: 40rpx;
  font-size: 36rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(0,137,123,0.3);
  margin-top: 24rpx;
}
.start-btn:active { transform: scale(0.97); }

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx;
  color: #888;
  font-size: 32rpx;
}
.back-inline-btn {
  margin-top: 32rpx;
  padding: 20rpx 48rpx;
  background: #00897B;
  color: #fff;
  border-radius: 20rpx;
  font-size: 28rpx;
}

/* 答题区 */
.quiz-area {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.char-outline-wrap {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 16rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
  overflow: hidden;
}
.char-outline-target { width: 200px; height: 200px; line-height: 0; }
.char-outline-target :deep(svg) { display: block; }
.char-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 150px;
  font-weight: bold;
  color: #DDD;
  line-height: 1;
  font-family: "KaiTi", "楷体", "STKaiti", serif;
}
.speak-btn {
  margin: 12rpx 0;
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
  color: #888;
  font-size: 28rpx;
  margin: 24rpx 0;
}

.answer-box {
  width: 100%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  margin: 24rpx 0;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.answer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid #eee;
  border-radius: 8rpx;
}
.answer-row:last-of-type { border-bottom: none; }
.answer-row.highlight {
  background: #E0F2F1;
  border: 2rpx solid #00897B;
  margin-bottom: 8rpx;
}
.answer-label {
  font-size: 28rpx;
  color: #888;
}
.answer-value {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}
.answer-value.pinyin {
  color: #E65100;
  font-family: serif;
}
.answer-btn {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #E3F2FD;
  color: #1565C0;
  border-radius: 12rpx;
  text-align: center;
  font-size: 28rpx;
}
.answer-btn:active { transform: scale(0.97); }

.show-answer-btn {
  margin-top: 32rpx;
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #00897B, #00695C);
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(0,137,123,0.3);
}
.show-answer-btn:active { transform: scale(0.97); }

.self-judge {
  display: flex;
  gap: 32rpx;
  margin-top: 32rpx;
  justify-content: center;
}
.judge-btn {
  padding: 28rpx 56rpx;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: 3rpx solid;
  box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08);
}
.judge-btn:active { transform: scale(0.95); }
.judge-btn.correct { background: #E8F5E9; color: #2E7D32; border-color: #66BB6A; }
.judge-btn.wrong { background: #FFEBEE; color: #C62828; border-color: #EF5350; }

/* 扩展学习 */
.extend-area {
  width: 100%;
  margin-top: 32rpx;
}
.extend-toggle {
  text-align: center;
  padding: 16rpx;
  color: #00897B;
  font-size: 28rpx;
  background: #fff;
  border-radius: 12rpx;
  border: 2rpx dashed #00897B;
}
.extend-toggle:active { transform: scale(0.98); }
.iframe-wrap {
  margin-top: 16rpx;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  height: 800rpx;
}
.extend-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
