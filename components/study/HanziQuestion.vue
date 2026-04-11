<template>
  <view class="hanzi-question">
    <!-- 笔顺自测题型 -->
    <template v-if="question && question.qType === 'stroke'">
      <view class="type-badge stroke-badge">笔顺</view>
      <text v-if="question.hint" class="hint-text">{{ question.hint }}</text>
      <view class="char-outline-wrap">
        <view class="char-fallback" v-show="!outlineReady">{{ question.char }}</view>
        <view ref="outlineRef" class="char-outline-target" v-show="outlineReady"></view>
      </view>
      <view class="speak-btn" @click="speakChar">🔊</view>

      <view v-if="!showAnswer" class="show-answer-btn" @click="revealAnswer">查看笔顺动画</view>
      <view v-if="showAnswer" class="answer-area">
        <text class="answer-hint">观察正确笔顺：</text>
        <view class="color-legend">
          <view class="legend-item">
            <view class="legend-dot" style="background:#333"></view>
            <text>普通笔画</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot" style="background:#168F16"></view>
            <text>部首笔画</text>
          </view>
        </view>
        <view class="answer-btn" @click="replayAnim">▶ 重播动画</view>
      </view>
      <view v-if="showAnswer" class="self-judge">
        <view class="judge-btn wrong" @click="judgeSelf(false)">❌ 我不会</view>
        <view class="judge-btn correct" @click="judgeSelf(true)">✅ 我会了</view>
      </view>
    </template>

    <!-- 选择题型（部首/结构/笔画数）-->
    <template v-else-if="question">
      <view class="char-display">{{ question.char }}</view>
      <view class="speak-btn" @click="speakChar">🔊</view>
      <view class="type-badge" :class="question.qType + '-badge'">
        {{ qTypeLabel(question.qType) }}
      </view>
      <text v-if="question.hint" class="hint-text">{{ question.hint }}</text>

      <view class="options-grid">
        <view
          v-for="(opt, i) in (question.options || [])"
          :key="i"
          :class="['option-btn',
            choiceState === 'correct' && opt.isCorrect && 'correct',
            choiceState === 'wrong' && selectedOpt === i && 'wrong',
            choiceState === 'wrong' && opt.isCorrect && 'correct']"
          @click="pickOption(i)"
        >{{ opt.label }}</view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import HanziWriter from 'hanzi-writer'
import { speak } from '../../utils/common/speech.js'

const props = defineProps({
  question: { type: Object, required: true }
})

const emit = defineEmits(['answer'])

const choiceState = ref('')
const selectedOpt = ref(-1)
const showAnswer = ref(false)
const outlineRef = ref(null)
const outlineReady = ref(false)
let writerInstance = null
let loadToken = 0
let pendingTimer = null

function resetState() {
  choiceState.value = ''
  selectedOpt.value = -1
  showAnswer.value = false
  outlineReady.value = false
}

function qTypeLabel(t) {
  return ({ radical: '部首', structure: '结构', strokeCount: '笔画数', stroke: '笔顺' })[t] || t
}

async function initOutline() {
  outlineReady.value = false
  await nextTick()
  const el = outlineRef.value
  if (!el || !props.question?.char) return
  el.innerHTML = ''
  const myToken = ++loadToken
  try {
    writerInstance = HanziWriter.create(el, props.question.char, {
      width: 200,
      height: 200,
      padding: 20,
      strokeColor: '#333',
      outlineColor: '#DDD',
      radicalColor: '#168F16',
      strokeAnimationSpeed: 1.5,
      delayBetweenStrokes: 400,
      showCharacter: true,
      showOutline: true,
      onLoadCharDataSuccess: () => {
        if (myToken === loadToken) outlineReady.value = true
      },
      onLoadCharDataError: () => {
        if (myToken === loadToken) {
          outlineReady.value = false
          console.warn('[HanziQuestion] HanziWriter 加载字符失败:', props.question?.char)
        }
      }
    })
  } catch (e) {
    if (myToken === loadToken) outlineReady.value = false
  }
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
  emit('answer', { isCorrect })
}

function pickOption(i) {
  if (choiceState.value) return
  selectedOpt.value = i
  const opt = props.question.options?.[i]
  if (!opt) return
  const isCorrect = !!opt.isCorrect
  choiceState.value = isCorrect ? 'correct' : 'wrong'
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = setTimeout(() => {
    pendingTimer = null
    emit('answer', { isCorrect, optionIndex: i })
  }, isCorrect ? 800 : 1500)
}

function speakChar() {
  if (props.question?.char) speak(props.question.char)
}

watch(
  () => props.question?.char,
  (newChar) => {
    resetState()
    writerInstance = null
    if (props.question?.qType === 'stroke' && newChar) {
      initOutline()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  loadToken++
  writerInstance = null
  if (pendingTimer) {
    clearTimeout(pendingTimer)
    pendingTimer = null
  }
  if (outlineRef.value) {
    try { outlineRef.value.innerHTML = '' } catch (e) {}
  }
})
</script>

<style scoped>
.hanzi-question {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
}

.char-display {
  font-size: 120rpx;
  font-weight: bold;
  text-align: center;
  color: #333;
  min-height: 140rpx;
  line-height: 1.3;
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

.type-badge {
  text-align: center;
  font-size: 24rpx;
  font-weight: bold;
  padding: 6rpx 24rpx;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  display: inline-block;
}
.stroke-badge { background: #E3F2FD; color: #1565C0; }
.radical-badge { background: #FFF3E0; color: #E65100; }
.structure-badge { background: #E8F5E9; color: #2E7D32; }
.strokeCount-badge { background: #F3E5F5; color: #7B1FA2; }

.hint-text {
  text-align: center;
  color: #888;
  font-size: 28rpx;
  margin-bottom: 24rpx;
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
.char-outline-target {
  width: 200px;
  height: 200px;
  line-height: 0;
}
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

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  padding: 0 24rpx;
  width: 100%;
}
.option-btn {
  background: #fff;
  border: 3rpx solid #BDBDBD;
  border-radius: 20rpx;
  padding: 32rpx 16rpx;
  text-align: center;
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  transition: all 0.2s;
}
.option-btn:active { transform: scale(0.96); }
.option-btn.correct {
  border-color: #66BB6A;
  background: #E8F5E9;
  color: #2E7D32;
  box-shadow: 0 0 0 4rpx rgba(102,187,106,0.3);
}
.option-btn.wrong {
  border-color: #EF5350;
  background: #FFEBEE;
  color: #C62828;
  box-shadow: 0 0 0 4rpx rgba(239,83,80,0.3);
}

.show-answer-btn {
  margin-top: 32rpx;
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #42A5F5, #1E88E5);
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(66,165,245,0.3);
}
.show-answer-btn:active { transform: scale(0.97); }

.answer-area {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.answer-hint {
  font-size: 28rpx;
  color: #666;
}
.color-legend {
  display: flex;
  gap: 32rpx;
  justify-content: center;
  font-size: 24rpx;
  color: #888;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
}
.answer-btn {
  padding: 16rpx 48rpx;
  background: #E3F2FD;
  color: #1565C0;
  border-radius: 24rpx;
  font-size: 28rpx;
}

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
