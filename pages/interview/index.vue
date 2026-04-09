<template>
  <view class="home">
    <view class="header">
      <text class="title">结构化面试练习</text>
      <text class="subtitle">公务员 / 事业单位</text>
    </view>

    <!-- 题型选择 -->
    <view class="section">
      <view class="section-title">选择题型</view>
      <view class="type-grid">
        <view
          v-for="t in allTypes"
          :key="t.value"
          class="type-item"
          :class="{ active: selectedType === t.value }"
          @click="selectedType = t.value"
        >
          <text>{{ t.label }}</text>
        </view>
      </view>
    </view>

    <!-- 自由练习 -->
    <view class="section">
      <button class="btn-primary btn-large" @click="startFree" :loading="loading">
        自由练习
      </button>
      <text class="hint">不限时 · 不限题数 · 每题独立点评</text>
    </view>

    <!-- 模拟考场 -->
    <view class="section">
      <view class="exam-config">
        <view class="config-row">
          <text>题目数量</text>
          <text class="config-value">{{ examConfig.questionCount }} 题</text>
        </view>
        <view class="config-row">
          <text>每题限时</text>
          <text class="config-value">{{ examConfig.timePerQuestion / 60 }} 分钟</text>
        </view>
        <text class="config-link" @click="goSettings">修改参数 ></text>
      </view>
      <button class="btn-exam btn-large" @click="startExam" :loading="loading">
        模拟考场
      </button>
      <text class="hint">限时作答 · 答完统一点评 · 模拟真实考场</text>
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
import { ref, onMounted } from 'vue'
import { QUESTION_TYPES, DEFAULT_EXAM_CONFIG, PRACTICE_MODES } from '../../utils/interview/constants'
import { useAuth } from '../../composables/common/useAuth'

const { getUsername } = useAuth()
const currentTab = 'index'

const allTypes = [
  { value: 'random', label: '随机' },
  ...QUESTION_TYPES
]

const selectedType = ref('random')
const loading = ref(false)
const examConfig = ref({ ...DEFAULT_EXAM_CONFIG })

onMounted(async () => {
  await loadExamConfig()
  await checkApiKey()
})

async function loadExamConfig() {
  try {
    const db = uniCloud.database()
    const res = await db.collection('interview_settings').limit(1).get()
    if (res.result.data.length > 0) {
      const s = res.result.data[0]
      if (s.exam_question_count) examConfig.value.questionCount = s.exam_question_count
      if (s.exam_time_per_question) examConfig.value.timePerQuestion = s.exam_time_per_question
    }
  } catch (e) {
    console.error('加载考场配置失败', e)
  }
}

async function checkApiKey() {
  try {
    const db = uniCloud.database()
    const res = await db.collection('interview_settings').limit(1).get()
    if (!res.result.data.length || !res.result.data[0].api_key) {
      uni.showModal({
        title: '欢迎使用',
        content: '请先在设置页配置 DeepSeek API Key 后开始练习',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) goSettings()
        }
      })
    }
  } catch (e) {
    console.error('检查 API Key 失败', e)
  }
}

async function startFree() {
  loading.value = true
  uni.showLoading({ title: '正在出题...' })
  try {
    const res = await uniCloud.callFunction({
      name: 'generate-question',
      data: { username: getUsername(), type: selectedType.value, count: 1 }
    })
    if (res.result.code !== 0) {
      uni.showToast({ title: res.result.msg, icon: 'none' })
      if (res.result.code === -1) goSettings()
      return
    }
    uni.navigateTo({
      url: `/pages/interview/practice?mode=${PRACTICE_MODES.FREE}&type=${selectedType.value}&questionId=${res.result.data[0]._id}&question=${encodeURIComponent(res.result.data[0].content)}&typeLabel=${encodeURIComponent(res.result.data[0].typeLabel)}`
    })
  } catch (e) {
    uni.showToast({ title: '出题失败，请检查网络', icon: 'none' })
  } finally {
    loading.value = false
    uni.hideLoading()
  }
}

async function startExam() {
  loading.value = true
  uni.showLoading({ title: '正在出题...' })
  try {
    const res = await uniCloud.callFunction({
      name: 'generate-question',
      data: { username: getUsername(), type: selectedType.value, count: examConfig.value.questionCount }
    })
    if (res.result.code !== 0) {
      uni.showToast({ title: res.result.msg, icon: 'none' })
      if (res.result.code === -1) goSettings()
      return
    }
    // 考场模式通过事件传递题目数据（避免 URL 过长）
    uni.$emit('examQuestions', {
      questions: res.result.data,
      timePerQuestion: examConfig.value.timePerQuestion
    })
    uni.navigateTo({
      url: `/pages/interview/practice?mode=${PRACTICE_MODES.EXAM}`
    })
  } catch (e) {
    uni.showToast({ title: '出题失败，请检查网络', icon: 'none' })
  } finally {
    loading.value = false
    uni.hideLoading()
  }
}

function goSettings() {
  uni.navigateTo({ url: '/pages/interview/settings' })
}

function goTab(url) {
  uni.redirectTo({ url })
}
</script>

<style scoped>
.home { padding: 20rpx; }
.header { text-align: center; padding: 40rpx 0 20rpx; }
.title { font-size: 44rpx; font-weight: bold; display: block; }
.subtitle { font-size: 28rpx; color: #999; margin-top: 8rpx; display: block; }
.section { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 20rpx; }
.type-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.type-item {
  padding: 16rpx 28rpx; border: 1rpx solid #ddd; border-radius: 32rpx;
  font-size: 26rpx; color: #666;
}
.type-item.active { border-color: #007AFF; color: #007AFF; background: rgba(0, 122, 255, 0.05); }
.btn-large { height: 88rpx; line-height: 88rpx; font-size: 32rpx; }
.btn-primary { background: #007AFF; color: #fff; border: none; border-radius: 12rpx; }
.btn-exam { background: #FF9500; color: #fff; border: none; border-radius: 12rpx; }
.hint { font-size: 24rpx; color: #999; text-align: center; margin-top: 12rpx; display: block; }
.exam-config { margin-bottom: 20rpx; }
.config-row { display: flex; justify-content: space-between; padding: 12rpx 0; font-size: 28rpx; }
.config-value { color: #007AFF; }
.config-link { font-size: 24rpx; color: #007AFF; display: block; text-align: right; margin-top: 8rpx; }

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
