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
  padding: 40rpx 32rpx;
}
.question-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
}
.char-display {
  font-size: 120rpx;
  font-weight: bold;
  text-align: center;
  line-height: 1.3;
  color: #333;
  min-height: 140rpx;
}
.pinyin-display {
  font-size: 72rpx;
  font-family: serif;
  text-align: center;
  color: #E65100;
}
.speak-btn {
  margin-top: 20rpx;
  margin-bottom: 8rpx;
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
  font-size: 64rpx;
  font-weight: bold;
  text-align: center;
  color: #333;
}
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  padding: 0 24rpx;
}
.option-btn {
  background: #fff;
  border: 3rpx solid #BDBDBD;
  border-radius: 20rpx;
  padding: 32rpx 16rpx;
  text-align: center;
  font-size: 40rpx;
  font-weight: 500;
  color: #333;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  transition: all 0.2s ease;
}
.option-btn:active {
  transform: scale(0.96);
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
}
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
</style>
