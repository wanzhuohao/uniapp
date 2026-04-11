<template>
  <view v-if="visible" class="us-mask" @click.self="$emit('close')">
    <view class="us-card">
      <view class="us-header">
        <text class="us-title">选择用户</text>
        <view class="us-close" @click="$emit('close')">✕</view>
      </view>

      <view class="us-list">
        <view
          v-for="name in recent"
          :key="name"
          class="us-item"
          :class="{ current: name === currentUser }"
        >
          <view class="us-item-main" @click="handlePick(name)">
            <text v-if="name === currentUser" class="us-check">✓</text>
            <text class="us-name">{{ name }}</text>
            <text v-if="name === currentUser" class="us-badge">当前</text>
          </view>
          <view
            v-if="name !== currentUser"
            class="us-remove"
            @click.stop="handleRemove(name)"
          >✕</view>
        </view>

        <view v-if="recent.length === 0" class="us-empty">
          <text>还没有用过其他用户</text>
        </view>
      </view>

      <view class="us-add-btn" @click="$emit('add-new')">+ 添加新用户</view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRecentUsers } from '../../composables/common/useRecentUsers.js'
import { useAuth } from '../../composables/common/useAuth.js'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'switch-to', 'add-new'])

const { getRecentUsers, removeRecentUser } = useRecentUsers()
const { getUsername } = useAuth()

const recent = ref([])
const currentUser = ref('')

function refresh() {
  const list = getRecentUsers()
  const cur = getUsername()
  currentUser.value = cur
  // 兜底：当前用户不在 localStorage 时，在 UI 层插入顶部展示
  if (cur && !list.includes(cur)) {
    recent.value = [cur, ...list]
  } else {
    recent.value = list
  }
}

watch(() => props.visible, (v) => {
  if (v) refresh()
})

function handlePick(name) {
  // 点当前用户等于取消切换 → 关闭模态
  if (name === currentUser.value) {
    emit('close')
    return
  }
  emit('switch-to', name)
}

function handleRemove(name) {
  // 双重防护：不允许删除当前用户
  if (name === currentUser.value) return
  removeRecentUser(name)
  refresh()
}
</script>

<style scoped>
.us-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.us-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  width: 600rpx;
  max-width: 90vw;
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.us-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.us-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.us-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f0f0;
  font-size: 28rpx;
  color: #666;
}
.us-close:active { transform: scale(0.9); }

.us-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.us-item {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  border: 3rpx solid transparent;
  transition: all 0.2s;
}

.us-item.current {
  background: #FFF8E1;
  border-color: #FFB300;
}

.us-item-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.us-item-main:active { transform: scale(0.98); }

.us-check {
  color: #4CAF50;
  font-size: 32rpx;
  font-weight: bold;
}

.us-name {
  flex: 1;
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

.us-badge {
  font-size: 22rpx;
  color: #FF8F00;
  background: #FFE0B2;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.us-remove {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ffebee;
  color: #c62828;
  font-size: 24rpx;
  margin-left: 12rpx;
}
.us-remove:active { transform: scale(0.9); }

.us-empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}

.us-add-btn {
  margin-top: 8rpx;
  padding: 24rpx;
  text-align: center;
  background: linear-gradient(135deg, #FFA726, #F57C00);
  color: #fff;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 16rpx rgba(255, 167, 38, 0.3);
}
.us-add-btn:active { transform: scale(0.97); }
</style>
