# 统一平台 - 待修问题清单

> 生成时间: 2026-04-10
> 来源: 发布前二次全面代码审查（3 个 agent 并行 + 人工核实）
> 已修：P0 batch 1/2 + P1 batch 1（详见 git log）

---

## 已核实为误报（不用改）

| 报告项 | 核实结果 |
|--------|---------|
| wrong-book-practice.vue:156 未 await getQuestions | 第 174 行已 `await getQuestions(...)` |
| learn.vue:158 currentQuestion null 未检查 | 第 129 行 `if (!el || !currentQ.value) return` 已保护 |
| store.game switchUser 字段不全 | state 只有 5 字段，全部已重置 |
| practice.vue 写 interview_records 缺 username | 第 157 行 `username: getUsername()` 已带 |
| exam-summary 云函数写 exam_sessions 缺 username | 第 72 行已带 |
| wrong-book TOP5 数据源不全 | 已按 wrongCount desc 排序，limit 200 合理 |
| stele 模块数据无 username 隔离 | 碑文模块是家里一个人的工作工具，单人使用，无需隔离（**待用户确认**） |

---

## 误判已澄清

- **3D 预览手势支持**：preview.vue 用的 `OrbitControls`（three.js 内置）默认就支持触屏 two-finger pinch zoom + 单指旋转，无需额外开发。

## 真 - P0（必改）

### [P1-new] 云函数调用量偏高，需要优化（2026-04-10 用户反馈）
**现象**：uniCloud 云函数使用量上升较快，接近/超过免费额度预警。
**可能的热点**：
1. App.vue onLaunch 每次冷启动都调用 `loadFromCloud` → queryCollection user_stats
2. 学习模块每次进页面都 `getQuestions` 拉题库（虽然有 24h localStorage 缓存兜底）
3. wrong-book 页面 `Promise.all([getWrongStats, getAllWrongList, getRecentLogs])` 一次 3 个查询，且 `getWrongStats` 内部其实是调了 `getAllWrongList` 一次
4. recordWrong 每次答错都是 `query + insert/update` 两次调用
5. store/game.js _syncCloud 防抖 1 秒但每次星星变化都会触发
6. 面试模块 loadExamConfig + checkApiKey 两次几乎相同的 settings 查询可以合并为一次
7. interview/practice 每题提交都写一次 interview_records + 每题点评再写一次 review

**优化方向**：
- **合并查询**：wrong-book 页面的 getWrongStats 内部已经查过 all，stats + list 可以复用一次结果
- **加缓存**：user_stats 在 session 内只拉一次；题库 24h 缓存已有，延长到 7 天
- **减少写入**：星星变化用 5~10 秒防抖而不是 1 秒；mathHistory 不必每次持久化
- **函数合并**：interview 的 loadExamConfig + checkApiKey 改成一个函数返回所有设置字段
- **批量写**：mental-math 提交错题已经改成 Promise.all，但还是 N 次单独写；可以一次性批量 insertMany
- **前端本地计算**：错题统计（pinyinCount/hanziCount 等）可以在拿到 all list 后前端 reduce，不用额外查询

**监控建议**：到 uniCloud 控制台 → 用量统计 → 按云函数查看哪个调用量最大，针对性优化

---

### [P0-new] uniCloud clientDB 防刷限流误伤真实用户（2026-04-10 Playwright 测试触发）
**现象**：用 Playwright 跑自动化测试时短时间内多次跳页 + 查询，`stele/list` 和学习模块 `loadFromCloud` 同时返回 500，控制台报 `[DCloud-clientDB]: 防刷限流异常-触发禁止访问规则`。用户以为数据丢了，实际只是当前 IP 被临时禁访问。
**影响**：数据没丢，但果果和家人真实使用中如果页面切换频繁（比如快速翻单元、反复进出错题本），也可能被误伤。
**修法建议**：
1. 到 uniCloud 控制台 → 数据库 → 权限规则 / 防刷限流配置 → 调高单 IP 每分钟请求上限
2. 或者前端做请求节流/合并（比如同一页面重复进入 30 秒内用缓存）
3. 云函数调用的数据（stele/interview 模块用的是云函数）限流策略和 clientDB 不同，要分别配置

**验证方式**：等限流解除后用同 IP 反复进出错题本 20 次看是否再次触发。

---

### [P0-new] 多用户切换后错题本和星星数不切换 ✅ 已修（2026-04-11）
**修法**：editUsername 成功后调 `uni.reLaunch({ url: '/pages/index/index' })`，清空页面栈强制重新加载所有页面。同时保留 `username-changed` 事件广播作为兜底。
**遗留风险**：reLaunch 切回首页是体验上的副作用（修改用户名后用户会被强制带回主界面），后续可改为更精细的事件驱动方案。

---

### [P0-new-原文] 多用户切换后错题本和星星数不切换（2026-04-10 手工测试发现）
**现象**：点击首页右上角用户名改成另一个名字后，学习模块的错题本、星星数等数据没有切换成新用户的。
**已做的处理**：
- `pages/index/index.vue` 的 editUsername 里已经调用了 `store.switchUser()`
- `store/game.js` 的 switchUser() 会清空 totalStars/mathLevel/mathHistory/currentUnit/_statsId 并重新 `loadFromCloud()`
- `utils/common/storage.js` 已按用户名前缀隔离 localStorage key
**可能原因**（下次修的时候优先查）：
1. 错题本数据不是从 store 读的，而是每次进页面从云端按 username 查 → 检查 wrong-book.vue 和 wrong-book-practice.vue 是否确实用的是当前 username（可能缓存了旧 username）
2. useAuth() 的 getUsername() 返回值在 Vue 组件里没有响应式，子组件拿到的是旧值
3. store.switchUser 被调用了，但 loadFromCloud 是异步的，切换完成前页面已经渲染
4. 首页 editUsername 成功后 uni.$emit 了 'username-changed'，但其他模块（学习/错题本）没监听
**修法建议**：
- 让 useAuth 返回一个共享的响应式 ref（defineStore 或 shallowRef）
- 或在 editUsername 成功后广播 `uni.$emit('username-changed')`，学习模块的各页面监听后重新加载数据
- 或最暴力的：切换用户后 uni.reLaunch 回首页强制刷新所有页面

**复现步骤**：
1. 用户A 登录 → 做一轮拼音练习答错几题 → 错题本有记录
2. 点击右上角用户名 → 改成"用户B"
3. 进入学习 → 错题本 → **预期**：空的 / 用户B 自己的；**实际**：还是用户A 的

---

## 真 - P1（建议改）

### [P1-1] hanzi.vue:327-328 可能重复记录错题
**问题**：选择题答错时，setTimeout + advanceQuestion 之间可能重复触发 recordWrong。
**修法**：用一个 `recorded` flag 防止同题多次写入。
**验证方式**：答错后快速多次点击/等待自动前进，检查云端 wrong_records 是否只写入一条。

### [P1-2] wrong-book-practice.vue checkStrokeAnswer 未被调用 ✅ 已修
2026-04-11 整页重写，旧死代码全部清除。

### [P1-3] mental-math.vue recordWrong 循环未 await
**问题**：第 233 行 `questions.value.forEach(q => { ... recordWrong(...) })`，fire-and-forget 的异步调用，可能丢失部分写入（极端情况）。
**修法**：改为 `Promise.all(questions.value.filter(...).map(q => recordWrong(...)))`，提交时 await。
**风险**：低 —— uniCloud 写入一般不会丢，但保险起见。

### [P1-4] data-admin.vue 新增记录不支持 hanzi 类型 ✅ 误报
questions 表只存 pinyin/stroke 两种 type，hanzi 是错题侧的分类，从 pinyin 题派生，data-admin 不需要支持 hanzi。

### [P1-5] stele/list.vue 云端响应未做错误分支校验
**问题**：`res.result.data` 直接访问，若云函数返回错误（code != 0）页面空白。
**修法**：加 `if (res.result?.code !== 0) { 提示 + 返回 }`。
**影响**：上线体验。

### [P1-6] interview/index.vue 多处 res.result.data 未 bound 检查
**问题**：100/116/145/170 行访问 `data[0]` 前未判长度。
**修法**：统一加 `data?.length > 0` 保护。

### [P1-7] stele/photo.vue 上传失败不阻断后续
**问题**：upload loop 单张失败后仍继续，进度显示错乱。
**修法**：`Promise.allSettled` + 末尾统计成功/失败数并提示。

### [P1-8] generate-question 云函数参数校验缺失
**问题**：未校验 type/username 就查库，极端请求可能崩。
**修法**：函数开头 `if (!type || !username) return { code: -1, msg: '参数缺失' }`。

### [P1-9] questions.schema.json type 枚举待扩展 ✅ 误报
questions 表只存 pinyin/stroke，hanzi/math 是错题分类（属于 wrong_records 的 type 枚举），questions 表不需要扩展。

---

## 真 - P2（可选）

### [P2-1] console.log 清理 ✅ 大部分已清
当前 pages/ 目录已无 console.log，云函数仅 seed-questions 还保留 2 处（种子脚本，可忽略）。

### [P2-2] 顶栏风格不统一
学习模块 6 个页面各写自己的顶栏，抽 `TopBar` 组件。

### [P2-3] mental-math.vue restart() 未重置 timerWarn ✅ 已修
restart() 第 257 行已加 `timerWarn.value = false`。

### [P2-4] result.vue encourageText 硬编码 10
第 59 行用 `total === 10` 判断，learn.vue 题量可变。改为相对正确率判断。

### [P2-5] hanzi.vue 结构题干扰项不足兜底 ✅ 误报
ALL_STRUCTURES 有 5 个，过滤正确项后有 4 个，slice(0,3) 能给出 3 个干扰项，永远充足。

### [P2-6] stele/preview.vue Three.js 资源释放
onBeforeUnmount 未清 animateId，可能残留动画帧。

### [P2-7] store/game.js _syncCloud 失败静默
catch 里只 console.error，无 toast 提示，失败用户无感。

### [P2-8] interview/index.vue URL 传 question 内容
长题目可能超 URL 限制（2KB），改用 storage 中转。

### [P2-9] stele/detail.vue 草稿加载时序 ✅ 已修（2026-04-11）
modal success 回调改为 async，loadDraft() 后 await nextTick() 再 refreshPreview()，确保 form 响应式状态沉淀。同时拆清两种分支：草稿损坏 / 用户选新建，都正确 clearDraft。

### [P2-10] interview/records.vue formatTime 缺年份
长期积累后日期混淆。

---

## 数据库 schema 重新部署清单（发布前必做）

部署前需要重新上传以下 schema 到 uniCloud：
- `wrong_records.schema.json`（type 枚举扩展到 hanzi/math）
- `practice_logs.schema.json`（type 枚举扩展到 hanzi/math）
- `questions.schema.json`（新增 radical/structure 字段 + type 枚举可能要扩展）

云函数重新部署清单：视是否修了 P1-8 而定。

---

## 线上自测清单（发布后）

待创建 `docs/online-test-checklist.md`。
