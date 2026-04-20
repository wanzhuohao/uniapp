<template>
  <view class="container">
    <view class="header">
      <text class="title">碑文排版</text>
    </view>

    <view class="cards">
      <view class="card card-stele" @click="goTo('/pages/stele/list')">
        <text class="card-icon">📝</text>
        <text class="card-title">碑文排版</text>
        <text class="card-desc">订单管理与排版预览</text>
      </view>
    </view>
  </view>
</template>

<script setup>
function goTo(url) {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 40rpx 30rpx;
  background: #F5F7FA;
}

.header {
  padding: 30rpx 0 40rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #2C2420;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.card-stele { border-left: 8rpx solid #96700A; }

.card-icon {
  font-size: 56rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #2C2420;
}

.card-desc {
  font-size: 26rpx;
  color: #888;
}
</style>
