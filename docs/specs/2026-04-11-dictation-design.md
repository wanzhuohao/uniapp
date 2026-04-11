# 听写练习设计

> 日期：2026-04-11
> 状态：待评审 → 实施
> 关联：方案二第 5 项

## 背景

当前学习模块有拼音题 / 汉字题 / 口算题 / 错题本 / 学习页（自测），缺"听写"这个基本的识字练习。数字化版本：TTS 念字，孩子按笔顺描，自测判断对错。

## 目标

新增听写模块：

- TTS 念字，不直接显示汉字
- 用 HanziWriter quiz 模式，用户按笔顺描红
- 用户自测（不做 OCR 识别）：我写对了 / 我写错了
- 一轮 10 题，答错的字进错题本（type=hanzi，qType=dictation），后续 Leitner 自动复习

**设计决定**：第一轮评审后**砍掉盲写 canvas 模式**。理由：
1. uniapp H5 的 `<canvas>` 存在 DPR / 坐标换算 / uni-canvas 包装等兼容坑，实现复杂风险大
2. 描红模式已覆盖"不会写的字 + 熟悉笔顺"场景，对一年级小学生更有教学价值
3. 听写的本质是"TTS + 写 + 自测"，写的载体是描红 or 盲写不影响本质
4. 简化后 dictation.vue 从 ~400 行降到 ~200 行

**非目标**：
- 不做盲写 canvas
- 不做手写 OCR 识别
- 不做拍纸听写
- 不做语音识别输入
- 不做错题驱动的听写（只按单元）

## 流程

```
筛选页（选单元 2-1 ~ 2-8）
    ↓
开始听写
    ↓
循环 × 10：
  ├─ StarBar 显示 "N / 10"
  ├─ TTS 念字（onMount / 切题时自动念，点喇叭再念）
  ├─ HanziWriter quiz 模式描红（灰轮廓，用户按笔顺描）
  │     - 描错多次会自动提示下一笔
  │     - 全部笔顺描完 onComplete 触发，自动进结算
  │     - 或点"我写完了"手动进结算
  ├─ 底部按钮：[🔊 再念一遍] [我写完了]
  └─ 结算遮罩：
        - 显示正确字（HanziWriter 另一实例，showCharacter: true）
        - [▶ 播放笔顺动画]
        - [❌ 我写错了]  [✅ 我写对了]
        - 点击判断后 800ms 切下一题
    ↓
答完 10 题 → navigateTo result.vue，带参数 `?module=dictation&correct=X&total=10&earned=Y&oldTotal=Z`
```

## 数据

### 题库来源

`getQuestions('pinyin', currentUnit)`，随机抽 10 个字（`sampleWithout`）。不足 10 题时有多少用多少。

### 错题记录

答错时：
```js
recordWrong(username, {
  type: 'hanzi',
  qType: 'dictation',
  char: q.char,
  unit: q.unit,
  question_id: q._id,
})
```

`type='hanzi'` 和现有汉字错题合流，被 Leitner 复习纳入。`qType='dictation'` 标记来源是听写。

### Schema 备注

`wrong_records.schema.json` 的 `qType` 字段只有 description 无 enum，写 `'dictation'` 不会被拒绝。**同步更新 description**：`"radical/structure/strokeCount/stroke/dictation"`。

### 答对时

不调 recordCorrect（这是新练习不是错题重练）：
```js
store.addStars(earned)
recordPractice(username, { type: 'hanzi', totalCount: 10, correctCount })
```

跳转 result.vue 参数按 hanzi.vue 模式：
```js
uni.navigateTo({
  url: `/pages/study/result?module=dictation&correct=${correctCount.value}&total=${totalQuestions.value}&earned=${earned}&oldTotal=${oldTotal}`
})
```

**注意**：result.vue 需要对 `module=dictation` 的文案做一次性兼容（显示"听写"而不是未知）。实测确认即可。

## HanziWriter 实现

### 题目区（quiz 模式）

复用 HanziQuestion 组件的稳定模式：

- **传 id string** 不传 DOM 节点（uniapp uni-view 不兼容 HanziWriter.create 直接传元素）
- id 唯一：`dictation-quiz-` + Date.now() + random
- 每次切题前 `cancelQuiz()` + null 旧实例 + innerHTML 清空
- loadToken 异步竞态保护

```js
import HanziWriter from 'hanzi-writer'

const QUIZ_ID = 'dictation-quiz-' + Date.now() + '-' + Math.floor(Math.random() * 1e6)
let quizWriter = null
let quizLoadToken = 0

async function startQuiz(char) {
  cleanupQuiz()
  await nextTick()
  const el = document.getElementById(QUIZ_ID)
  if (!el || !char) return
  el.innerHTML = ''
  const myToken = ++quizLoadToken
  try {
    quizWriter = HanziWriter.create(QUIZ_ID, char, {
      width: 280,
      height: 280,
      padding: 10,
      strokeColor: '#2E7D32',
      outlineColor: '#DDD',
      radicalColor: '#168F16',
      showCharacter: false,
      showOutline: true,
      showHintAfterMisses: 2,
      onLoadCharDataSuccess: () => {
        if (myToken !== quizLoadToken) return
        // load 成功后立即进入 quiz 模式
        try {
          quizWriter?.quiz({
            onComplete: () => {
              if (myToken !== quizLoadToken) return
              // 全部描完自动进结算
              onFinishWriting()
            }
          })
        } catch (e) {}
      },
      onLoadCharDataError: () => {
        if (myToken === quizLoadToken) {
          console.warn('[dictation] 加载字符失败:', char)
        }
      }
    })
  } catch (e) {
    console.error('[dictation] HanziWriter.create 异常', e)
  }
}

function cleanupQuiz() {
  quizLoadToken++
  if (quizWriter) {
    try { quizWriter.cancelQuiz?.() } catch (e) {}
    quizWriter = null
  }
  const el = document.getElementById(QUIZ_ID)
  if (el) el.innerHTML = ''
}
```

### 结算区（静态 + 动画）

用**另一个 id**（`RESULT_ID`）独立初始化正确字的 HanziWriter，避免和 quiz 实例冲突。

```js
const RESULT_ID = 'dictation-result-' + Date.now() + '-' + Math.floor(Math.random() * 1e6)
let resultWriter = null

async function showResultHanzi(char) {
  cleanupResult()
  await nextTick()
  const el = document.getElementById(RESULT_ID)
  if (!el) return
  el.innerHTML = ''
  resultWriter = HanziWriter.create(RESULT_ID, char, {
    width: 200, height: 200, padding: 10,
    strokeColor: '#333', outlineColor: '#DDD', radicalColor: '#168F16',
    showCharacter: true, showOutline: true,
  })
}

function replayResult() {
  try { resultWriter?.animateCharacter() } catch (e) {}
}

function cleanupResult() {
  if (resultWriter) {
    resultWriter = null
  }
  const el = document.getElementById(RESULT_ID)
  if (el) el.innerHTML = ''
}
```

切题时：`cleanupQuiz()` + `cleanupResult()` 都清，避免实例泄漏。

组件 `onBeforeUnmount` 也都清。

## TTS

复用 `utils/common/speech.js` 的 `speak(char)`。

**时机**：
- 每道题 `watch currentQ.char, immediate: false` + onMounted 初次，50ms 延迟念
- 点🔊按钮手动再念

**cancel 重叠修复**（pm 评审指出 H5 Chrome bug）：
```js
function safeSpeak(char) {
  try { window.speechSynthesis?.cancel?.() } catch (e) {}
  setTimeout(() => {
    try { speak(char) } catch (e) {}
  }, 50)
}
```

切题时也走 safeSpeak。

## UI 布局

### 筛选页

沿用 pinyin.vue / hanzi.vue 的筛选区样式：

```
  StarBar（总星数）
  标题：选择单元
  [第1单元] [第2单元] ... [第8单元]
  ... （选中高亮）
  [开始听写]（大按钮渐变色）
```

### 答题页

```
  StarBar（N/10）
  ┌──────────────┐
  │ 🔊 大喇叭按钮 │   ← 点击重新念
  └──────────────┘
  ┌──────────────┐
  │              │
  │  HanziWriter │   ← 280x280 描红区
  │   quiz 灰框  │
  │              │
  └──────────────┘
  [ 我写完了 ]
```

### 结算遮罩

```
  ┌────────────┐
  │  正确答案  │
  │            │
  │  HanziWriter│  ← 200x200 静态字
  │            │
  │ ▶ 笔顺动画 │
  │            │
  │ ❌ 我写错了  ✅ 我写对了 │
  └────────────┘
```

半透明遮罩层，覆盖在答题区上方。

## 入口卡片

`pages/study/index.vue` 当前 6 个卡片（2x3 网格）。加一个变成 7 个会出现孤行。

**方案**：放在"汉字"之后、"口算"之前，语义是"汉字 → 听写 → 口算"，自然的学习链。

布局变成：
```
📚 学习    📖 拼音
✏️ 汉字    ✍️ 听写
⏱️ 口算    📕 错题本
🛠️ 数据维护
```

或者如果 CSS 是单列 flex（见实际代码），则直接插入即可无孤行问题。

```vue
<view class="module-card dictation-card" @click="goTo('/pages/study/dictation')">
  <text class="module-icon">✍️</text>
  <text class="module-name">听写</text>
  <text class="module-desc">听声音写汉字</text>
</view>
```

CSS：
```css
.dictation-card { border-left-color: #26A69A; }
```

## 文件变动清单

| 操作 | 路径 | 大致行数 |
|------|------|---------|
| 新建 | `pages/study/dictation.vue` | ~250 行 |
| 改 | `pages/study/index.vue` | +8 行（卡片） |
| 改 | `pages.json` | +4 行（路由） |
| 改 | `pages/study/result.vue` | +2~5 行（module=dictation 的文案兜底） |
| 改 | `uniCloud-alipay/database/wrong_records.schema.json` | +1 行（qType description 加 dictation） |

## 路由

`pages.json` 新增 subPackages 或 pages 段，参考现有其他 study 页面：

```json
{
  "path": "pages/study/dictation",
  "style": { "navigationBarTitleText": "听写练习" }
}
```

## 验证清单

1. 学习主页看到"听写"卡片 ✓
2. 点击进入筛选页，选单元 2-1 → 开始 ✓
3. 进入第 1 题，TTS 自动念字（不显示汉字文字） ✓
4. 灰色 HanziWriter quiz 轮廓出现 ✓
5. 按笔顺描红 → 全部描完自动进结算 ✓
6. 或点"我写完了"手动进结算 ✓
7. 点"🔊 再念一遍"可再次 TTS ✓
8. 结算遮罩显示正确字 + "▶ 笔顺动画"按钮可播放 ✓
9. 点"❌ 我写错了" → 进下一题，云端 wrong_records 有新条目 `type=hanzi, qType=dictation, box=1, nextReviewAt=now+1d` ✓
10. 点"✅ 我写对了" → 进下一题，无错题记录 ✓
11. 切题时 TTS 不重叠（50ms 延迟 + cancel）✓
12. 切题时 quizWriter 和 resultWriter 都销毁，无残留 ✓
13. 答完 10 题 → 跳 result.vue，文案显示"听写" ✓
14. 错题本"全部" tab 能看到听写错的字 ✓
15. 从 result 页返回 → 回到筛选页，可以再选单元重做 ✓

## 风险与回滚

**主要风险**：
- HanziWriter quiz 切题时的异步竞态 → 用 loadToken 闭环，和 HanziQuestion 一样
- TTS 在不同浏览器发音质量差异 → 已有方案沿用，不额外处理
- result.vue 需要加 module=dictation 的文案 → 小改，向下兼容

**回滚**：单 commit 即可回退（4 个文件改动）

## 不在本次范围

- 手写 OCR 识别
- 拍纸听写
- 盲写 canvas 模式
- 语音识别输入
- 成绩排行
- 单元测试
