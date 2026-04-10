<template>
  <view class="detail">
    <view class="section">
      <view class="type-tag">{{ getTypeLabel(record.question_type) }}</view>
      <text class="question">{{ record.question }}</text>
    </view>

    <view class="section">
      <view class="section-title">我的答案</view>
      <text class="answer-text">{{ record.answer }}</text>
      <text class="duration" v-if="record.duration">
        用时 {{ Math.floor(record.duration / 60) }}分{{ record.duration % 60 }}秒
      </text>
    </view>

    <view class="section" v-if="record.review">
      <view class="section-title">AI 点评</view>

      <view v-if="record.scores" class="scores">
        <view v-for="dim in scoreDimensions" :key="dim.key" class="score-row">
          <text class="dim-label">{{ dim.label }}</text>
          <view class="bar-bg">
            <view class="bar" :style="{ width: getScoreWidth(dim.key) }"></view>
          </view>
          <text class="dim-score">{{ getScore(dim.key) }}</text>
        </view>
      </view>

      <text class="total">综合评分：{{ record.total_score || '-' }} / 10</text>
      <text class="review-text">{{ record.review }}</text>
    </view>

    <view v-else class="section">
      <text class="no-review">暂无点评</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { QUESTION_TYPES, SCORE_DIMENSIONS } from '../../utils/interview/constants'
import { useAuth } from '../../composables/common/useAuth'

const { getUsername } = useAuth()
const record = ref({})
const scoreDimensions = SCORE_DIMENSIONS
let recordId = ''

onLoad((options) => {
  recordId = options.id
})

onMounted(async () => {
  if (!recordId) return
  const db = uniCloud.database()
  try {
    const res = await db.collection('interview_records').doc(recordId).get()
    const data = res.result?.data || res.data || []
    if (data.length > 0) {
      const item = data[0]
      const currentUser = getUsername()
      if (item.username && currentUser && item.username !== currentUser) {
        uni.showToast({ title: '无权访问', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 800)
        return
      }
      record.value = item
    }
  } catch (e) {
    console.error('加载记录失败', e)
  }
})

function getTypeLabel(type) {
  const t = QUESTION_TYPES.find(q => q.value === type)
  return t ? t.label : type
}

function getScore(key) {
  const s = record.value.scores && record.value.scores[key]
  if (!s) return '-'
  return typeof s === 'object' ? s.score : s
}

function getScoreWidth(key) {
  const score = getScore(key)
  return score === '-' ? '0%' : `${score * 10}%`
}
</script>

<style scoped>
.detail { padding: 20rpx; min-height: 100vh; background: #f5f5f5; }
.section { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; }
.type-tag { display: inline-block; background: #007AFF; color: #fff; padding: 6rpx 16rpx; border-radius: 20rpx; font-size: 24rpx; margin-bottom: 12rpx; }
.question { font-size: 32rpx; line-height: 1.6; display: block; }
.answer-text { font-size: 28rpx; line-height: 1.8; color: #333; white-space: pre-wrap; display: block; }
.duration { font-size: 24rpx; color: #999; margin-top: 12rpx; display: block; }
.scores { margin-bottom: 20rpx; }
.score-row { display: flex; align-items: center; margin-bottom: 12rpx; }
.dim-label { width: 140rpx; font-size: 26rpx; color: #666; }
.bar-bg { flex: 1; height: 16rpx; background: #f0f0f0; border-radius: 8rpx; overflow: hidden; }
.bar { height: 100%; background: #007AFF; border-radius: 8rpx; }
.dim-score { width: 60rpx; text-align: right; font-size: 26rpx; font-weight: bold; }
.total { font-size: 30rpx; font-weight: bold; color: #007AFF; margin-bottom: 16rpx; display: block; }
.review-text { font-size: 28rpx; line-height: 1.8; color: #333; white-space: pre-wrap; display: block; }
.no-review { color: #999; font-size: 28rpx; text-align: center; }
</style>
