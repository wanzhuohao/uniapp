# 统一平台 - 开发进度

> 项目路径: `D:\code\uniapp`
> 技术栈: UniApp Vue3 + Pinia + uniCloud-alipay
> 最后更新: 2026-04-11（错题重练 UI 改造 + 屏蔽面试入口）
> 状态: **已部署上线**，56 个 commit
> 域名: https://env-00jxhanvoaj1-static.normal.cloudstatic.cn/

## 本轮（2026-04-11）错题重练 UI 改造 + 多用户切换 + 草稿时序

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
- 拼音多音字数据未二次校对（保留 PDF 原数据）
- 笔顺按钮交互（hanzipi 数据太粗，HanziWriter 动画+自测代替）

---

## 关键路径参考

- 设计文档：`docs/specs/2026-04-09-unified-platform-design.md`
- 实施计划：`docs/plans/2026-04-09-unified-platform.md`
- 线上测试清单：`docs/online-test-checklist.md`
- 原项目保留：
  - `D:/code/other/libei/`
  - `D:/code/other/kids-learn/kids-learn/`
  - `D:/code/other/kids-learn/interview-practice/`
