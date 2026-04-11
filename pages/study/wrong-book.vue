<template>
  <view class="container">
    <TopBar title="错题本" />

    <!-- 统计概览 -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-num">{{ stats.pinyinCount }}</text>
        <text class="stat-label">拼音</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ stats.hanziCount }}</text>
        <text class="stat-label">汉字</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ stats.mathCount }}</text>
        <text class="stat-label">口算</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ stats.unmasteredCount }}</text>
        <text class="stat-label">待掌握</text>
      </view>
    </view>

    <!-- 正确率趋势 -->
    <view class="section" v-if="trendData.length > 0">
      <TrendChart :data="trendData" title="近 7 天正确率" />
    </view>

    <!-- 高频错字 TOP5 -->
    <view class="section" v-if="stats.top5 && stats.top5.length > 0">
      <text class="section-title">高频错字 TOP5</text>
      <view class="top5-list">
        <view class="top5-item" v-for="(item, i) in stats.top5" :key="item._id">
          <text class="top5-rank">{{ i + 1 }}</text>
          <text class="top5-char">{{ item.char }}</text>
          <text class="top5-type">{{ ({ pinyin: '拼音', hanzi: '汉字', stroke: '汉字', math: '口算' })[item.type] || item.type }}</text>
          <text class="top5-count">错 {{ item.wrongCount }} 次</text>
        </view>
      </view>
    </view>

    <!-- 筛选 -->
    <view class="filter-row">
      <text
        :class="['filter-btn', filter === '' && 'active']"
        @click="filter = ''"
      >全部</text>
      <text
        :class="['filter-btn', filter === 'pinyin' && 'active']"
        @click="filter = 'pinyin'"
      >拼音</text>
      <text
        :class="['filter-btn', filter === 'hanzi' && 'active']"
        @click="filter = 'hanzi'"
      >汉字</text>
      <text
        :class="['filter-btn', filter === 'math' && 'active']"
        @click="filter = 'math'"
      >口算</text>
    </view>

    <!-- 错题列表 -->
    <view class="wrong-list">
      <view
        v-for="item in filteredList"
        :key="item._id"
        :class="['wrong-item', item.mastered && 'mastered']"
      >
        <view :class="['wrong-char', item.type === 'math' && 'wrong-math']">{{ item.char }}</view>
        <view class="wrong-info">
          <text class="wrong-type">{{ ({ pinyin: '拼音', hanzi: '汉字', stroke: '汉字', math: '口算' })[item.type] || item.type }}</text>
          <text class="wrong-unit">{{ item.unit }}</text>
        </view>
        <view class="wrong-meta">
          <text class="wrong-count">错 {{ item.wrongCount }} 次</text>
          <text v-if="item.mastered" class="mastered-badge">已掌握</text>
        </view>
      </view>

      <view v-if="filteredList.length === 0" class="empty">
        <text>暂无错题记录</text>
      </view>
    </view>

    <!-- 重练按钮 -->
    <view class="bottom-bar" v-if="stats.unmasteredCount > 0">
      <button class="practice-btn" @click="goPractice">
        开始重练（{{ stats.unmasteredCount }} 题未掌握）
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuth } from '../../composables/common/useAuth.js'
import { getAllWrongList, getWrongStats } from '../../utils/study/wrongBook.js'
import { getRecentLogs } from '../../utils/study/practiceLog.js'
import TrendChart from '../../components/common/TrendChart.vue'
import TopBar from '../../components/common/TopBar.vue'

const { getUsername } = useAuth()

const stats = ref({
  total: 0,
  pinyinCount: 0,
  strokeCount: 0,
  unmasteredCount: 0,
  masteredCount: 0,
  top5: []
})
const wrongList = ref([])
const trendData = ref([])
const filter = ref('')
const loading = ref(true)

const filteredList = computed(() => {
  if (!filter.value) return wrongList.value
  // "hanzi" 筛选时兼容旧的 stroke 类型
  if (filter.value === 'hanzi') {
    return wrongList.value.filter(item => item.type === 'hanzi' || item.type === 'stroke')
  }
  return wrongList.value.filter(item => item.type === filter.value)
})

async function loadData() {
  loading.value = true
  const username = getUsername()
  if (!username) {
    loading.value = false
    return
  }

  try {
    const [statsData, listData, logsData] = await Promise.all([
      getWrongStats(username),
      getAllWrongList(username),
      getRecentLogs(username, 7)
    ])

    stats.value = statsData
    wrongList.value = listData
    trendData.value = logsData.map(d => ({
      label: d.label,
      rate: d.accuracy != null ? d.accuracy : d.rate
    }))
  } catch (e) {
    console.error('加载错题数据失败:', e)
  }
  loading.value = false
}

onShow(() => {
  loadData()
})


function goPractice() {
  uni.navigateTo({ url: '/pages/study/wrong-book-practice' })
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 120rpx;
}

.stats-row {
  display: flex;
  padding: 20rpx;
  gap: 16rpx;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 10rpx;
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
}

.section {
  margin: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.top5-list {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
}

.top5-item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.top5-item:last-child {
  border-bottom: none;
}

.top5-rank {
  width: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #ff6b6b;
  text-align: center;
}

.top5-char {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-left: 16rpx;
}

.top5-type {
  font-size: 22rpx;
  color: #999;
  margin-left: 12rpx;
}

.top5-count {
  margin-left: auto;
  font-size: 24rpx;
  color: #ff6b6b;
}

.filter-row {
  display: flex;
  padding: 20rpx;
  gap: 16rpx;
}

.filter-btn {
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background: #fff;
}

.filter-btn.active {
  background: #667eea;
  color: #fff;
}

.wrong-list {
  padding: 0 20rpx;
}

.wrong-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.wrong-item.mastered {
  opacity: 0.5;
}

.wrong-char {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  width: 80rpx;
  text-align: center;
  flex-shrink: 0;
}

/* 口算题表达式较长，不限制宽度，改为左对齐横排 */
.wrong-char.wrong-math {
  font-size: 32rpx;
  width: auto;
  min-width: 160rpx;
  max-width: 60%;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}

.wrong-info {
  flex: 1;
  margin-left: 20rpx;
}

.wrong-type {
  font-size: 26rpx;
  color: #666;
}

.wrong-unit {
  font-size: 22rpx;
  color: #999;
  margin-left: 12rpx;
}

.wrong-meta {
  text-align: right;
}

.wrong-count {
  font-size: 24rpx;
  color: #ff6b6b;
}

.mastered-badge {
  display: block;
  font-size: 20rpx;
  color: #52c41a;
  margin-top: 4rpx;
}

.empty {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.practice-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  font-size: 30rpx;
  padding: 24rpx 0;
}
</style>
