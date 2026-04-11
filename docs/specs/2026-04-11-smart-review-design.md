# 错题智能复习（Leitner Box）设计

> 日期：2026-04-11
> 状态：待评审 → 实施
> 关联：方案二第 4 项

## 背景

当前错题本：

- 答对 2 次 → `mastered=true` → 永久隐藏
- 缺点 1：蒙对 2 次就"掌握"，真实长期记忆未建立
- 缺点 2：`mastered` 后永不再现，遗忘后没人提醒
- 缺点 3：不考虑时间因素（遗忘曲线）

## 目标

引入 Leitner Box 5 级间隔重复算法，让错题按遗忘曲线自动排期：

- 刚错的字当天立即可练
- 一次次答对拉长下次间隔
- 长期巩固的字（box 5）30 天左右仍会复活一次
- 错题本主视图只显示"今日待复习"，降低选择成本

**非目标**：
- 不做复习日历 / 热力图
- 不做每日提醒推送
- 不做算法参数可配置
- 不做老数据一次性迁移（运行时兜底）

## 算法

### Leitner Box 5 级

```js
const BOX_INTERVALS_DAYS = [1, 1, 3, 7, 15]
// box 1 → 1 天后（次日可复习，不是当下立即）
// box 2 → 1 天后
// box 3 → 3 天后
// box 4 → 7 天后
// box 5 → 15 天后
```

**初始状态**：新错题 `box = 1`，`nextReviewAt = Date.now() + 1 天`

**为什么不当下立即**：刚在 hanzi/pinyin 页答错一个字，本轮已经练过这道题；回到错题本马上又看到同一题意义不大还挫败。次日生效是间隔学习的基本要求（不能 0 间隔）。

**答对**（重练时）：
```js
newBox = Math.min(box + 1, 5)
nextReviewAt = Date.now() + BOX_INTERVALS_DAYS[newBox - 1] * 86400 * 1000
```

**答错**（重练时）：
```js
newBox = 1
nextReviewAt = Date.now() + 1 * 86400 * 1000  // 次日再练（避免当下立即循环）
wrongCount += 1
```

**为何 box 5 也会过期**（30 天左右）：

- box 5 间隔 = 15 天
- 到期后用户再练一次答对，box 仍是 5（cap），又 +15 天
- 实际体感：每 15 天过一次"巩固关"
- 所谓 "30 天" 是保守估计，实际可能更短；概念是"长期错题也不会永久隐藏"

## Schema 改动

```json
{
  "properties": {
    ...
    "box": {
      "bsonType": "int",
      "description": "Leitner box 等级 1-5，越大间隔越长",
      "minimum": 1,
      "maximum": 5
    },
    "nextReviewAt": {
      "bsonType": "long",
      "description": "下次待复习时间戳（ms），小于等于 now 即到期。与 lastWrongAt 一致用 long"
    }
  }
}
```

**注意**：不用 `bsonType: "timestamp"`（MongoDB Timestamp 是内部类型），要用 `"long"` / `"int"` 匹配 `Date.now()` 返回的毫秒数。`lastWrongAt` 现有字段写的是 `"timestamp"` 但实际存的是 `Date.now()` 数字，应顺手改成 `"long"` 或 `"number"` 保持一致（若 schema 校验没拒绝现有数据说明 uniCloud 校验宽松，本次不动以避免回归）。

**保留字段**：`wrongCount` / `correctCount` / `mastered` / `lastWrongAt` / `createdAt` / `qType`

- `mastered` 语义改为 "box >= 5"（写入时自动计算），**不再作为永久隐藏标记**
- 不做老数据迁移，运行时 `box ?? 1` / `nextReviewAt ?? 0` 兜底

## API 改动（`utils/study/wrongBook.js`）

### 新增

```js
/**
 * 取今日待复习的错题（nextReviewAt <= now）
 * @param {string} username
 * @param {string} [type]
 */
export async function getDueList(username, type) { ... }
```

### 修改

```js
// 记录新错题：box=1, nextReviewAt=now
export async function recordWrong(username, { type, char, unit, question_id, qType }) { ... }

// 重练答对：box +1, nextReviewAt 推后
// 返回 { box, nextReviewAt, isLongTerm: box === 5 }
export async function recordCorrect(recordId, currentBox, currentCorrectCount) { ... }

// 重练答错：box 回到 1, nextReviewAt=now, wrongCount +1
export async function recordWrongAgain(recordId, currentBox, currentWrongCount) { ... }

// getUnmasteredList：向后兼容 alias，内部改为 `box < 5` 过滤
// 保留给暂未迁移的调用方（若有）
export async function getUnmasteredList(username, type) { ... }

// getAllWrongList：不变
// getWrongStats：新增按类型分组的 due 统计
//   { ..., dueCount, pinyinDue, hanziDue, mathDue }
// due 判定：nextReviewAt <= now (含老数据兜底)
```

### recordCorrect 新签名说明

旧签名：`recordCorrect(recordId, currentCorrectCount)`
新签名：`recordCorrect(recordId, currentBox, currentCorrectCount)`

调用方（wrong-book-practice.vue）需更新，多传一个 `currentBox`（从 wrong record 对象取）。

**recordWrongAgain** 同理，新签名 `recordWrongAgain(recordId, currentBox, currentWrongCount)`。

**函数内部兜底**：`box = Number(currentBox ?? 1); if (box < 1) box = 1; if (box > 5) box = 5`，防止调用方传错或传 undefined。不做服务端查询（避免额外云调用，project 有云函数调用量优化要求）。

## UI 改动

### wrong-book.vue 主页

**顶部统计行**：原 4 个卡片（拼音/汉字/口算/待掌握），改为 4 个卡片（拼音/汉字/口算/**今日待复习**）。其中 "今日待复习" 用醒目色（比如红色）突出。

**列表区**：加 tab 切换：

```
[ 待复习 (N) ]  [ 全部 ]
```

- "待复习" 默认选中，显示 `nextReviewAt <= now` 的错题
- "全部" 显示所有（和当前行为一致）
- 内部的 pinyin / hanzi / math filter 保留，作为 tab 下的二级筛选

**底部"开始重练"按钮**：文案改为

```
开始重练（今日 X 题待复习）
```

X = 当前 tab 下待复习数量

### wrong-book-practice.vue 入口卡片

原卡片显示类型 + 总数：
```
拼音 3 题待掌握
```

改为显示 due / total：
```
拼音
今日待复习 1 / 共 3
```

**点击行为**：
- 默认进入"只练今日到期"模式（调用 `getDueList`）
- 如果今日到期数为 0，卡片不置灰，点击后弹 `uni.showActionSheet`：
  - 选项 1：`今天没有待复习的拼音`（只是提示，无动作）
  - 选项 2：`练全部 N 题`（进入全量模式，用 `getAllWrongList`）
- 这样"今日无待复习"仍有"手动刷全部"的路径

### 答题流程（wrong-book-practice.vue）

- `prepareXxxMode()` 从 `getDueList(username)` 取题（过滤 type）
- 答对调新 `recordCorrect(w._id, w.box, w.correctCount)`
- 答错调新 `recordWrongAgain(w._id, w.box, w.wrongCount)`
- 完成态显示 "今日已复习 N 题"

### 答题页显示 box 信息？

**不显示**。box 是内部状态，对小朋友解释"你这题在 3 号盒子"没意义。UI 保持简单。

## 文件变动清单

| 操作 | 路径 | 说明 |
|------|------|------|
| 改 | `uniCloud-alipay/database/wrong_records.schema.json` | 加 box + nextReviewAt |
| 改 | `utils/study/wrongBook.js` | 实现 Leitner Box 算法 |
| 改 | `pages/study/wrong-book.vue` | 加 tab + 待复习统计 |
| 改 | `pages/study/wrong-book-practice.vue` | 入口卡片 due/total，改用 getDueList |

**不动**的文件：
- `pages/study/hanzi.vue` / `pinyin.vue` / `mental-math.vue` — `recordWrong` 签名未变
- 其他页面

## 验证清单

1. 新建一个错题 → 检查云端记录 `box=1, nextReviewAt ≈ now + 1 天`
2. 当下该题**不**出现在今日待复习（延后到次日）
3. 手动把云端 `nextReviewAt` 改到 now - 1 → 刷新后该题出现在"待复习" tab
4. 答对一次 → 记录更新 `box=2, nextReviewAt ≈ now + 1 天`
5. 待复习列表里该题消失
6. 切换到"全部" tab 能看到该题
7. 从 box=1 连续答对 4 次 → 最终 `box=5`（过程中 box 依次升到 2/3/4/5）
8. 答错后 → `box` 回到 1，`wrongCount` +1，`nextReviewAt ≈ now + 1 天`
9. 统计卡片 `dueCount` 数字正确，**按类型分组**（pinyinDue/hanziDue/mathDue）
10. 老数据（无 box/nextReviewAt 字段）：
    - 未 mastered 的 → box 默认 1，nextReviewAt 默认 0（立即到期）
    - 已 mastered 的 → box 视为 5，nextReviewAt 视为 now + 15 天（不立即涌入）
11. 入口卡片今日待复习 = 0 时点击 → 弹 ActionSheet 提供"练全部"选项

## 老数据兼容

旧 wrong_records 没有 `box` / `nextReviewAt` 字段。分两种：

### 未掌握的老数据（`mastered != true`）

**读取时兜底**：
```js
const box = record.box ?? 1
// 未设 nextReviewAt 的视为立即到期，首次被操作时自动补齐
const nextReviewAt = record.nextReviewAt ?? 0
```

这些原本就是需要复习的错题，立即进入待复习是合理的。

### 已 mastered 的老数据（`mastered === true`）

**不立即复活**，避免一夜之间"错题本炸了"：

```js
// getDueList 里的过滤逻辑
if (record.mastered && record.box == null) {
  // 老 mastered 数据按 box=5 对待，nextReviewAt 设 now + 15 天后
  return record.nextReviewAt ?? (referenceTime + 15 * 86400 * 1000)
}
```

**首次被答对/答错操作时**，update 调用显式把 `box=5` + `nextReviewAt=now + 15天` 写回（若 box 原本缺失），完成隐式迁移。

**用户体验**：已掌握的老数据仍按长期巩固的 box 5 间隔出现（15 天一次），不会瞬间涌入。

## 风险与回滚

**主要风险**：

- 老 mastered 数据"复活"让用户感到错题数量暴涨 → **文档里说清楚这是预期**
- API 签名变化 `recordCorrect(id, box, count)` → 只在 wrong-book-practice.vue 两处调用，手工确认
- 云端 schema 加字段 → 需要上传新 schema

**回滚**：

- 单 commit 粒度回退 `git revert <sha>`
- 云端 schema 回退：把 schema 文件 revert，重新上传
- 本地字段不会干扰旧代码（旧代码不读 box 字段）

## 不在本次范围

- 每日复习提醒推送
- 复习日历 / 热力图 / 记忆曲线图表
- 用户自定义间隔
- 老数据批量迁移脚本
- 错题本导出 / 分享
- 单元测试（项目无测试基础设施）
