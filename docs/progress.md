# 统一平台 - 开发进度

> 项目路径: `D:\code\uniapp`
> 技术栈: UniApp Vue3 + Pinia + uniCloud-alipay
> 最后更新: 2026-04-14
> 状态: **已上线**，累计 100+ commit
> 域名: https://env-00jxhanvoaj1-static.normal.cloudstatic.cn/

## 2026-04-13~14 汉字练习改造 + 数据修正

### 1. 笔顺题改为描红模式
- **HanziQuestion.vue** — 笔顺题从"看字→播放动画→自判"改为 HanziWriter quiz 描红（280px），自动判定错笔数，完成后显示结果+动画回放+下一题
- 动画加速：strokeAnimationSpeed=2, delayBetweenStrokes=200

### 2. 删除听写页，合并到汉字练习
- 删除 `dictation.vue`、pages.json 路由、学习首页入口、App.vue 暗色选择器
- 听写功能由笔顺题替代（保留喇叭按钮可选念字）

### 3. 出题逻辑改造
- hanzi.vue `buildRound` 重写：不再随机抽几题，改为**该单元所有字按课文顺序逐个出题**
- 单一题型：每字一道该题型；混合模式：每字随机分配一种题型

### 4. 第4单元数据修正
- 22 个字确认正确：思床前地故乡 色把讲样笑再 节米间分吃肉 册支电衣
- 新增 4 个字（册支电衣）到 strokes/pinyin/seed-questions
- 三个数据文件按课文顺序排列
- 其余单元暂归 2-0 待整理

### 5. 数据维护刷新优化
- 刷新按钮：清旧缓存 → 拉云端全量 → 按 type+unit 写入本地缓存 → 答题页直接用

### 部署
- ✅ seed-questions 云函数已上传运行
- ✅ 前端已重新发行（2026-04-14）

---

## 2026-04-11 方案二大批次（44 个 commit）

**方案二：改进与新功能** — 从头脑风暴清单一次性全部落地：

### 1. 重构（技术债）
- **HanziQuestion 共享组件** — 抽出 hanzi.vue / wrong-book-practice.vue 重复的汉字题 UI（约 100 行），两个页面都改用组件
- **toast wrapper** — 抽 `utils/common/toast.js`，一次迁移 84+ 处 `uni.showToast` / 15+ 处 `showLoading`，5 个方法 API（success / error / info / loading / hideLoading），84 处调用覆盖完整 grep 验证

### 2. 基础设施
- **UserSwitcher 多用户切换 UI** — 新建 `components/common/UserSwitcher.vue` 模态浮层 + `composables/common/useRecentUsers.js` localStorage 列表（最多 5 个）。首页点用户名弹出，支持切换 / 删除 / 添加新用户
- **错题智能复习（Leitner Box 5 级）** — `wrong_records` schema 加 `box` + `nextReviewAt`，`wrongBook.js` 重写算法：box 1/1/3/7/15 天间隔，错题本主页加 tab 切换 "待复习 / 全部"

### 3. 新功能
- **听写练习** — 新建 `pages/study/dictation.vue`：TTS 念字 + HanziWriter quiz 描红 + 自测判对错，10 题一轮，答错进错题本（type=hanzi，qType=dictation，和 Leitner 流合流）
- **暗色模式（学习模块）** — `utils/common/theme.js` + App.vue 全局 CSS（`html body.dark-mode ...` 0,3,0 优先级穿透 scoped），浮动切换按钮用 DOM API 注入 body（App.vue template 在 uniapp H5 不渲染），HanziWriter strokeColor 按主题动态传

### 4. 小改 / Bug 修复
- **面试入口** 完全移除（设计中，之前只是置灰）
- **错题本口算** 算式横排显示（之前被 80rpx 宽的 wrong-char 挤成一字一行）
- **碑文 detail 改用 el-splitter** 左右栏可拖动调整宽度
- **碑文草稿提示** 改为编辑区顶部非阻断横幅（原来是 uni.showModal 阻塞）
- **stele/detail** 返回按钮去掉"确定返回"确认弹窗

### 5. 文件清理
- 删除 `static/data/characters.json` / `hanzipi_strokes.json` / `hanzipi_cache.json` 3 个无引用数据文件
- 删除 `uniCloud-alipay/database/JQL查询.jql` 空模板
- 保留 `seed-questions` 云函数（用户决定）

### 6. 暗色模式全面自测（20 个页面场景）
全部 ✓。修复过程中发现的小问题都修到位：
- StarBar `.star-num` / `.dot` 浅色
- TopBar + StarBar `goBack` 加 navigateBack fallback → reLaunch study/index（解决 reLaunch 后页面栈只有 1 页返回失效）
- 口算 timer / 听写字轮廓 outline 提亮
- 数据维护 unit-filter / item / modal 等实际 class 名
- 结果页 score / encourage / star-text
- 错题本 wrong-item 红色冲突（限定到 mental-page）
- UserSwitcher 模态完整暗色（us-card / us-item.current / us-badge 等）
- HanziWriter strokeColor 按主题动态选色（4 处 create 调用全部改）
- toggleDark 后 location.reload 确保 HanziWriter 重建
- 错题重练 practice-mode-hint 暗色 + 文案按 practiceAll 切换"今日/全部"

### 部署清单
- ✅ `wrong_records.schema.json` 已上传 uniCloud（含 box / nextReviewAt / qType dictation）
- ✅ HBuilderX 重新发行前端（2026-04-13 完成）

### 关键新增文件
- `components/common/UserSwitcher.vue`
- `components/study/HanziQuestion.vue`
- `composables/common/useRecentUsers.js`
- `utils/common/toast.js`
- `utils/common/theme.js`
- `pages/study/dictation.vue`
- 6 份 spec + 3 份 plan 在 docs/specs 和 docs/plans

---

## 2026-04-11 早些时候：错题重练 UI 改造 + 多用户切换 + 草稿时序

**多用户切换 P0 修复**
- `pages/index/index.vue` editUsername 成功后调 `uni.reLaunch` 回首页，清空页面栈，确保下次进入子页面都加载新用户数据
- 同时广播 `username-changed` 事件（保留兼容）

**stele/detail 草稿时序 P2 修复**
- modal success 回调改为 async，loadDraft 后 `await nextTick()` 再 refreshPreview，避免响应式未沉淀就读旧值
- 草稿损坏 / 用户选新建 两种分支都正确清草稿

**错题重练 UI 改造**
- **wrong_records.schema.json** 新增 `qType` 字段（汉字题子类型：radical/structure/strokeCount/stroke）
- **utils/study/wrongBook.js** `recordWrong` 接受并存储 `qType`
- **pages/study/hanzi.vue** 答错时记录 `qType`
- **pages/study/wrong-book-practice.vue** 完全重写：
  - 入口先选类型（拼音/汉字/口算 三个卡片）
  - 拼音重练复用 `QuestionCard` 组件，4 选 1 大按钮，和 pinyin.vue 一致
  - 汉字重练用 hanzi.vue 同款 UI（type-badge + char-display + 选项卡 / HanziWriter 自测），按 qType 出原题型
  - 口算重练改为**一屏批量**（所有错题列表式输入，交卷一次性批改并写入答对/答错状态）
  - 答对 2 次自动标记掌握的逻辑保留
  - 完成态显示得分 + 本轮掌握题数
- **pages/index/index.vue** 屏蔽面试入口（卡片置灰，文案"重新设计中，暂不可用"）

**部署清单**
- ⏳ wrong_records.schema.json（新增 qType 字段需重新上传到 uniCloud）
- ⏳ 前端静态托管（HBuilderX 重新发行）

---

## 上轮（2026-04-10）发布前审查与修复

三个 agent 并行全面审查（学习 / 碑文面试 / 云端工具层），人工核实后修复：

**P0 致命 bug（已修）**
- 多用户数据隔离：storage 按用户名分 key、store 加 switchUser、面试模块加 username 过滤和 ownership 校验
- 题库云端拉取：learn/hanzi 改为先云端后本地降级
- 趋势图数据：accuracy/rate 字段兼容
- 错题重练死代码：hanzi/math 类型改自测模式
- CSS 变量缺失：App.vue 补全 --color-text-light 等
- 用户名弹窗 UX：content 清空、showCancel false、空输入递归重弹
- 首次输入用户名后 index.vue 不刷新：uni.\$emit + uni.\$on 事件通信

**P1 重要问题（已修）**
- hanzi 页面错题按轮次 Set 去重
- mental-math recordWrong 改 Promise.all await
- wrong-book-practice distractors 空时从同单元其他题拼音兜底
- data-admin 删除也清本地缓存
- stele/list 响应 code 校验
- interview/index 多处 bound 检查 + startFree 改用 storage 传题（避免 URL 超长）
- stele/photo 上传改容错循环 + 统计成功/失败数
- generate-question 云函数参数校验 + count 限幅

**P2 优化（已修）**
- 新建 TopBar 组件，学习模块 4 个页面接入
- result.vue encourageText 改按正确率
- interview/records formatTime 跨年显示年份
- stele/preview Three.js 资源 dispose 后置 null
- store/game \_syncCloud 失败加 toast 提示

**误报清单**（已核实不改）
- 碑文 order-query 不过滤 username → 单人工作工具，不是 bug
- questions.schema type 枚举只有 pinyin/stroke → 正确，hanzi/math 是 wrong_records 的 type
- 各处 res.data 兼容访问 → 已有保护
- store switchUser 字段不全 → 覆盖了所有 5 个 state 字段

**本轮部署清单**
- ✅ wrong_records / practice_logs / questions schema
- ✅ generate-question 云函数
- ✅ 前端静态托管（2 次发行：P0/P1/P2 + 首次用户名刷新 hotfix）

**自动化测试覆盖**
- 用户名流程、学习-拼音、错题本、错题重练、数据维护、面试首页、碑文列表：全部通过
- 未覆盖需手工：HanziWriter 动画、口算 100 题、learn 自定义 back、3D 预览、照片上传、多用户切换

---

## 项目概况

三业务合一的 UniApp H5 应用：
- **碑文排版** — 原 libei 项目迁移
- **学习小天地** — 一年级下册拼音/汉字/口算练习（核心业务）
- **面试助手** — 原 interview-practice 项目迁移

果果（一年级小朋友）日常学习使用。

---

## 已完成功能

### 统一入口（pages/index/）
- 3 个业务卡片
- 用户名标识（首次弹窗输入，存 localStorage，云端按用户名 key 同步）
- 碑文卡片直达订单列表页

### 学习模块（pages/study/）6 个功能 + 1 个管理

| 页面 | 功能 |
|------|------|
| `index.vue` | 学习首页（6 个入口卡片） |
| `learn.vue` | **学习** — 看字自测，显示汉字→点击查看答案（拼音/部首/结构/笔画数）→HanziWriter 笔顺动画→我会了/不会了→错题进错题本+汉字皮 iframe 扩展学习 |
| `pinyin.vue` | **拼音** — 单元筛选+题型筛选（看字选拼音/看拼音选字/混合）+4 选 1+发音按钮 |
| `hanzi.vue` | **汉字** — 单元筛选+题型筛选（笔顺自测/部首/结构/笔画数 4 选 1/混合）+HanziWriter 动画 |
| `mental-math.vue` | **口算** — 100 题计时挑战，Lv.1/2/3 三难度，8 分钟和 10 分钟提醒，答错进错题本 |
| `wrong-book.vue` | **错题本** — 拼音/汉字/口算 分类统计+近 7 天正确率趋势图+高频错字 TOP5+按类型筛选列表 |
| `wrong-book-practice.vue` | **错题重练** — 从未掌握错题出题，答对 2 次标记掌握 |
| `data-admin.vue` | **数据维护** — 按汉字合并展示/编辑/新增/删除，支持单元筛选+搜索，云端直存 |
| `result.vue` | 结算页（得星+鼓励语） |

### 碑文模块（pages/stele/）6 个页面
- `index.vue` 下单首页、`list.vue` 订单管理、`detail.vue` 详情（PC 编辑）
- `preview.vue` 3D 预览（Three.js）、`photo.vue` 相册、`help.vue` 帮助

### 面试模块（pages/interview/）6 个页面
- `index.vue` 首页（3 tab 自定义导航）、`practice.vue` 答题
- `records.vue` 记录、`record-detail.vue` 详情
- `exam-result.vue` 考场结果、`settings.vue` 设置（DeepSeek API Key）

---

## 数据层

### 题库（questions 表，350 条）
- **来源**：部编版一年级下册语文教材 PDF OCR
- **字段**：char / pinyin / radical / structure / strokeCount / distractors / char_distractors / unit / type
- **准确性校对**：
  - 笔画数：hanzi-writer-data 校对，184/184 全对 ✅
  - 部首：cnchar-radical 校对修正 51 个 ✅
  - 结构：cnchar-radical 校对修正 39 个 ✅
  - 拼音：PDF 原数据（hanzipi 多音字不可靠未采用）
- **笔顺展示**：用 HanziWriter 标准动画（本地不存简化数据）
- **单元划分**：8 个单元（2-1 到 2-8），按 PDF 课文顺序

### 用户数据云端同步
| 表 | 用途 |
|----|------|
| `user_stats` | 星星/等级/单元（跨设备同步，1 秒防抖写云端） |
| `wrong_records` | 错题记录（type + char + question_id，支持重练标记） |
| `practice_logs` | 每轮练习（用于趋势图） |
| `questions` | 题库（本地 24h 缓存） |

### 碑文数据
- `order` / `albums` / `photos`（从 libei 迁移）

### 面试数据
- `interview_records` / `exam_sessions` / `interview_settings` / `interview_questions`

---

## 技术栈

- **框架**：UniApp Vue3 + Composition API（`<script setup>`）
- **状态**：Pinia（学习模块）
- **云**：uniCloud-alipay（数据库 + 云函数 + 前端网页托管）
- **汉字**：hanzi-writer（笔顺动画）
- **碑文**：element-plus + three.js + html2canvas + vuedraggable 4.x
- **语音**：Web Speech API（TTS 发音）
- **TS**：碑文模块用 TypeScript，其他模块 JS

---

## 重要决策记录

1. **3 个原项目合并** — libei + kids-learn + interview-practice 合并为一个 uniapp，按业务分目录
2. **数据结构按 type 分** — 历史原因 questions 表分 pinyin 和 stroke 两种类型，一个汉字有两条记录（data-admin 展示时按 char 合并）
3. **笔顺交互放弃手动数据** — 尝试过手写笔顺数据、hanzipi 简化笔顺，都不够可靠，最终用 HanziWriter 动画+自测模式
4. **用户标识轻量化** — 不做登录，只用用户名作云端 key
5. **题库数据本地+云端双存** — 本地 JSON 24h 缓存兜底，云端为主
6. **URL 保留 hash 模式** — history 模式对体验无明显帮助
7. **pages 前缀无法去掉** — UniApp 硬性规则

---

## 云函数（uniCloud-alipay/cloudfunctions/）15 个

**碑文（11）**：order-query/update/delete、album-create/list/update/delete、photo-insert/list/delete、file-upload

**面试（3）**：generate-question、review-answer、exam-summary

**学习（1）**：seed-questions（题库种子数据上传）

---

## 数据库 schema（10 张）

- 学习：`questions` / `wrong_records` / `practice_logs` / `user_stats`
- 碑文：`order` / `albums` / `photos`
- 面试：`interview_records` / `exam_sessions` / `interview_settings` / `interview_questions`

---

## 部署

- **服务商**：uniCloud 支付宝云（w060761）
- **方式**：HBuilderX → 发行 → 上传到前端网页托管
- **状态**：已上线（具体域名待记录）

---

## 遗留事项

- 果果实测持续收集反馈
- 数据维护刷新拉取 limit 500 硬编码，题目超过 500 条会截断，需改为分页拉取全量
- 其他单元（2-1~2-3, 2-5~2-8）字表待整理（当前全部归在 2-0）
- ~~拼音多音字数据未二次校对（保留 PDF 原数据）~~ — 暂不处理
- ~~笔顺名称逐字校对（166 字）~~ — 暂不处理
- ~~笔顺按钮交互（hanzipi 数据太粗，HanziWriter 动画+自测代替）~~ — 暂不处理

---

## 关键路径参考

- 设计文档：`docs/specs/2026-04-09-unified-platform-design.md`
- 实施计划：`docs/plans/2026-04-09-unified-platform.md`
- 线上测试清单：`docs/online-test-checklist.md`
- 原项目保留：
  - `D:/code/other/libei/`
  - `D:/code/other/kids-learn/kids-learn/`
  - `D:/code/other/kids-learn/interview-practice/`
