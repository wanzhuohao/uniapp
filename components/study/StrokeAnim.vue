<template>
  <view class="stroke-anim">
    <!-- HanziWriter 渲染容器 -->
    <view class="writer-wrap">
      <view :id="writerId" class="writer-target"></view>
    </view>
    <text v-if="loading" class="loading-text">加载中...</text>
    <text v-if="error" class="error-text">{{ error }}</text>
  </view>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import HanziWriter from 'hanzi-writer'
import { isDark } from '../../utils/common/theme.js'

const props = defineProps({
  char: String,
  autoPlay: { type: Boolean, default: true },
})

const emit = defineEmits(['complete'])

const writerId = ref('writer-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6))
const loading = ref(false)
const error = ref('')
let writer = null

async function initWriter() {
  await nextTick()
  const el = document.getElementById(writerId.value)
  if (!el) return

  // 清理旧实例
  el.innerHTML = ''
  writer = null
  loading.value = true
  error.value = ''

  try {
    const dark = isDark()
    writer = HanziWriter.create(writerId.value, props.char, {
      width: 200,
      height: 200,
      padding: 10,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 400,
      strokeColor: dark ? '#e0e0e0' : '#333',
      radicalColor: dark ? '#80cbc4' : '#168F16',
      outlineColor: dark ? '#555' : '#DDD',
      drawingColor: dark ? '#90caf9' : '#42A5F5',
      showOutline: true,
      showCharacter: false,
    })
    loading.value = false

    if (props.autoPlay) {
      writer.animateCharacter({
        onComplete: () => {
          emit('complete')
        }
      })
    }
  } catch (e) {
    loading.value = false
    error.value = '字符加载失败'
    console.error('HanziWriter error:', e)
    // 降级：3 秒后通知完成
    setTimeout(() => emit('complete'), 3000)
  }
}

onMounted(() => {
  initWriter()
})

watch(() => props.char, () => {
  initWriter()
})
</script>

<style scoped>
.stroke-anim {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx;
}
.writer-wrap {
  width: 400rpx;
  height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.writer-target {
  width: 200px;
  height: 200px;
}
.loading-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: var(--color-text-light);
}
.error-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: var(--color-danger);
}
</style>
