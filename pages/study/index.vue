<template>
  <view class="index-page">
    <view class="header">
      <text class="title">学习小天地</text>
      <view class="star-total">
        <text class="star-icon">⭐</text>
        <text class="star-num">{{ store.totalStars }}</text>
      </view>
    </view>

    <view class="modules">
      <view class="module-card mock-card" @click="goTo('/pages/study/learn')">
        <text class="module-icon">📚</text>
        <text class="module-name">学习</text>
        <text class="module-desc">看答案自判，拓展学习</text>
      </view>
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
      <view class="module-card dictation-card" @click="goTo('/pages/study/dictation')">
        <text class="module-icon">✍️</text>
        <text class="module-name">听写</text>
        <text class="module-desc">听声音写汉字</text>
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
      <view class="module-card admin-card" @click="goTo('/pages/study/data-admin')">
        <text class="module-icon">🛠️</text>
        <text class="module-name">数据维护</text>
        <text class="module-desc">编辑题库</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useGameStore } from '../../store/game.js'

const store = useGameStore()

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
  margin-bottom: 32rpx;
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
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  border-left: 8rpx solid;
  transition: transform 0.2s;
}
.module-card:active { transform: scale(0.97); }
.pinyin-card { border-left-color: #FFA726; }
.hanzi-card { border-left-color: #42A5F5; }
.mock-card { border-left-color: #00897B; }
.mental-card { border-left-color: #9C27B0; }
.dictation-card { border-left-color: #26A69A; }
.wrong-book-card { border-left-color: #FF5722; }
.admin-card { border-left-color: #607D8B; }
.module-icon { font-size: 56rpx; }
.module-name { font-size: 36rpx; font-weight: bold; }
.module-desc { font-size: 26rpx; color: #888; }
</style>
