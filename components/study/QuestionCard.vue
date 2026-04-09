<template>
  <view class="question-card">
    <!-- 题干 -->
    <view class="question-area">
      <view v-if="questionType === 'char'" class="char-display">{{ question }}</view>
      <view v-else-if="questionType === 'pinyin'" class="pinyin-display">{{ question }}</view>
      <view v-else class="question-text">{{ question }}</view>
      <view class="speak-btn" @click.stop="handleSpeak">🔊</view>
    </view>

    <!-- 4 个选项 -->
    <view class="options-grid">
      <view
        v-for="(opt, i) in options"
        :key="i"
        class="option-btn"
        :class="optionClass(opt)"
        @click="handleClick(opt)"
      >
        {{ opt.label }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { speak } from '../../utils/common/speech.js'

const props = defineProps({
  question: String,
  questionType: { type: String, default: 'text' },
  options: Array,
  index: Number,
  total: Number,
})

const emit = defineEmits(['answer'])

const answered = ref(false)
const selectedValue = ref(null)

function optionClass(opt) {
  if (!answered.value) return ''
  if (opt.isCorrect) return 'correct'
  if (opt.value === selectedValue.value && !opt.isCorrect) return 'wrong'
  return ''
}

function handleSpeak() {
  // 根据题型朗读题干内容（不泄露答案）
  if (props.questionType === 'char') {
    speak(props.question) // 朗读汉字
  } else if (props.questionType === 'pinyin') {
    // 拼音题型：读正确的汉字（帮助小朋友听音辨字）
    const correctOpt = props.options?.find(o => o.isCorrect)
    speak(correctOpt ? correctOpt.label : props.question)
  } else {
    // 算术题：朗读算式
    speak(props.question.replace('=', '等于').replace('+', '加').replace('-', '减').replace('?', '几'))
  }
}

function handleClick(opt) {
  if (answered.value) return
  answered.value = true
  selectedValue.value = opt.value

  const isCorrect = opt.isCorrect
  const delay = isCorrect ? 800 : 1500

  setTimeout(() => {
    emit('answer', { correct: isCorrect, selected: opt.value })
    // reset for next question
    answered.value = false
    selectedValue.value = null
  }, delay)
}
</script>

<style scoped>
.question-card {
  padding: 32rpx;
}
.question-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.speak-btn {
  margin-top: 16rpx;
  margin-bottom: 24rpx;
  font-size: 44rpx;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E3F2FD;
  border-radius: 50%;
  transition: transform 0.2s;
}
.speak-btn:active {
  transform: scale(0.9);
}
.question-text {
  font-size: 56rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 48rpx;
  color: var(--color-text);
}
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  padding: 0 24rpx;
}
</style>
