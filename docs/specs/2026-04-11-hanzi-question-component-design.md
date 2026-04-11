# HanziQuestion 共享组件设计

> 日期：2026-04-11
> 状态：待评审 → 实施
> 关联：方案二第 1 项重构（参见 progress.md 头脑风暴清单）

## 背景

`pages/study/hanzi.vue` 和 `pages/study/wrong-book-practice.vue` 都包含完整的"汉字题"展示与交互逻辑：

- 笔顺自测（HanziWriter 动画 + 我会了 / 我不会）
- 部首 / 结构 / 笔画数 三种选择题
- 朗读按钮、type-badge、char-display、options-grid 等 UI

两份代码约 100~150 行模板/CSS/JS 高度重复。后续若新增汉字题型或修改交互，必须改两处，容易遗漏出 bug。

## 目标

抽出 `components/study/HanziQuestion.vue` 作为纯展示 + 交互组件，让两个调用方共用一份代码。

**非目标**：

- 不改变现有出题逻辑（distractors 生成、ALL_STRUCTURES 等仍在父组件）
- 不改变错题写入逻辑（recordWrong / recordCorrect / recordWrongAgain 仍在父组件）
- 不改变页面入口、StarBar、筛选区等外层 UI

## 边界划分

| 职责 | 归属 |
|------|------|
| 题目数据准备（出题、构造 options/distractors） | 父组件 |
| 题目展示（汉字、选项、笔顺动画、自测按钮） | **HanziQuestion** |
| 用户交互反馈（选项点击高亮 / 自测按钮显示） | **HanziQuestion** |
| HanziWriter 实例的初始化、动画、销毁 | **HanziQuestion** |
| 朗读按钮（speak 调用） | **HanziQuestion** |
| 答题事件的发出 | **HanziQuestion** → emit |
| 错题写入（recordWrong / recordCorrect / recordWrongAgain） | 父组件（响应 emit） |
| 推进到下一题 | 父组件（更换 question prop） |

## 组件 API

### Props

```ts
{
  question: {
    qType: 'stroke' | 'radical' | 'structure' | 'strokeCount',
    char: string,
    options?: Array<{ label: string, isCorrect: boolean }>,  // 选择题型必填
    hint?: string                                            // 题干提示文本（所有题型都用）
  }
}
```

**说明**：

- `qType === 'stroke'` 时，组件渲染 HanziWriter 自测 UI（不需要 options）
- `qType !== 'stroke'` 时，组件渲染选择题 UI（必需 options）
- 父组件通过更换 `question.char` 隐式触发组件状态重置（组件内 watch char）
- **组件对 question 上的额外字段（如 `_id` / `_wrong` / `unit`）透明透传，不读不校验** —— 父组件可以挂任何业务字段，组件只用 `qType` / `char` / `options` / `hint` 这 4 个
- **`hint` 文案完全由父组件提供**：hanzi.vue 传"按正确笔顺写一遍"，wrong-book-practice 传"想一想笔顺"，组件不写默认值

### Events

```ts
emit('answer', payload: {
  isCorrect: boolean,
  optionIndex?: number  // 选择题才有，自测题省略
})
```

**触发时机**：

- 选择题：点击选项后，组件先显示 800ms (correct) / 1500ms (wrong) 反馈，然后 emit
- 自测题：点击「我会了」/「我不会」按钮后，立即 emit

emit 之后，父组件应更换 `question` prop 切下一题，组件 watch 新 `char` 自动重置内部状态。

### 父组件用法示例（hanzi.vue）

```vue
<HanziQuestion
  :question="currentQ"
  @answer="handleAnswer"
/>
```

```js
const recordedWrongIds = new Set()  // 同一题答错只记一次

function handleAnswer({ isCorrect }) {
  if (isCorrect) {
    correctCount.value++
  } else {
    const q = currentQ.value
    if (q._id && !recordedWrongIds.has(q._id)) {
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
  advanceQuestion()  // 切下一题，组件自动重置
}
```

**注意**：`recordedWrongIds` 必须保留在父组件，组件本身不知道"题目唯一性"语义。每轮 `startRound()` 时清空（`recordedWrongIds.clear()`）。

## 组件内部实现

### 状态

```js
const choiceState = ref('')      // '' | 'correct' | 'wrong'
const selectedOpt = ref(-1)
const showAnswer = ref(false)    // stroke 自测的「查看答案」展开
const outlineRef = ref(null)     // 模板 ref，HanziWriter 直接挂载到此 DOM 节点
const outlineReady = ref(false)
let writerInstance = null
let loadToken = 0                // 异步加载竞态保护
```

### 关键逻辑

```js
// 题目变化时重置内部状态 + 重新初始化笔顺
watch(() => props.question?.char, (newChar) => {
  resetState()
  // 旧动画 onLoad 回调可能在新题加载后才 fire，用 token 比对忽略过期回调
  loadToken++
  writerInstance = null
  if (props.question?.qType === 'stroke') {
    nextTick(() => initOutline())
  }
})

function resetState() {
  choiceState.value = ''
  selectedOpt.value = -1
  showAnswer.value = false
  outlineReady.value = false   // 重要：避免新题瞬间显示旧 svg
}

function pickOption(i) {
  if (choiceState.value) return
  selectedOpt.value = i
  const isCorrect = props.question.options[i].isCorrect
  choiceState.value = isCorrect ? 'correct' : 'wrong'
  setTimeout(() => {
    emit('answer', { isCorrect, optionIndex: i })
  }, isCorrect ? 800 : 1500)
}

function judgeSelf(isCorrect) {
  emit('answer', { isCorrect })
}
```

### HanziWriter 生命周期

**关键修订**：

- 不用 `document.getElementById('hz-xxx')`（uniapp 非 H5 端无 `document`，且多实例会 id 冲突）
- 用 `<view ref="outlineRef">` + `HanziWriter.create(outlineRef.value, char, ...)`，HanziWriter 支持直接传 DOM 节点
- 用 `loadToken` 拦截过期 onLoad 回调，避免「快速切题时旧题加载完成把新题的 outlineReady 设成 true」的竞态

```js
async function initOutline() {
  outlineReady.value = false
  await nextTick()
  const el = outlineRef.value
  if (!el || !props.question?.char) return
  el.innerHTML = ''
  const myToken = ++loadToken
  try {
    writerInstance = HanziWriter.create(el, props.question.char, {
      width: 200, height: 200, padding: 20,
      strokeColor: '#333', outlineColor: '#DDD', radicalColor: '#168F16',
      strokeAnimationSpeed: 1.5, delayBetweenStrokes: 400,
      showCharacter: true, showOutline: true,
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

onBeforeUnmount(() => {
  loadToken++  // 让所有 in-flight 回调失效
  writerInstance = null
})
```

**onLoadCharDataError 时的 UI 行为**：`outlineReady = false` → `char-fallback` 文字版始终显示（已有 `v-show="!outlineReady"`），用户至少能看到字。

### 朗读按钮

```js
import { speak } from '../../utils/common/speech.js'

function speakChar() {
  if (props.question?.char) speak(props.question.char)
}
```

## 样式

组件 scoped CSS 包含：

- `.type-badge` + 4 个变体（stroke/radical/structure/strokeCount）
- `.char-display` / `.char-outline-wrap` / `.char-fallback` / `.char-outline-target`
- `.speak-btn`
- `.hint-text`
- `.options-grid` / `.option-btn` / `.option-btn.correct` / `.option-btn.wrong`
- `.show-answer-btn` / `.answer-area` / `.answer-btn`
- `.self-judge` / `.judge-btn` / `.judge-btn.correct` / `.judge-btn.wrong`

**直接从 hanzi.vue 的 style 块迁移**，无需重写。

## 父组件迁移

### `hanzi.vue` 改动

**删除**：

- 模板中 `<view class="quiz-area">` 内的两块（笔顺自测 + 选择题），约 50 行
- script 中：`choiceState`, `selectedOpt`, `showAnswer`, `outlineId`, `outlineReady`, `writerInstance`, `initOutline()`, `revealAnswer()`, `replayAnim()`, `pickOption()`, `speakChar()`
- style 中：type-badge / char-display / options-grid / self-judge 等约 100 行（已迁到 HanziQuestion）
- **`STROKE_COLORS` 常数和 `strokeColor()` 函数**：核实后确认当前模板里没有引用（color-legend 是写死 style），可直接删除。如果 grep 后发现还有引用就保留。

**保留**：

- 出题逻辑 `buildRound()`、`startRound()`
- ALL_STRUCTURES、ALL_RADICALS（构造 options 时用）
- `recordedWrongIds` 去重 Set —— **必须保留**，组件不知道题目唯一性语义
- `judgeSelf()` 改名为 `handleAnswer()`，接收 `{ isCorrect }`，内部统一去重逻辑
- `advanceQuestion()`

**新增**：

```vue
<HanziQuestion
  v-if="started && currentQ"
  :question="currentQ"
  @answer="handleAnswer"
/>
```

### `wrong-book-practice.vue` 改动

**删除**：

- 模板中 hanzi 模式的两块（stroke 自测 + 选择题），约 60 行
- script 中：`choiceState`, `selectedOpt`, `showAnswer`, `outlineId`, `outlineReady`, `writerInstance`, `initOutline()`, `revealAnswer()`, `replayAnim()`, `pickHanziOption()`, `recordHanziResult()`, `judgeSelf()`, `speakChar()`, `qTypeLabel()`, `resetHanziState()`
- 大量 CSS 类（type-badge / char-display / options-grid / self-judge 等）

**保留**：

- `prepareHanziMode()` 出题逻辑
- 答题统计（correctCount, masteredThisRound）
- recordCorrect / recordWrongAgain 调用
- `advanceHanzi()` 推进逻辑

**新增**：

```vue
<HanziQuestion
  v-if="mode === 'hanzi' && !finishedMode && currentHanziQ"
  :question="currentHanziQ"
  @answer="handleHanziAnswer"
/>
```

```js
async function handleHanziAnswer({ isCorrect }) {
  const w = currentHanziQ.value._wrong
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

## 验证清单

迁移完成后手工验证以下场景（两个调用方各跑一遍）：

**基础**

1. 部首题答对 → 显示绿色高亮 → 800ms 后自动切下一题
2. 部首题答错 → 显示红色高亮 + 正确答案标绿 → 1.5s 后自动切下一题
3. 结构题、笔画数题同上
4. 笔顺题：
   - 进入时显示汉字 fallback → HanziWriter 加载完替换
   - 朗读按钮可点
   - 「查看笔顺动画」按钮显示后，点击展开答案区 + 播放动画
   - 「重播动画」可用
   - 「我会了」/「我不会」点击后切下一题

**边角场景（pm 评审追加）**

5. 题目切换时（更换 question prop），`outlineReady` 立即回到 false，避免新题瞬间闪现旧字
6. 在反馈 800ms 内继续点击其他选项 → 应被忽略（`if (choiceState.value) return` 保护）
7. HanziWriter 加载失败（断网 / 字超出字库）→ fallback 文字版始终显示，朗读 + 自测按钮仍能用
8. 用户在题目加载途中 navigateBack → onBeforeUnmount 清理 loadToken，无 console 报错
9. 快速切题（200ms 内连续 advanceQuestion）→ outlineReady 不被旧题的 onLoad 回调污染
10. 错题正确写入 / 已掌握进度正确更新
11. hanzi.vue 中同一题快速答错多次 → wrong_records 只写入一条（recordedWrongIds 去重生效）

## 风险与回滚

**主要风险**：

- HanziWriter 实例切题时未正确销毁，导致 DOM 残留 → 在 `watch char` 时清理旧实例 + onBeforeUnmount 也清一次
- options 不足时组件渲染异常 → 父组件保证 options 长度 >=3 + 1 正确项

**回滚**：

如果迁移后行为异常无法快速修复，回退两个父组件文件即可（git revert）。新增的 HanziQuestion.vue 文件可保留作未来重试。

## 不在本次范围内

- HanziQuestion 的单元测试（项目当前无测试基础设施）
- 抽出 `<MathQuestion>` / `<PinyinQuestion>` 等其他题型组件（YAGNI）
- 重构 ALL_STRUCTURES / ALL_RADICALS 到单独 constants 文件
- 整理 hanzi.vue 内的 STROKE_COLORS（如果迁移后确认不再使用，可一并删除）
