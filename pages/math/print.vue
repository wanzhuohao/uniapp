<template>
  <view class="print-page">
    <!-- Phase 1: Setup panel -->
    <view v-if="!questions.length" class="setup-panel">
      <view class="header">
        <text class="back-btn" @click="goBack">←</text>
        <text class="title">打印出题</text>
      </view>

      <view class="config-card">
        <text class="config-label">选择难度</text>
        <view class="level-tabs">
          <view
            v-for="opt in levelOptions"
            :key="opt.value"
            class="level-tab"
            :class="{ active: selectedLevel === opt.value }"
            @click="selectedLevel = opt.value"
          >
            {{ opt.label }}
          </view>
        </view>

        <text class="config-label">包含连加减</text>
        <view class="chain-toggle" @click="includeChain = !includeChain">
          <view class="toggle-track" :class="{ on: includeChain }">
            <view class="toggle-thumb" />
          </view>
          <text class="toggle-label">{{ includeChain ? '是（如 3+5+2）' : '否（只出加减法）' }}</text>
        </view>

        <view class="info-row">
          <text class="info-text">固定 100 题，纯计算</text>
        </view>

        <button class="gen-btn" @click="generateSheet">生成试卷</button>
      </view>
    </view>

    <!-- Phase 2: Preview + Actions -->
    <view v-else class="preview-panel">
      <!-- Action bar (no-print) -->
      <view class="action-bar no-print">
        <button class="action-btn btn-print" @click="handlePrint">打印试卷</button>
        <button class="action-btn btn-export" @click="exportAnswerImage">导出答案图片</button>
        <button class="action-btn btn-regen" @click="regenerate">重新生成</button>
        <button class="action-btn btn-back" @click="goBack">返回</button>
      </view>

      <!-- Trial sheet -->
      <div id="printArea" class="a4-sheet print-page">
        <div class="sheet-body">
          <div
            v-for="(q, i) in questions"
            :key="i"
            class="question-item"
          >
            {{ q.expr }} =
          </div>
        </div>
      </div>

      <!-- Answer sheet (hidden by default, shown only for export) -->
      <div
        id="answerArea"
        class="a4-sheet answer-sheet no-print"
        :style="{ display: showAnswerSheet ? 'block' : 'none' }"
      >
        <div class="sheet-header">
          <div class="sheet-title">数学练习 — 答案</div>
          <div class="sheet-info-row">
            <span class="sheet-info-item">日期：{{ todayStr }}</span>
            <span class="sheet-info-item">难度：{{ levelLabel }}</span>
            <span class="sheet-info-item">题数：{{ questions.length }} 题</span>
          </div>
        </div>
        <div class="sheet-body">
          <div
            v-for="(q, i) in questions"
            :key="i"
            class="question-item"
          >
            {{ q.expr }} = <span class="answer-text">{{ q.answer }}</span>
          </div>
        </div>
      </div>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { generateQuestions, LEVEL_CONFIG } from '../../utils/math/questionEngine.js'
import { saveRecord } from '../../utils/math/mathStorage.js'
import { toast } from '../../utils/common/toast.js'

// ─── State ────────────────────────────────────────────────────────────────────

const selectedLevel = ref(1)
const includeChain = ref(false)
const questions = ref([])
const showAnswerSheet = ref(false)

// ─── Config ───────────────────────────────────────────────────────────────────

const levelOptions = [
  { value: 1,     label: '20以内加减' },
  { value: 2,     label: '100以内±整十' },
  { value: 3,     label: '100以内±一位数' },
  { value: 'mix', label: '混合' },
]

const levelLabel = computed(() => {
  if (selectedLevel.value === 'mix') return '混合 (Lv.1-3)'
  return LEVEL_CONFIG[selectedLevel.value]?.name ?? `Lv.${selectedLevel.value}`
})

const todayStr = computed(() => formatDate(new Date()))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function generateSheet() {
  questions.value = generateQuestions({
    level: selectedLevel.value,
    count: 100,
    questionType: includeChain.value ? 'print' : 'print-no-chain',
  })
}

function regenerate() {
  generateSheet()
}

function goBack() {
  if (questions.value.length) {
    questions.value = []
  } else {
    uni.navigateBack()
  }
}

function handlePrint() {
  saveRecord({
    type: 'print',
    level: selectedLevel.value,
    total: questions.value.length,
    questions: questions.value.map(q => ({ expr: q.expr, answer: q.answer })),
  })
  // Ensure answer sheet is hidden before print
  showAnswerSheet.value = false
  window.print()
}

async function exportAnswerImage() {
  showAnswerSheet.value = true
  toast.loading('正在生成图片...')
  await new Promise(r => setTimeout(r, 300)) // wait for DOM render
  try {
    const { default: html2canvas } = await import('html2canvas')
    const el = document.getElementById('answerArea')
    const canvas = await html2canvas(el, { scale: 2, useCORS: true })
    const link = document.createElement('a')
    link.download = `数学练习答案_${formatDate(new Date())}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.hideLoading()
    toast.success('图片已保存')
  } catch (e) {
    toast.hideLoading()
    toast.error('导出失败')
    console.error(e)
  }
  showAnswerSheet.value = false
}
</script>

<style scoped>
/* ── Page wrapper ─────────────────────────────────────────────── */
.print-page {
  min-height: 100vh;
  background: #F0F4F8;
  padding-bottom: 40rpx;
}

/* ── Setup panel ──────────────────────────────────────────────── */
.setup-panel {
  padding: 48rpx 32rpx;
}

.header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.back-btn {
  font-size: 44rpx;
  color: #42A5F5;
  font-weight: bold;
  padding: 8rpx 16rpx;
  cursor: pointer;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #222;
}

.config-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.config-label {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.level-tabs {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.level-tab {
  flex: 1;
  min-width: 100rpx;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 12rpx;
  border: 2rpx solid #ddd;
  font-size: 28rpx;
  color: #555;
  background: #F8F9FA;
  cursor: pointer;
  transition: all 0.2s;
}

.level-tab.active {
  background: #42A5F5;
  border-color: #42A5F5;
  color: #fff;
  font-weight: bold;
}

.chain-toggle {
  display: flex;
  align-items: center;
  gap: 16rpx;
  cursor: pointer;
}
.toggle-track {
  width: 80rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background: #ccc;
  position: relative;
  transition: background 0.2s;
}
.toggle-track.on { background: #42A5F5; }
.toggle-thumb {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #fff;
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  transition: left 0.2s;
}
.toggle-track.on .toggle-thumb { left: 44rpx; }
.toggle-label {
  font-size: 26rpx;
  color: #666;
}

.info-row {
  padding: 16rpx 20rpx;
  background: #EFF8FF;
  border-radius: 10rpx;
  border-left: 6rpx solid #42A5F5;
}

.info-text {
  font-size: 26rpx;
  color: #555;
  line-height: 1.6;
}

.gen-btn {
  background: #42A5F5;
  color: #fff;
  font-size: 34rpx;
  font-weight: bold;
  border: none;
  border-radius: 12rpx;
  padding: 28rpx 0;
  width: 100%;
  cursor: pointer;
  transition: background 0.2s;
}

.gen-btn:active {
  background: #1E88E5;
}

/* ── Preview panel ────────────────────────────────────────────── */
.preview-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 16rpx;
  gap: 24rpx;
}

/* ── Action bar ───────────────────────────────────────────────── */
.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  justify-content: center;
  width: 100%;
  max-width: 230mm;
}

.action-btn {
  flex: 1;
  min-width: 180rpx;
  padding: 22rpx 28rpx;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.action-btn:active {
  opacity: 0.8;
}

.btn-print  { background: #42A5F5; color: #fff; }
.btn-export { background: #E53935; color: #fff; }
.btn-regen  { background: #66BB6A; color: #fff; }
.btn-back   { background: #78909C; color: #fff; }

/* ── A4 sheet (screen) ────────────────────────────────────────── */
.a4-sheet {
  width: 210mm;
  margin: 20rpx auto;
  padding: 8mm 12mm;
  background: #fff !important;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  font-family: 'Arial', 'SimSun', sans-serif;
}

/* ── Sheet info bar (no title, just name/class/score) ─────────── */
.sheet-info-bar {
  display: flex;
  justify-content: space-between;
  font-size: 12pt;
  color: #333;
  border-bottom: 1px solid #ccc;
  padding-bottom: 3mm;
  margin-bottom: 4mm;
}

.sheet-info-item {
  white-space: nowrap;
}

/* ── Answer sheet header ─────────────────────────────────────── */
.sheet-header {
  text-align: center;
  margin-bottom: 3mm;
}
.sheet-title {
  font-size: 14pt;
  font-weight: bold;
  color: #111;
  margin-bottom: 2mm;
}
.sheet-info-row {
  display: flex;
  justify-content: center;
  gap: 8mm;
  font-size: 11pt;
  color: #333;
  border-bottom: 1px solid #ccc;
  padding-bottom: 2mm;
  margin-bottom: 3mm;
}

/* ── Sheet body: 4-column grid ────────────────────────────────── */
.sheet-body {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  font-size: 14pt;
  line-height: 1.75;
}

.question-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #111;
}

/* ── Answer text ──────────────────────────────────────────────── */
.answer-text {
  color: #E53935;
  font-weight: bold;
}

/* ── Answer sheet decoration ──────────────────────────────────── */
.answer-sheet {
  border: 2px dashed #E53935;
}
</style>

<!-- Global styles (dark mode + print) -->
<style>
/* ── Dark mode — setup panel ──────────────────────────────────── */
body.dark-mode .print-page {
  background: #1a1a2e;
}

body.dark-mode .title {
  color: #e0e0e0;
}

body.dark-mode .back-btn {
  color: #64B5F6;
}

body.dark-mode .config-card {
  background: #252545;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
}

body.dark-mode .config-label {
  color: #ccc;
}

body.dark-mode .level-tab {
  background: #1e1e3a;
  border-color: #444;
  color: #aaa;
}

body.dark-mode .level-tab.active {
  background: #42A5F5;
  border-color: #42A5F5;
  color: #fff;
}

body.dark-mode .info-row {
  background: #1e2d3a;
  border-left-color: #42A5F5;
}

body.dark-mode .info-text {
  color: #9ab;
}

/* ── Dark mode — A4 sheet stays white (print preview) ─────────── */
body.dark-mode .a4-sheet {
  background: #fff !important;
  color: #111 !important;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
}

body.dark-mode .sheet-title,
body.dark-mode .sheet-info-item,
body.dark-mode .question-item {
  color: #111 !important;
}

body.dark-mode .answer-text {
  color: #E53935 !important;
}

/* ── Print media ──────────────────────────────────────────────── */
@media print {
  @page {
    margin: 3mm;
  }

  .no-print {
    display: none !important;
  }

  /* Reset everything */
  html, body, #app, uni-app, uni-page, uni-page-body,
  .uni-page-head, .uni-page-head-hd {
    margin: 0 !important;
    padding: 0 !important;
    min-height: auto !important;
    background: #fff !important;
    overflow: visible !important;
  }

  /* Hide uni navigation bar */
  .uni-page-head, uni-page-head {
    display: none !important;
  }

  .print-page,
  .preview-panel {
    margin: 0;
    padding: 0;
    background: #fff;
    min-height: auto;
  }

  .a4-sheet {
    width: 100%;
    margin: 0;
    padding: 0 5mm;
    box-shadow: none;
    min-height: auto;
    background: #fff !important;
  }

  .sheet-body {
    font-size: 14pt;
    line-height: 1.75;
    gap: 0;
  }
}
</style>
