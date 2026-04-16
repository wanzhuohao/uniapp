<template>
  <view class="container">
    <view class="header">
      <text class="title">我的工具箱</text>
      <text class="username" @click="openSwitcher">{{ username || '未设置' }}</text>
    </view>

    <view class="cards">
      <view class="card card-stele" @click="goTo('/pages/stele/list')">
        <text class="card-icon">📝</text>
        <text class="card-title">碑文排版</text>
        <text class="card-desc">订单管理与排版预览</text>
      </view>

      <view class="card card-study" @click="goTo('/pages/study/index')">
        <text class="card-icon">📚</text>
        <text class="card-title">语文练习</text>
        <text class="card-desc">拼音、汉字、错题本</text>
      </view>

    </view>
    <UserSwitcher
      :visible="showSwitcher"
      @close="showSwitcher = false"
      @switch-to="doSwitch"
      @add-new="onAddNew"
    />
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuth } from '../../composables/common/useAuth.js'
import { useGameStore } from '../../store/game.js'
import UserSwitcher from '../../components/common/UserSwitcher.vue'
import { useRecentUsers } from '../../composables/common/useRecentUsers.js'
import { toast } from '../../utils/common/toast.js'

const { getUsername, setUsername } = useAuth()
const store = useGameStore()
const { addRecentUser } = useRecentUsers()
const username = ref(getUsername())
const showSwitcher = ref(false)
const switching = ref(false)

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

function openSwitcher() {
  if (switching.value) return
  showSwitcher.value = true
}

async function doSwitch(name) {
  if (switching.value) return
  switching.value = true
  setUsername(name)
  addRecentUser(name)
  username.value = name
  showSwitcher.value = false

  try {
    await store.switchUser()
  } catch (e) {
    toast.error('云端加载失败，使用默认数据', 1500)
  }

  uni.$emit('username-changed', name)
  toast.success('已切换到 ' + name, 1200)
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/index/index' })
  }, 1200)
}

function onAddNew() {
  showSwitcher.value = false
  uni.showModal({
    title: '添加新用户',
    content: '',
    editable: true,
    placeholderText: '输入新用户名',
    showCancel: true,
    async success(res) {
      const newName = (res.content || '').trim()
      if (!res.confirm || !newName) return
      if (newName === username.value) return
      await doSwitch(newName)
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
.card.disabled {
  opacity: 0.5;
  filter: grayscale(0.6);
}
.card.disabled:active {
  transform: none;
  opacity: 0.5;
}
</style>
