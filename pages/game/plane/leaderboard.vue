<template>
  <view class="lb-page">
    <view class="lb-header">
      <text class="lb-title">🏆 排行榜</text>
      <view class="lb-close" @click="goBack">✕</view>
    </view>

    <view v-if="loading" class="lb-loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="list.length === 0" class="lb-empty">
      <text>暂无记录</text>
      <text class="lb-empty-sub">成为第一个上榜的人吧！</text>
    </view>

    <scroll-view v-else scroll-y class="lb-list">
      <!-- 表头 -->
      <view class="lb-row lb-head">
        <text class="lb-col-rank">#</text>
        <text class="lb-col-name">昵称</text>
        <text class="lb-col-score">评分</text>
        <text class="lb-col-detail">击杀</text>
        <text class="lb-col-detail">等级</text>
        <text class="lb-col-detail">时长</text>
      </view>
      <!-- 数据行 -->
      <view
        v-for="(item, i) in list"
        :key="i"
        class="lb-row"
        :class="{ 'lb-top3': i < 3, 'lb-me': item.nickname === myNickname }"
      >
        <view class="lb-col-rank">
          <text v-if="i === 0" class="medal">🥇</text>
          <text v-else-if="i === 1" class="medal">🥈</text>
          <text v-else-if="i === 2" class="medal">🥉</text>
          <text v-else>{{ i + 1 }}</text>
        </view>
        <text class="lb-col-name">{{ item.nickname }}</text>
        <text class="lb-col-score">{{ item.score }}</text>
        <text class="lb-col-detail">{{ item.kills }}</text>
        <text class="lb-col-detail">Lv{{ item.level }}</text>
        <text class="lb-col-detail">{{ formatTime(item.time) }}</text>
      </view>
    </scroll-view>

    <view class="lb-footer">
      <view class="lb-btn" @click="goBack">返回</view>
      <view class="lb-btn primary" @click="refresh">刷新</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getLeaderboard, getNickname } from '../api.js';

const list = ref([]);
const loading = ref(true);
const myNickname = getNickname();

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function loadData() {
  loading.value = true;
  try {
    list.value = await getLeaderboard(50);
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' });
  }
  loading.value = false;
}

function refresh() {
  loadData();
}

function goBack() {
  uni.navigateBack();
}

onMounted(loadData);
</script>

<style scoped>
.lb-page {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: linear-gradient(180deg, #1A0E3D 0%, #0B1840 50%, #04081F 100%);
  display: flex;
  flex-direction: column;
  color: #fff;
  font-size: 14px;
}
.lb-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  position: relative;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.lb-title {
  font-size: 20px;
  font-weight: bold;
  color: #FFE066;
}
.lb-close {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.08);
  border-radius: 50%;
}
.lb-loading, .lb-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255,255,255,0.5);
}
.lb-empty-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.3);
}
.lb-list {
  flex: 1;
  padding: 0 12px;
}
.lb-row {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.lb-head {
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}
.lb-top3 {
  background: rgba(255,215,0,0.06);
}
.lb-me {
  background: rgba(94,200,255,0.12);
  border-radius: 6px;
}
.medal {
  font-size: 18px;
}
.lb-col-rank {
  width: 36px;
  text-align: center;
  font-weight: bold;
  color: #FFE066;
}
.lb-col-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 6px;
}
.lb-col-score {
  width: 60px;
  text-align: right;
  font-weight: bold;
  color: #FFE066;
}
.lb-col-detail {
  width: 44px;
  text-align: right;
  color: rgba(255,255,255,0.7);
  font-size: 12px;
}
.lb-footer {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.lb-btn {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  color: #fff;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
}
.lb-btn.primary {
  background: #06D6A0;
  border-color: #06D6A0;
  color: #0B132B;
  font-weight: bold;
}
</style>
