<template>
  <view class="welcome-page">
    <view class="welcome-content">
      <text class="welcome-icon">✨</text>
      <text class="welcome-title">欢迎</text>
      <text class="welcome-desc">这里什么都没有</text>
    </view>
  </view>
</template>

<script setup>
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.welcome-content {
  text-align: center;
  color: #fff;
}
.welcome-icon {
  font-size: 120rpx;
  display: block;
  margin-bottom: 32rpx;
}
.welcome-title {
  font-size: 48rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}
.welcome-desc {
  font-size: 28rpx;
  opacity: 0.7;
  display: block;
}
</style>
