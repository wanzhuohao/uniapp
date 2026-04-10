<template>
  <view class="records">
    <!-- 统计概览 -->
    <view class="stats">
      <view class="stat-item">
        <text class="stat-value">{{ totalCount }}</text>
        <text class="stat-label">总练习</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ avgScoreDisplay }}</text>
        <text class="stat-label">平均分</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ todayCount }}</text>
        <text class="stat-label">今日</text>
      </view>
    </view>

    <!-- 题型筛选 -->
    <scroll-view scroll-x class="filter-bar">
      <view
        v-for="t in filterTypes"
        :key="t.value"
        class="filter-item"
        :class="{ active: currentFilter === t.value }"
        @click="currentFilter = t.value"
      >
        {{ t.label }}
      </view>
    </scroll-view>

    <!-- 记录列表 -->
    <view v-if="filteredRecords.length === 0" class="empty">
      <text>暂无练习记录</text>
    </view>
    <view v-for="record in filteredRecords" :key="record._id" class="record-card" @click="viewDetail(record._id)">
      <view class="record-top">
        <text class="record-type">{{ getTypeLabel(record.question_type) }}</text>
        <text class="record-mode">{{ record.mode === 'exam' ? '模拟' : '自由' }}</text>
        <text class="record-score" :class="scoreClass(record.total_score)">
          {{ record.total_score || '-' }}
        </text>
      </view>
      <text class="record-question">{{ record.question }}</text>
      <text class="record-time">{{ formatTime(record.create_time) }}</text>
    </view>

    <!-- 底部占位，防止内容被 tab bar 遮挡 -->
    <view style="height: 120rpx;"></view>

    <!-- 自定义底部导航 -->
    <view class="custom-tab-bar">
      <view class="tab-item" :class="{ active: currentTab === 'index' }" @click="goTab('/pages/interview/index')">
        <text class="tab-icon">📝</text>
        <text class="tab-label">练习</text>
      </view>
      <view class="tab-item" :class="{ active: currentTab === 'records' }" @click="goTab('/pages/interview/records')">
        <text class="tab-icon">📊</text>
        <text class="tab-label">记录</text>
      </view>
      <view class="tab-item" :class="{ active: currentTab === 'settings' }" @click="goTab('/pages/interview/settings')">
        <text class="tab-icon">⚙️</text>
        <text class="tab-label">设置</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { QUESTION_TYPES } from '../../utils/interview/constants'
import { useAuth } from '../../composables/common/useAuth'

const { getUsername } = useAuth()
const currentTab = 'records'
const allRecords = ref([])
const currentFilter = ref('all')

const filterTypes = [
  { value: 'all', label: '全部' },
  ...QUESTION_TYPES
]

const filteredRecords = computed(() => {
  if (currentFilter.value === 'all') return allRecords.value
  return allRecords.value.filter(r => r.question_type === currentFilter.value)
})

const totalCount = computed(() => allRecords.value.length)
const todayCount = computed(() => {
  const today = new Date().toDateString()
  return allRecords.value.filter(r => new Date(r.create_time).toDateString() === today).length
})
const avgScoreDisplay = computed(() => {
  const scores = allRecords.value.map(r => r.total_score).filter(s => s > 0)
  if (scores.length === 0) return '-'
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
})

onShow(() => {
  loadRecords()
})

async function loadRecords() {
  try {
    const username = getUsername()
    if (!username) return
    const db = uniCloud.database()
    const res = await db.collection('interview_records')
      .where({ username })
      .orderBy('create_time', 'desc')
      .limit(100)
      .get()
    allRecords.value = res.result.data
  } catch (e) {
    console.error('加载记录失败', e)
  }
}

function getTypeLabel(type) {
  const t = QUESTION_TYPES.find(q => q.value === type)
  return t ? t.label : type
}

function scoreClass(score) {
  if (!score) return ''
  if (score >= 8) return 'high'
  if (score >= 5) return 'mid'
  return 'low'
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const yearPart = d.getFullYear() === now.getFullYear() ? '' : `${d.getFullYear()}/`
  return `${yearPart}${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function viewDetail(id) {
  uni.navigateTo({ url: `/pages/interview/record-detail?id=${id}` })
}

function goTab(url) {
  uni.redirectTo({ url })
}
</script>

<style scoped>
.records { padding: 20rpx; min-height: 100vh; background: #f5f5f5; }
.stats { display: flex; background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.stat-item { flex: 1; text-align: center; }
.stat-value { font-size: 40rpx; font-weight: bold; color: #007AFF; display: block; }
.stat-label { font-size: 24rpx; color: #999; }
.filter-bar { white-space: nowrap; margin-bottom: 20rpx; }
.filter-item { display: inline-block; padding: 12rpx 24rpx; margin-right: 12rpx; border-radius: 24rpx; font-size: 26rpx; color: #666; background: #fff; }
.filter-item.active { color: #007AFF; background: rgba(0, 122, 255, 0.1); }
.empty { text-align: center; padding: 60rpx; color: #999; font-size: 28rpx; }
.record-card { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx; }
.record-top { display: flex; align-items: center; gap: 12rpx; margin-bottom: 8rpx; }
.record-type { font-size: 24rpx; color: #007AFF; background: rgba(0, 122, 255, 0.1); padding: 4rpx 12rpx; border-radius: 8rpx; }
.record-mode { font-size: 22rpx; color: #999; }
.record-score { margin-left: auto; font-size: 32rpx; font-weight: bold; }
.record-score.high { color: #34C759; }
.record-score.mid { color: #FF9500; }
.record-score.low { color: #FF3B30; }
.record-question { font-size: 28rpx; color: #333; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; }
.record-time { font-size: 22rpx; color: #ccc; margin-top: 8rpx; display: block; }

.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  box-shadow: 0 -2rpx 8rpx rgba(0,0,0,0.06);
  padding: 12rpx 0 20rpx;
  z-index: 100;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  color: #999;
}
.tab-item.active { color: #007AFF; }
.tab-icon { font-size: 40rpx; }
.tab-label { font-size: 22rpx; }
</style>
