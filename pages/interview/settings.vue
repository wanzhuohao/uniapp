<template>
  <view class="settings">
    <view class="section">
      <view class="section-title">DeepSeek API Key</view>
      <view class="input-group">
        <input
          v-model="apiKey"
          type="text"
          :password="!showKey"
          placeholder="请输入 API Key"
          class="input"
        />
        <text class="toggle" @click="showKey = !showKey">
          {{ showKey ? '隐藏' : '显示' }}
        </text>
      </view>
      <button class="btn-primary" @click="saveApiKey" :loading="saving">
        保存
      </button>
      <text class="hint">
        前往 platform.deepseek.com 获取 API Key
      </text>
    </view>

    <view class="section">
      <view class="section-title">模拟考场默认参数</view>
      <view class="form-item">
        <text class="label">题目数量</text>
        <picker :range="questionCountOptions" :value="questionCountIndex" @change="onCountChange">
          <view class="picker-value">{{ examConfig.questionCount }} 题</view>
        </picker>
      </view>
      <view class="form-item">
        <text class="label">每题限时</text>
        <picker :range="timeOptions" :value="timeIndex" @change="onTimeChange">
          <view class="picker-value">{{ examConfig.timePerQuestion / 60 }} 分钟</view>
        </picker>
      </view>
      <button class="btn-primary" @click="saveExamConfig" :loading="saving">
        保存
      </button>
    </view>

    <view class="section">
      <button class="btn-danger" @click="clearData">清除所有数据</button>
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
import { ref, computed, onMounted } from 'vue'
import { DEFAULT_EXAM_CONFIG } from '../../utils/interview/constants'
import { useAuth } from '../../composables/common/useAuth'

const { getUsername } = useAuth()
const currentTab = 'settings'
const db = uniCloud.database()

const apiKey = ref('')
const showKey = ref(false)
const saving = ref(false)
const settingsId = ref('')

const examConfig = ref({ ...DEFAULT_EXAM_CONFIG })

const questionCountOptions = ['2', '3', '4', '5', '6']
const questionCountIndex = computed(() =>
  questionCountOptions.indexOf(String(examConfig.value.questionCount))
)

const timeOptions = ['3 分钟', '5 分钟', '8 分钟', '10 分钟']
const timeValues = [180, 300, 480, 600]
const timeIndex = computed(() =>
  timeValues.indexOf(examConfig.value.timePerQuestion)
)

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  try {
    const username = getUsername()
    if (!username) return
    const res = await db.collection('interview_settings').where({ username }).limit(1).get()
    if (res.result.data.length > 0) {
      const s = res.result.data[0]
      settingsId.value = s._id
      apiKey.value = s.api_key || ''
      examConfig.value.questionCount = s.exam_question_count || DEFAULT_EXAM_CONFIG.questionCount
      examConfig.value.timePerQuestion = s.exam_time_per_question || DEFAULT_EXAM_CONFIG.timePerQuestion
    }
  } catch (e) {
    console.error('加载设置失败', e)
  }
}

async function saveApiKey() {
  if (!apiKey.value.trim()) {
    uni.showToast({ title: '请输入 API Key', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const data = { api_key: apiKey.value.trim() }
    if (settingsId.value) {
      await db.collection('interview_settings').doc(settingsId.value).update(data)
    } else {
      const res = await db.collection('interview_settings').add({
        ...data,
        username: getUsername(),
        exam_question_count: examConfig.value.questionCount,
        exam_time_per_question: examConfig.value.timePerQuestion
      })
      settingsId.value = res.result.id
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

async function saveExamConfig() {
  saving.value = true
  try {
    const data = {
      exam_question_count: examConfig.value.questionCount,
      exam_time_per_question: examConfig.value.timePerQuestion
    }
    if (settingsId.value) {
      await db.collection('interview_settings').doc(settingsId.value).update(data)
    } else {
      const res = await db.collection('interview_settings').add({
        ...data,
        username: getUsername(),
        api_key: ''
      })
      settingsId.value = res.result.id
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function onCountChange(e) {
  examConfig.value.questionCount = Number(questionCountOptions[e.detail.value])
}

function onTimeChange(e) {
  examConfig.value.timePerQuestion = timeValues[e.detail.value]
}

function clearData() {
  uni.showModal({
    title: '确认清除',
    content: '将删除所有练习记录和题库缓存，API Key 保留。确定要清除吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '暂不支持，请联系开发者', icon: 'none' })
      }
    }
  })
}

function goTab(url) {
  uni.redirectTo({ url })
}
</script>

<style scoped>
.settings { padding: 20rpx; }
.section { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: bold; margin-bottom: 20rpx; }
.input-group { display: flex; align-items: center; margin-bottom: 20rpx; }
.input { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 16rpx; font-size: 28rpx; }
.toggle { color: #007AFF; font-size: 26rpx; margin-left: 16rpx; }
.hint { font-size: 24rpx; color: #999; margin-top: 16rpx; display: block; }
.form-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.label { font-size: 28rpx; }
.picker-value { font-size: 28rpx; color: #007AFF; }
.btn-primary { background: #007AFF; color: #fff; border: none; border-radius: 8rpx; margin-top: 20rpx; font-size: 28rpx; }
.btn-danger { background: #fff; color: #FF3B30; border: 1rpx solid #FF3B30; border-radius: 8rpx; font-size: 28rpx; }

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
