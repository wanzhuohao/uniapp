<script setup>
import { onMounted, onUnmounted } from 'vue'
import { onLaunch } from '@dcloudio/uni-app'
import { useAuth } from './composables/common/useAuth.js'
import { useRecentUsers } from './composables/common/useRecentUsers.js'
import { useGameStore } from './store/game.js'
import { isDark, toggleDark, applyTheme } from './utils/common/theme.js'

const { hasUsername, setUsername } = useAuth()
const { addRecentUser } = useRecentUsers()

// uniapp App.vue 不渲染 template，浮动按钮用 DOM API 直接注入到 body
let themeBtnEl = null
let routeCheckTimer = null

function syncBtnText() {
  if (themeBtnEl) themeBtnEl.textContent = isDark() ? '☀️' : '🌙'
}

function updateBtnVisible() {
  if (!themeBtnEl) return
  try {
    const pages = getCurrentPages()
    const cur = pages[pages.length - 1]
    const path = cur?.route || ''
    // 只在学习首页和数学首页显示，避免子页面学习时的视觉干扰
    const showPaths = ['pages/study/index', 'pages/math/index']
    themeBtnEl.style.display = showPaths.includes(path) ? 'flex' : 'none'
  } catch (e) {
    themeBtnEl.style.display = 'none'
  }
}

function injectThemeToggle() {
  if (typeof document === 'undefined') return
  if (themeBtnEl) return
  themeBtnEl = document.createElement('div')
  themeBtnEl.className = 'global-theme-toggle'
  themeBtnEl.style.display = 'none'
  themeBtnEl.addEventListener('click', () => {
    toggleDark()
    syncBtnText()
  })
  document.body.appendChild(themeBtnEl)
  syncBtnText()
}

function promptUsername() {
  uni.showModal({
    title: '请输入你的名字',
    content: '',
    editable: true,
    placeholderText: '例如：小明',
    showCancel: false,
    confirmText: '确定',
    success(res) {
      const name = (res.content || '').trim()
      if (res.confirm && name) {
        setUsername(name)
        addRecentUser(name)
        const store = useGameStore()
        store.loadFromCloud()
        uni.$emit('username-changed', name)
      } else {
        // 空输入 → 再弹一次
        setTimeout(promptUsername, 100)
      }
    }
  })
}

onLaunch(() => {
  applyTheme()
  if (!hasUsername()) {
    promptUsername()
  } else {
    // 已有用户名，启动时从云端拉取数据
    const store = useGameStore()
    store.loadFromCloud()
  }
})

onMounted(() => {
  injectThemeToggle()
  updateBtnVisible()
  // 500ms 轮询路由，切页后显隐浮动按钮（只读 getCurrentPages 无副作用）
  routeCheckTimer = setInterval(updateBtnVisible, 500)
})

onUnmounted(() => {
  if (routeCheckTimer) clearInterval(routeCheckTimer)
  if (themeBtnEl) {
    themeBtnEl.remove()
    themeBtnEl = null
  }
})
</script>

<style>
page {
  background-color: #F5F7FA;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
}

:root {
  /* 碑文模块主色 */
  --color-primary: #96700A;
  --color-primary-hover: #B8860B;
  --color-primary-light: #8B6914;
  --color-border: #8C8078;
  --color-border-light: #D5CEC8;
  --color-bg-blue: #F5F0EB;
  --color-bg-blue-light: #FAF7F4;
  --color-success: #5B8C3E;
  --color-success-hover: #7AAD56;
  --color-danger: #C0392B;
  --color-danger-hover: #D95B4E;
  --color-warning: #D4A017;
  --color-warning-hover: #E8BF3A;
  --color-text: #2C2420;
  --color-text-light: #888;
  --color-gold: #D4A528;
  --color-star: #FFB300;
  --color-stroke: #42A5F5;
  --radius-btn: 16rpx;
  --radius-card: 20rpx;
}

/* ==== 浮动主题切换按钮 ==== */
.global-theme-toggle {
  position: fixed;
  right: 24rpx;
  bottom: 120rpx;
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FFF9C4;
  font-size: 44rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.2);
  z-index: 1000;
}
.global-theme-toggle:active {
  transform: scale(0.9);
}

/* ==== 暗色模式覆盖 ==== */
html body.dark-mode uni-page-body,
html body.dark-mode page {
  background-color: #1a1a1a !important;
}

/* 学习模块所有页面容器 */
html body.dark-mode .index-page,
html body.dark-mode .mock-page,
html body.dark-mode .pinyin-page,
html body.dark-mode .hanzi-page,
html body.dark-mode .mental-page,
html body.dark-mode .wbp-page,
html body.dark-mode .admin-page,
html body.dark-mode .result-page,
html body.dark-mode .container {
  background-color: #1a1a1a !important;
  color: #e0e0e0 !important;
}

/* 卡片 / 面板背景 */
html body.dark-mode .module-card,
html body.dark-mode .stat-card,
html body.dark-mode .wrong-item,
html body.dark-mode .type-card,
html body.dark-mode .us-card,
html body.dark-mode .desc-area,
html body.dark-mode .top5-list,
html body.dark-mode .section,
html body.dark-mode .result-card,
html body.dark-mode .question-card,
html body.dark-mode .hanzi-question,
html body.dark-mode .char-outline-wrap,
html body.dark-mode .quiz-wrap,
html body.dark-mode .q-row {
  background-color: #2a2a2a !important;
  color: #e0e0e0;
}

/* 主要文字 */
html body.dark-mode .title,
html body.dark-mode .filter-title,
html body.dark-mode .module-name,
html body.dark-mode .stat-num,
html body.dark-mode .wrong-char,
html body.dark-mode .section-title,
html body.dark-mode .char-display,
html body.dark-mode .q-expr,
html body.dark-mode .top5-char,
html body.dark-mode .us-name {
  color: #e0e0e0 !important;
}

/* 次要文字 */
html body.dark-mode .module-desc,
html body.dark-mode .desc,
html body.dark-mode .stat-label,
html body.dark-mode .wrong-type,
html body.dark-mode .wrong-unit,
html body.dark-mode .hint-text,
html body.dark-mode .empty,
html body.dark-mode .empty-hint,
html body.dark-mode .empty-text,
html body.dark-mode .sub-text,
html body.dark-mode .top5-type {
  color: #888 !important;
}

/* 未选中的筛选 / tab 标签（用 :not(.active) 保留选中态原色） */
html body.dark-mode .unit-tag:not(.active),
html body.dark-mode .filter-tag:not(.active),
html body.dark-mode .filter-btn:not(.active),
html body.dark-mode .tab-btn:not(.active) {
  background: #3a3a3a !important;
  color: #ccc !important;
  border-color: #555 !important;
}

/* StarBar + TopBar */
html body.dark-mode .star-bar,
html body.dark-mode .top-bar {
  background-color: #2a2a2a !important;
}
html body.dark-mode .star-num,
html body.dark-mode .page-title,
html body.dark-mode .star-total,
html body.dark-mode .star-total .star-num {
  color: #e0e0e0 !important;
}
html body.dark-mode .dot {
  background: #444 !important;
}
html body.dark-mode .dot.active,
html body.dark-mode .dot.done {
  background: #FFB300 !important;
}
html body.dark-mode .back-btn {
  background: #3a3a3a !important;
  color: #ccc !important;
}

/* 选择题的选项 */
html body.dark-mode .option-btn {
  background: #2a2a2a !important;
  color: #e0e0e0 !important;
  border-color: #555 !important;
}

/* HanziWriter 的字外框在深背景下的 fallback 色 */
html body.dark-mode .char-fallback {
  color: #555 !important;
}

/* 数学题 q-input */
html body.dark-mode .q-input {
  background: #1a1a1a !important;
  color: #e0e0e0 !important;
  border-color: #555 !important;
}

/* 听写页浅色按钮块 */
html body.dark-mode .tts-btn,
html body.dark-mode .speak-btn,
html body.dark-mode .answer-btn,
html body.dark-mode .replay-btn {
  background: #1e3a3a !important;
  color: #80cbc4 !important;
}

/* TrendChart / TOP5 */
html body.dark-mode .trend-chart,
html body.dark-mode .top5-item {
  background-color: #2a2a2a !important;
}

/* 错题重练页的 hint 切换条 */
html body.dark-mode .practice-mode-hint {
  background: #1e3a4f !important;
  color: #a0c4de !important;
}
html body.dark-mode .practice-mode-hint .switch-link {
  color: #90caf9 !important;
}

/* UserSwitcher 模态（.us-*）*/
html body.dark-mode .us-card {
  background: #2a2a2a !important;
}
html body.dark-mode .us-title {
  color: #e0e0e0 !important;
}
html body.dark-mode .us-close {
  background: #3a3a3a !important;
  color: #ccc !important;
}
html body.dark-mode .us-item {
  background: #3a3a3a !important;
  color: #e0e0e0 !important;
}
html body.dark-mode .us-item.current {
  background: #3a2f1a !important;  /* 深金色 */
  border-color: #FFB300 !important;
}
html body.dark-mode .us-name {
  color: #e0e0e0 !important;
}
html body.dark-mode .us-badge {
  background: #4a3a1a !important;
  color: #ffcc80 !important;
}
html body.dark-mode .us-remove {
  background: #4a1f1f !important;
  color: #ff8a80 !important;
}
html body.dark-mode .us-empty {
  color: #888 !important;
}

/* 底部固定条（错题本 / 数据维护 / 口算交卷 等）*/
html body.dark-mode .bottom-bar,
html body.dark-mode .submit-bar,
html body.dark-mode .mental-page .top-bar {
  background: #2a2a2a !important;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.3) !important;
}

/* 口算结果区 */
html body.dark-mode .result-area,
html body.dark-mode .time-alert-box {
  background: #2a2a2a !important;
  color: #e0e0e0 !important;
}
html body.dark-mode .result-title,
html body.dark-mode .result-time,
html body.dark-mode .result-score,
html body.dark-mode .result-accuracy,
html body.dark-mode .time-alert-text {
  color: #e0e0e0 !important;
}
html body.dark-mode .action-btn:not(.primary) {
  background: #3a3a3a !important;
  color: #ccc !important;
  border-color: #555 !important;
}
/* 口算结果区的错题回顾（区分于错题本的 wrong-item）*/
html body.dark-mode .mental-page .wrong-item {
  background: #3a1f22 !important;
}
html body.dark-mode .wrong-section .wrong-title {
  color: #ff8a65 !important;
}

/* TrendChart 内部文字（chart-title / 坐标轴） */
html body.dark-mode .chart-title,
html body.dark-mode .chart-label,
html body.dark-mode .chart-axis-label,
html body.dark-mode .y-label,
html body.dark-mode .x-label {
  color: #e0e0e0 !important;
}
html body.dark-mode .chart-line,
html body.dark-mode .chart-axis {
  stroke: #666 !important;
}

/* 数据维护页面（data-admin.vue 实际 class 名）*/
html body.dark-mode .admin-page .toolbar,
html body.dark-mode .admin-page .list,
html body.dark-mode .admin-page .item,
html body.dark-mode .admin-page .modal,
html body.dark-mode .admin-page .modal-header,
html body.dark-mode .admin-page .modal-body,
html body.dark-mode .admin-page .modal-footer,
html body.dark-mode .admin-page .field {
  background-color: #2a2a2a !important;
  color: #e0e0e0 !important;
}
html body.dark-mode .admin-page .item-char,
html body.dark-mode .admin-page .modal-title,
html body.dark-mode .admin-page .reload-btn,
html body.dark-mode .admin-page .label {
  color: #e0e0e0 !important;
}
html body.dark-mode .admin-page .line1,
html body.dark-mode .admin-page .line2,
html body.dark-mode .admin-page .line3,
html body.dark-mode .admin-page .stats,
html body.dark-mode .admin-page .modal-close {
  color: #aaa !important;
}
html body.dark-mode .admin-page input,
html body.dark-mode .admin-page textarea,
html body.dark-mode .admin-page .search-input,
html body.dark-mode .admin-page .input {
  background: #1a1a1a !important;
  color: #e0e0e0 !important;
  border-color: #555 !important;
}
html body.dark-mode .admin-page .unit-chip:not(.active) {
  background: #3a3a3a !important;
  color: #ccc !important;
  border-color: #555 !important;
}
html body.dark-mode .admin-page .unit-filter {
  background: #1a1a1a !important;
  border-bottom-color: #444 !important;
}
html body.dark-mode .admin-page .toolbar .add-btn {
  background: #1e3a1e !important;
  color: #81c784 !important;
}

/* 错题本的 high-frequency top5 list 内部项 */
html body.dark-mode .top5-rank {
  color: #ff8a65 !important;
}
html body.dark-mode .wrong-count,
html body.dark-mode .top5-count {
  color: #ff8a65 !important;
}

/* 浮动主题切换按钮 */
html body.dark-mode .global-theme-toggle {
  background: #3a3a3a !important;
  color: #FFF9C4 !important;
}

/* 学习页答案区（learn.vue）*/
html body.dark-mode .answer-box,
html body.dark-mode .answer-row {
  background: #2a2a2a !important;
  color: #e0e0e0 !important;
}
html body.dark-mode .answer-label {
  color: #888 !important;
}
html body.dark-mode .answer-value {
  color: #e0e0e0 !important;
}

/* HanziWriter SVG：strokeColor 已在各组件按主题动态设置，
   CSS 这里不做 fill 强制覆盖（会干扰绿色部首色），信任 HanziWriter 自身 */

/* 口算计时器（顶部时间显示）暗色 */
html body.dark-mode .timer {
  color: #e0e0e0 !important;
}
html body.dark-mode .timer.warn {
  color: #ff8a65 !important;
}

/* 错题本未掌握题数 / 已掌握题数 标签 */
html body.dark-mode .mastered-badge {
  color: #66bb6a !important;
}

/* 结果页（result.vue）*/
html body.dark-mode .result-page {
  background-color: #1a1a1a !important;
}
html body.dark-mode .result-card {
  background: #2a2a2a !important;
}
html body.dark-mode .score {
  color: #FFD54F !important;  /* 亮金色 */
}
html body.dark-mode .score-label,
html body.dark-mode .stars-total-change,
html body.dark-mode .old-total,
html body.dark-mode .arrow {
  color: #aaa !important;
}
html body.dark-mode .new-total {
  color: #FFD54F !important;
}
html body.dark-mode .star-text {
  color: #FFB300 !important;
}
html body.dark-mode .encourage {
  color: #e0e0e0 !important;
}
html body.dark-mode .level-change {
  color: #4fc3f7 !important;
}
</style>
