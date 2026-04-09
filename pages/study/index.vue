<template>
  <view class="index-page">
    <view class="header">
      <text class="title">学习小天地</text>
      <view class="star-total">
        <text class="star-icon">⭐</text>
        <text class="star-num">{{ store.totalStars }}</text>
      </view>
    </view>

    <!-- 学期选择 -->
    <view class="semester-bar">
      <view class="semester-tag" :class="{ active: currentSemester === '1' }" @click="switchSemester('1')">一年级上</view>
      <view class="semester-tag" :class="{ active: currentSemester === '2' }" @click="switchSemester('2')">一年级下</view>
    </view>
    <!-- 单元选择 -->
    <view class="unit-bar">
      <view
        v-for="u in 8" :key="u"
        class="unit-tag"
        :class="{ active: store.currentUnit === currentSemester + '-' + u }"
        @click="store.setUnit(currentSemester + '-' + u)"
      >第{{ u }}单元</view>
    </view>

    <view class="modules">
      <view class="module-card pinyin-card" @click="goTo('/pages/study/pinyin')">
        <text class="module-icon">📖</text>
        <text class="module-name">拼音</text>
        <text class="module-desc">看字选拼音</text>
      </view>
      <view class="module-card hanzi-card" @click="goTo('/pages/study/hanzi')">
        <text class="module-icon">✏️</text>
        <text class="module-name">汉字</text>
        <text class="module-desc">笔顺、部首、结构、笔画</text>
      </view>
      <view class="module-card mental-card" @click="goTo('/pages/study/mental-math')">
        <text class="module-icon">⏱️</text>
        <text class="module-name">口算</text>
        <text class="module-desc">100题计时挑战</text>
      </view>
      <view class="module-card wrong-book-card" @click="goTo('/pages/study/wrong-book')">
        <text class="module-icon">📕</text>
        <text class="module-name">错题本</text>
        <text class="module-desc">错题回顾与重练</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../../store/game.js'

const store = useGameStore()

const currentSemester = computed(() => (store.currentUnit || '1-1').split('-')[0])

function switchSemester(s) {
  store.setUnit(s + '-1') // 切换学期时默认选第1单元
}

function goTo(url) {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  padding: 48rpx 32rpx;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.title {
  font-size: 48rpx;
  font-weight: bold;
}
.star-total {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #FFF9C4;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
}
.star-icon { font-size: 36rpx; }
.star-num { font-size: 32rpx; font-weight: bold; }
.semester-bar {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.semester-tag {
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  font-size: 28rpx;
  background: #eee;
  color: #aaa;
  transition: all 0.2s;
}
.semester-tag:active { transform: scale(0.95); }
.semester-tag.active {
  background: var(--color-stroke);
  color: #fff;
  font-weight: bold;
}
.unit-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}
.unit-tag {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  background: #eee;
  color: #aaa;
  transition: all 0.2s;
}
.unit-tag:active { transform: scale(0.95); }
.unit-tag.active {
  background: var(--color-pinyin);
  color: #fff;
  font-weight: bold;
}
.unlock-hint {
  text-align: center;
  font-size: 26rpx;
  color: var(--color-text-light);
  margin-bottom: 32rpx;
}
.modules {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}
.module-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: #fff;
  border-radius: var(--radius-card);
  padding: 40rpx 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  border-left: 8rpx solid;
  transition: transform 0.2s;
}
.module-card:active { transform: scale(0.97); }
.pinyin-card { border-left-color: var(--color-pinyin); }
.hanzi-card { border-left-color: #42A5F5; }
.math-card { border-left-color: var(--color-math); }
.mental-card { border-left-color: #9C27B0; }
.wrong-book-card { border-left-color: #FF5722; }
.module-icon { font-size: 56rpx; }
.module-name { font-size: 36rpx; font-weight: bold; }
.module-desc { font-size: 26rpx; color: var(--color-text-light); }
</style>
