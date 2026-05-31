# 碑文排版 - 开发进度

> 项目路径: `D:\code\uniapp`
> 技术栈: UniApp Vue3 + uniCloud-alipay（仅 3 个订单云函数 + order 集合）
> 最后更新: 2026-05-29
> 状态: **已上线**
> 域名: https://env-00jxhanvoaj1-static.normal.cloudstatic.cn/
> 品牌: **老万石雕**

## 2026-05-29 飞机肉鸽 难度曲线拉长 + 两个新道具

### 难度曲线
- `tier` 取消硬 cap,从 `min(3, floor(elapsed/20000))` 改 `floor(elapsed/30000)`,30s 升一档无上限
- `spawnInterval` 起步 800→900ms,衰减系数 /60→/100(更平缓),触底 220→120ms;约 100s 接近底
- enemy HP 公式 `1 + tier + (elite?2:0)`,**完全无上限**,每档 +1:tier 5 时 HP 6, tier 10 时 HP 11,精英再 +2
- 精英概率 `min(0.85, tier*0.05)` 平滑增长,封顶 85%(原 60s 后 70% 就锁死)
- 敌人体型 `sizeBoost = min(0.8, tier*0.08)` 加 cap 防止遮屏
- 敌人速度 `tierForSpeed = min(6, tier)` cap 防止后期飞太快
- 精英开火频率随 tier 加快,封底 600ms(原恒定 ~1800ms)

### 子弹大小道具(skills.js bulletSize, max 5)
- player 加 `bulletSize` 字段(默认 1)
- skill 每级 ×1.25;满级 1.25^5 ≈ 3.05 倍
- `spawnBullet` 子弹 r 乘 bulletSize(视觉+碰撞同时变大)

### 吸铁石道具(skills.js magnet, max 4)
- player 加 `magnetRange` 字段(默认 0,单位:unit 倍数)
- skill 每级 +5 unit(≈60px);满级 20 unit(≈250px)覆盖大半屏
- `boxes` update 加磁吸逻辑:范围内宝箱朝玩家飞,距离反比加速(blend = 1 - d/range);默认下落 50px/s,满级磁吸内速度达 150+ px/s

### 自测
- engine smoke test 5 分钟:fresh HP 30s=1 / 60s=2 / 90s=5 / 150s=7 / 300s=12,持续无封顶;aliveEnemies 同步从 10 涨到 30+;elite 数从 0 涨到 13+
- 子弹大小升级 3 次:r 从 3.50 → 6.83 (≈1.95x,符合 1.25^3=1.95)
- 磁吸满级:远段 50px/s(默认),进入 250px 范围后 154px/s(3x 加速,符合预期)

---

## 2026-05-29 飞机肉鸽小游戏 canvas → DOM 渲染改造

### 背景
`pages/game/plane/` 原 canvas 2D 实现在手机上"尺寸/位置错位"——按 [[reference_uniapp_h5_canvas_wrapper]] 修齐 querySelector + DPR cap + raf fallback 之后,真机仍偶发飘。换 DOM 渲染绕开所有 canvas 坐标系折腾。

### 改动
- `engine.js`：删除整个 draw()（150 行），新增 `getRenderState()` 返回所有实体快照 + `onFrame` 回调；每实体加自增 id；粒子上限 cap 30、飘字 cap 12 防 DOM 暴涨
- `index.vue`：去掉 `<canvas>` + `initCanvas` + `applyResize` 全套；改为绝对定位 view 层级（背景渐变 + 18+10 颗星空 + 粒子 + 宝箱 + 敌人 + 子弹 + 敌弹 + 玩家 + 飘字 + 闪屏）；每实体 `transform: translate3d` 走 GPU；玩家飞机改 CSS clip-path 拼装（机身六边形 + 双翼 polygon + 驾驶舱圆 + 双层尾焰 flicker 动画 + 护盾 ring）；敌人六边形用 clip-path，HP 条放外层 wrap 避免被剪裁；触控基准统一用 `.game-area` 的 `getBoundingClientRect`

### 自测
- engine smoke test（驱动 30s/1875 帧）：推进到 Lv3 / 21 击杀 / 1 宝箱、onUpgrade 触发 3 次、粒子/飘字 cap 守住
- `@vue/compiler-sfc` parse + scriptSetup + template 全部编译通过（修了一处 `// #ifdef` 两支 const raf 重复声明的 lint 报错,改 let + 分支赋值）

### 待验证
- HBuilderX 运行 H5 真机/模拟器看实际渲染效果（PC 模拟器和真机表现可能不同）
- 极端尖峰（多精英怪同屏 + 全屏爆破触发大量粒子）下 DOM 节点数是否稳定 ≤150

### 关联经验
- [[feedback_uniapp_canvas_to_dom]] — 何时该放弃 canvas 改 DOM
- [[reference_uniapp_ifdef_const_dup]] — uniapp #ifdef 两支同名 const 离线 lint 报重复

---

## 2026-04-22 首页主卡箭头修正

`pages/index/index.vue` 主卡右下角 `.tool-arrow` 原本是 `入 ──→`（"入"字 + 箭头线），手机窄屏下"入"字与 `.tool-desc` 末行重叠。去掉"入"字，只保留 `──→`，同步删掉 `.tool-arrow-txt` CSS 规则。

## 2026-04-21 UI 整体中式化重构（老万石雕品牌）

### 目标
原 Element Plus 默认样式缺乏品牌识别度。围绕"老万石雕"品牌，建立一套中式工具书 / 文书气质的视觉语言，避免 AI 生成的通用感。

### 设计系统（App.vue）
- **色板 CSS 变量**：`--paper-*`（6 级米色宣纸）、`--ink-gold-*`（4 级金棕）、`--ink-vermilion-*`（3 级朱砂）、`--ink-*`（5 级墨色）+ 透明色阶 `--gold-a10/15/25/35/60`
- **共用图元**：`--paper-bg`（径向宣纸渐变）、`--paper-noise-url`（SVG noise 噪点 data URI）、`--brush-line-url`（毛笔横画 data URI）、`--shadow-paper/seal`
- **字体**：引入 **霞鹜文楷 Screen**（Web Font 通过 `registry.npmmirror.com` CDN 加载）作 `--font-display`；英文 `--font-en` 用 Georgia
- **旧变量映射**：`--color-primary` 等保留并映射到新变量，不破坏 Element Plus

### Element Plus 全局中式化
全部在 App.vue `:root` 级别写 `!important` 规则，覆盖：button / input / select / textarea / radio / radio-button / checkbox / switch / dropdown-menu / pagination / dialog / message，外加 `::selection`、滚动条、`:focus-visible`、`prefers-reduced-motion`。

### 品牌元素
- **品牌名**："工具箱" → "老万石雕"（印章字"器" → "万"）
- **favicon.svg**：朱砂"万"字方印（SVG，零加载成本）
- **各页 title 后缀**：`pages.json` / `index.html` 统一为 "· 老万石雕"

### 页面改造（全部用宣纸渐变 + 噪点背景）
- **首页** `pages/index/index.vue`
  - 品牌带：110rpx 楷体主标 + Georgia 拼音副标 + 座右铭"一凿一刻，传世可期"
  - 右上角 96rpx 朱砂"万"字方印（-8° 旋转 + 晕染光环）
  - 分隔线 + "匠"字小方印
  - 章节标"壹 · 工坊器用"（向左突出 -16rpx + 毛笔横画）
  - 工具网格 `3fr 2fr` 不对称：主卡片跨列+书脊双线，副列两张"敬请期待"
  - 墨竹角饰 SVG（右下角 opacity 0.18）
  - 页脚落款"石上春秋 · 字字千年"
  - **入场仪式 2.3s**：墨滴扩散 → 标题 clip-path 左→右墨染 → 副标/座右铭 fade → 朱砂印砸下+晕染 → 分隔线 → 章节标 → 毛笔画线 → 主卡 → 副卡 → 页脚 → 墨竹
- **列表页** `pages/stele/list.vue`
  - 页头楷体标题"碑文记录"+ 英文副标 + 毛笔横画（限宽 280px）
  - 桌面表格：米白底 + 金色表头 + 朱砂描边 tag；**hover 最左 td 出现 3px 朱砂竖线**（朱批感）
  - 移动端卡片：**左侧 48×48 朱砂方印**（双/父/母一字）+ 考妣称谓分栏 + 虚线分割 + 日期
  - 空态：SVG "未立"碑 + "尚无碑文"楷体
  - Loading："墨"字旋转 + 金色环
- **下单页** `pages/stele/index.vue`
  - 步骤条 1/2/3 → **壹/貳/叄 朱砂方印**，当前步骤 -3° 倾斜+脉冲阴影；hover 印章抖动
  - 步骤间虚线连接
  - 底部**毛玻璃抽屉式操作栏**，按钮楷体+大字距
  - draft-notice 改朱砂"稿"字方印引导
  - 名单组左侧 3rpx 金色书脊
- **详情页** `pages/stele/detail.vue`
  - 顶栏压缩至 40px 高度（原 70px）
  - section-title 下 72px 毛笔短画装饰
- **帮助页** `pages/stele/help.vue`
  - 改造成**线装卷轴**：上下金色卷轴杆 + 圆形轴头 + 顶部"说"字朱砂小印
  - 6 章节用 壹/貳/叄/肆/伍/陸 朱砂方印编号 + 毛笔横画延伸线
  - 警告框改"注"字方印式
- **3D 预览页** `pages/stele/preview.vue`
  - 工具栏米白+楷体；空态改"观"字大方印
- **WordPreview** 组件
  - 字体栈前置 LXGW WenKai Screen
  - 最终保持简洁**无外框**（尝试过卷轴装饰+落款，被用户撤销）

### 印章式 Toast（`utils/common/toast.js`）
- H5 环境走自定义 DOM toast，非 H5 回退 uni.showToast
- **成功**："成"字金印（盖章动画 rotate -18° → +4° → -3°）
- **失败**："误"字朱砂印
- **info**："告"字金印
- **loading**：金色旋转环 + 反向旋转的"墨"字（视觉保持正向）
- 每个 toast 带上下虚线装饰

### 风险 / 待验证
- **html2canvas 导出 PNG 字体兼容性未实测**：霞鹜文楷是 Web Font，跨 iframe 截图可能 fallback 到系统 STKaiti。需要实际点"保存图片"测一次
- `backdrop-filter: blur` 在 Safari 15.4 以下不支持（底栏失色但不崩）

### 新增/修改文件清单（代码层，不含 docs）
```
新增：static/favicon.svg
修改：App.vue、index.html、pages.json
      pages/index/index.vue
      pages/stele/{detail,help,index,list,preview}.vue
      components/stele/WordPreview.vue
      utils/common/toast.js
      utils/stele/word-preview.css
```

---

## 2026-04-20 精简为纯碑文项目

### 背景
面试模块、相册、用户系统全部不再需要；语文模块早已迁到 uniapp-aliyun 纯前端版，残留代码仅作历史参考。本次彻底清理。

### 删除范围
- **页面目录**：`pages/study/`（8）、`pages/interview/`（6）、`pages/stele/photo.vue`
- **组件/工具**：`components/study/`、`components/common/{UserSwitcher,TopBar,TrendChart}.vue`、`utils/study/`、`utils/interview/`、`utils/common/storage.js`、`composables/interview/`、`composables/common/{useAuth,useRecentUsers}.js`、`store/game.js`（+ 整个 store/）、`scripts/{rebuild-questions.py,seed-questions.js}`
- **云函数（12）**：`seed-questions`、`migrate-unit`、`generate-question`、`review-answer`、`exam-summary`、`album-{create,delete,list,update}`、`photo-{insert,delete,list}`
- **数据库 schema（10）**：`questions`、`wrong_records`、`practice_logs`、`user_stats`、`exam_sessions`、`interview_{questions,records,settings}`、`albums`、`photos`
- **依赖（5）**：`hanzi-writer`、`hanzi-writer-data`、`cnchar`、`cnchar-order`、`cnchar-radical`
- **阿里云控制台**：用户手动删除上述云函数和集合（现仅剩 order-* 三函数 + order 集合）

### 修改
- `pages.json`：21 条路由 → 6 条（只留碑文相关）
- `App.vue`：清掉所有 useAuth/useGameStore/浮动主题按钮/dark-mode 样式，400+ 行 → 33 行
- `pages/index/index.vue`：删语文卡和用户切换，简化为只有碑文入口
- `pages/stele/list.vue`：删"相册"按钮及 `goToPhoto`
- `components/common/TopBar.vue`：兜底跳转从 `/pages/study/index` 改为 `/pages/index/index`（随后整个文件被删）
- `uniCloud-alipay/database/db_index.md`、`docs/project-overview.md`：更新描述

### docs 整理
- 迁至 `uniapp-aliyun/docs/`（语文模块专属设计，6 份）：dictation-design、dark-mode-design、smart-review(plan+design)、hanzi-question-component(plan+design)
- 删：unified-platform(plan+design)、user-switcher(plan+design)，共 4 份（全部过时）
- 保留：toast-wrapper(plan+design)（通用组件，碑文也在用）

### 收尾修复与清理（当日稍后）
- `fix(stele): list 删除订单补错误分支校验`（`7f8e1df`）—— `order-delete` 失败不再误报"已移除"
- `fix(stele): preview 重渲染时 cancelAnimationFrame`（`1ac4801`）—— `renderThreeStele` 二次调用防御 double-animate；`onBeforeUnmount` 其它资源释放此前已完整
- `chore: 清理精简后残留的死代码`（`16ae072`）—— 删 `utils/common/{cloudDb,speech,theme}.js`、`static/data/{pinyin,strokes}.json`、`scripts/` 空目录；`main.js` 去掉 `createPinia()` 注册；`package.json` 删 `pinia` 依赖（项目零 store）

### 保留云资源
- 云函数：`order-delete`、`order-query`、`order-update`
- 集合：`order`

---

## 2026-04-16 题库单元整理 + 课程多选 + 移除数学模块

### 0. 移除数学模块 + 改名语文练习
- **移除数学模块**（已迁移到 uniapp-aliyun）
- 删除 `pages/math/` 4个页面（index/online/print/history）
- 删除 `pages/study/mental-math.vue`（口算计时）
- 删除 `utils/math/`（mathStorage.js、questionEngine.js）、`utils/study/mathGen.js`
- 清理：首页数学卡片、学习首页口算入口、错题本/错题重练口算模式、store math 字段、App.vue 共享模式路由守卫 + 暗色口算样式
- 净删除 3351 行
- **改名**："学习小天地" → "语文练习"，子菜单：生字学习 / 拼音练习 / 汉字练习
- **learn.vue** 单元筛选改为两级多选（之前漏改）

---

### 1. unit 字段改为三级格式 `2-单元-课号`
- 旧格式 `"2-4"` → 新格式 `"2-4-7"`（第四单元-阅读7）
- 语文园地用课号 `0`（如 `"2-5-0"`）
- 未分类字统一为 `"2-0-0"`

### 2. 整理第5、6单元数据（按写字表照片）
- **第五单元**（26字）：识字5-8 + 语文园地五
  - 2-5-5: 物造运欢房网 | 2-5-6: 对今雪细夕语
  - 2-5-7: 打皮跑足沙包 | 2-5-8: 近习远学玉义
  - 2-5-0: 饱抱
- **第六单元**（26字）：阅读10-13 + 语文园地六
  - 2-6-10: 首池采尖角早 | 2-6-11: 玩眼泪它贝气
  - 2-6-12: 机台唱伞朵美 | 2-6-13: 这看鱼面问加
  - 2-6-0: 豆斗
- 第四单元（22字）拆分课号：阅读7/8/9 + 语文园地
- 新建 31 个字的完整条目（pinyin + strokes），5 个字补充 strokes 数据

### 3. 课程筛选改为两级多选
- 第一级：选单元（第四/五/六单元、未分类）
- 第二级：选课程（多选，如 识字5、识字6…），带"全选"按钮
- 影响页面：hanzi.vue、pinyin.vue、data-admin.vue
- 新建 `utils/study/unitConfig.js` 共享配置
- `cloudDb.js` `getQuestions` 支持传入 unit 数组（用 `dbCmd.in`）

### 4. 云端数据迁移思路
- **不靠 seed-questions 全量重传**，而是写独立迁移云函数 `migrate-unit`
- 迁移函数按字查映射表，只改 unit 字段，数据量小、风险低
- 上传运行一次后可删除
- 前端只需认新格式，不需要兼容旧格式

### 部署清单
- ✅ 上传 `migrate-unit` 云函数并运行（358条：81更新，277归未分类）
- ✅ 上传 `seed-questions` 云函数（新增67条，更新358条）
- ✅ 前端重新发行（2026-04-16）

### 新增/修改文件
- `utils/study/unitConfig.js`（新建）
- `static/data/pinyin.json`、`static/data/strokes.json`（重写）
- `uniCloud-alipay/cloudfunctions/seed-questions/index.js`（重写）
- `uniCloud-alipay/cloudfunctions/migrate-unit/index.js`（新建）
- `pages/study/hanzi.vue`、`pinyin.vue`、`data-admin.vue`（UI改造）
- `utils/common/cloudDb.js`（支持多unit查询）
- `store/game.js`（默认unit改为2-4）
- `scripts/rebuild-questions.py`（可复用数据重建脚本）

---

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
