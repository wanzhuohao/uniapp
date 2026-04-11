<template>
  <view class="top-bar">
    <view v-if="showBack" class="back-btn" @click="onBack">←</view>
    <view v-else class="back-placeholder"></view>
    <view class="title-wrap">
      <slot name="title">
        <text class="title">{{ title }}</text>
      </slot>
    </view>
    <view class="right-slot">
      <slot name="right"></slot>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  // autoBack=false 时不执行默认 navigateBack，仅 emit back，交给父组件处理
  autoBack: { type: Boolean, default: true }
})

const emit = defineEmits(['back'])

function onBack() {
  emit('back')
  if (props.autoBack) {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
    } else {
      uni.reLaunch({ url: '/pages/study/index' })
    }
  }
}
</script>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 10;
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
  color: #333;
}
.back-btn:active { transform: scale(0.9); }
.back-placeholder {
  width: 56rpx;
  height: 56rpx;
}
.title-wrap {
  flex: 1;
  text-align: center;
}
.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}
.right-slot {
  min-width: 56rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 26rpx;
  color: #999;
}
</style>
