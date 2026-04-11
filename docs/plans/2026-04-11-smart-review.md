# 错题智能复习（Leitner Box）Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans or superpowers:subagent-driven-development.

**Goal:** 用 Leitner Box 5 级间隔重复算法替代"答对 2 次永久掌握"，错题本主视图显示"今日待复习"。

**Architecture:** Schema 加 `box` + `nextReviewAt`；`wrongBook.js` 重写核心写入逻辑（Leitner 规则 + 老数据兜底）；错题本/重练页更新 UI 和数据源；答题页 (hanzi/pinyin/mental-math) 零改动。

**Tech Stack:** UniApp Vue 3 H5 + uniCloud-alipay

**Spec:** [docs/specs/2026-04-11-smart-review-design.md](../specs/2026-04-11-smart-review-design.md)

**Import 路径**：相对路径，项目无 `@/` alias。

**验证策略**：无单测，靠 HBuilderX HMR 实时反馈 + 手工浏览器验证。JS 文件用 `node --check`。

---

## 文件清单

| 操作 | 路径 | 批次 |
|------|------|------|
| 改 | `uniCloud-alipay/database/wrong_records.schema.json` | Batch 1 |
| 改 | `utils/study/wrongBook.js` | Batch 2 |
| 改 | `pages/study/wrong-book.vue` | Batch 3 |
| 改 | `pages/study/wrong-book-practice.vue` | Batch 4 |

**不动**：hanzi.vue / pinyin.vue / mental-math.vue（recordWrong 签名未变）

---

## Batch 1: Schema 加字段

**Files:** `D:\code\uniapp\uniCloud-alipay\database\wrong_records.schema.json`

- [ ] **Step 1**: 在 `properties` 里加两个字段：

```json
"box": {
  "bsonType": "int",
  "description": "Leitner box 等级 1-5，越大间隔越长",
  "minimum": 1,
  "maximum": 5
},
"nextReviewAt": {
  "bsonType": "long",
  "description": "下次待复习时间戳（ms），<=now 即到期"
}
```

完整示例（加在 `createdAt` 之后即可）。

- [ ] **Step 2**: 提交
  ```bash
  cd D:/code/uniapp && git add uniCloud-alipay/database/wrong_records.schema.json && \
  git commit -m "feat(schema): wrong_records 加 box + nextReviewAt 字段

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  ```

- [ ] **Step 3**: 提醒用户在 HBuilderX 上传 schema 到 uniCloud（schema 改动需要手工上传）

---

## Batch 2: 重写 wrongBook.js

**Files:** `D:\code\uniapp\utils\study\wrongBook.js`

整文件重写。完整内容：

```js
// utils/study/wrongBook.js
import { queryCollection, addDocument, updateDocument } from '../common/cloudDb.js'

// Leitner box 间隔（天）
// box 1: 1 天 / box 2: 1 天 / box 3: 3 天 / box 4: 7 天 / box 5: 15 天
// 注意：新错题和重练答错的 box=1 间隔也是 1 天（次日），避免当下立即循环
const BOX_INTERVALS_DAYS = [1, 1, 3, 7, 15]
const DAY_MS = 24 * 60 * 60 * 1000

function clampBox(b) {
  const n = Number(b ?? 1)
  if (!Number.isFinite(n) || n < 1) return 1
  if (n > 5) return 5
  return Math.floor(n)
}

function nextReviewFromBox(box) {
  const idx = clampBox(box) - 1
  return Date.now() + BOX_INTERVALS_DAYS[idx] * DAY_MS
}

// 老数据判断是否到期
// 未 mastered 且无 nextReviewAt -> 立即到期（0）
// 已 mastered 但无 box/nextReviewAt -> 视为 box=5 + now+15d
function effectiveNextReviewAt(record, now = Date.now()) {
  if (record.nextReviewAt != null) return record.nextReviewAt
  if (record.mastered && record.box == null) {
    return now + 15 * DAY_MS
  }
  return 0
}

function effectiveBox(record) {
  if (record.box != null) return clampBox(record.box)
  if (record.mastered) return 5
  return 1
}

export async function recordWrong(username, { type, char, unit, question_id, qType }) {
  try {
    const records = await queryCollection('wrong_records', { username, question_id }, { limit: 1 })

    if (records.length > 0) {
      const record = records[0]
      // 新错一次：box 回到 1，wrongCount +1，次日再练
      const updateData = {
        wrongCount: (record.wrongCount || 0) + 1,
        correctCount: 0,
        box: 1,
        nextReviewAt: nextReviewFromBox(1),
        mastered: false,
        lastWrongAt: Date.now()
      }
      if (qType) updateData.qType = qType
      await updateDocument('wrong_records', record._id, updateData)
    } else {
      const insertData = {
        username, question_id, type, char, unit,
        wrongCount: 1, correctCount: 0,
        box: 1,
        nextReviewAt: nextReviewFromBox(1),
        mastered: false,
        lastWrongAt: Date.now(), createdAt: Date.now()
      }
      if (qType) insertData.qType = qType
      await addDocument('wrong_records', insertData)
    }
  } catch (e) {
    console.error('记录错题失败:', e)
  }
}

// 重练答对：box +1, nextReviewAt 推后
// 调用方传 currentBox（从 wrong record 取），内部 clamp
export async function recordCorrect(recordId, currentBox, currentCorrectCount) {
  try {
    const box = clampBox(currentBox)
    const newBox = Math.min(box + 1, 5)
    const nextReviewAt = nextReviewFromBox(newBox)
    const newCorrectCount = (currentCorrectCount || 0) + 1
    const mastered = newBox >= 5
    await updateDocument('wrong_records', recordId, {
      box: newBox,
      nextReviewAt,
      correctCount: newCorrectCount,
      mastered,
    })
    return { mastered, box: newBox, nextReviewAt, correctCount: newCorrectCount }
  } catch (e) {
    console.error('更新错题记录失败:', e)
    return { mastered: false, box: clampBox(currentBox), nextReviewAt: null, correctCount: currentCorrectCount }
  }
}

// 重练答错：box 回到 1, wrongCount +1, 次日再练
export async function recordWrongAgain(recordId, currentBox, currentWrongCount) {
  try {
    await updateDocument('wrong_records', recordId, {
      box: 1,
      nextReviewAt: nextReviewFromBox(1),
      wrongCount: (currentWrongCount || 0) + 1,
      correctCount: 0,
      mastered: false,
      lastWrongAt: Date.now()
    })
  } catch (e) {
    console.error('更新错题记录失败:', e)
  }
}

// 今日待复习：nextReviewAt <= now（含老数据兜底）
export async function getDueList(username, type) {
  const all = await getAllWrongList(username, type)
  const now = Date.now()
  return all.filter(r => effectiveNextReviewAt(r, now) <= now)
}

// 未掌握（兼容旧 API）：box < 5
export async function getUnmasteredList(username, type) {
  const all = await getAllWrongList(username, type)
  return all.filter(r => effectiveBox(r) < 5)
}

export async function getAllWrongList(username, type) {
  const where = { username }
  if (type) where.type = type
  return queryCollection('wrong_records', where, {
    orderBy: { field: 'wrongCount', order: 'desc' }, limit: 200
  })
}

export async function getWrongStats(username) {
  const all = await getAllWrongList(username)
  const now = Date.now()
  const due = all.filter(r => effectiveNextReviewAt(r, now) <= now)
  return {
    total: all.length,
    pinyinCount: all.filter(r => r.type === 'pinyin').length,
    hanziCount: all.filter(r => r.type === 'stroke' || r.type === 'hanzi').length,
    mathCount: all.filter(r => r.type === 'math').length,
    strokeCount: all.filter(r => r.type === 'stroke' || r.type === 'hanzi').length, // 兼容旧字段
    unmasteredCount: all.filter(r => effectiveBox(r) < 5).length,
    masteredCount: all.filter(r => effectiveBox(r) >= 5).length,
    dueCount: due.length,
    pinyinDue: due.filter(r => r.type === 'pinyin').length,
    hanziDue: due.filter(r => r.type === 'stroke' || r.type === 'hanzi').length,
    mathDue: due.filter(r => r.type === 'math').length,
    top5: all.filter(r => effectiveBox(r) < 5).sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 5)
  }
}
```

- [ ] **Step 1**: 覆盖写入文件（整文件替换）

- [ ] **Step 2**: `node --check`：
  ```bash
  cd D:/code/uniapp && node --check utils/study/wrongBook.js
  ```
  预期：无输出

- [ ] **Step 3**: 提交
  ```bash
  cd D:/code/uniapp && git add utils/study/wrongBook.js && \
  git commit -m "refactor(wrongBook): Leitner Box 间隔重复算法

- 新增 getDueList 取今日待复习
- recordCorrect/recordWrongAgain 按 box 推进下次复习时间
- getWrongStats 新增 dueCount + 按类型分组 dueCount
- 老数据兜底：未 mastered box=1 立即到期，已 mastered box=5 延后 15 天
- clampBox 防调用方传错 box 值

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  ```

---

## Batch 3: wrong-book.vue 加 tab + due 统计

**Files:** `D:\code\uniapp\pages\study\wrong-book.vue`

### Step 1: 更新 stats 结构

读当前文件的 `stats` ref 初始化代码，加入新字段：

```js
const stats = ref({
  total: 0,
  pinyinCount: 0,
  hanziCount: 0,
  mathCount: 0,
  unmasteredCount: 0,
  masteredCount: 0,
  dueCount: 0,
  pinyinDue: 0,
  hanziDue: 0,
  mathDue: 0,
  top5: []
})
```

### Step 2: 新增 tab 状态

在 script 中加：
```js
const viewMode = ref('due') // 'due' | 'all'
```

### Step 3: filteredList 逻辑更新

把 computed `filteredList` 改为：
```js
const filteredList = computed(() => {
  const now = Date.now()
  // 先按 viewMode 过滤
  let list = viewMode.value === 'due'
    ? wrongList.value.filter(r => {
        const t = r.nextReviewAt != null ? r.nextReviewAt
          : (r.mastered && r.box == null ? now + 15 * 86400000 : 0)
        return t <= now
      })
    : wrongList.value

  // 再按 type filter
  if (!filter.value) return list
  if (filter.value === 'hanzi') {
    return list.filter(item => item.type === 'hanzi' || item.type === 'stroke')
  }
  return list.filter(item => item.type === filter.value)
})
```

### Step 4: 模板改动

**4a. stats-row**：原 4 个卡片（拼音/汉字/口算/待掌握），最后一个改为"今日待复习"，数字用红色突出：

```vue
<view class="stats-row">
  <view class="stat-card">
    <text class="stat-num">{{ stats.pinyinCount }}</text>
    <text class="stat-label">拼音</text>
  </view>
  <view class="stat-card">
    <text class="stat-num">{{ stats.hanziCount }}</text>
    <text class="stat-label">汉字</text>
  </view>
  <view class="stat-card">
    <text class="stat-num">{{ stats.mathCount }}</text>
    <text class="stat-label">口算</text>
  </view>
  <view class="stat-card">
    <text class="stat-num due-num">{{ stats.dueCount }}</text>
    <text class="stat-label">今日待复习</text>
  </view>
</view>
```

CSS 追加：
```css
.stat-num.due-num {
  color: #FF5722;
}
```

**4b. 加 tab 切换**（在 filter-row 之前）：

```vue
<view class="tab-row">
  <text :class="['tab-btn', viewMode === 'due' && 'active']" @click="viewMode = 'due'">
    待复习 {{ stats.dueCount }}
  </text>
  <text :class="['tab-btn', viewMode === 'all' && 'active']" @click="viewMode = 'all'">
    全部 {{ stats.total }}
  </text>
</view>
```

CSS 追加：
```css
.tab-row {
  display: flex;
  padding: 0 20rpx 12rpx;
  gap: 16rpx;
}
.tab-btn {
  padding: 14rpx 32rpx;
  border-radius: 32rpx;
  font-size: 28rpx;
  color: #666;
  background: #fff;
  font-weight: 500;
}
.tab-btn.active {
  background: #667eea;
  color: #fff;
  font-weight: bold;
}
```

**4c. 底部按钮文案**：原
```
开始重练（{{ stats.unmasteredCount }} 题未掌握）
```
改为：
```vue
<button class="practice-btn" @click="goPractice">
  开始重练（今日 {{ stats.dueCount }} 题待复习）
</button>
```

并把 v-if 条件改为 `v-if="stats.dueCount > 0 || stats.unmasteredCount > 0"`（有任何错题都显示按钮，确保 dueCount=0 时用户也能手动练全部）。

### Step 5: grep 兜底 + 提交

```bash
cd D:/code/uniapp && grep -n "stats.unmasteredCount\|viewMode\|dueCount" pages/study/wrong-book.vue
```

- [ ] **Step 6**: 提交
  ```bash
  cd D:/code/uniapp && git add pages/study/wrong-book.vue && \
  git commit -m "feat(wrong-book): 主页加 待复习/全部 tab + 今日待复习统计

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  ```

---

## Batch 4: wrong-book-practice.vue 改用 getDueList

**Files:** `D:\code\uniapp\pages\study\wrong-book-practice.vue`

### Step 1: import 改动

在 import 区：
- 移除 `getUnmasteredList`
- 加 `getDueList, getAllWrongList`

```js
import { getDueList, getAllWrongList, recordCorrect, recordWrongAgain } from '../../utils/study/wrongBook.js'
```

### Step 2: 新增 "练全部" 模式状态

在 script 中加：
```js
const practiceAll = ref(false)  // true = 练全部, false = 只练待复习（默认）
```

### Step 3: loadAllWrong 改为根据 practiceAll 取数据

```js
async function loadAllWrong() {
  loading.value = true
  const username = getUsername()
  if (!username) {
    loading.value = false
    return
  }
  try {
    const list = practiceAll.value
      ? await getAllWrongList(username)
      : await getDueList(username)
    const groups = { pinyin: [], hanzi: [], math: [] }
    for (const w of list) {
      if (w.type === 'pinyin') groups.pinyin.push(w)
      else if (w.type === 'hanzi' || w.type === 'stroke') groups.hanzi.push(w)
      else if (w.type === 'math') groups.math.push(w)
    }
    allWrong.value = groups
  } catch (e) {
    console.error('加载错题失败:', e)
  }
  loading.value = false
}
```

### Step 4: handleHanziAnswer / handlePinyinAnswer / submitMath 改用新签名

找到三处调用 `recordCorrect` / `recordWrongAgain` 的地方，改为传 `currentBox`：

- `recordCorrect(w._id, w.correctCount || 0)` → `recordCorrect(w._id, w.box, w.correctCount || 0)`
- `recordWrongAgain(w._id, w.wrongCount || 0)` → `recordWrongAgain(w._id, w.box, w.wrongCount || 0)`

grep 确认 3 处都改了：
```bash
grep -n "recordCorrect\|recordWrongAgain" pages/study/wrong-book-practice.vue
```
预期：所有调用都有 3 个参数。

### Step 5: 入口卡片文案改动

找到类型卡片模板（`<view class="type-card type-pinyin" @click="enterMode('pinyin')">` 等），文案：

原：
```
<text class="type-count">{{ counts.pinyin }} 题待掌握</text>
```

改为：
```
<text class="type-count">今日 {{ counts.pinyin }} 题</text>
```

（这里 counts 已经是基于 loadAllWrong 取的数据，默认 getDueList 模式下的数量）

### Step 6: 加"练全部"模式提示

在类型选择区顶部，加一行：
```vue
<text class="filter-title">选择要重练的类型</text>
<view v-if="!practiceAll" class="practice-mode-hint" @click="switchToAll">
  <text>📚 今日待复习</text>
  <text class="switch-link">切换到练全部 »</text>
</view>
<view v-else class="practice-mode-hint" @click="switchToDue">
  <text>📖 练全部错题</text>
  <text class="switch-link">切换到今日待复习 »</text>
</view>
```

Script 加：
```js
async function switchToAll() {
  practiceAll.value = true
  await loadAllWrong()
}
async function switchToDue() {
  practiceAll.value = false
  await loadAllWrong()
}
```

CSS 追加：
```css
.practice-mode-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #F0F4FF;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  color: #666;
  width: 100%;
  max-width: 600rpx;
}
.switch-link {
  color: #667eea;
  font-weight: bold;
}
.switch-link:active { opacity: 0.6; }
```

### Step 7: grep 兜底

```bash
cd D:/code/uniapp && grep -n "getUnmasteredList\|recordCorrect\|recordWrongAgain" pages/study/wrong-book-practice.vue
```

预期：
- 无 `getUnmasteredList` 残留
- `recordCorrect` / `recordWrongAgain` 都是 3 个参数调用

### Step 8: 提交

```bash
cd D:/code/uniapp && git add pages/study/wrong-book-practice.vue && \
git commit -m "feat(wrong-book-practice): 改用 getDueList + 支持练全部模式

- 默认只练今日待复习（getDueList）
- 顶部提供切换到练全部的入口
- 入口卡片文案改为 '今日 N 题'
- recordCorrect/recordWrongAgain 传 currentBox

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Batch 5: 浏览器手工验证

**前置**：用户已上传 schema 到 uniCloud。dev server HMR 已就绪。

- [ ] **Step 1**: 学习 → 汉字 → 选个单元 → 答错 1 题 → 进入错题本
- [ ] **Step 2**: 验证答错的这道题**不在**"待复习" tab（因为 nextReviewAt = now + 1 天，不到期）
- [ ] **Step 3**: 切到"全部" tab 能看到
- [ ] **Step 4**: DevTools 手动改 `nextReviewAt` 为 `Date.now() - 1` → 回到"待复习" tab 能看到
- [ ] **Step 5**: 开始重练 → 答对 1 次 → 该题 box=2 → 从待复习消失
- [ ] **Step 6**: DevTools 确认云端记录 box 从 1 → 2，nextReviewAt 推后 1 天
- [ ] **Step 7**: 手动改 box=4 + 再答对 → box=5 mastered=true
- [ ] **Step 8**: 入口卡片今日待复习 = 0 时，顶部切换"练全部"能看到所有错题
- [ ] **Step 9**: 浏览器控制台无 error

- [ ] **Step 10**: 更新 progress.md 追加小节
- [ ] **Step 11**: 提交文档

---

## 风险与回滚

- 4 个 commit 逐个 revert：
  ```bash
  git revert --no-edit <batch4-sha>  # wrong-book-practice
  git revert --no-edit <batch3-sha>  # wrong-book
  git revert --no-edit <batch2-sha>  # wrongBook.js
  git revert --no-edit <batch1-sha>  # schema
  ```
- Schema 回退后需**重新上传** uniCloud
- 老数据兜底逻辑即使完全回退也不会丢数据（box/nextReviewAt 是新字段，旧代码不读）
