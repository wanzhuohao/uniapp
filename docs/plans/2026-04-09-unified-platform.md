# 统一平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将碑文排版、学习小天地、面试助手合并为统一平台，新增错题本功能，题库迁移到云数据库。

**Architecture:** UniApp Vue3 统一平台，按业务分包（pages/stele、pages/study、pages/interview），公共层抽离（utils/common、composables/common），uniCloud-alipay 统一数据层。

**Tech Stack:** UniApp Vue3, Pinia, uniCloud-alipay, HanziWriter, Web Speech API, TypeScript (碑文模块)

**Spec:** `docs/specs/2026-04-09-unified-platform-design.md`

---

## Phase 1: 项目脚手架 + 公共层 + 统一入口

### Task 1: 项目创建（用户手动 + 初始化）

**Files:**
- Create: `.gitignore`
- Create: `package.json`（HBuilderX 自动生成，手动安装依赖）

- [ ] **Step 1: 用户在 HBuilderX 创建项目**
  - 文件 → 新建 → 项目 → uni-app → Vue3 → 选择 uniCloud-alipay
  - 项目路径：`D:\code\uniapp`（已有 docs/ 目录，选择合并）

- [ ] **Step 2: 安装 npm 依赖**
  ```bash
  cd D:\code\uniapp
  npm install pinia hanzi-writer
  ```

- [ ] **Step 3: 初始化 git**
  ```bash
  cd D:\code\uniapp
  git init
  ```

- [ ] **Step 4: 创建 .gitignore**
  ```
  node_modules/
  unpackage/
  .hbuilderx/
  .DS_Store
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add -A && git commit -m "chore: init uniapp project with Vue3 + uniCloud-alipay"
  ```

---

### Task 2: 公共层 + pages.json + App.vue + main.js

**Files:**
- Create: `composables/common/useAuth.js`
- Create: `utils/common/cloudDb.js`
- Create: `utils/common/storage.js`
- Create: `utils/common/speech.js`
- Create: `pages.json`（覆盖 HBuilderX 默认生成的）
- Create: `App.vue`（覆盖默认）
- Create: `main.js`（覆盖默认）

- [ ] **Step 1: composables/common/useAuth.js**

```js
// composables/common/useAuth.js
export function useAuth() {
  function getUsername() {
    return uni.getStorageSync('username') || ''
  }
  function setUsername(name) {
    uni.setStorageSync('username', name)
  }
  function hasUsername() {
    return !!getUsername()
  }
  return { getUsername, setUsername, hasUsername }
}
```

- [ ] **Step 2: utils/common/cloudDb.js**

```js
// utils/common/cloudDb.js
const db = uniCloud.database()

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 小时

/**
 * 按 type + unit 拉取题库（带本地缓存）
 */
export async function getQuestions(type, unit) {
  const cacheKey = `questions_${type}_${unit}`

  // 检查本地缓存
  try {
    const cached = uni.getStorageSync(cacheKey)
    if (cached && cached.data && (Date.now() - cached.cachedAt < CACHE_TTL)) {
      return cached.data
    }
  } catch (e) {}

  // 从云数据库拉取
  try {
    const res = await db.collection('questions')
      .where({ type, unit })
      .get()

    if (res.result && res.result.data && res.result.data.length > 0) {
      const data = res.result.data
      uni.setStorageSync(cacheKey, { data, cachedAt: Date.now() })
      return data
    }
  } catch (e) {
    console.error('拉取题库失败:', e)
  }

  // 兜底：用过期缓存
  try {
    const cached = uni.getStorageSync(cacheKey)
    if (cached && cached.data) {
      return cached.data
    }
  } catch (e) {}

  return null
}

/**
 * 通用查询
 */
export async function queryCollection(name, where, options = {}) {
  const { limit = 100, orderBy, skip = 0 } = options
  let query = db.collection(name).where(where)
  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.order || 'desc')
  }
  if (skip > 0) query = query.skip(skip)
  query = query.limit(limit)
  const res = await query.get()
  return res.result ? res.result.data : []
}

/**
 * 新增文档
 */
export async function addDocument(name, data) {
  const res = await db.collection(name).add(data)
  return res.result || res
}

/**
 * 更新文档
 */
export async function updateDocument(name, docId, data) {
  const res = await db.collection(name).doc(docId).update(data)
  return res.result || res
}
```

- [ ] **Step 3: utils/common/storage.js**

复制自 kids-learn，内容不变：
```
Copy from: D:/code/other/kids-learn/kids-learn/utils/storage.js
      → to: D:/code/uniapp/utils/common/storage.js
```

- [ ] **Step 4: utils/common/speech.js**

复制自 kids-learn，内容不变：
```
Copy from: D:/code/other/kids-learn/kids-learn/utils/speech.js
      → to: D:/code/uniapp/utils/common/speech.js
```

- [ ] **Step 5: pages.json（全部 21 个路由）**

```json
{
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "统一平台", "navigationStyle": "custom" } },

    { "path": "pages/stele/index", "style": { "navigationBarTitleText": "碑文下单", "navigationStyle": "custom" } },
    { "path": "pages/stele/list", "style": { "navigationBarTitleText": "订单管理", "navigationStyle": "custom" } },
    { "path": "pages/stele/detail", "style": { "navigationBarTitleText": "详情", "navigationStyle": "custom" } },
    { "path": "pages/stele/preview", "style": { "navigationBarTitleText": "预览", "navigationStyle": "custom" } },
    { "path": "pages/stele/photo", "style": { "navigationBarTitleText": "查看照片", "navigationStyle": "custom" } },
    { "path": "pages/stele/help", "style": { "navigationBarTitleText": "帮助", "navigationStyle": "custom" } },

    { "path": "pages/study/index", "style": { "navigationBarTitleText": "学习小天地", "navigationStyle": "custom" } },
    { "path": "pages/study/pinyin", "style": { "navigationBarTitleText": "拼音练习", "navigationStyle": "custom" } },
    { "path": "pages/study/stroke", "style": { "navigationBarTitleText": "笔顺练习", "navigationStyle": "custom" } },
    { "path": "pages/study/math", "style": { "navigationBarTitleText": "算术练习", "navigationStyle": "custom" } },
    { "path": "pages/study/mental-math", "style": { "navigationBarTitleText": "口算计时", "navigationStyle": "custom" } },
    { "path": "pages/study/result", "style": { "navigationBarTitleText": "本轮成绩", "navigationStyle": "custom" } },
    { "path": "pages/study/wrong-book", "style": { "navigationBarTitleText": "错题本", "navigationStyle": "custom" } },
    { "path": "pages/study/wrong-book-practice", "style": { "navigationBarTitleText": "错题重练", "navigationStyle": "custom" } },

    { "path": "pages/interview/index", "style": { "navigationBarTitleText": "面试练习", "navigationStyle": "custom" } },
    { "path": "pages/interview/practice", "style": { "navigationBarTitleText": "答题", "navigationStyle": "custom" } },
    { "path": "pages/interview/records", "style": { "navigationBarTitleText": "练习记录", "navigationStyle": "custom" } },
    { "path": "pages/interview/record-detail", "style": { "navigationBarTitleText": "答题详情", "navigationStyle": "custom" } },
    { "path": "pages/interview/exam-result", "style": { "navigationBarTitleText": "考场结果", "navigationStyle": "custom" } },
    { "path": "pages/interview/settings", "style": { "navigationBarTitleText": "设置", "navigationStyle": "custom" } }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "统一平台",
    "navigationBarBackgroundColor": "#F8F8F8",
    "backgroundColor": "#F8F8F8"
  },
  "uniIdRouter": {}
}
```

- [ ] **Step 6: App.vue**

```vue
<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useAuth } from './composables/common/useAuth.js'

const { hasUsername, setUsername } = useAuth()

onLaunch(() => {
  if (!hasUsername()) {
    uni.showModal({
      title: '欢迎使用',
      content: '请输入你的用户名',
      editable: true,
      placeholderText: '输入用户名',
      success(res) {
        if (res.confirm && res.content && res.content.trim()) {
          setUsername(res.content.trim())
        }
      }
    })
  }
})
</script>

<style>
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
  --color-gold: #D4A528;
}
</style>
```

- [ ] **Step 7: main.js**

```js
import App from './App'
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  return { app }
}
```

- [ ] **Step 8: Commit**
  ```bash
  git add composables/ utils/common/ pages.json App.vue main.js && git commit -m "feat: add common layer, pages.json with all 21 routes, App.vue and main.js"
  ```

---

### Task 3: 统一入口页

**Files:**
- Create: `pages/index/index.vue`

- [ ] **Step 1: pages/index/index.vue**

```vue
<template>
  <view class="container">
    <view class="header">
      <text class="title">统一平台</text>
      <text class="username" @click="editUsername">{{ username || '未设置' }}</text>
    </view>

    <view class="cards">
      <view class="card card-stele" @click="goTo('/pages/stele/index')">
        <text class="card-icon">📝</text>
        <text class="card-title">碑文排版</text>
        <text class="card-desc">碑文下单与排版预览</text>
      </view>

      <view class="card card-study" @click="goTo('/pages/study/index')">
        <text class="card-icon">📚</text>
        <text class="card-title">学习小天地</text>
        <text class="card-desc">拼音、笔顺、算术练习</text>
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
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuth } from '../../composables/common/useAuth.js'

const { getUsername, setUsername } = useAuth()
const username = ref(getUsername())

onShow(() => {
  username.value = getUsername()
})

function goTo(url) {
  uni.navigateTo({ url })
}

function editUsername() {
  uni.showModal({
    title: '修改用户名',
    content: '',
    editable: true,
    placeholderText: username.value || '输入用户名',
    success(res) {
      if (res.confirm && res.content && res.content.trim()) {
        setUsername(res.content.trim())
        username.value = res.content.trim()
      }
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
  color: #999;
}
</style>
```

- [ ] **Step 2: Commit**
  ```bash
  git add pages/index/ && git commit -m "feat: add unified entry page with 3 business cards"
  ```

---

## Phase 2: 碑文排版迁移

### Task 4: 碑文页面 + 组件 + composables + utils + types 迁移

**Files:**
- Copy from: `D:/code/other/libei/pages/index/index.vue` → `pages/stele/index.vue`
- Copy from: `D:/code/other/libei/pages/list/list.vue` → `pages/stele/list.vue`
- Copy from: `D:/code/other/libei/pages/detail/detail.vue` → `pages/stele/detail.vue`
- Copy from: `D:/code/other/libei/pages/preview/preview.vue` → `pages/stele/preview.vue`
- Copy from: `D:/code/other/libei/pages/photo/photo.vue` → `pages/stele/photo.vue`
- Copy from: `D:/code/other/libei/pages/help/help.vue` → `pages/stele/help.vue`
- Copy from: `D:/code/other/libei/components/BeibeiWordPreview.vue` → `components/stele/WordPreview.vue`
- Copy from: `D:/code/other/libei/composables/useOrderForm.ts` → `composables/stele/useOrderForm.ts`
- Copy from: `D:/code/other/libei/utils/beibei-utils.ts` → `utils/stele/stele-utils.ts`
- Copy from: `D:/code/other/libei/utils/beibei-word-preview.css` → `utils/stele/word-preview.css`
- Copy from: `D:/code/other/libei/types/order.ts` → `types/order.ts`

- [ ] **Step 1: 复制所有文件**
  ```bash
  # 页面
  mkdir -p D:/code/uniapp/pages/stele
  cp D:/code/other/libei/pages/index/index.vue D:/code/uniapp/pages/stele/index.vue
  cp D:/code/other/libei/pages/list/list.vue D:/code/uniapp/pages/stele/list.vue
  cp D:/code/other/libei/pages/detail/detail.vue D:/code/uniapp/pages/stele/detail.vue
  cp D:/code/other/libei/pages/preview/preview.vue D:/code/uniapp/pages/stele/preview.vue
  cp D:/code/other/libei/pages/photo/photo.vue D:/code/uniapp/pages/stele/photo.vue
  cp D:/code/other/libei/pages/help/help.vue D:/code/uniapp/pages/stele/help.vue

  # 组件（重命名 BeibeiWordPreview → WordPreview）
  mkdir -p D:/code/uniapp/components/stele
  cp D:/code/other/libei/components/BeibeiWordPreview.vue D:/code/uniapp/components/stele/WordPreview.vue

  # composables
  mkdir -p D:/code/uniapp/composables/stele
  cp D:/code/other/libei/composables/useOrderForm.ts D:/code/uniapp/composables/stele/useOrderForm.ts

  # utils（重命名）
  mkdir -p D:/code/uniapp/utils/stele
  cp D:/code/other/libei/utils/beibei-utils.ts D:/code/uniapp/utils/stele/stele-utils.ts
  cp D:/code/other/libei/utils/beibei-word-preview.css D:/code/uniapp/utils/stele/word-preview.css

  # types
  mkdir -p D:/code/uniapp/types
  cp D:/code/other/libei/types/order.ts D:/code/uniapp/types/order.ts
  ```

- [ ] **Step 2: 更新 import 路径**

  由于 libei 的页面在 `pages/xxx/xxx.vue`（子目录格式），迁移后变为 `pages/stele/xxx.vue`（扁平格式），相对路径深度从 `../../` 变为 `../../`，**深度不变**。但文件名引用需要更新：

  **所有 6 个页面中的 import 替换规则：**

  | 原 import | 新 import |
  |-----------|-----------|
  | `../../utils/beibei-utils` | `../../utils/stele/stele-utils` |
  | `../../composables/useOrderForm` | `../../composables/stele/useOrderForm` |
  | `../../components/BeibeiWordPreview.vue` | `../../components/stele/WordPreview.vue` |
  | `../../types/order` | `../../types/order`（不变） |

  **影响的文件及具体行：**
  - `pages/stele/index.vue`: 改 3 处（beibei-utils → stele/stele-utils, useOrderForm → stele/useOrderForm, BeibeiWordPreview → stele/WordPreview）
  - `pages/stele/detail.vue`: 改 3 处（同上）
  - `pages/stele/list.vue`: 无外部 import 需改（只 import vue 和 types/order）
  - `pages/stele/preview.vue`: 无需改（只 import vue 和 three）
  - `pages/stele/photo.vue`: 无需改
  - `pages/stele/help.vue`: 无需改

  **注意**：libei 页面原路径格式为 `pages/xxx/xxx.vue`（如 `pages/index/index.vue`），新路径为 `pages/stele/xxx.vue`（如 `pages/stele/index.vue`）。原来的相对路径 `../../` 指向项目根，新的也是 `../../` 指向项目根，深度一致，不需要改相对路径前缀。

  **组件内 import 替换：**
  - `components/stele/WordPreview.vue`:
    - `../types/order` → `../../types/order`（深度变了：原来在 components/ 下，现在在 components/stele/ 下）
    - `@import '../utils/beibei-word-preview.css'` → `@import '../../utils/stele/word-preview.css'`

  **composables 内 import 替换：**
  - `composables/stele/useOrderForm.ts`:
    - `../types/order` → `../../types/order`（深度变了）
    - beibei-utils 的 import：如果原来是 `import { ... } from '../utils/beibei-utils'`，需改为 `import { ... } from '../../utils/stele/stele-utils'`

  注意检查 useOrderForm.ts 的实际 import（原文件 import 了 `'../utils/beibei-utils'`、`'../types/order'`）：
  - `../utils/beibei-utils` → `../../utils/stele/stele-utils`
  - `../types/order` → `../../types/order`

- [ ] **Step 3: 更新页面内路由跳转**

  搜索所有 `uni.navigateTo`、`uni.redirectTo`、`uni.reLaunch` 调用，替换路由路径：

  | 原路由 | 新路由 |
  |--------|--------|
  | `/pages/index/index` | `/pages/stele/index` |
  | `/pages/list/list` | `/pages/stele/list` |
  | `/pages/detail/detail` | `/pages/stele/detail` |
  | `/pages/preview/preview` | `/pages/stele/preview` |
  | `/pages/photo/photo` | `/pages/stele/photo` |
  | `/pages/help/help` | `/pages/stele/help` |

  在所有 6 个 stele 页面中全局替换。注意带参数的路由（如 `/pages/detail/detail?id=xxx`），只替换路径部分。

- [ ] **Step 4: 安装碑文模块依赖**

  碑文模块额外依赖（检查 libei 的 package.json 确认）：
  ```bash
  npm install element-plus vuedraggable three html2canvas
  ```

  `main.js` 中需要注册 ElementPlus：
  ```js
  // main.js 追加
  import ElementPlus from 'element-plus'
  import 'element-plus/dist/index.css'
  // 在 createApp 中：app.use(ElementPlus)
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add pages/stele/ components/stele/ composables/stele/ utils/stele/ types/ main.js package.json && git commit -m "feat: migrate stele module (6 pages + component + composables + utils + types)"
  ```

---

### Task 5: 碑文云函数 + DB Schema 迁移

**Files:**
- Copy from: `D:/code/other/libei/uniCloud-alipay/cloudfunctions/` (11 个云函数) → `uniCloud-alipay/cloudfunctions/`
- Copy from: `D:/code/other/libei/uniCloud-alipay/database/` (3 个 schema) → `uniCloud-alipay/database/`

- [ ] **Step 1: 复制云函数**
  ```bash
  mkdir -p D:/code/uniapp/uniCloud-alipay/cloudfunctions
  for fn in order-query order-update order-delete album-create album-list album-update album-delete photo-insert photo-list photo-delete file-upload; do
    cp -r D:/code/other/libei/uniCloud-alipay/cloudfunctions/$fn D:/code/uniapp/uniCloud-alipay/cloudfunctions/
  done
  ```

- [ ] **Step 2: 复制 DB Schema**
  ```bash
  mkdir -p D:/code/uniapp/uniCloud-alipay/database
  cp D:/code/other/libei/uniCloud-alipay/database/order.schema.json D:/code/uniapp/uniCloud-alipay/database/
  cp D:/code/other/libei/uniCloud-alipay/database/albums.schema.json D:/code/uniapp/uniCloud-alipay/database/
  cp D:/code/other/libei/uniCloud-alipay/database/photos.schema.json D:/code/uniapp/uniCloud-alipay/database/
  ```

  云函数和 schema 均为 uniCloud-alipay → uniCloud-alipay，无需修改服务商相关代码。

- [ ] **Step 3: Commit**
  ```bash
  git add uniCloud-alipay/ && git commit -m "feat: migrate stele cloud functions (11) and DB schemas (3)"
  ```

---

## Phase 3: 学习模块迁移

### Task 6: 学习模块页面 + 组件 + store + utils + static 迁移

**Files:**
- Copy from: `D:/code/other/kids-learn/kids-learn/pages/index/index.vue` → `pages/study/index.vue`
- Copy from: `D:/code/other/kids-learn/kids-learn/pages/pinyin/pinyin.vue` → `pages/study/pinyin.vue`
- Copy from: `D:/code/other/kids-learn/kids-learn/pages/stroke/stroke.vue` → `pages/study/stroke.vue`
- Copy from: `D:/code/other/kids-learn/kids-learn/pages/math/math.vue` → `pages/study/math.vue`
- Copy from: `D:/code/other/kids-learn/kids-learn/pages/mental-math/mental-math.vue` → `pages/study/mental-math.vue`
- Copy from: `D:/code/other/kids-learn/kids-learn/pages/result/result.vue` → `pages/study/result.vue`
- Copy from: `D:/code/other/kids-learn/kids-learn/components/QuestionCard.vue` → `components/study/QuestionCard.vue`
- Copy from: `D:/code/other/kids-learn/kids-learn/components/StarBar.vue` → `components/study/StarBar.vue`
- Copy from: `D:/code/other/kids-learn/kids-learn/components/StrokeAnim.vue` → `components/study/StrokeAnim.vue`
- Copy from: `D:/code/other/kids-learn/kids-learn/store/game.js` → `store/game.js`
- Copy from: `D:/code/other/kids-learn/kids-learn/utils/questionHelper.js` → `utils/study/questionHelper.js`
- Copy from: `D:/code/other/kids-learn/kids-learn/utils/mathGen.js` → `utils/study/mathGen.js`
- Copy from: `D:/code/other/kids-learn/kids-learn/static/data/pinyin.json` → `static/data/pinyin.json`
- Copy from: `D:/code/other/kids-learn/kids-learn/static/data/strokes.json` → `static/data/strokes.json`
- Copy from: `D:/code/other/kids-learn/kids-learn/static/css/common.css` → `static/css/common.css`

- [ ] **Step 1: 复制所有文件**
  ```bash
  # 页面（只复制学习相关的 7 个，不含 interview-* 页面）
  mkdir -p D:/code/uniapp/pages/study
  cp D:/code/other/kids-learn/kids-learn/pages/index/index.vue D:/code/uniapp/pages/study/index.vue
  cp D:/code/other/kids-learn/kids-learn/pages/pinyin/pinyin.vue D:/code/uniapp/pages/study/pinyin.vue
  cp D:/code/other/kids-learn/kids-learn/pages/stroke/stroke.vue D:/code/uniapp/pages/study/stroke.vue
  cp D:/code/other/kids-learn/kids-learn/pages/math/math.vue D:/code/uniapp/pages/study/math.vue
  cp D:/code/other/kids-learn/kids-learn/pages/mental-math/mental-math.vue D:/code/uniapp/pages/study/mental-math.vue
  cp D:/code/other/kids-learn/kids-learn/pages/result/result.vue D:/code/uniapp/pages/study/result.vue

  # 组件
  mkdir -p D:/code/uniapp/components/study
  cp D:/code/other/kids-learn/kids-learn/components/QuestionCard.vue D:/code/uniapp/components/study/QuestionCard.vue
  cp D:/code/other/kids-learn/kids-learn/components/StarBar.vue D:/code/uniapp/components/study/StarBar.vue
  cp D:/code/other/kids-learn/kids-learn/components/StrokeAnim.vue D:/code/uniapp/components/study/StrokeAnim.vue

  # store
  mkdir -p D:/code/uniapp/store
  cp D:/code/other/kids-learn/kids-learn/store/game.js D:/code/uniapp/store/game.js

  # utils
  mkdir -p D:/code/uniapp/utils/study
  cp D:/code/other/kids-learn/kids-learn/utils/questionHelper.js D:/code/uniapp/utils/study/questionHelper.js
  cp D:/code/other/kids-learn/kids-learn/utils/mathGen.js D:/code/uniapp/utils/study/mathGen.js

  # static
  mkdir -p D:/code/uniapp/static/data
  mkdir -p D:/code/uniapp/static/css
  cp D:/code/other/kids-learn/kids-learn/static/data/pinyin.json D:/code/uniapp/static/data/pinyin.json
  cp D:/code/other/kids-learn/kids-learn/static/data/strokes.json D:/code/uniapp/static/data/strokes.json
  cp D:/code/other/kids-learn/kids-learn/static/css/common.css D:/code/uniapp/static/css/common.css
  ```

- [ ] **Step 2: 更新页面 import 路径**

  kids-learn 原页面格式为 `pages/xxx/xxx.vue`（如 `pages/pinyin/pinyin.vue`），新路径为 `pages/study/xxx.vue`。相对路径 `../../` 仍指向项目根，深度不变。

  **需要修改的 import 路径（所有 study 页面）：**

  | 原 import | 新 import |
  |-----------|-----------|
  | `../../store/game.js` | `../../store/game.js`（不变） |
  | `../../utils/questionHelper.js` | `../../utils/study/questionHelper.js` |
  | `../../utils/mathGen.js` | `../../utils/study/mathGen.js` |
  | `../../utils/speech.js` | `../../utils/common/speech.js` |
  | `../../components/QuestionCard.vue` | `../../components/study/QuestionCard.vue` |
  | `../../components/StarBar.vue` | `../../components/study/StarBar.vue` |
  | `../../components/StrokeAnim.vue` | `../../components/study/StrokeAnim.vue` |
  | `../../static/data/pinyin.json` | `../../static/data/pinyin.json`（不变） |
  | `../../static/data/strokes.json` | `../../static/data/strokes.json`（不变） |

  **影响的文件及具体改动：**
  - `pages/study/index.vue`: `../../store/game.js` 不变
  - `pages/study/pinyin.vue`: `questionHelper.js` → `study/questionHelper.js`, `QuestionCard` → `study/QuestionCard`, `StarBar` → `study/StarBar`
  - `pages/study/stroke.vue`: `questionHelper.js` → `study/questionHelper.js`, `speech.js` → `common/speech.js`, `StarBar` → `study/StarBar`, `StrokeAnim` → `study/StrokeAnim`
  - `pages/study/math.vue`: `mathGen.js` → `study/mathGen.js`, `StarBar` → `study/StarBar`, `QuestionCard` → `study/QuestionCard`
  - `pages/study/mental-math.vue`: `mathGen.js` → `study/mathGen.js`
  - `pages/study/result.vue`: 无外部 import 需改

  **组件内 import 替换：**
  - `components/study/QuestionCard.vue`: `../utils/speech.js` → `../../utils/common/speech.js`（深度变了：原 components/ → 现 components/study/）
  - `components/study/StrokeAnim.vue`: 无外部 import 需改（只 import vue 和 hanzi-writer）

  **store 内 import 替换：**
  - `store/game.js`: `../utils/storage.js` → `../utils/common/storage.js`

  **utils 内 import 替换：**
  - `utils/study/mathGen.js`: `./questionHelper.js` → `./questionHelper.js`（不变，同目录）

- [ ] **Step 3: 更新页面内路由跳转**

  搜索所有 `uni.navigateTo`、`uni.redirectTo`、`uni.reLaunch` 调用，替换路由路径：

  | 原路由 | 新路由 |
  |--------|--------|
  | `/pages/pinyin/pinyin` | `/pages/study/pinyin` |
  | `/pages/stroke/stroke` | `/pages/study/stroke` |
  | `/pages/math/math` | `/pages/study/math` |
  | `/pages/mental-math/mental-math` | `/pages/study/mental-math` |
  | `/pages/result/result` | `/pages/study/result` |
  | `/pages/index/index` | `/pages/study/index`（学习模块内的返回首页） |

  另外，`pages/study/index.vue` 中原来可能有跳转到面试页面的入口（因为 kids-learn 项目含面试模块），需要**移除**面试相关入口/按钮/路由。

- [ ] **Step 4: 修改 study/index.vue**

  kids-learn 的首页 `pages/index/index.vue` 包含学习模块入口和面试入口。迁移到 `pages/study/index.vue` 后：
  - 移除面试相关的入口卡片/按钮
  - 保留学习模块（拼音、笔顺、算术、口算）的入口
  - 后续 Task 13 会在此页面添加"错题本"入口

- [ ] **Step 5: Commit**
  ```bash
  git add pages/study/ components/study/ store/ utils/study/ static/ && git commit -m "feat: migrate study module (7 pages + 3 components + store + utils + static data)"
  ```

---

### Task 7: 学习模块完整性验证

**Files:**
- 无新文件

- [ ] **Step 1: 验证文件完整性**
  检查所有文件是否复制完整，import 路径是否全部更新：
  ```bash
  # 检查是否有残留的旧路径引用
  grep -rn "../../utils/questionHelper\." D:/code/uniapp/pages/study/
  grep -rn "../../utils/mathGen\." D:/code/uniapp/pages/study/
  grep -rn "../../utils/speech\." D:/code/uniapp/pages/study/
  grep -rn "../../components/QuestionCard\." D:/code/uniapp/pages/study/
  grep -rn "../../components/StarBar\." D:/code/uniapp/pages/study/
  grep -rn "../../components/StrokeAnim\." D:/code/uniapp/pages/study/
  grep -rn "/pages/pinyin/pinyin" D:/code/uniapp/pages/study/
  grep -rn "/pages/stroke/stroke" D:/code/uniapp/pages/study/
  grep -rn "/pages/math/math" D:/code/uniapp/pages/study/
  grep -rn "/pages/mental-math/mental-math" D:/code/uniapp/pages/study/
  grep -rn "/pages/result/result" D:/code/uniapp/pages/study/
  grep -rn "interview" D:/code/uniapp/pages/study/index.vue
  ```
  以上命令应该全部无输出（无匹配）。如有残留，逐一修复。

- [ ] **Step 2: 验证 store 引用链**
  ```bash
  grep -rn "../utils/storage\." D:/code/uniapp/store/
  ```
  应该匹配到 `../utils/common/storage.js`，不应有 `../utils/storage.js`。

- [ ] **Step 3: HBuilderX 编译检查**
  在 HBuilderX 中运行到浏览器，确认学习模块各页面可正常打开、无 import 报错。

- [ ] **Step 4: Commit（如有修复）**
  ```bash
  git add -A && git commit -m "fix: fix remaining import paths in study module"
  ```

---

## Phase 4: 面试助手迁移

### Task 8: 面试页面 + composables + utils 迁移

**Files:**
- Copy from: `D:/code/other/kids-learn/interview-practice/pages/index/index.vue` → `pages/interview/index.vue`
- Copy from: `D:/code/other/kids-learn/interview-practice/pages/practice/practice.vue` → `pages/interview/practice.vue`
- Copy from: `D:/code/other/kids-learn/interview-practice/pages/records/records.vue` → `pages/interview/records.vue`
- Copy from: `D:/code/other/kids-learn/interview-practice/pages/record-detail/record-detail.vue` → `pages/interview/record-detail.vue`
- Copy from: `D:/code/other/kids-learn/interview-practice/pages/exam-result/exam-result.vue` → `pages/interview/exam-result.vue`
- Copy from: `D:/code/other/kids-learn/interview-practice/pages/settings/settings.vue` → `pages/interview/settings.vue`
- Copy from: `D:/code/other/kids-learn/interview-practice/composables/useTimer.js` → `composables/interview/useTimer.js`
- Copy from: `D:/code/other/kids-learn/interview-practice/utils/constants.js` → `utils/interview/constants.js`

- [ ] **Step 1: 复制所有文件**
  ```bash
  # 页面
  mkdir -p D:/code/uniapp/pages/interview
  cp D:/code/other/kids-learn/interview-practice/pages/index/index.vue D:/code/uniapp/pages/interview/index.vue
  cp D:/code/other/kids-learn/interview-practice/pages/practice/practice.vue D:/code/uniapp/pages/interview/practice.vue
  cp D:/code/other/kids-learn/interview-practice/pages/records/records.vue D:/code/uniapp/pages/interview/records.vue
  cp D:/code/other/kids-learn/interview-practice/pages/record-detail/record-detail.vue D:/code/uniapp/pages/interview/record-detail.vue
  cp D:/code/other/kids-learn/interview-practice/pages/exam-result/exam-result.vue D:/code/uniapp/pages/interview/exam-result.vue
  cp D:/code/other/kids-learn/interview-practice/pages/settings/settings.vue D:/code/uniapp/pages/interview/settings.vue

  # composables
  mkdir -p D:/code/uniapp/composables/interview
  cp D:/code/other/kids-learn/interview-practice/composables/useTimer.js D:/code/uniapp/composables/interview/useTimer.js

  # utils
  mkdir -p D:/code/uniapp/utils/interview
  cp D:/code/other/kids-learn/interview-practice/utils/constants.js D:/code/uniapp/utils/interview/constants.js
  ```

- [ ] **Step 2: 更新 import 路径**

  interview 原页面格式为 `pages/xxx/xxx.vue`，新路径为 `pages/interview/xxx.vue`。相对路径 `../../` 深度不变。

  | 原 import | 新 import |
  |-----------|-----------|
  | `../../utils/constants` | `../../utils/interview/constants` |
  | `../../composables/useTimer` | `../../composables/interview/useTimer` |
  | `../../composables/useAuth` | 移除，改用 `useAuth` from `../../composables/common/useAuth.js` |

  **影响的文件：**
  - `pages/interview/index.vue`: `../../utils/constants` → `../../utils/interview/constants`
  - `pages/interview/practice.vue`: `../../utils/constants` → `../../utils/interview/constants`, `../../composables/useTimer` → `../../composables/interview/useTimer`
  - `pages/interview/records.vue`: `../../utils/constants` → `../../utils/interview/constants`
  - `pages/interview/record-detail.vue`: `../../utils/constants` → `../../utils/interview/constants`
  - `pages/interview/settings.vue`: `../../utils/constants` → `../../utils/interview/constants`
  - `pages/interview/exam-result.vue`: 无外部工具 import 需改

- [ ] **Step 3: user_id → username 全局替换**

  面试模块中所有 `user_id` 引用需替换为 `username`：

  **页面中的 `uni.getStorageSync('user_id')` 替换为 `uni.getStorageSync('username')`**

  涉及文件（基于源码 grep 结果）：
  - `pages/interview/index.vue` (2 处): `userId: uni.getStorageSync('user_id')` → `username: uni.getStorageSync('username')`
  - `pages/interview/practice.vue` (4 处):
    - `user_id: uni.getStorageSync('user_id')` → `username: uni.getStorageSync('username')`
    - `userId: uni.getStorageSync('user_id')` → `username: uni.getStorageSync('username')`
  - `pages/interview/settings.vue` (2 处): `user_id: uni.getStorageSync('user_id')` → `username: uni.getStorageSync('username')`

  **注意**：云函数端的 `userId` 参数名也需要对应改为 `username`（在 Task 9 中处理）。这里页面端统一改为传 `username` 参数。

- [ ] **Step 4: 更新页面内路由跳转**

  | 原路由 | 新路由 |
  |--------|--------|
  | `/pages/practice/practice` | `/pages/interview/practice` |
  | `/pages/records/records` | `/pages/interview/records` |
  | `/pages/record-detail/record-detail` | `/pages/interview/record-detail` |
  | `/pages/exam-result/exam-result` | `/pages/interview/exam-result` |
  | `/pages/settings/settings` | `/pages/interview/settings` |
  | `/pages/index/index` | `/pages/interview/index` |

  在所有 6 个 interview 页面中全局替换。

- [ ] **Step 5: 移除 tabBar 依赖**

  interview 原项目有 tabBar（首页/记录/设置），迁移后不再使用 tabBar（统一平台用 navigateTo）。检查页面中是否有 `uni.switchTab` 调用，替换为 `uni.navigateTo` 或 `uni.redirectTo`。

- [ ] **Step 6: Commit**
  ```bash
  git add pages/interview/ composables/interview/ utils/interview/ && git commit -m "feat: migrate interview module (6 pages + useTimer + constants), user_id -> username"
  ```

---

### Task 9: 面试云函数 + DB Schema 迁移

**Files:**
- Copy from: `D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/cloudfunctions/generate-question/` → `uniCloud-alipay/cloudfunctions/generate-question/`
- Copy from: `D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/cloudfunctions/review-answer/` → `uniCloud-alipay/cloudfunctions/review-answer/`
- Copy from: `D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/cloudfunctions/exam-summary/` → `uniCloud-alipay/cloudfunctions/exam-summary/`
- Copy from: `D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/database/practice_records.schema.json` → `uniCloud-alipay/database/interview_records.schema.json`
- Copy from: `D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/database/exam_sessions.schema.json` → `uniCloud-alipay/database/exam_sessions.schema.json`
- Copy from: `D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/database/settings.schema.json` → `uniCloud-alipay/database/interview_settings.schema.json`
- Copy from: `D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/database/questions.schema.json` → `uniCloud-alipay/database/interview_questions.schema.json`

- [ ] **Step 1: 复制云函数**
  ```bash
  cp -r D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/cloudfunctions/generate-question D:/code/uniapp/uniCloud-alipay/cloudfunctions/
  cp -r D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/cloudfunctions/review-answer D:/code/uniapp/uniCloud-alipay/cloudfunctions/
  cp -r D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/cloudfunctions/exam-summary D:/code/uniapp/uniCloud-alipay/cloudfunctions/
  ```

- [ ] **Step 2: 复制并重命名 DB Schema**
  ```bash
  cp D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/database/practice_records.schema.json D:/code/uniapp/uniCloud-alipay/database/interview_records.schema.json
  cp D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/database/exam_sessions.schema.json D:/code/uniapp/uniCloud-alipay/database/exam_sessions.schema.json
  cp D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/database/settings.schema.json D:/code/uniapp/uniCloud-alipay/database/interview_settings.schema.json
  cp D:/code/other/kids-learn/interview-practice/uniCloud-aliyun/database/questions.schema.json D:/code/uniapp/uniCloud-alipay/database/interview_questions.schema.json
  ```

- [ ] **Step 3: 修改云函数中的表名和字段名**

  **generate-question/index.js：**
  - `db.collection('settings')` → `db.collection('interview_settings')`
  - `db.collection('questions')` → `db.collection('interview_questions')`
  - `{ user_id: uid }` → `{ username: uid }`（where 条件）
  - `user_id: uid` → `username: uid`（add 数据）
  - `event.userId` → `event.username`

  **review-answer/index.js：**
  - `db.collection('settings')` → `db.collection('interview_settings')`
  - `db.collection('practice_records')` → `db.collection('interview_records')`
  - `{ user_id: uid }` → `{ username: uid }`
  - `event.userId` → `event.username`

  **exam-summary/index.js：**
  - `db.collection('settings')` → `db.collection('interview_settings')`
  - `db.collection('practice_records')` → `db.collection('interview_records')`
  - `db.collection('exam_sessions')` 不变
  - `{ user_id: uid }` → `{ username: uid }`
  - `user_id: uid` → `username: uid`（add 数据）
  - `event.userId` → `event.username`

- [ ] **Step 4: 修改 DB Schema 中的字段名**

  在 4 个 schema 文件中，将 `user_id` 替换为 `username`：
  - `interview_records.schema.json`: `"required"` 中 `"user_id"` → `"username"`, `"properties"` 中 `"user_id"` → `"username"`, description 改为 `"用户名"`
  - `exam_sessions.schema.json`: 同上
  - `interview_settings.schema.json`: 同上
  - `interview_questions.schema.json`: 同上

- [ ] **Step 5: 同步更新页面端的云函数调用参数**

  确认 Task 8 中页面端传给云函数的参数名已从 `userId` 改为 `username`。检查：
  ```bash
  grep -rn "userId" D:/code/uniapp/pages/interview/
  ```
  应该全部替换为 `username`。

- [ ] **Step 6: Commit**
  ```bash
  git add uniCloud-alipay/ && git commit -m "feat: migrate interview cloud functions (3) and DB schemas (4), rename tables and user_id -> username"
  ```

---

## Phase 5: 云数据库层 + 错题本

### Task 10: 新增学习模块 DB Schema + 种子脚本框架

**Files:**
- Create: `uniCloud-alipay/database/questions.schema.json`
- Create: `uniCloud-alipay/database/wrong_records.schema.json`
- Create: `uniCloud-alipay/database/practice_logs.schema.json`
- Create: `scripts/seed-questions.js`

- [ ] **Step 1: questions.schema.json**

```json
{
  "bsonType": "object",
  "required": ["type", "unit", "char"],
  "permission": {
    "read": true,
    "create": true,
    "update": true,
    "delete": true
  },
  "properties": {
    "_id": { "description": "ID" },
    "type": {
      "bsonType": "string",
      "description": "题目类型",
      "enum": ["pinyin", "stroke"]
    },
    "unit": { "bsonType": "string", "description": "单元，如 1-2" },
    "char": { "bsonType": "string", "description": "汉字" },
    "pinyin": { "bsonType": "string", "description": "正确拼音（拼音题）" },
    "distractors": {
      "bsonType": "array",
      "description": "拼音干扰项（拼音题）",
      "items": { "bsonType": "string" }
    },
    "char_distractors": {
      "bsonType": "array",
      "description": "汉字干扰项（拼音题）",
      "items": { "bsonType": "string" }
    },
    "strokes": {
      "bsonType": "array",
      "description": "笔顺数组（笔顺题）",
      "items": { "bsonType": "string" }
    },
    "strokeCount": { "bsonType": "int", "description": "笔画数（笔顺题）" }
  }
}
```

- [ ] **Step 2: wrong_records.schema.json**

```json
{
  "bsonType": "object",
  "required": ["username", "question_id", "type", "char"],
  "permission": {
    "read": true,
    "create": true,
    "update": true,
    "delete": true
  },
  "properties": {
    "_id": { "description": "ID" },
    "username": { "bsonType": "string", "description": "用户名" },
    "question_id": { "bsonType": "string", "description": "题目ID" },
    "type": {
      "bsonType": "string",
      "description": "题目类型",
      "enum": ["pinyin", "stroke"]
    },
    "char": { "bsonType": "string", "description": "汉字（冗余）" },
    "unit": { "bsonType": "string", "description": "单元（冗余）" },
    "wrongCount": { "bsonType": "int", "description": "累计错误次数" },
    "correctCount": { "bsonType": "int", "description": "重练连续答对次数" },
    "mastered": { "bsonType": "bool", "description": "是否已掌握（连对2次）" },
    "lastWrongAt": { "bsonType": "timestamp", "description": "最后错误时间" },
    "createdAt": { "bsonType": "timestamp", "description": "创建时间" }
  }
}
```

- [ ] **Step 3: practice_logs.schema.json**

```json
{
  "bsonType": "object",
  "required": ["username", "type", "date", "totalCount", "correctCount"],
  "permission": {
    "read": true,
    "create": true,
    "update": true,
    "delete": true
  },
  "properties": {
    "_id": { "description": "ID" },
    "username": { "bsonType": "string", "description": "用户名" },
    "type": {
      "bsonType": "string",
      "description": "练习类型",
      "enum": ["pinyin", "stroke"]
    },
    "date": { "bsonType": "string", "description": "日期 YYYY-MM-DD" },
    "totalCount": { "bsonType": "int", "description": "本轮总题数" },
    "correctCount": { "bsonType": "int", "description": "本轮正确数" },
    "createdAt": { "bsonType": "timestamp", "description": "创建时间" }
  }
}
```

- [ ] **Step 4: scripts/seed-questions.js**

```js
// scripts/seed-questions.js
// 题库上传脚本框架
// 用法：在 HBuilderX 中运行，或通过云函数调用
// 数据待用户提供后填入 questionsData 数组

'use strict'
const db = uniCloud.database()

const questionsData = [
  // 数据待提供，格式示例：
  // { type: 'pinyin', unit: '1-1', char: '花', pinyin: 'huā', distractors: ['huà', 'huá', 'hā'], char_distractors: ['化', '画', '话'] },
  // { type: 'stroke', unit: '1-1', char: '上', strokes: ['竖', '横', '横'], strokeCount: 3 },
]

async function seed() {
  if (questionsData.length === 0) {
    console.log('暂无题目数据，请先填入 questionsData 数组')
    return
  }

  console.log(`开始上传 ${questionsData.length} 道题目...`)

  let success = 0
  let skip = 0
  let fail = 0

  for (const q of questionsData) {
    try {
      // 检查是否已存在（type + char 唯一）
      const existing = await db.collection('questions')
        .where({ type: q.type, char: q.char })
        .limit(1)
        .get()

      if (existing.data && existing.data.length > 0) {
        skip++
        continue
      }

      await db.collection('questions').add(q)
      success++
    } catch (e) {
      console.error(`上传失败: ${q.char}`, e)
      fail++
    }
  }

  console.log(`上传完成：成功 ${success}，跳过 ${skip}，失败 ${fail}`)
}

// 如果作为云函数运行
exports.main = async (event, context) => {
  await seed()
  return { code: 0, msg: 'done' }
}
```

- [ ] **Step 5: Commit**
  ```bash
  git add uniCloud-alipay/database/questions.schema.json uniCloud-alipay/database/wrong_records.schema.json uniCloud-alipay/database/practice_logs.schema.json scripts/ && git commit -m "feat: add study DB schemas (questions, wrong_records, practice_logs) and seed script"
  ```

---

### Task 11: 错题本 + 练习日志工具函数

**Files:**
- Create: `utils/study/wrongBook.js`
- Create: `utils/study/practiceLog.js`

- [ ] **Step 1: utils/study/wrongBook.js**

```js
// utils/study/wrongBook.js
// 错题本操作封装 — 异步写入，不阻塞答题

import { queryCollection, addDocument, updateDocument } from '../common/cloudDb.js'

const db = uniCloud.database()

/**
 * 记录一道错题（答错时调用）
 * @param {string} username
 * @param {object} params - { type, char, unit, question_id }
 */
export async function recordWrong(username, { type, char, unit, question_id }) {
  try {
    // 查找已有记录
    const records = await queryCollection('wrong_records', {
      username,
      question_id
    }, { limit: 1 })

    if (records.length > 0) {
      // 已有记录：wrongCount+1, correctCount=0, mastered=false
      const record = records[0]
      await updateDocument('wrong_records', record._id, {
        wrongCount: (record.wrongCount || 0) + 1,
        correctCount: 0,
        mastered: false,
        lastWrongAt: Date.now()
      })
    } else {
      // 新记录
      await addDocument('wrong_records', {
        username,
        question_id,
        type,
        char,
        unit,
        wrongCount: 1,
        correctCount: 0,
        mastered: false,
        lastWrongAt: Date.now(),
        createdAt: Date.now()
      })
    }
  } catch (e) {
    console.error('记录错题失败:', e)
  }
}

/**
 * 重练答对（更新 correctCount，达 2 次 → mastered）
 * @param {string} recordId - wrong_records 的 _id
 * @param {number} currentCorrectCount - 当前连续答对次数
 */
export async function recordCorrect(recordId, currentCorrectCount) {
  try {
    const newCount = currentCorrectCount + 1
    const mastered = newCount >= 2

    await updateDocument('wrong_records', recordId, {
      correctCount: newCount,
      mastered
    })

    return { mastered, correctCount: newCount }
  } catch (e) {
    console.error('更新错题记录失败:', e)
    return { mastered: false, correctCount: currentCorrectCount }
  }
}

/**
 * 重练答错（wrongCount+1, correctCount=0, mastered=false）
 * @param {string} recordId
 * @param {number} currentWrongCount
 */
export async function recordWrongAgain(recordId, currentWrongCount) {
  try {
    await updateDocument('wrong_records', recordId, {
      wrongCount: (currentWrongCount || 0) + 1,
      correctCount: 0,
      mastered: false,
      lastWrongAt: Date.now()
    })
  } catch (e) {
    console.error('更新错题记录失败:', e)
  }
}

/**
 * 获取未掌握的错题列表
 * @param {string} username
 * @param {string} [type] - 可选，'pinyin' | 'stroke' | 不传则全部
 */
export async function getUnmasteredList(username, type) {
  const where = { username, mastered: false }
  if (type) where.type = type
  return queryCollection('wrong_records', where, {
    orderBy: { field: 'wrongCount', order: 'desc' },
    limit: 100
  })
}

/**
 * 获取全部错题列表（含已掌握）
 * @param {string} username
 * @param {string} [type]
 */
export async function getAllWrongList(username, type) {
  const where = { username }
  if (type) where.type = type
  return queryCollection('wrong_records', where, {
    orderBy: { field: 'wrongCount', order: 'desc' },
    limit: 200
  })
}

/**
 * 获取错题统计
 * @param {string} username
 */
export async function getWrongStats(username) {
  const all = await getAllWrongList(username)

  const pinyinCount = all.filter(r => r.type === 'pinyin').length
  const strokeCount = all.filter(r => r.type === 'stroke').length
  const unmasteredCount = all.filter(r => !r.mastered).length
  const masteredCount = all.filter(r => r.mastered).length

  // 高频错字 TOP5（未掌握，按 wrongCount 降序）
  const top5 = all
    .filter(r => !r.mastered)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5)

  return {
    total: all.length,
    pinyinCount,
    strokeCount,
    unmasteredCount,
    masteredCount,
    top5
  }
}
```

- [ ] **Step 2: utils/study/practiceLog.js**

```js
// utils/study/practiceLog.js
// 练习日志记录

import { addDocument, queryCollection } from '../common/cloudDb.js'

/**
 * 记录一轮练习
 * @param {string} username
 * @param {object} params - { type, totalCount, correctCount }
 */
export async function recordPractice(username, { type, totalCount, correctCount }) {
  try {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    await addDocument('practice_logs', {
      username,
      type,
      date,
      totalCount,
      correctCount,
      createdAt: Date.now()
    })
  } catch (e) {
    console.error('记录练习日志失败:', e)
  }
}

/**
 * 获取近 N 天的练习日志（趋势图用）
 * @param {string} username
 * @param {number} days - 天数，默认 7
 */
export async function getRecentLogs(username, days = 7) {
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`

  const logs = await queryCollection('practice_logs', {
    username,
    date: uniCloud.database().command.gte(startStr)
  }, {
    orderBy: { field: 'date', order: 'asc' },
    limit: 200
  })

  // 按日期聚合
  const dailyMap = {}
  for (const log of logs) {
    if (!dailyMap[log.date]) {
      dailyMap[log.date] = { total: 0, correct: 0 }
    }
    dailyMap[log.date].total += log.totalCount
    dailyMap[log.date].correct += log.correctCount
  }

  // 生成连续日期数组（含无数据的日期）
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const day = dailyMap[dateStr]
    result.push({
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      total: day ? day.total : 0,
      correct: day ? day.correct : 0,
      rate: day && day.total > 0 ? Math.round(day.correct / day.total * 100) : null
    })
  }

  return result
}
```

- [ ] **Step 3: Commit**
  ```bash
  git add utils/study/wrongBook.js utils/study/practiceLog.js && git commit -m "feat: add wrongBook and practiceLog utility functions"
  ```

---

### Task 12: 拼音/笔顺页面接入云端题库 + 错题记录 + 练习日志

**Files:**
- Modify: `pages/study/pinyin.vue`
- Modify: `pages/study/stroke.vue`

- [ ] **Step 1: 修改 pinyin.vue — 接入云端题库**

  在 pinyin.vue 中增加云端题库拉取逻辑：

  ```js
  // 新增 import
  import { getQuestions } from '../../utils/common/cloudDb.js'
  import { recordWrong } from '../../utils/study/wrongBook.js'
  import { recordPractice } from '../../utils/study/practiceLog.js'
  import { useAuth } from '../../composables/common/useAuth.js'
  ```

  **出题逻辑改造：**
  - 页面加载时，先尝试 `getQuestions('pinyin', currentUnit)` 从云端拉取题库
  - 如果云端有数据，用云端数据出题（每题有 `_id`，可关联错题本）
  - 如果云端无数据（null），降级用本地 `pinyin.json`（此时无法记录错题，因为无 question_id）
  - 显示一个小标签区分"云端题库"还是"本地题库"

  **错题记录：**
  - 在答错回调中，如果是云端题目（有 `_id`），异步调用 `recordWrong(username, { type: 'pinyin', char, unit, question_id: item._id })`
  - 不阻塞答题流程

  **练习日志：**
  - 在本轮结束（跳转 result 页之前），调用 `recordPractice(username, { type: 'pinyin', totalCount, correctCount })`

  具体改动点需要在实施时对照完整的 pinyin.vue 源码进行。核心逻辑：
  1. 在 `onShow` 或 `onMounted` 中加入云端拉取
  2. 将 `pinyinData` 的使用改为优先使用 `cloudData`
  3. 在答错处加 `recordWrong` 调用
  4. 在轮次结束处加 `recordPractice` 调用

- [ ] **Step 2: 修改 stroke.vue — 同理接入**

  ```js
  // 新增 import
  import { getQuestions } from '../../utils/common/cloudDb.js'
  import { recordWrong } from '../../utils/study/wrongBook.js'
  import { recordPractice } from '../../utils/study/practiceLog.js'
  import { useAuth } from '../../composables/common/useAuth.js'
  ```

  改造逻辑与 pinyin.vue 相同：
  1. 云端拉取 `getQuestions('stroke', currentUnit)`
  2. 降级用本地 `strokes.json`
  3. 答错时 `recordWrong`
  4. 轮次结束时 `recordPractice`

- [ ] **Step 3: Commit**
  ```bash
  git add pages/study/pinyin.vue pages/study/stroke.vue && git commit -m "feat: integrate cloud question bank + wrong book recording + practice logging in pinyin and stroke pages"
  ```

---

### Task 13: TrendChart 组件 + 错题本主页

**Files:**
- Create: `components/common/TrendChart.vue`
- Create: `pages/study/wrong-book.vue`
- Modify: `pages/study/index.vue`（添加错题本入口）

- [ ] **Step 1: components/common/TrendChart.vue**

```vue
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
```

- [ ] **Step 2: pages/study/wrong-book.vue**

```vue
<template>
  <view class="container">
    <!-- 头部 -->
    <view class="header">
      <text class="back" @click="goBack">←</text>
      <text class="title">错题本</text>
    </view>

    <!-- 统计概览 -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-num">{{ stats.pinyinCount }}</text>
        <text class="stat-label">拼音错题</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ stats.strokeCount }}</text>
        <text class="stat-label">笔顺错题</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ stats.unmasteredCount }}</text>
        <text class="stat-label">待掌握</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ stats.masteredCount }}</text>
        <text class="stat-label">已掌握</text>
      </view>
    </view>

    <!-- 正确率趋势 -->
    <view class="section" v-if="trendData.length > 0">
      <TrendChart :data="trendData" title="近 7 天正确率" />
    </view>

    <!-- 高频错字 TOP5 -->
    <view class="section" v-if="stats.top5 && stats.top5.length > 0">
      <text class="section-title">高频错字 TOP5</text>
      <view class="top5-list">
        <view class="top5-item" v-for="(item, i) in stats.top5" :key="item._id">
          <text class="top5-rank">{{ i + 1 }}</text>
          <text class="top5-char">{{ item.char }}</text>
          <text class="top5-type">{{ item.type === 'pinyin' ? '拼音' : '笔顺' }}</text>
          <text class="top5-count">错 {{ item.wrongCount }} 次</text>
        </view>
      </view>
    </view>

    <!-- 筛选 -->
    <view class="filter-row">
      <text
        :class="['filter-btn', filter === '' && 'active']"
        @click="filter = ''"
      >全部</text>
      <text
        :class="['filter-btn', filter === 'pinyin' && 'active']"
        @click="filter = 'pinyin'"
      >拼音</text>
      <text
        :class="['filter-btn', filter === 'stroke' && 'active']"
        @click="filter = 'stroke'"
      >笔顺</text>
    </view>

    <!-- 错题列表 -->
    <view class="wrong-list">
      <view
        v-for="item in filteredList"
        :key="item._id"
        :class="['wrong-item', item.mastered && 'mastered']"
      >
        <view class="wrong-char">{{ item.char }}</view>
        <view class="wrong-info">
          <text class="wrong-type">{{ item.type === 'pinyin' ? '拼音' : '笔顺' }}</text>
          <text class="wrong-unit">{{ item.unit }}</text>
        </view>
        <view class="wrong-meta">
          <text class="wrong-count">错 {{ item.wrongCount }} 次</text>
          <text v-if="item.mastered" class="mastered-badge">已掌握</text>
        </view>
      </view>

      <view v-if="filteredList.length === 0" class="empty">
        <text>暂无错题记录</text>
      </view>
    </view>

    <!-- 重练按钮 -->
    <view class="bottom-bar" v-if="stats.unmasteredCount > 0">
      <button class="practice-btn" @click="goPractice">
        开始重练（{{ stats.unmasteredCount }} 题未掌握）
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuth } from '../../composables/common/useAuth.js'
import { getAllWrongList, getWrongStats } from '../../utils/study/wrongBook.js'
import { getRecentLogs } from '../../utils/study/practiceLog.js'
import TrendChart from '../../components/common/TrendChart.vue'

const { getUsername } = useAuth()

const stats = ref({
  total: 0,
  pinyinCount: 0,
  strokeCount: 0,
  unmasteredCount: 0,
  masteredCount: 0,
  top5: []
})
const wrongList = ref([])
const trendData = ref([])
const filter = ref('')
const loading = ref(true)

const filteredList = computed(() => {
  if (!filter.value) return wrongList.value
  return wrongList.value.filter(item => item.type === filter.value)
})

async function loadData() {
  loading.value = true
  const username = getUsername()
  if (!username) {
    loading.value = false
    return
  }

  try {
    const [statsData, listData, logsData] = await Promise.all([
      getWrongStats(username),
      getAllWrongList(username),
      getRecentLogs(username, 7)
    ])

    stats.value = statsData
    wrongList.value = listData
    trendData.value = logsData.map(d => ({
      label: d.label,
      rate: d.rate
    }))
  } catch (e) {
    console.error('加载错题数据失败:', e)
  }
  loading.value = false
}

onShow(() => {
  loadData()
})

function goBack() {
  uni.navigateBack()
}

function goPractice() {
  uni.navigateTo({ url: '/pages/study/wrong-book-practice' })
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 120rpx;
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
}

.back {
  font-size: 36rpx;
  margin-right: 20rpx;
  color: #333;
}

.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.stats-row {
  display: flex;
  padding: 20rpx;
  gap: 16rpx;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 10rpx;
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
}

.section {
  margin: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.top5-list {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
}

.top5-item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.top5-item:last-child {
  border-bottom: none;
}

.top5-rank {
  width: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #ff6b6b;
  text-align: center;
}

.top5-char {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-left: 16rpx;
}

.top5-type {
  font-size: 22rpx;
  color: #999;
  margin-left: 12rpx;
}

.top5-count {
  margin-left: auto;
  font-size: 24rpx;
  color: #ff6b6b;
}

.filter-row {
  display: flex;
  padding: 20rpx;
  gap: 16rpx;
}

.filter-btn {
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background: #fff;
}

.filter-btn.active {
  background: #667eea;
  color: #fff;
}

.wrong-list {
  padding: 0 20rpx;
}

.wrong-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.wrong-item.mastered {
  opacity: 0.5;
}

.wrong-char {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  width: 80rpx;
  text-align: center;
}

.wrong-info {
  flex: 1;
  margin-left: 20rpx;
}

.wrong-type {
  font-size: 26rpx;
  color: #666;
}

.wrong-unit {
  font-size: 22rpx;
  color: #999;
  margin-left: 12rpx;
}

.wrong-meta {
  text-align: right;
}

.wrong-count {
  font-size: 24rpx;
  color: #ff6b6b;
}

.mastered-badge {
  display: block;
  font-size: 20rpx;
  color: #52c41a;
  margin-top: 4rpx;
}

.empty {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.practice-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  font-size: 30rpx;
  padding: 24rpx 0;
}
</style>
```

- [ ] **Step 3: 修改 pages/study/index.vue — 添加错题本入口**

  在学习首页的模块列表中添加错题本入口按钮/卡片：

  ```html
  <!-- 在现有模块入口之后添加 -->
  <view class="module-card" @click="goTo('/pages/study/wrong-book')">
    <text class="module-icon">📖</text>
    <text class="module-name">错题本</text>
  </view>
  ```

  在 `<script setup>` 中确认有 `goTo` 函数（或使用页面已有的路由跳转方式）。

- [ ] **Step 4: Commit**
  ```bash
  git add components/common/TrendChart.vue pages/study/wrong-book.vue pages/study/index.vue && git commit -m "feat: add TrendChart component and wrong-book page with stats, trend, and list"
  ```

---

### Task 14: 错题重练页面

**Files:**
- Create: `pages/study/wrong-book-practice.vue`

- [ ] **Step 1: pages/study/wrong-book-practice.vue**

```vue
<template>
  <view class="container">
    <!-- 头部进度 -->
    <view class="header">
      <text class="back" @click="goBack">←</text>
      <text class="title">错题重练</text>
      <text class="progress">{{ currentIndex + 1 }} / {{ questions.length }}</text>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <!-- 无错题 -->
    <view v-else-if="questions.length === 0" class="empty-state">
      <text class="empty-icon">🎉</text>
      <text class="empty-text">太棒了！没有未掌握的错题！</text>
      <button class="back-btn" @click="goBack">返回错题本</button>
    </view>

    <!-- 全部掌握 -->
    <view v-else-if="allMastered" class="empty-state">
      <text class="empty-icon">🏆</text>
      <text class="empty-text">太棒了！全部掌握！</text>
      <text class="sub-text">本轮正确 {{ correctCount }} / {{ questions.length }}</text>
      <button class="back-btn" @click="goBack">返回错题本</button>
    </view>

    <!-- 答题区 -->
    <view v-else class="practice-area">
      <!-- 拼音题 -->
      <view v-if="currentQuestion && currentQuestion.type === 'pinyin'" class="question-block">
        <text class="char-display">{{ currentQuestion.char }}</text>
        <text class="prompt">选择正确的拼音</text>
        <view class="options">
          <view
            v-for="(opt, i) in currentOptions"
            :key="i"
            :class="['option', selectedAnswer === opt && (isCorrect ? 'correct' : 'wrong')]"
            @click="checkAnswer(opt)"
          >
            <text>{{ opt }}</text>
          </view>
        </view>
      </view>

      <!-- 笔顺题 -->
      <view v-if="currentQuestion && currentQuestion.type === 'stroke'" class="question-block">
        <view class="stroke-top">
          <text class="char-display">{{ currentQuestion.char }}</text>
          <text class="stroke-count">{{ currentQuestion.strokeCount }} 画</text>
        </view>
        <text class="prompt">选择正确的笔顺</text>
        <view class="stroke-options">
          <view
            v-for="(opt, i) in currentOptions"
            :key="i"
            :class="['stroke-option', selectedAnswer === i && (isCorrect ? 'correct' : 'wrong')]"
            @click="checkStrokeAnswer(i, opt)"
          >
            <text>{{ opt.join(' → ') }}</text>
          </view>
        </view>
      </view>

      <!-- 反馈 -->
      <view v-if="showFeedback" class="feedback">
        <text v-if="isCorrect" class="feedback-correct">✓ 答对了！</text>
        <text v-if="isCorrect && justMastered" class="mastered-msg">已掌握此题！</text>
        <text v-if="!isCorrect" class="feedback-wrong">✗ 答错了</text>
        <button class="next-btn" @click="nextQuestion">
          {{ currentIndex < questions.length - 1 ? '下一题' : '查看结果' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../composables/common/useAuth.js'
import { getUnmasteredList, recordCorrect, recordWrongAgain } from '../../utils/study/wrongBook.js'
import { getQuestions } from '../../utils/common/cloudDb.js'
import { shuffle } from '../../utils/study/questionHelper.js'
import { generateStrokeDistractors } from '../../utils/study/questionHelper.js'

const { getUsername } = useAuth()

const loading = ref(true)
const questions = ref([])       // 错题 wrong_records 列表
const questionData = ref({})    // question_id -> 完整题目数据
const currentIndex = ref(0)
const currentOptions = ref([])
const selectedAnswer = ref(null)
const isCorrect = ref(false)
const showFeedback = ref(false)
const justMastered = ref(false)
const allMastered = ref(false)
const correctCount = ref(0)

const currentQuestion = computed(() => {
  if (currentIndex.value < questions.value.length) {
    const wrongRecord = questions.value[currentIndex.value]
    return {
      ...wrongRecord,
      ...(questionData.value[wrongRecord.question_id] || {})
    }
  }
  return null
})

async function loadQuestions() {
  loading.value = true
  const username = getUsername()
  if (!username) {
    loading.value = false
    return
  }

  try {
    // 获取未掌握的错题列表
    const wrongList = await getUnmasteredList(username)
    questions.value = wrongList

    if (wrongList.length === 0) {
      loading.value = false
      return
    }

    // 按 unit + type 分组，批量拉取题目数据
    const groups = {}
    for (const w of wrongList) {
      const key = `${w.type}_${w.unit}`
      if (!groups[key]) groups[key] = { type: w.type, unit: w.unit }
    }

    for (const g of Object.values(groups)) {
      const data = await getQuestions(g.type, g.unit)
      if (data) {
        for (const q of data) {
          questionData.value[q._id] = q
        }
      }
    }

    // 准备第一题选项
    prepareOptions()
  } catch (e) {
    console.error('加载错题失败:', e)
  }
  loading.value = false
}

function prepareOptions() {
  const q = currentQuestion.value
  if (!q) return

  if (q.type === 'pinyin' && q.pinyin) {
    // 拼音题选项
    const opts = [q.pinyin, ...(q.distractors || [])]
    currentOptions.value = shuffle(opts)
  } else if (q.type === 'stroke' && q.strokes) {
    // 笔顺题选项
    const distractors = generateStrokeDistractors(q.strokes, 3)
    const opts = [q.strokes, ...distractors]
    currentOptions.value = shuffle(opts)
  }
}

function checkAnswer(answer) {
  if (showFeedback.value) return
  selectedAnswer.value = answer
  const q = currentQuestion.value

  if (q.type === 'pinyin') {
    isCorrect.value = answer === q.pinyin
  }

  handleResult()
}

function checkStrokeAnswer(index, answer) {
  if (showFeedback.value) return
  selectedAnswer.value = index
  const q = currentQuestion.value

  if (q.type === 'stroke') {
    isCorrect.value = answer.join(',') === q.strokes.join(',')
  }

  handleResult()
}

async function handleResult() {
  showFeedback.value = true
  const wrongRecord = questions.value[currentIndex.value]

  if (isCorrect.value) {
    correctCount.value++
    const result = await recordCorrect(wrongRecord._id, wrongRecord.correctCount || 0)
    justMastered.value = result.mastered
  } else {
    justMastered.value = false
    await recordWrongAgain(wrongRecord._id, wrongRecord.wrongCount || 0)
  }
}

function nextQuestion() {
  if (currentIndex.value >= questions.value.length - 1) {
    allMastered.value = true
    return
  }

  currentIndex.value++
  selectedAnswer.value = null
  isCorrect.value = false
  showFeedback.value = false
  justMastered.value = false
  prepareOptions()
}

function goBack() {
  uni.navigateBack()
}

onMounted(() => {
  loadQuestions()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
}

.back {
  font-size: 36rpx;
  margin-right: 20rpx;
  color: #333;
}

.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.progress {
  font-size: 26rpx;
  color: #999;
}

.loading, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.sub-text {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.back-btn {
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 50rpx;
  font-size: 28rpx;
  padding: 20rpx 60rpx;
  margin-top: 30rpx;
}

.practice-area {
  padding: 30rpx;
}

.question-block {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.char-display {
  display: block;
  font-size: 120rpx;
  font-weight: bold;
  text-align: center;
  color: #333;
  margin-bottom: 20rpx;
}

.stroke-top {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 20rpx;
}

.stroke-count {
  font-size: 28rpx;
  color: #999;
}

.prompt {
  display: block;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 30rpx;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  justify-content: center;
}

.option {
  padding: 24rpx 48rpx;
  border-radius: 16rpx;
  background: #f0f2ff;
  font-size: 32rpx;
  color: #333;
  min-width: 150rpx;
  text-align: center;
}

.option.correct {
  background: #d4edda;
  color: #155724;
}

.option.wrong {
  background: #f8d7da;
  color: #721c24;
}

.stroke-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.stroke-option {
  padding: 24rpx;
  border-radius: 16rpx;
  background: #f0f2ff;
  font-size: 26rpx;
  color: #333;
  text-align: center;
}

.stroke-option.correct {
  background: #d4edda;
  color: #155724;
}

.stroke-option.wrong {
  background: #f8d7da;
  color: #721c24;
}

.feedback {
  text-align: center;
  padding: 30rpx;
}

.feedback-correct {
  display: block;
  font-size: 36rpx;
  color: #52c41a;
  margin-bottom: 16rpx;
}

.feedback-wrong {
  display: block;
  font-size: 36rpx;
  color: #ff4d4f;
  margin-bottom: 16rpx;
}

.mastered-msg {
  display: block;
  font-size: 28rpx;
  color: #667eea;
  margin-bottom: 16rpx;
}

.next-btn {
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 50rpx;
  font-size: 28rpx;
  padding: 20rpx 60rpx;
  margin-top: 20rpx;
}
</style>
```

- [ ] **Step 2: Commit**
  ```bash
  git add pages/study/wrong-book-practice.vue && git commit -m "feat: add wrong-book-practice page for re-practicing wrong answers"
  ```

---

## Summary

| Phase | Tasks | 说明 |
|-------|-------|------|
| Phase 1 | Task 1-3 | 项目脚手架 + 公共层 + 统一入口 |
| Phase 2 | Task 4-5 | 碑文排版迁移（6 页面 + 11 云函数 + 3 schema） |
| Phase 3 | Task 6-7 | 学习模块迁移（7 页面 + 3 组件 + store + utils） |
| Phase 4 | Task 8-9 | 面试助手迁移（6 页面 + 3 云函数 + 4 schema） |
| Phase 5 | Task 10-14 | 云数据库 + 错题本（3 新 schema + 2 新页面 + 2 新工具函数 + 1 组件） |

**总计：14 个 Task，5 个 Phase，21 个页面路由，14 个云函数，10 个 DB Schema。**
