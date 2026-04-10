<template>
  <view class="container">
    <view class="header">
      <text class="title">我的工具箱</text>
      <text class="username" @click="editUsername">{{ username || '未设置' }}</text>
    </view>

    <view class="cards">
      <view class="card card-stele" @click="goTo('/pages/stele/list')">
        <text class="card-icon">📝</text>
        <text class="card-title">碑文排版</text>
        <text class="card-desc">订单管理与排版预览</text>
      </view>

      <view class="card card-study" @click="goTo('/pages/study/index')">
        <text class="card-icon">📚</text>
        <text class="card-title">学习小天地</text>
        <text class="card-desc">拼音、汉字、口算练习</text>
      </view>

      <view class="card card-interview" @click="goTo('/pages/interview/index')">
        <text class="card-icon">🎤</text>
        <text class="card-title">面试助手</text>
        <text class="card-desc">公务员结构化面试练习</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuth } from '../../composables/common/useAuth.js'
import { useGameStore } from '../../store/game.js'

const { getUsername, setUsername } = useAuth()
const store = useGameStore()
const username = ref(getUsername())

onShow(() => {
  username.value = getUsername()
})

// 监听 App.vue 首次设置用户名事件
const onUsernameChanged = (name) => { username.value = name }
onMounted(() => {
  uni.$on('username-changed', onUsernameChanged)
})
onUnmounted(() => {
  uni.$off('username-changed', onUsernameChanged)
})

function goTo(url) {
  uni.navigateTo({ url })
}

function editUsername() {
  uni.showModal({
    title: '修改用户名',
    content: '',
    editable: true,
    placeholderText: '当前：' + (username.value || '未设置'),
    async success(res) {
      const newName = (res.content || '').trim()
      if (!res.confirm || !newName) return
      if (newName === username.value) return
      setUsername(newName)
      username.value = newName
      // 切换用户：重置 store 状态并从新用户云端拉取
      await store.switchUser()
      uni.showToast({ title: '已切换到 ' + newName, icon: 'success' })
    }
  })
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 10rpx 40rpx;
}
.title {
  font-size: 42rpx;
  font-weight: bold;
  color: #fff;
}
.username {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 24rpx;
  border-radius: 30rpx;
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  margin-top: 20rpx;
}
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.card:active {
  transform: scale(0.98);
  opacity: 0.9;
}
.card-icon {
  font-size: 56rpx;
}
.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
.card-desc {
  font-size: 26rpx;
  color: #888;
}
.card-stele { border-left: 8rpx solid #96700A; }
.card-study { border-left: 8rpx solid #66BB6A; }
.card-interview { border-left: 8rpx solid #007AFF; }
</style>
