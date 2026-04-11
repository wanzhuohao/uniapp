# HanziQuestion 共享组件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 抽出 `components/study/HanziQuestion.vue` 共享组件，让 `hanzi.vue` 和 `wrong-book-practice.vue` 共用一份汉字题展示与交互逻辑，消除约 100 行重复代码。

**Architecture:** 组件做纯展示 + 交互 + HanziWriter 生命周期；父组件负责出题数据准备、错题写入逻辑、题目推进。组件通过 `question` prop 接收题目数据，通过 `@answer` 事件抛出答题结果。题目切换由父组件更换 prop 触发，组件 `watch char` 自动重置内部状态。

**Tech Stack:** UniApp Vue 3 (Composition API + `<script setup>`), hanzi-writer

**Spec:** [docs/specs/2026-04-11-hanzi-question-component-design.md](../specs/2026-04-11-hanzi-question-component-design.md)

**测试约定**：项目当前无单元测试基础设施。每个 task 用**手工浏览器验证**代替 TDD 自动化测试。验证步骤会列出具体场景。

---

## 文件清单

| 操作 | 路径 | 职责 |
|------|------|------|
| 新建 | `components/study/HanziQuestion.vue` | 汉字题组件（4 种 qType：stroke / radical / structure / strokeCount） |
| 修改 | `pages/study/hanzi.vue` | 删除内联 UI，改用组件，保留出题/统计/错题写入 |
| 修改 | `pages/study/wrong-book-practice.vue` | 删除内联 UI，改用组件，保留 mastered 进度逻辑 |

---

## Task 1: 创建 HanziQuestion 组件

**Files:**
- Create: `D:\code\uniapp\components\study\HanziQuestion.vue`

**目标**：建一个独立组件，包含完整的汉字题展示和交互，但不依赖任何业务数据写入逻辑。

- [ ] **Step 1: 创建文件**

完整内容如下（直接写入）：

```vue
<template>
  <view class="hanzi-question">
    <!-- 笔顺自测题型 -->
    <template v-if="question && question.qType === 'stroke'">
      <view class="type-badge stroke-badge">笔顺</view>
      <text v-if="question.hint" class="hint-text">{{ question.hint }}</text>
      <view class="char-outline-wrap">
        <view class="char-fallback" v-show="!outlineReady">{{ question.char }}</view>
        <view ref="outlineRef" class="char-outline-target" v-show="outlineReady"></view>
      </view>
      <view class="speak-btn" @click="speakChar">🔊</view>

      <view v-if="!showAnswer" class="show-answer-btn" @click="revealAnswer">查看笔顺动画</view>
      <view v-if="showAnswer" class="answer-area">
        <text class="answer-hint">观察正确笔顺：</text>
        <view class="color-legend">
          <view class="legend-item">
            <view class="legend-dot" style="background:#333"></view>
            <text>普通笔画</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot" style="background:#168F16"></view>
            <text>部首笔画</text>
          </view>
        </view>
        <view class="answer-btn" @click="replayAnim">▶ 重播动画</view>
      </view>
      <view v-if="showAnswer" class="self-judge">
        <view class="judge-btn wrong" @click="judgeSelf(false)">❌ 我不会</view>
        <view class="judge-btn correct" @click="judgeSelf(true)">✅ 我会了</view>
      </view>
    </template>

    <!-- 选择题型（部首/结构/笔画数）-->
    <template v-else-if="question">
      <view class="char-display">{{ question.char }}</view>
      <view class="speak-btn" @click="speakChar">🔊</view>
      <view class="type-badge" :class="question.qType + '-badge'">
        {{ qTypeLabel(question.qType) }}
      </view>
      <text v-if="question.hint" class="hint-text">{{ question.hint }}</text>

      <view class="options-grid">
        <view
          v-for="(opt, i) in (question.options || [])"
          :key="i"
          :class="['option-btn',
            choiceState === 'correct' && opt.isCorrect && 'correct',
            choiceState === 'wrong' && selectedOpt === i && 'wrong',
            choiceState === 'wrong' && opt.isCorrect && 'correct']"
          @click="pickOption(i)"
        >{{ opt.label }}</view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import HanziWriter from 'hanzi-writer'
import { speak } from '../../utils/common/speech.js'

const props = defineProps({
  question: { type: Object, required: true }
})

const emit = defineEmits(['answer'])

const choiceState = ref('')
const selectedOpt = ref(-1)
const showAnswer = ref(false)
const outlineRef = ref(null)
const outlineReady = ref(false)
let writerInstance = null
let loadToken = 0

function resetState() {
  choiceState.value = ''
  selectedOpt.value = -1
  showAnswer.value = false
  outlineReady.value = false
}

function qTypeLabel(t) {
  return ({ radical: '部首', structure: '结构', strokeCount: '笔画数', stroke: '笔顺' })[t] || t
}

async function initOutline() {
  outlineReady.value = false
  await nextTick()
  const el = outlineRef.value
  if (!el || !props.question?.char) return
  el.innerHTML = ''
  const myToken = ++loadToken
  try {
    writerInstance = HanziWriter.create(el, props.question.char, {
      width: 200,
      height: 200,
      padding: 20,
      strokeColor: '#333',
      outlineColor: '#DDD',
      radicalColor: '#168F16',
      strokeAnimationSpeed: 1.5,
      delayBetweenStrokes: 400,
      showCharacter: true,
      showOutline: true,
      onLoadCharDataSuccess: () => {
        if (myToken === loadToken) outlineReady.value = true
      },
      onLoadCharDataError: () => {
        if (myToken === loadToken) outlineReady.value = false
      }
    })
  } catch (e) {
    if (myToken === loadToken) outlineReady.value = false
  }
}

function revealAnswer() {
  showAnswer.value = true
  if (writerInstance) {
    try { writerInstance.animateCharacter() } catch (e) {}
  }
}

function replayAnim() {
  if (writerInstance) {
    try { writerInstance.animateCharacter() } catch (e) {}
  }
}

function judgeSelf(isCorrect) {
  emit('answer', { isCorrect })
}

function pickOption(i) {
  if (choiceState.value) return
  selectedOpt.value = i
  const opt = props.question.options?.[i]
  if (!opt) return
  const isCorrect = !!opt.isCorrect
  choiceState.value = isCorrect ? 'correct' : 'wrong'
  setTimeout(() => {
    emit('answer', { isCorrect, optionIndex: i })
  }, isCorrect ? 800 : 1500)
}

function speakChar() {
  if (props.question?.char) speak(props.question.char)
}

watch(
  () => props.question?.char,
  (newChar) => {
    resetState()
    loadToken++
    writerInstance = null
    if (props.question?.qType === 'stroke' && newChar) {
      nextTick(() => initOutline())
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  loadToken++
  writerInstance = null
})
</script>

<style scoped>
.hanzi-question {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
}

.char-display {
  font-size: 120rpx;
  font-weight: bold;
  text-align: center;
  color: #333;
  min-height: 140rpx;
  line-height: 1.3;
}

.speak-btn {
  margin: 12rpx 0;
  font-size: 44rpx;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E3F2FD;
  border-radius: 50%;
}
.speak-btn:active { transform: scale(0.9); }

.type-badge {
  text-align: center;
  font-size: 24rpx;
  font-weight: bold;
  padding: 6rpx 24rpx;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  display: inline-block;
}
.stroke-badge { background: #E3F2FD; color: #1565C0; }
.radical-badge { background: #FFF3E0; color: #E65100; }
.structure-badge { background: #E8F5E9; color: #2E7D32; }
.strokeCount-badge { background: #F3E5F5; color: #7B1FA2; }

.hint-text {
  text-align: center;
  color: #888;
  font-size: 28rpx;
  margin-bottom: 24rpx;
}

.char-outline-wrap {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 16rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
  overflow: hidden;
}
.char-outline-target {
  width: 200px;
  height: 200px;
  line-height: 0;
}
.char-outline-target :deep(svg) { display: block; }
.char-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 150px;
  font-weight: bold;
  color: #DDD;
  line-height: 1;
  font-family: "KaiTi", "楷体", "STKaiti", serif;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  padding: 0 24rpx;
  width: 100%;
}
.option-btn {
  background: #fff;
  border: 3rpx solid #BDBDBD;
  border-radius: 20rpx;
  padding: 32rpx 16rpx;
  text-align: center;
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  transition: all 0.2s;
}
.option-btn:active { transform: scale(0.96); }
.option-btn.correct {
  border-color: #66BB6A;
  background: #E8F5E9;
  color: #2E7D32;
  box-shadow: 0 0 0 4rpx rgba(102,187,106,0.3);
}
.option-btn.wrong {
  border-color: #EF5350;
  background: #FFEBEE;
  color: #C62828;
  box-shadow: 0 0 0 4rpx rgba(239,83,80,0.3);
}

.show-answer-btn {
  margin-top: 32rpx;
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #42A5F5, #1E88E5);
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(66,165,245,0.3);
}
.show-answer-btn:active { transform: scale(0.97); }

.answer-area {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.answer-hint {
  font-size: 28rpx;
  color: #666;
}
.color-legend {
  display: flex;
  gap: 32rpx;
  justify-content: center;
  font-size: 24rpx;
  color: #888;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
}
.answer-btn {
  padding: 16rpx 48rpx;
  background: #E3F2FD;
  color: #1565C0;
  border-radius: 24rpx;
  font-size: 28rpx;
}

.self-judge {
  display: flex;
  gap: 32rpx;
  margin-top: 32rpx;
  justify-content: center;
}
.judge-btn {
  padding: 28rpx 56rpx;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: 3rpx solid;
  box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08);
}
.judge-btn:active { transform: scale(0.95); }
.judge-btn.correct {
  background: #E8F5E9;
  color: #2E7D32;
  border-color: #66BB6A;
}
.judge-btn.wrong {
  background: #FFEBEE;
  color: #C62828;
  border-color: #EF5350;
}
</style>
```

- [ ] **Step 2: 静态语法检查**

```bash
cd D:/code/uniapp && node -e "
const fs = require('fs');
const c = fs.readFileSync('components/study/HanziQuestion.vue', 'utf8');
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
const code = m[1].split('\n').filter(l => !/^\s*import\s/.test(l)).join('\n');
try { new Function(code); console.log('OK'); } catch (e) { console.log('ERR:', e.message); }
"
```
预期输出：`OK`

- [ ] **Step 3: 提交**

```bash
cd D:/code/uniapp && git add components/study/HanziQuestion.vue && git commit -m "feat(study): 抽出 HanziQuestion 共享组件"
```

---

## Task 2: 迁移 hanzi.vue 使用组件

**Files:**
- Modify: `D:\code\uniapp\pages\study\hanzi.vue`

**目标**：删除内联汉字题模板/逻辑/CSS，换成 `<HanziQuestion>`，保留出题/统计/错题写入。

- [ ] **Step 1: 替换模板中的两块汉字题 UI**

`hanzi.vue` 模板中有**两个平级的 `<view class="quiz-area">`**：

- 第一个：第 35 行 `<view v-if="started && currentQ && currentQ.qType === 'stroke'" class="quiz-area">` 到其闭合 `</view>`（约第 70 行）
- 第二个：第 73 行 `<view v-if="started && currentQ && ['radical','structure','strokeCount'].includes(currentQ.qType)" class="quiz-area">` 到其闭合 `</view>`（约第 88 行）

**两个都要删**，整体替换为下面一段：

```vue
    <!-- 汉字题（笔顺自测 / 部首/结构/笔画数 选择题）-->
    <HanziQuestion
      v-if="started && currentQ"
      :question="currentQ"
      @answer="handleAnswer"
    />
```

替换前先 grep 确认行号：
```bash
cd D:/code/uniapp && grep -n 'class="quiz-area"' pages/study/hanzi.vue
```

- [ ] **Step 2: 给 currentQ 加 hint 字段**

在 `buildRound()` 函数中，为每种题型的 push 加上 `hint`：

- 笔顺题：`pool.push({ qType: 'stroke', char: s.char, ..., hint: '看着汉字想一想笔顺，然后看答案自测' })`
- 部首题：已有 `hint: '这个字的部首是？'` ✓ 保留
- 结构题：已有 `hint: '这个字是什么结构？'` ✓ 保留
- 笔画数题：已有 `hint: '这个字有几画？'` ✓ 保留

笔顺题原 hint 是"按正确笔顺依次点击"，改成"看着汉字想一想笔顺，然后看答案自测"以匹配新 UI（自测模式）。

- [ ] **Step 3: 引入组件**

在 `<script setup>` 顶部 import 区，加：

```js
import HanziQuestion from '../../components/study/HanziQuestion.vue'
```

可同时移除：

```js
import HanziWriter from 'hanzi-writer'
```

- [ ] **Step 4a: 删除 STROKE_COLORS（如未引用）**

```bash
cd D:/code/uniapp && grep -n "STROKE_COLORS\|strokeColor(" pages/study/hanzi.vue
```
如果只在定义处（第 112-124 行）出现，整段 `STROKE_COLORS` 常数 + `strokeColor()` 函数都删。如果有其他引用就跳过此步。

- [ ] **Step 4b: 删除内联 ref 状态**

从 `<script setup>` 中删除以下 ref/let（约 8 行，分散在 140-150 行附近）：

- `const showAnswer = ref(false)`
- `let writerInstance = null`
- `const outlineId = ref(...)`
- `const outlineReady = ref(false)`
- `const choiceState = ref('')`
- `const selectedOpt = ref(-1)`

- [ ] **Step 4c: 删除内联函数**

删除以下函数定义（约 60 行总计）：

- `initOutline()`（约 156-185 行）
- `revealAnswer()`（约 187-195 行）
- `replayAnim()`（约 197-203 行）
- `pickOption(i)`（约 317-335 行）
- `speakChar()`（约 358-360 行）
- `resetState()`（约 310-314 行）

**笔顺题 `judgeSelf(isCorrect)` 不删，下一步会改造它。**

- [ ] **Step 4d: 删除函数调用点**

删除 3 处对已删函数的调用（**关键**，否则会 ReferenceError）：

- `startRound()` 函数末尾（约 304-307 行）：
  ```js
  resetState()
  if (currentQ.value?.qType === 'stroke') {
    nextTick(() => initOutline())
  }
  ```
  这 4 行整段删除。

- `advanceQuestion()` 函数中（约 340-344 行）：
  ```js
  resetState()
  const q = questions.value[currentIndex.value]
  if (q?.qType === 'stroke') {
    nextTick(() => initOutline())
  }
  ```
  这 5 行整段删除。

- `onShow()` 回调中（约 366-372 行）：
  ```js
  onShow(() => {
    if (roundFinished.value) {
      started.value = false
      roundFinished.value = false
      resetState()  // ← 删这一行
    }
  })
  ```
  只删 `resetState()` 那一行。组件自己管内部状态，外层无需管。

跑一次 grep 确认没有遗留：
```bash
cd D:/code/uniapp && grep -n "resetState\|initOutline\|revealAnswer\|replayAnim\|writerInstance\|outlineReady\|choiceState\|selectedOpt\|showAnswer" pages/study/hanzi.vue
```
预期：除了 import 和变量定义本身已删，其他位置应无匹配。

- [ ] **Step 5: 添加 handleAnswer 函数 + 改造 judgeSelf**

在 script 中，把原 `judgeSelf(isCorrect)` 函数**改名**为 `handleAnswer`，参数改为 `{ isCorrect }`，并统一去重逻辑：

```js
function handleAnswer({ isCorrect }) {
  if (isCorrect) {
    correctCount.value++
  } else {
    const q = currentQ.value
    if (q?._id && !recordedWrongIds.has(q._id)) {
      recordedWrongIds.add(q._id)
      recordWrong(getUsername(), {
        type: 'hanzi',
        char: q.char,
        unit: q.unit,
        question_id: q._id,
        qType: q.qType
      })
    }
  }
  advanceQuestion()
}
```

**行为变更说明**（写到 commit message 里）：原 `judgeSelf` 笔顺题答错时**不去重**，只 `pickOption` 走 `recordedWrongIds`。新 `handleAnswer` 把笔顺题和选择题统一走去重，**顺带修复了笔顺题同字答错可能重复写入 wrong_records 的潜在 bug**。

- [ ] **Step 6: 删除内联 CSS**

从 `<style scoped>` 中删除以下类（已迁到组件，约 80-100 行）：

- `.quiz-area` 内部展示样式（保留 `.quiz-area` 本身的 padding 容器如还有用就留，否则也删）
- `.char-display` / `.char-outline-wrap` / `.char-outline-target` / `.char-fallback` / `.speak-btn`
- `.type-badge` / `.stroke-badge` / `.radical-badge` / `.structure-badge` / `.strokeCount-badge`
- `.hint-text`
- `.options-grid` / `.option-btn` / `.option-btn.correct` / `.option-btn.wrong`
- `.show-answer-btn` / `.answer-area` / `.answer-hint` / `.color-legend` / `.legend-item` / `.legend-dot` / `.answer-btn`
- `.self-judge` / `.judge-btn` / `.judge-btn.correct` / `.judge-btn.wrong`

**保留**：`.hanzi-page` / `.filter-area` / `.unit-tags` / `.unit-tag` / `.filter-title` / `.filter-tags` / `.filter-tag` / `.start-btn` / `.empty-hint` / `.back-btn`（这些是筛选页和外层 UI，组件不管）

- [ ] **Step 7: 静态语法检查**

```bash
cd D:/code/uniapp && node -e "
const fs = require('fs');
const c = fs.readFileSync('pages/study/hanzi.vue', 'utf8');
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
const code = m[1].split('\n').filter(l => !/^\s*import\s/.test(l)).join('\n');
try { new Function(code); console.log('OK'); } catch (e) { console.log('ERR:', e.message); }
"
```
预期：`OK`

- [ ] **Step 8: 提交**

```bash
cd D:/code/uniapp && git add pages/study/hanzi.vue && git commit -m "refactor(study): hanzi.vue 改用 HanziQuestion 组件"
```

---

## Task 3: 迁移 wrong-book-practice.vue 使用组件

**Files:**
- Modify: `D:\code\uniapp\pages\study\wrong-book-practice.vue`

**目标**：删除汉字模式的内联 UI，换成 `<HanziQuestion>`，保留 mastered 进度逻辑。

- [ ] **Step 1: 替换模板中的汉字模式 UI**

`wrong-book-practice.vue` 中汉字模式是**一个外层 `.quiz-area` view 包住两个 `<template>` 分支**：

- 起：第 74 行 `<view v-if="mode === 'hanzi' && !finishedMode && currentHanziQ" class="quiz-area">`
- 止：第 115 行 `</view>`（外层 view 闭合，下一行就是口算重练注释）

**整段替换**为下面一段（连外层 view 一起换掉，不留空壳）：

```vue
    <!-- 汉字重练 -->
    <HanziQuestion
      v-if="mode === 'hanzi' && !finishedMode && currentHanziQ"
      :question="currentHanziQ"
      @answer="handleHanziAnswer"
    />
```

替换前 grep 确认行号：
```bash
cd D:/code/uniapp && grep -n "汉字重练\|mode === 'hanzi'" pages/study/wrong-book-practice.vue
```

- [ ] **Step 2: 引入组件**

在 `<script setup>` 顶部 import 区，加：

```js
import HanziQuestion from '../../components/study/HanziQuestion.vue'
```

可同时移除：

```js
import HanziWriter from 'hanzi-writer'
```

- [ ] **Step 3: 给 prepareHanziMode 出题加 hint**

在 `prepareHanziMode()` 函数中，为每个 q 对象加 `hint`：

- 笔顺题（`q.qType = 'stroke'`，`q.hint = '想一想笔顺'`）— 已有，保留
- 部首题：已有 `q.hint = '这个字的部首是？'` ✓ 保留
- 结构题：已有 `q.hint = '这个字是什么结构？'` ✓ 保留
- 笔画数题：已有 `q.hint = '这个字有几画？'` ✓ 保留

无需改动 hint 字段，但 stroke 自测 hint 应改为更友好的"看着汉字想一想笔顺，然后看答案自测"以与 hanzi.vue 一致。

- [ ] **Step 4: 删除内联逻辑**

从 `<script setup>` 中删除：

- `choiceState`, `selectedOpt`, `showAnswer`, `outlineId`, `outlineReady`, `writerInstance` 这些 ref/let
- `initOutline / revealAnswer / replayAnim / speakChar / qTypeLabel / resetHanziState` 这些函数
- `pickHanziOption(i)` 函数

把原 `recordHanziResult(isCorrect)` 函数**改名**为 `handleHanziAnswer({ isCorrect })`：

```js
async function handleHanziAnswer({ isCorrect }) {
  const q = currentHanziQ.value
  if (!q) return
  const w = q._wrong
  if (isCorrect) {
    correctCount.value++
    const r = await recordCorrect(w._id, w.correctCount || 0)
    if (r.mastered) masteredThisRound.value++
  } else {
    await recordWrongAgain(w._id, w.wrongCount || 0)
  }
  advanceHanzi()
}
```

`advanceHanzi()` 中删除 `resetHanziState()` 调用 + `nextTick(() => initOutline())` 块：

```js
function advanceHanzi() {
  if (currentIndex.value < hanziQueue.value.length - 1) {
    currentIndex.value++
    // 组件 watch question.char 自动重置内部状态，无需手动 reset / initOutline
  } else {
    finishMode()
  }
}
```

`prepareHanziMode()` 末尾删除 `resetHanziState()` 调用和 `nextTick(() => initOutline())` 块。

- [ ] **Step 5: 删除内联 CSS**

从 `<style scoped>` 中删除：

- `.quiz-area`（如果只汉字模式用，整个删；如果其他模式也用，保留）
- `.char-display` / `.speak-btn` / `.type-badge` 及变体 / `.hint-text` / `.char-outline-wrap` / `.char-outline-target` / `.char-fallback`
- `.options-grid` / `.option-btn` 及变体
- `.show-answer-btn` / `.answer-area` / `.answer-hint` / `.answer-btn`
- `.self-judge` / `.judge-btn` 及变体

**保留**：所有 `.wbp-page` / `.top-bar` / `.filter-area` / `.type-cards` / `.type-card` / `.empty-state` / `.quiz-wrap` / `.math-mode` 相关样式 / `.finished-area` 样式

- [ ] **Step 6: 静态语法检查**

```bash
cd D:/code/uniapp && node -e "
const fs = require('fs');
const c = fs.readFileSync('pages/study/wrong-book-practice.vue', 'utf8');
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
const code = m[1].split('\n').filter(l => !/^\s*import\s/.test(l)).join('\n');
try { new Function(code); console.log('OK'); } catch (e) { console.log('ERR:', e.message); }
"
```
预期：`OK`

- [ ] **Step 7: 提交**

```bash
cd D:/code/uniapp && git add pages/study/wrong-book-practice.vue && git commit -m "refactor(study): wrong-book-practice 改用 HanziQuestion 组件"
```

---

## Task 4: 浏览器手工验证

**Files:** 无修改，纯验证

**前置**：需要用户在 HBuilderX 启动 H5 预览（npm run dev:h5 或 HBuilderX 运行到浏览器），或者 dev 服务已在跑。

- [ ] **Step 1: 启动开发服务**

提醒用户：在 HBuilderX 中点击「运行 → 运行到浏览器 → Chrome」启动本地预览。

- [ ] **Step 2: 验证 hanzi.vue 路径**

打开学习 → 汉字 → 选个有数据的单元 → 开始练习，依次跑：

- [ ] 部首选择题答对：选项变绿，800ms 后切下一题
- [ ] 部首选择题答错：选中变红 + 正确答案变绿，1.5s 后切下一题
- [ ] 结构题、笔画数题表现一致
- [ ] 笔顺题：进入显示汉字 fallback → HanziWriter 加载完显示笔画外形
- [ ] 笔顺题朗读按钮可点（有 TTS 声音）
- [ ] 「查看笔顺动画」点击展开答案区 + 自动播放动画
- [ ] 「重播动画」可点
- [ ] 「我会了」/「我不会」点击后切下一题
- [ ] 答完一轮跳到 result 页

- [ ] **Step 3: 验证 wrong-book-practice.vue 路径**

学习 → 错题本 → 开始重练 → 选「汉字 X 题」：

- [ ] 重练界面布局与 hanzi.vue 完全一致
- [ ] 选择题答对/答错交互正常
- [ ] 笔顺题 HanziWriter + 自测按钮正常
- [ ] 答对一题后 wrong_records 中该条 correctCount +1
- [ ] 答对 2 次后 mastered = true
- [ ] 答错时 wrongCount +1，correctCount 重置为 0
- [ ] 全部答完显示完成态 + 「本轮掌握 X 题」

- [ ] **Step 4: 边角场景**

- [ ] 反馈期间（800ms / 1500ms 内）连续点击其他选项 → 被忽略
- [ ] 浏览器控制台无 error / warning（与组件相关的）
- [ ] **HanziWriter 加载竞态**（手工较难触发，可选）：DevTools → Network → Throttling 设为 Slow 3G → 进入笔顺题 → 在 HanziWriter SVG 还没加载完时点「我会了」切到下一题 → 验证新题不会瞬间显示旧字的笔顺数据

- [ ] **Step 5: 验证未引入回归**

- [ ] 学习 → 拼音页面正常（未受影响）
- [ ] 学习 → 学习页面正常（learn.vue 内部还有 HanziWriter，未受影响）
- [ ] 学习 → 口算正常
- [ ] 错题本 → 拼音重练正常
- [ ] 错题本 → 口算批量重练正常

- [ ] **Step 6: 更新文档**

修改 `D:/code/uniapp/docs/progress.md`，在最新一节添加：

```markdown
## 本轮（2026-04-11 后续）HanziQuestion 组件抽取

- 新建 `components/study/HanziQuestion.vue`，承载汉字题完整 UI 与交互
- `pages/study/hanzi.vue` / `pages/study/wrong-book-practice.vue` 改用组件，删除约 100 行重复代码
- 用 outlineRef + loadToken 解决 HanziWriter 跨端兼容和异步竞态
```

- [ ] **Step 7: 提交文档更新**

```bash
cd D:/code/uniapp && git add docs/progress.md && git commit -m "docs: 记录 HanziQuestion 组件抽取"
```

- [ ] **Step 8: 通知用户**

汇报本次重构完成，列出下一步：方案二第 2 项「多用户切换 UI + 统一错误提示 + 错误上报」基础设施一起做。

---

## 风险与回滚

如果迁移后行为异常：

```bash
cd D:/code/uniapp
git log --oneline -6  # 查看本次 commit（Task 1 组件 / Task 2 hanzi / Task 3 wrong-book / Task 4 docs）
```

只回退父组件迁移，保留新建的组件文件：

```bash
# 假设 commit 顺序: <docs-sha> <wrongbook-sha> <hanzi-sha> <component-sha>
git revert <wrongbook-sha> <hanzi-sha>  # 只 revert 两个父组件 commit
```

或更精准用 commit message 定位：

```bash
git revert $(git log --grep="wrong-book-practice 改用 HanziQuestion" --format="%H" -1)
git revert $(git log --grep="hanzi.vue 改用 HanziQuestion" --format="%H" -1)
```

新组件文件保留无副作用，可在下次重试时复用。
