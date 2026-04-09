<template>
  <view class="star-bar">
    <!-- 返回按钮 -->
    <view class="back-btn" @click="goBack">←</view>
    <!-- 进度圆点 -->
    <view class="progress-dots">
      <view
        v-for="i in total"
        :key="i"
        class="dot"
        :class="{ active: i <= current, done: i < current }"
      />
    </view>
    <!-- 星星数 -->
    <view class="star-count">
      <text class="star-icon">⭐</text>
      <text class="star-num">{{ stars }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  current: { type: Number, default: 0 },
  total: { type: Number, default: 10 },
  stars: { type: Number, default: 0 },
})

function goBack() {
  uni.navigateBack()
}
</script>

<style scoped>
.back-btn {
  font-size: 36rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f0f0;
  flex-shrink: 0;
}
.back-btn:active { transform: scale(0.9); background: #e0e0e0; }
.star-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  background: #fff;
  border-radius: 0 0 var(--radius-card) var(--radius-card);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.progress-dots {
  display: flex;
  gap: 12rpx;
}
.dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #E0E0E0;
  transition: all 0.3s;
}
.dot.active {
  background: var(--color-primary);
  transform: scale(1.2);
}
.dot.done {
  background: var(--color-primary);
}
.star-count {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.star-num {
  font-size: 32rpx;
  font-weight: bold;
}
</style>
