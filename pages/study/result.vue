<template>
  <view class="result-page">
    <view class="result-card">
      <text class="score">{{ correct }}/{{ total }}</text>
      <text class="score-label">答对题数</text>

      <view class="stars-earned">
        <text class="star-icon">⭐</text>
        <text class="star-text">+{{ earned }} 星</text>
      </view>
      <view class="stars-total-change">
        <text>{{ oldTotal }}</text>
        <text class="arrow">→</text>
        <text class="new-total">{{ oldTotal + earned }}</text>
      </view>

      <view v-if="module === 'math' && levelChanged" class="level-change">
        <text>{{ levelChangeText }}</text>
      </view>

      <text class="encourage">{{ encourageText }}</text>
    </view>

    <view class="actions">
      <view class="action-btn primary" @click="playAgain">再来一轮</view>
      <view class="action-btn" @click="goHome">回到主页</view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({})

// 从 URL 参数获取数据
const query = (() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  return page?.$page?.options || page?.options || {}
})()

const module = query.module || ''
const correct = Number(query.correct) || 0
const total = Number(query.total) || 10
const earned = Number(query.earned) || 0
const oldLevel = Number(query.oldLevel) || 0
const newLevel = Number(query.newLevel) || 0
const oldTotal = Number(query.oldTotal) || 0

const levelChanged = computed(() => module === 'math' && oldLevel !== newLevel)
const levelChangeText = computed(() => {
  if (newLevel > oldLevel) return `恭喜升到 Lv.${newLevel}！`
  if (newLevel < oldLevel) return `降到 Lv.${newLevel}，加油哦！`
  return ''
})

const encourageText = computed(() => {
  if (correct === 10) return '太棒了！全部答对！'
  if (correct >= 8) return '真厉害！继续保持！'
  if (correct >= 6) return '不错哦，继续加油！'
  return '没关系，多练几次就会了！'
})

function playAgain() {
  uni.navigateBack()
}

function goHome() {
  uni.navigateBack({ delta: 2 })
}
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}
.result-card {
  background: #fff;
  border-radius: var(--radius-card);
  padding: 64rpx 48rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  width: 100%;
  max-width: 600rpx;
}
.score {
  font-size: 96rpx;
  font-weight: bold;
  color: var(--color-primary);
}
.score-label {
  display: block;
  font-size: 28rpx;
  color: var(--color-text-light);
  margin-bottom: 32rpx;
}
.stars-earned {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}
.star-icon { font-size: 48rpx; }
.star-text { font-size: 36rpx; font-weight: bold; color: var(--color-star); }
.stars-total-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  font-size: 30rpx;
  color: var(--color-text-light);
  margin-bottom: 24rpx;
}
.arrow { color: var(--color-primary); }
.new-total { font-weight: bold; color: var(--color-primary); font-size: 36rpx; }
.level-change {
  font-size: 30rpx;
  color: var(--color-stroke);
  margin-bottom: 24rpx;
  font-weight: bold;
}
.encourage {
  font-size: 32rpx;
  color: var(--color-text);
  margin-top: 16rpx;
}
.actions {
  margin-top: 48rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 100%;
  max-width: 600rpx;
}
.action-btn {
  text-align: center;
  padding: 28rpx;
  border-radius: var(--radius-btn);
  font-size: 32rpx;
  font-weight: bold;
  background: #fff;
  border: 4rpx solid #E0E0E0;
}
.action-btn:active { transform: scale(0.97); }
.action-btn.primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
</style>
