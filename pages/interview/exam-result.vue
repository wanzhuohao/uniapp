<template>
  <view class="exam-result">
    <view class="score-card">
      <text class="score-label">综合评分</text>
      <text class="score-big">{{ session.avgScore || '-' }}</text>
      <text class="score-unit">/ 10</text>
      <view class="meta">
        <text>{{ session.totalQuestions }} 题</text>
        <text>用时 {{ formatDuration(session.totalDuration) }}</text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">AI 总评</view>
      <text class="summary-text">{{ session.summary }}</text>
    </view>

    <view class="section">
      <view class="section-title">逐题回顾</view>
      <view v-for="(record, index) in records" :key="record._id" class="record-item" @click="viewDetail(record._id)">
        <view class="record-header">
          <text class="record-index">第{{ index + 1 }}题</text>
          <text class="record-type">{{ record.question_type }}</text>
          <text class="record-score" :class="scoreClass(record.total_score)">
            {{ record.total_score || '-' }}分
          </text>
        </view>
        <text class="record-question">{{ record.question }}</text>
      </view>
    </view>

    <button class="btn-home" @click="goHome">返回首页</button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAuth } from '../../composables/common/useAuth'

const { getUsername } = useAuth()
const session = ref({})
const records = ref([])
const sessionId = ref('')

onLoad((options) => {
  sessionId.value = options.sessionId
})

onMounted(async () => {
  await loadSession()
})

async function loadSession() {
  if (!sessionId.value) return
  const db = uniCloud.database()
  try {
    // 加载考场记录
    const sRes = await db.collection('exam_sessions').doc(sessionId.value).get()
    const sData = sRes.result?.data || sRes.data || []
    if (sData.length > 0) {
      const s = sData[0]
      const currentUser = getUsername()
      if (s.username && currentUser && s.username !== currentUser) {
        uni.showToast({ title: '无权访问', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 800)
        return
      }
      session.value = {
        avgScore: s.avg_score,
        totalQuestions: s.total_questions,
        totalDuration: s.total_duration,
        summary: s.summary
      }

      // 加载各题记录
      for (const id of (s.record_ids || [])) {
        const rRes = await db.collection('interview_records').doc(id).get()
        const rData = rRes.result?.data || rRes.data || []
        if (rData.length > 0) {
          records.value.push(rData[0])
        }
      }
    }
  } catch (e) {
    console.error('加载考场记录失败', e)
  }
}

function formatDuration(seconds) {
  if (!seconds) return '-'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
}

function scoreClass(score) {
  if (!score) return ''
  if (score >= 8) return 'high'
  if (score >= 5) return 'mid'
  return 'low'
}

function viewDetail(id) {
  uni.navigateTo({ url: `/pages/interview/record-detail?id=${id}` })
}

function goHome() {
  uni.redirectTo({ url: '/pages/interview/index' })
}
</script>

<style scoped>
.exam-result { padding: 20rpx; min-height: 100vh; background: #f5f5f5; }
.score-card { background: linear-gradient(135deg, #007AFF, #00C6FF); border-radius: 16rpx; padding: 40rpx; text-align: center; color: #fff; margin-bottom: 20rpx; }
.score-label { font-size: 28rpx; opacity: 0.9; display: block; }
.score-big { font-size: 80rpx; font-weight: bold; }
.score-unit { font-size: 32rpx; opacity: 0.8; }
.meta { margin-top: 16rpx; font-size: 26rpx; opacity: 0.9; display: flex; gap: 30rpx; justify-content: center; }
.section { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; }
.summary-text { font-size: 28rpx; line-height: 1.8; color: #333; white-space: pre-wrap; }
.record-item { padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.record-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 8rpx; }
.record-index { font-size: 26rpx; font-weight: bold; }
.record-type { font-size: 24rpx; color: #999; }
.record-score { font-size: 28rpx; font-weight: bold; margin-left: auto; }
.record-score.high { color: #34C759; }
.record-score.mid { color: #FF9500; }
.record-score.low { color: #FF3B30; }
.record-question { font-size: 26rpx; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.btn-home { background: #007AFF; color: #fff; border: none; border-radius: 12rpx; margin-top: 20rpx; font-size: 30rpx; }
</style>
