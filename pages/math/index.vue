<template>
  <view class="index-page">
    <view class="header">
      <text class="back-btn" @click="goBack">←</text>
      <text class="title">数学练习</text>
    </view>

    <view class="modules">
      <view class="module-card online-card" @click="goTo('/pages/math/online')">
        <text class="module-icon">📝</text>
        <view class="module-info">
          <text class="module-name">在线练习</text>
          <text class="module-desc">实时出题，即时反馈</text>
        </view>
      </view>
      <view class="module-card print-card" @click="goTo('/pages/math/print')">
        <text class="module-icon">🖨️</text>
        <view class="module-info">
          <text class="module-name">打印出题</text>
          <text class="module-desc">生成试卷，打印练习</text>
        </view>
      </view>
      <view class="module-card history-card" @click="goTo('/pages/math/history')">
        <text class="module-icon">📋</text>
        <view class="module-info">
          <text class="module-name">历史记录</text>
          <text class="module-desc">查看历次练习成绩</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
function goBack() {
  uni.navigateBack()
}

function goTo(url) {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  padding: 48rpx 32rpx;
  background: #F5F7FA;
}
.header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 48rpx;
}
.back-btn {
  font-size: 44rpx;
  color: #42A5F5;
  font-weight: bold;
  padding: 8rpx 16rpx;
}
.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #222;
}
.modules {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}
.module-card {
  display: flex;
  align-items: center;
  gap: 28rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  border-left: 8rpx solid #42A5F5;
  transition: transform 0.2s;
}
.module-card:active {
  transform: scale(0.97);
}
.online-card  { border-left-color: #42A5F5; }
.print-card   { border-left-color: #29B6F6; }
.history-card { border-left-color: #0288D1; }
.module-icon {
  font-size: 56rpx;
}
.module-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.module-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #222;
}
.module-desc {
  font-size: 26rpx;
  color: #888;
}
</style>

<style>
body.dark-mode .index-page {
  background: #1a1a2e;
}
body.dark-mode .module-card {
  background: #252545;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.3);
}
body.dark-mode .title,
body.dark-mode .module-name {
  color: #e0e0e0;
}
body.dark-mode .module-desc {
  color: #888;
}
body.dark-mode .back-btn {
  color: #64B5F6;
}
</style>
