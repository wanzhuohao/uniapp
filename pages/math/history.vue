<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <text class="header-title">练习记录</text>
    </view>

    <!-- Tab Bar -->
    <view class="tab-row">
      <text
        v-for="(tab, i) in tabs"
        :key="i"
        :class="['tab-btn', activeTab === tab.value && 'active']"
        @click="switchTab(tab.value)"
      >{{ tab.label }}</text>
    </view>

    <!-- Record List -->
    <scroll-view scroll-y class="record-list">
      <view v-if="filteredList.length === 0" class="empty">
        <text class="empty-text">暂无记录</text>
      </view>

      <view
        v-for="(record, index) in filteredList"
        :key="record.id"
        class="record-card"
      >
        <!-- Card Header (clickable) -->
        <view class="card-header" @click="toggleExpand(index)">
          <view class="card-header-left">
            <!-- Type Badge -->
            <text
              :class="['type-badge', record.type === 'online' ? 'badge-online' : 'badge-print']"
            >{{ record.type === 'online' ? '在线' : '打印' }}</text>

            <!-- Difficulty -->
            <text class="difficulty-name">{{ getLevelName(record.level) }}</text>

            <!-- Question Count -->
            <text class="question-count">{{ record.questions ? record.questions.length : 0 }} 题</text>
          </view>

          <view class="card-header-right">
            <view class="card-meta">
              <!-- Online: accuracy + time -->
              <view v-if="record.type === 'online'" class="meta-row">
                <text class="accuracy-text">{{ getAccuracy(record) }}%</text>
                <text class="time-text">{{ formatTime(record.duration) }}</text>
              </view>
              <!-- Print: label -->
              <view v-else class="meta-row">
                <text class="print-label">打印练习</text>
              </view>
              <text class="date-text">{{ formatDate(record.createdAt) }}</text>
            </view>
            <text class="expand-arrow">{{ expandedIndex === index ? '▼' : '▶' }}</text>
          </view>
        </view>

        <!-- Expanded Detail: 4-column grid like print sheet -->
        <view v-if="expandedIndex === index" class="card-detail">
          <view class="detail-grid">
            <view
              v-for="(q, qi) in record.questions"
              :key="qi"
              :class="['grid-item', record.type === 'online' && isWrong(record, qi) && 'grid-item-wrong']"
            >
              <text class="grid-expr">{{ q.expr }} = </text>
              <text class="grid-answer">{{ q.answer }}</text>
              <text v-if="record.type === 'online' && isWrong(record, qi)" class="grid-user">
                ({{ getUserAnswer(record, qi) || '未填' }})
              </text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getHistory } from '../../utils/math/mathStorage.js'
import { LEVEL_CONFIG } from '../../utils/math/questionEngine.js'

const tabs = [
  { label: '全部', value: 'all' },
  { label: '在线', value: 'online' },
  { label: '打印', value: 'print' },
]

const activeTab = ref('all')
const expandedIndex = ref(-1)
const records = ref([])

function switchTab(value) {
  activeTab.value = value
  expandedIndex.value = -1
}

function toggleExpand(index) {
  expandedIndex.value = expandedIndex.value === index ? -1 : index
}

const filteredList = computed(() => {
  if (activeTab.value === 'all') return records.value
  return records.value.filter(r => r.type === activeTab.value)
})

function getLevelName(level) {
  if (level === 'mix') return '混合'
  const cfg = LEVEL_CONFIG[level]
  return cfg ? cfg.name : String(level)
}

function getAccuracy(record) {
  if (!record.answers || !record.questions) return 0
  const total = record.questions.length
  if (total === 0) return 0
  const correct = record.questions.filter((q, i) => {
    const ua = record.answers[i]
    return ua != null && String(ua).trim() === String(q.answer).trim()
  }).length
  return Math.round((correct / total) * 100)
}

function getUserAnswer(record, index) {
  if (!record.answers) return ''
  return record.answers[index] != null ? String(record.answers[index]) : ''
}

function isCorrect(record, index) {
  if (!record.questions || !record.answers) return false
  const q = record.questions[index]
  const ua = record.answers[index]
  return ua != null && String(ua).trim() === String(q.answer).trim()
}

function isWrong(record, index) {
  if (!record.questions || !record.answers) return false
  const ua = record.answers[index]
  if (ua == null || String(ua).trim() === '') return false
  return !isCorrect(record, index)
}

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const M = d.getMonth() + 1
  const D = d.getDate()
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${M}/${D} ${HH}:${mm}`
}

onShow(() => {
  records.value = getHistory()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background: #42A5F5;
  padding: 40rpx 30rpx 24rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

/* Tab Bar */
.tab-row {
  display: flex;
  padding: 20rpx 20rpx 12rpx;
  gap: 16rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-btn {
  padding: 12rpx 36rpx;
  border-radius: 32rpx;
  font-size: 28rpx;
  color: #666;
  background: #f5f7fa;
  font-weight: 500;
}

.tab-btn.active {
  background: #42A5F5;
  color: #fff;
  font-weight: bold;
}

/* Record List */
.record-list {
  flex: 1;
  padding: 20rpx;
}

/* Empty State */
.empty {
  text-align: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: 30rpx;
  color: #bbb;
}

/* Record Card */
.record-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex: 1;
}

.card-header-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

/* Type Badge */
.type-badge {
  font-size: 22rpx;
  font-weight: bold;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
  color: #fff;
}

.badge-online {
  background: #4CAF50;
}

.badge-print {
  background: #9E9E9E;
}

/* Difficulty + Count */
.difficulty-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.question-count {
  font-size: 26rpx;
  color: #888;
}

/* Meta */
.card-meta {
  text-align: right;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  margin-bottom: 4rpx;
}

.accuracy-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #42A5F5;
}

.time-text {
  font-size: 24rpx;
  color: #888;
}

.print-label {
  font-size: 24rpx;
  color: #9E9E9E;
}

.date-text {
  font-size: 22rpx;
  color: #bbb;
}

/* Expand Arrow */
.expand-arrow {
  font-size: 24rpx;
  color: #aaa;
  margin-left: 8rpx;
}

/* Card Detail */
.card-detail {
  border-top: 1rpx solid #f0f0f0;
  padding: 16rpx 20rpx;
  background: #fafafa;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4rpx 8rpx;
  font-size: 24rpx;
  line-height: 1.8;
}

.grid-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
}

.grid-item-wrong {
  background: #fff3f3;
}

.grid-expr {
  color: #333;
  font-family: monospace;
}

.grid-answer {
  font-weight: bold;
  color: #E53935;
  font-family: monospace;
}

.grid-user {
  font-size: 20rpx;
  color: #E53935;
}

/* Dark Mode */
:global(html body.dark-mode) .container {
  background: #1a1a2e;
}

:global(html body.dark-mode) .tab-row {
  background: #16213e;
  border-bottom-color: #2a2a4a;
}

:global(html body.dark-mode) .tab-btn {
  background: #0f3460;
  color: #aaa;
}

:global(html body.dark-mode) .tab-btn.active {
  background: #42A5F5;
  color: #fff;
}

:global(html body.dark-mode) .record-card {
  background: #16213e;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.3);
}

:global(html body.dark-mode) .difficulty-name {
  color: #e0e0e0;
}

:global(html body.dark-mode) .card-detail {
  background: #0f3460;
  border-top-color: #2a2a4a;
}

:global(html body.dark-mode) .grid-item {
  color: #ccc;
}

:global(html body.dark-mode) .grid-item-wrong {
  background: #3a1a1a;
}

:global(html body.dark-mode) .grid-expr {
  color: #ccc;
}

:global(html body.dark-mode) .empty-text {
  color: #555;
}

:global(html body.dark-mode) .date-text,
:global(html body.dark-mode) .time-text,
:global(html body.dark-mode) .print-label {
  color: #888;
}

:global(html body.dark-mode) .expand-arrow {
  color: #888;
}

:global(html body.dark-mode) .question-count,
:global(html body.dark-mode) .accuracy-text {
  color: #bbb;
}

:global(html body.dark-mode) .card-header {
  border-bottom-color: #2a2a4a;
}
</style>
