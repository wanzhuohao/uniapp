<template>
  <view class="trend-chart">
    <view class="chart-title">{{ title }}</view>
    <canvas
      canvas-id="trendCanvas"
      id="trendCanvas"
      class="canvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
    />
    <view class="x-labels">
      <text v-for="(item, i) in data" :key="i" class="x-label">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  title: { type: String, default: '正确率趋势' },
  data: {
    type: Array,
    default: () => []
    // 每项: { label: '4/9', rate: 80 }  rate 为 null 表示无数据
  }
})

const canvasWidth = ref(300)
const canvasHeight = ref(160)

const padding = { top: 20, right: 20, bottom: 10, left: 35 }

function draw() {
  const ctx = uni.createCanvasContext('trendCanvas')
  if (!ctx || props.data.length === 0) return

  const w = canvasWidth.value
  const h = canvasHeight.value
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom

  ctx.clearRect(0, 0, w, h)

  // Y 轴标签
  ctx.setFontSize(10)
  ctx.setFillStyle('#999')
  const yLabels = [0, 25, 50, 75, 100]
  for (const val of yLabels) {
    const y = padding.top + chartH - (val / 100) * chartH
    ctx.fillText(`${val}%`, 2, y + 3)
    // 网格线
    ctx.setStrokeStyle('#f0f0f0')
    ctx.setLineWidth(0.5)
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(w - padding.right, y)
    ctx.stroke()
  }

  // 数据点
  const points = []
  const stepX = props.data.length > 1 ? chartW / (props.data.length - 1) : chartW / 2

  for (let i = 0; i < props.data.length; i++) {
    const item = props.data[i]
    if (item.rate !== null && item.rate !== undefined) {
      const x = padding.left + i * stepX
      const y = padding.top + chartH - (item.rate / 100) * chartH
      points.push({ x, y, rate: item.rate })
    }
  }

  if (points.length > 1) {
    // 折线
    ctx.setStrokeStyle('#667eea')
    ctx.setLineWidth(2)
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()
  }

  // 数据点圆圈
  for (const p of points) {
    ctx.setFillStyle('#667eea')
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI)
    ctx.fill()

    // 数值标签
    ctx.setFillStyle('#333')
    ctx.setFontSize(10)
    ctx.fillText(`${p.rate}%`, p.x - 12, p.y - 8)
  }

  ctx.draw()
}

onMounted(() => {
  // 获取容器宽度
  uni.getSystemInfo({
    success(info) {
      canvasWidth.value = info.windowWidth - 60 // 留边距
      nextTick(() => draw())
    }
  })
})

watch(() => props.data, () => {
  nextTick(() => draw())
}, { deep: true })
</script>

<style scoped>
.trend-chart {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
}

.chart-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.canvas {
  display: block;
}

.x-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 35px 0 35px;
}

.x-label {
  font-size: 20rpx;
  color: #999;
}
</style>
