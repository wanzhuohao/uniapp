# 统一平台 + 错题本 - 设计文档

> 日期：2026-04-09
> 状态：设计完成，待实施

## 1. 概述

将碑文排版（libei）、学习小天地（kids-learn）、面试助手（interview-practice）三个独立 UniApp 项目合并为一个统一平台，同时为学习模块新增错题本功能，并将题库迁移到 uniCloud 云数据库。

### 1.1 项目路径

- 新项目：`D:\code\uniapp`
- 原项目保留不动：
  - `D:/code/other/libei/` — 碑文排版
  - `D:/code/other/kids-learn/kids-learn/` — 学习小天地
  - `D:/code/other/kids-learn/interview-practice/` — 面试助手

### 1.2 技术栈

- UniApp Vue3 + Composition API (`<script setup>`) + TypeScript（碑文模块用 TS，其他模块用 JS）
- Pinia 状态管理
- uniCloud 阿里云（云数据库 + 前端网页托管 + 云函数）
- HanziWriter（笔顺动画）
- Web Speech API（语音朗读）

### 1.3 uniCloud 服务空间

新项目统一使用 **uniCloud-alipay**（阿里云支付宝版），与 libei 原项目保持一致，云函数和数据库直接搬过来无需迁移服务商。面试助手原项目用的是 `uniCloud-aliyun`，其云函数迁移到 `uniCloud-alipay` 时需在 HBuilderX 中重新关联服务空间。

## 2. 统一入口

`pages/index/index.vue` — 简洁入口页，3 个业务卡片：

| 入口 | 图标 | 路由 |
|------|------|------|
| 碑文排版 | 📝 | `/pages/stele/index` |
| 学习小天地 | 📚 | `/pages/study/index` |
| 面试助手 | 🎤 | `/pages/interview/index` |

右上角显示当前用户名，点击可修改。

## 3. 路由规划

### 3.1 统一入口
| 路径 | 说明 |
|------|------|
| `pages/index/index` | 统一入口（3 个业务卡片） |

### 3.2 碑文排版 `/pages/stele/`
| 路径 | 说明 |
|------|------|
| `pages/stele/index` | 碑文下单首页 |
| `pages/stele/list` | 订单管理 |
| `pages/stele/detail` | 详情 |
| `pages/stele/preview` | 预览 |
| `pages/stele/photo` | 查看照片 |
| `pages/stele/help` | 帮助 |

### 3.3 学习小天地 `/pages/study/`
| 路径 | 说明 |
|------|------|
| `pages/study/index` | 学习首页（模块选择 + 单元选择 + 星星） |
| `pages/study/pinyin` | 拼音练习 |
| `pages/study/stroke` | 笔顺练习 |
| `pages/study/math` | 算术练习 |
| `pages/study/mental-math` | 口算计时 |
| `pages/study/result` | 结算页 |
| `pages/study/wrong-book` | 错题本（列表 + 统计 + 趋势图） |
| `pages/study/wrong-book-practice` | 错题重练 |

### 3.4 面试助手 `/pages/interview/`
| 路径 | 说明 |
|------|------|
| `pages/interview/index` | 面试首页 |
| `pages/interview/practice` | 答题 |
| `pages/interview/records` | 练习记录 |
| `pages/interview/record-detail` | 答题详情 |
| `pages/interview/exam-result` | 考场结果 |
| `pages/interview/settings` | 设置 |

## 4. 用户标识

### 4.1 方案
- 用户自定义用户名，不做认证/密码
- 首次打开弹窗输入用户名，存 `uni.setStorageSync('username', 'xxx')`
- 云端所有数据用 `username` 作 key
- 本地缓存丢失后重新输入同一用户名即可找回云端数据

### 4.2 流程
```
App.vue onLaunch
  ↓
检查 localStorage 有无 username
  ↓ 无 → 弹窗输入用户名 → 存 localStorage
  ↓ 有 → 直接进入统一入口
```

### 4.3 useAuth 重写
```js
// composables/useAuth.js
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

## 5. 云数据库设计

### 5.1 `questions` — 题库表

```js
{
  _id: "自动生成",
  type: "pinyin" | "stroke",
  unit: "1-2",
  char: "花",
  // 拼音题专有
  pinyin: "huā",
  distractors: ["huà", "huá", "hā"],
  char_distractors: ["化", "画", "话"],
  // 笔顺题专有
  strokes: ["横", "竖", "竖", "撇", "竖", "横折", "横"],
  strokeCount: 7
}
```

- `type + char` 组合唯一
- 题库数据由用户后续提供，通过初始化脚本上传

### 5.2 `wrong_records` — 错题记录

```js
{
  _id: "自动生成",
  username: "小明",
  question_id: "questions表的_id",
  type: "pinyin" | "stroke",
  char: "花",              // 冗余，方便列表展示
  unit: "1-2",             // 冗余
  wrongCount: 3,           // 累计错误次数
  correctCount: 0,         // 重练连续答对次数（归零重计）
  mastered: false,         // 连对 2 次 → true
  lastWrongAt: 1712600000,
  createdAt: 1712500000
}
```

- `username + question_id` 组合唯一
- 答错：已有记录 → wrongCount+1, correctCount=0, mastered=false；无记录 → 新增
- 重练答对：correctCount+1，达 2 次 → mastered=true
- 重练又答错：wrongCount+1, correctCount=0, mastered=false

### 5.3 `practice_logs` — 练习日志（趋势统计用）

```js
{
  _id: "自动生成",
  username: "小明",
  type: "pinyin" | "stroke",
  date: "2026-04-09",
  totalCount: 10,
  correctCount: 8,
  createdAt: 1712600000
}
```

- 每完成一轮练习写入一条（同一天多轮 = 多条记录）
- 趋势图按 date 聚合：同一天多条记录合并计算当日总正确率

### 5.4 碑文模块表（从 libei 迁移）

- `order` — 碑文订单
- `albums` — 相册
- `photos` — 照片

### 5.5 面试模块表（从 interview 迁移）

- `interview_records` — 面试练习记录（原名 `practice_records`，重命名避免歧义）
- `exam_sessions` — 考场会话
- `interview_settings` — 面试设置（API Key、考场参数）（原名 `settings`，重命名避免歧义）
- `interview_questions` — 面试题库（原名 `questions`，重命名避免与学习题库表冲突）

### 5.6 用户标识适配

所有模块统一使用 `username` 字段作为用户标识。面试模块原有的 `user_id` 字段在迁移时替换为 `username`。

### 5.7 算术/口算不纳入错题本的说明

算术和口算题目是 JS 实时随机生成的，没有固定题目 ID，无法关联到 `questions` 表。且算术有自适应升降级机制已经覆盖了"薄弱点强化"的需求。因此 V1 错题本只收集拼音和笔顺。

## 6. 题库数据流

### 6.1 进入练习页面时

```
进入拼音/笔顺页面
  ↓
检查本地缓存 key: questions_{type}_{unit}
  ↓ 有缓存且 < 24 小时
  直接用缓存出题
  ↓ 无缓存或已过期
  从云数据库拉取（where: { type, unit }）
  ↓ 成功
  存入本地缓存（带时间戳） → 出题
  ↓ 失败
  用过期缓存兜底（如有） → 出题
  ↓ 完全无数据
  显示"暂无题目"提示
```

### 6.2 缓存格式

```js
uni.setStorageSync('questions_pinyin_1-2', {
  data: [...],           // 题目数组
  cachedAt: 1712600000   // 缓存时间戳
})
```

过期判断：`Date.now() - cachedAt > 24 * 60 * 60 * 1000`

### 6.3 cloudDb.js 封装

```js
// utils/cloudDb.js
const db = uniCloud.database()

// 按 type + unit 拉取题库（带本地缓存）
export async function getQuestions(type, unit) { ... }

// 通用查询/写入封装
export async function queryCollection(name, where, options) { ... }
export async function addDocument(name, data) { ... }
export async function updateDocument(name, docId, data) { ... }
```

## 7. 错题本功能

### 7.1 错题收集

答错时异步写入云端，不阻塞答题体验：

```
用户答错
  ↓ 异步
  wrongBook.record({ type, char, unit, question_id })
  ↓ 查 wrong_records 是否已有该题
  ↓ 有 → update: wrongCount+1, correctCount=0, mastered=false
  ↓ 无 → add: wrongCount=1, correctCount=0, mastered=false
```

每轮结束时写入 `practice_logs`：

```
本轮结束
  ↓
  practiceLog.record({ type, date, totalCount, correctCount })
```

### 7.2 错题本主页 `/pages/study/wrong-book`

**统计概览区**：
- 拼音错题数 / 笔顺错题数
- 待掌握数 / 已掌握数

**正确率趋势图**：
- 数据源：`practice_logs` 近 7 天
- 折线图，x 轴日期，y 轴正确率
- TrendChart 组件，CSS Canvas 简单实现，不引入图表库

**高频错字 TOP5**：
- 从 `wrong_records` 中 mastered=false 的记录，按 wrongCount 降序取前 5

**错题列表**：
- 筛选：拼音 / 笔顺 / 全部
- 每条显示：汉字、拼音/笔画数、错误次数、掌握状态
- 已掌握的灰显

**重练入口**：
- 底部按钮"开始重练（N 题未掌握）"
- 跳转到 `/pages/study/wrong-book-practice`

### 7.3 错题重练 `/pages/study/wrong-book-practice`

- 从 `wrong_records` 中 mastered=false 的记录，按 wrongCount 降序取题
- 根据 question_id 从缓存/云端获取完整题目数据
- 拼音题：复用 QuestionCard 组件
- 笔顺题：复用笔顺答题逻辑 + StrokeAnim
- 答对：correctCount+1，连对 2 次 → mastered=true，弹出"已掌握"提示
- 答错：wrongCount+1，correctCount=0
- 全部掌握 → 鼓励页"太棒了！全部掌握！"

## 8. 文件结构

```
D:\code\uniapp/
├── pages/
│   ├── index/index.vue                    ← 统一入口
│   ├── stele/                             ← 碑文排版（6 页面，从 libei 迁移）
│   │   ├── index.vue
│   │   ├── list.vue
│   │   ├── detail.vue
│   │   ├── preview.vue
│   │   ├── photo.vue
│   │   └── help.vue
│   ├── study/                             ← 学习小天地（8 页面）
│   │   ├── index.vue
│   │   ├── pinyin.vue
│   │   ├── stroke.vue
│   │   ├── math.vue
│   │   ├── mental-math.vue
│   │   ├── result.vue
│   │   ├── wrong-book.vue
│   │   └── wrong-book-practice.vue
│   └── interview/                         ← 面试助手（6 页面）
│       ├── index.vue
│       ├── practice.vue
│       ├── records.vue
│       ├── record-detail.vue
│       ├── exam-result.vue
│       └── settings.vue
├── components/
│   ├── common/                            ← 公共组件
│   │   └── TrendChart.vue                 ← 正确率趋势折线图
│   ├── study/                             ← 学习模块组件
│   │   ├── QuestionCard.vue               ← 通用答题卡片
│   │   ├── StarBar.vue                    ← 进度条+星星
│   │   └── StrokeAnim.vue                 ← HanziWriter 动画
│   └── stele/                             ← 碑文模块组件
│       └── WordPreview.vue          ← 碑面预览（从 libei 迁移）
├── composables/
│   ├── common/                            ← 公共
│   │   └── useAuth.js                     ← 用户名管理
│   ├── study/                             ← 学习
│   │   （暂无）
│   ├── stele/                             ← 碑文
│   │   └── useOrderForm.ts               ← 订单表单（TypeScript，从 libei 迁移）
│   └── interview/                         ← 面试
│       └── useTimer.js                    ← 计时（迁移）
├── store/
│   └── game.js                            ← 学习状态（星星、等级、单元）
├── utils/
│   ├── common/                            ← 公共工具
│   │   ├── cloudDb.js                     ← 云数据库操作封装
│   │   ├── storage.js                     ← localStorage 封装
│   │   └── speech.js                      ← TTS 语音
│   ├── study/                             ← 学习工具
│   │   ├── questionHelper.js              ← 出题辅助
│   │   ├── mathGen.js                     ← 算术生成
│   │   ├── wrongBook.js                   ← 错题本操作
│   │   └── practiceLog.js                 ← 练习日志记录
│   ├── stele/                             ← 碑文工具
│   │   ├── stele-utils.ts               ← 工具函数（TypeScript，从 libei 迁移）
│   │   └── word-preview.css        ← 预览样式（从 libei 迁移）
│   └── interview/                         ← 面试工具
│       └── constants.js                   ← 面试常量（迁移）
├── static/
│   └── data/
│       ├── pinyin.json                    ← 离线兜底
│       └── strokes.json                   ← 离线兜底
├── uniCloud-alipay/
│   ├── database/
│   │   ├── questions.schema.json          ← 学习题库
│   │   ├── wrong_records.schema.json      ← 错题记录
│   │   ├── practice_logs.schema.json      ← 练习日志
│   │   ├── order.schema.json              ← 碑文订单（从 libei 迁移）
│   │   ├── albums.schema.json             ← 碑文相册（从 libei 迁移）
│   │   ├── photos.schema.json             ← 碑文照片（从 libei 迁移）
│   │   ├── interview_records.schema.json  ← 面试记录（原 practice_records）
│   │   ├── exam_sessions.schema.json      ← 面试考场（迁移）
│   │   ├── interview_settings.schema.json ← 面试设置（原 settings）
│   │   └── interview_questions.schema.json ← 面试题库（原 questions，重命名）
│   └── cloudfunctions/
│       ├── generate-question/             ← 面试（迁移）
│       ├── review-answer/                 ← 面试（迁移）
│       ├── exam-summary/                  ← 面试（迁移）
│       ├── order-query/                   ← 碑文（从 libei 迁移）
│       ├── order-update/                  ← 碑文（从 libei 迁移）
│       ├── order-delete/                  ← 碑文（从 libei 迁移）
│       ├── album-create/                  ← 碑文（从 libei 迁移）
│       ├── album-list/                    ← 碑文（从 libei 迁移）
│       ├── album-update/                  ← 碑文（从 libei 迁移）
│       ├── album-delete/                  ← 碑文（从 libei 迁移）
│       ├── photo-insert/                  ← 碑文（从 libei 迁移）
│       ├── photo-list/                    ← 碑文（从 libei 迁移）
│       ├── photo-delete/                  ← 碑文（从 libei 迁移）
│       └── file-upload/                   ← 碑文（从 libei 迁移）
├── scripts/
│   └── seed-questions.js                  ← 题库上传脚本（数据待用户提供）
├── pages.json
├── App.vue
├── main.js
├── manifest.json
└── docs/
    └── specs/
        └── 2026-04-09-unified-platform-design.md
```

## 9. 迁移清单

| 来源项目 | 迁移内容 | 目标位置 | 需要改动 |
|----------|---------|---------|---------|
| libei | 6 个页面 | `pages/stele/` | 路由前缀改为 `/pages/stele/` |
| libei | WordPreview.vue | `components/stele/` | 直接复制 |
| libei | useOrderForm.ts | `composables/stele/` | 直接复制（保留 TS） |
| libei | stele-utils.ts, word-preview.css | `utils/stele/` | 直接复制 |
| libei | types/order.ts | `types/` | 如有依赖则迁移 |
| libei | 11 个云函数 | `uniCloud-alipay/cloudfunctions/` | 直接复制，同一服务商 |
| libei | 3 个 DB schema (order, albums, photos) | `uniCloud-alipay/database/` | 直接复制 |
| kids-learn | 7 个页面 | `pages/study/` | 路由前缀改为 `/pages/study/` |
| kids-learn | 3 个组件 | `components/study/` | 直接复制 |
| kids-learn | store/game.js | `store/` | 直接复制 |
| kids-learn | questionHelper, mathGen | `utils/study/` | 直接复制 |
| kids-learn | speech, storage | `utils/common/` | 直接复制（公共工具） |
| kids-learn | static/data/ | `static/data/` | 直接复制（离线兜底） |
| interview | 6 个页面 | `pages/interview/` | 路由前缀改为 `/pages/interview/` |
| interview | useTimer.js | `composables/interview/` | 直接复制 |
| interview | constants.js | `utils/interview/` | 重命名（原 interviewConstants.js → constants.js，目录已区分） |
| interview | 3 个云函数 | `uniCloud-alipay/cloudfunctions/` | 直接复制 |
| interview | 4 个 DB schema | `uniCloud-alipay/database/` | 重命名：practice_records→interview_records, settings→interview_settings, questions→interview_questions |

## 10. 范围边界

**V1 包含**：
- 统一入口页
- 3 个业务模块完整迁移（碑文排版、学习、面试助手）
- 错题本（列表、统计、趋势图、重练）
- 题库迁移到云数据库 + 本地缓存
- 用户名标识
- 练习日志记录
- 题库上传脚本（数据待用户提供）

**V1 不包含**：
- 用户认证/密码
- 后台管理页面
- 多年级支持
- 微信小程序适配
