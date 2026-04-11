# 学习模块暗色模式设计

> 日期：2026-04-11
> 状态：待评审 → 实施
> 关联：方案二第 6 项（折中方案 B）

## 背景与目标

晚上用平板学习白屏刺眼，给学习模块加一个暗色开关。范围：学习模块的所有页面 + 首页，不动碑文 / data-admin / Element Plus。

**非目标**：
- 不做 Element Plus dark theme
- 不做 prefers-color-scheme 自动跟随
- 不抽所有硬编码颜色成 CSS var（工作量大）
- 不改模块主题色（橙/蓝/紫/青绿保留，夜间看彩色按钮 OK）

## 机制

1. `utils/common/theme.js` 读写 `localStorage['dark_mode']`
2. 切换时给 `document.body` 加/移 class `dark-mode`
3. `App.vue` 的**全局 style**（非 scoped）用 `html body.dark-mode ...` 选择器覆盖页面容器、卡片、文字色
4. 学习首页 `pages/study/index.vue` 右上角加 🌙/☀️ 切换按钮
5. `App.vue onLaunch` 调 `applyTheme()` 恢复上次状态

## 文件改动

| 操作 | 路径 | 行数 |
|------|------|------|
| 新建 | `utils/common/theme.js` | ~30 行 |
| 改 | `App.vue` | onLaunch + ~60 行全局 CSS |
| 改 | `pages/study/index.vue` | 加 header-right 容器 + toggle 按钮 + script import |

## theme.js

```js
// utils/common/theme.js
// 暗色模式开关：localStorage + document.body class
const KEY = 'dark_mode'

export function isDark() {
  return uni.getStorageSync(KEY) === '1'
}

export function setDark(v) {
  uni.setStorageSync(KEY, v ? '1' : '0')
  applyTheme()
}

export function toggleDark() {
  setDark(!isDark())
}

export function applyTheme() {
  if (typeof document === 'undefined') return
  const body = document.body
  if (!body) return
  if (isDark()) body.classList.add('dark-mode')
  else body.classList.remove('dark-mode')
}
```

## App.vue 改动

### onLaunch 加 applyTheme

```js
import { applyTheme } from './utils/common/theme.js'

onLaunch(() => {
  applyTheme()
  // 已有 promptUsername / loadFromCloud 逻辑保留
})
```

### 全局 CSS（`<style>` 非 scoped）

覆盖规则（追加到现有 `<style>` 末尾，和 `:root` 主题变量同级）：

**优先级说明**（pm 评审指出）：UniApp H5 编译后 scoped CSS 用 `.xxx[data-v-hash]` 属性选择器（0,2,0），和 App.vue 全局 `.dark-mode .xxx`（0,2,0）优先级相等，CSS 加载顺序决定胜负。动态加载的页面 chunk CSS 通常**后于** App.vue 注入，会让覆盖失效。解决方案：**用 `html html body.dark-mode .xxx` 提升为 0,3,0，同时保留 `!important`** 作为双保险。

```css
/* ==== 暗色模式覆盖 ==== */
html html body.dark-mode uni-page-body,
html html body.dark-mode page {
  background-color: #1a1a1a !important;
}

/* 学习模块所有页面容器（实测根 class 清单） */
html html body.dark-mode .index-page,
html html body.dark-mode .mock-page,
html html body.dark-mode .pinyin-page,
html html body.dark-mode .hanzi-page,
html html body.dark-mode .mental-page,
html html body.dark-mode .dictation-page,
html html body.dark-mode .wbp-page,
html html body.dark-mode .admin-page,
html html body.dark-mode .result-page,
html html body.dark-mode .container {
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

/* 未选中的筛选/tab 标签 */
html body.dark-mode .unit-tag,
html body.dark-mode .filter-tag,
html body.dark-mode .filter-btn,
html body.dark-mode .tab-btn {
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
html body.dark-mode .page-title {
  color: #e0e0e0 !important;
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

/* HanziWriter 的字外框在深背景下需要加点对比度 */
html body.dark-mode .char-fallback {
  color: #555 !important;
}

/* 数学题 q-input */
html body.dark-mode .q-input {
  background: #1a1a1a !important;
  color: #e0e0e0 !important;
  border-color: #555 !important;
}

/* 听写页特殊浅色块 */
html body.dark-mode .tts-btn {
  background: #1e3a3a !important;
  color: #80cbc4 !important;
}
html body.dark-mode .speak-btn,
html body.dark-mode .answer-btn,
html body.dark-mode .replay-btn {
  background: #1e3a3a !important;
  color: #80cbc4 !important;
}

/* TrendChart / 高频错字等 section 背景 */
html body.dark-mode .trend-chart,
html body.dark-mode .top5-item {
  background-color: #2a2a2a !important;
}

/* 浮动主题切换按钮（App.vue 全局） */
html body.dark-mode .global-theme-toggle {
  background: #3a3a3a !important;
  color: #FFF9C4 !important;
}
```

**设计选择**：不动的元素
- 模块主题色按钮（`.start-btn` / `.practice-btn` / `.submit-btn`）保留彩色渐变
- Emoji 图标不受影响
- HanziWriter SVG 的黑色描边在深背景下仍然可见（对比度够）
- 切题按钮 `.judge-btn` 的红绿色保留

## 切换按钮 — App.vue 级浮动（pm 评审修订）

**为什么不放学习首页**：子页面进去后无法切换，要退回首页重进体验差。

**方案**：全局固定定位浮动按钮，`setInterval` 500ms 轮询路由，只在 `pages/study/*` 下显示。

- App.vue 模板加 `<view v-if="showThemeToggle" class="global-theme-toggle" @click="onToggleTheme">{{ isDarkMode ? '☀️' : '🌙' }}</view>`
- App.vue script 加 `showThemeToggle` ref + `updateToggleVisible()`（读 `getCurrentPages()` 末路径判断前缀 `pages/study/`）+ `setInterval(updateToggleVisible, 500)` 在 onMounted
- CSS 位置：`position: fixed; right: 24rpx; bottom: 120rpx; width: 96rpx; height: 96rpx; border-radius: 50%; background: #FFF9C4; z-index: 1000`
- **不改 study/index.vue**

### ~~原方案：嵌入 study/index.vue header~~（已弃）

`pages/study/index.vue` header：

**原**：
```vue
<view class="header">
  <text class="title">学习小天地</text>
  <view class="star-total">⭐ {{ store.totalStars }}</view>
</view>
```

**改**：
```vue
<view class="header">
  <text class="title">学习小天地</text>
  <view class="header-right">
    <view class="theme-toggle" @click="onToggleTheme">{{ isDarkMode ? '☀️' : '🌙' }}</view>
    <view class="star-total">
      <text class="star-icon">⭐</text>
      <text class="star-num">{{ store.totalStars }}</text>
    </view>
  </view>
</view>
```

Script 加：
```js
import { ref } from 'vue'
import { isDark, toggleDark } from '../../utils/common/theme.js'

const isDarkMode = ref(isDark())
function onToggleTheme() {
  toggleDark()
  isDarkMode.value = isDark()
}
```

CSS 追加：
```css
.header-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.theme-toggle {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFF9C4;
  border-radius: 50%;
  font-size: 32rpx;
}
.theme-toggle:active { transform: scale(0.9); }
```

暗色模式下 header-right 按钮自动继承（如果需要特殊处理，就 `html body.dark-mode .theme-toggle { background: #3a3a3a; }`）。

## 验证清单

1. 学习首页点 🌙 按钮 → 切到暗色，按钮变 ☀️
2. `uni.getStorageSync('dark_mode') === '1'`
3. `document.body.classList.contains('dark-mode') === true`
4. 学习首页、拼音、汉字、口算、听写、错题本、错题重练、学习页背景都变暗色
5. 模块卡片、stat-card、wrong-item 背景变深灰
6. 主标题、统计数字变浅色
7. 筛选按钮未选中状态变深灰
8. 模块主题色按钮（start/practice/submit）保持彩色渐变
9. 切回亮色恢复默认
10. 刷新页面保持上次的主题状态
11. 进碑文页面（stele/list / stele/detail）背景不变（Element Plus 白色保留）
12. 暗色模式下 HanziWriter SVG 黑字仍然可见（不完美但不影响使用）

## 风险与回滚

**主要风险**：
- 某些页面有硬编码 `background: #fff` 没被 `!important` 覆盖 → 手工测试时发现补 CSS
- `:deep()` 等 scoped 样式穿透问题
- Element Plus 组件如果被引用到学习页（没有）会有色冲突 → 现状学习页不用 Element Plus
- 主题色按钮对比度在暗色下可能偏亮 → 视觉微调

**回滚**：
- 单 commit 回退
- `utils/common/theme.js` 无依赖可保留

## 不在本次范围

- 自动跟随系统 prefers-color-scheme
- 定时自动切换（比如 20:00 自动暗色）
- 碑文模块的 Element Plus 暗色
- 自定义暗色强度
