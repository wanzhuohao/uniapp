<template>
  <view class="hanzi-question">
    <!-- 笔顺描红题型 -->
    <template v-if="question && question.qType === 'stroke'">
      <view class="type-badge stroke-badge">笔顺</view>
      <text class="hint-text">按正确笔顺写出这个字</text>
      <view class="speak-btn" @click="speakChar">🔊</view>
      <view class="char-outline-wrap quiz-size">
        <view class="char-fallback quiz-size" v-show="!outlineReady">{{ question.char }}</view>
        <view :id="outlineId" class="char-outline-target quiz-size" v-show="outlineReady"></view>
      </view>

      <!-- quiz 完成后的结果 -->
      <view v-if="strokeResult" class="stroke-result">
        <text :class="['result-verdict', strokeResult.correct ? 'correct' : 'wrong']">
          {{ strokeResult.correct ? '全对!' : `有 ${strokeResult.mistakes} 笔写错` }}
        </text>
        <view class="answer-btn" @click="replayAnim">▶ 播放笔顺动画</view>
        <view class="next-btn" @click="emitStrokeResult">下一题</view>
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
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import HanziWriter from 'hanzi-writer'
import { speak } from '../../utils/common/speech.js'
import { isDark } from '../../utils/common/theme.js'

const props = defineProps({
  question: { type: Object, required: true }
})

const emit = defineEmits(['answer'])

const choiceState = ref('')
const selectedOpt = ref(-1)
const strokeResult = ref(null) // { correct: boolean, mistakes: number }
const outlineId = 'hq-' + Date.now() + '-' + Math.floor(Math.random() * 1e6)
const outlineReady = ref(false)
let writerInstance = null
let loadToken = 0
let pendingTimer = null

function resetState() {
  choiceState.value = ''
  selectedOpt.value = -1
  strokeResult.value = null
  outlineReady.value = false
}

function qTypeLabel(t) {
  return ({ radical: '部首', structure: '结构', strokeCount: '笔画数', stroke: '笔顺' })[t] || t
}

async function initOutline() {
  outlineReady.value = false
  strokeResult.value = null
  await nextTick()
  const el = document.getElementById(outlineId)
  if (!el || !props.question?.char) return
  el.innerHTML = ''
  const myToken = ++loadToken
  try {
    const dark = isDark()
    writerInstance = HanziWriter.create(outlineId, props.question.char, {
      width: 280,
      height: 280,
      padding: 10,
      strokeColor: dark ? '#80cbc4' : '#2E7D32',
      outlineColor: dark ? '#888' : '#DDD',
      radicalColor: dark ? '#80cbc4' : '#168F16',
      strokeAnimationSpeed: 2,
      delayBetweenStrokes: 200,
      showCharacter: false,
      showOutline: true,
      showHintAfterMisses: 2,
      onLoadCharDataSuccess: () => {
        if (myToken !== loadToken) return
        outlineReady.value = true
        try {
          writerInstance?.quiz({
            onComplete: (summaryData) => {
              if (myToken !== loadToken) return
              strokeResult.value = {
                correct: summaryData.totalMistakes === 0,
                mistakes: summaryData.totalMistakes
              }
              // quiz 完成后显示完整字
              try {
                writerInstance?.showCharacter()
              } catch (e) {}
            }
          })
        } catch (e) {}
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

function replayAnim() {
  if (writerInstance) {
    try { writerInstance.animateCharacter() } catch (e) {}
  }
}

function emitStrokeResult() {
  if (strokeResult.value) {
    emit('answer', { isCorrect: strokeResult.value.correct })
  }
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

// 首次挂载时初始化（setup 阶段 ref 尚未绑定，不能用 immediate: true watch）
onMounted(() => {
  if (props.question?.qType === 'stroke' && props.question?.char) {
    initOutline()
  }
})

// 后续题目切换（父组件更换 question prop）时重置 + 重初始化
watch(
  () => props.question?.char,
  (newChar) => {
    resetState()
    writerInstance = null
    if (props.question?.qType === 'stroke' && newChar) {
      initOutline()
    }
  }
)

onBeforeUnmount(() => {
  loadToken++
  writerInstance = null
  if (pendingTimer) {
    clearTimeout(pendingTimer)
    pendingTimer = null
  }
  const el = document.getElementById(outlineId)
  if (el) {
    try { el.innerHTML = '' } catch (e) {}
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
.char-outline-wrap.quiz-size {
  width: 280px;
  height: 280px;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.char-outline-target {
  width: 200px;
  height: 200px;
  line-height: 0;
}
.char-outline-target.quiz-size {
  width: 280px;
  height: 280px;
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

.stroke-result {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
.result-verdict {
  font-size: 36rpx;
  font-weight: bold;
}
.result-verdict.correct { color: #2E7D32; }
.result-verdict.wrong { color: #C62828; }
.answer-btn {
  padding: 16rpx 48rpx;
  background: #E3F2FD;
  color: #1565C0;
  border-radius: 24rpx;
  font-size: 28rpx;
}
.answer-btn:active { transform: scale(0.95); }
.next-btn {
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #42A5F5, #1E88E5);
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(66,165,245,0.3);
}
.next-btn:active { transform: scale(0.97); }
</style>
