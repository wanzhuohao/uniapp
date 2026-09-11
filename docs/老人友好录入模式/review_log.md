# 老人友好录入模式 · 历史开发与代码审查记录

- 阶段：03-开发
- 03 基线：`33e5d231cd811dde1919e8253667bc64d7776d86`
- 开发分支：`feature/elder-friendly-entry`
- 当前状态：七步老人模式已取消，本文仅保留原实现及审核轨迹
- 历史代码审核：原审核项曾阻塞，后续固定边界审核已关闭残余严重项；该历史方案最终仍未进入提测/上线

> 2026-09-08 起不再继续本文的老人模式阶段。`research/` 和 `reviews/` 中的材料是冻结评审证据，保持原文与原哈希语义，不用当前实现反向改写。当前产品与部署结论以 [progress.md](progress.md)、[design.md](design.md) 顶部“当前有效设计”和 [deployment_guide.md](deployment_guide.md) 为准。

## 当前代码补充记录（2026-09-09～10）

- `488d26d` 修复管理员口令 401 后无法重输：错误口令立即清除并循环回输入框，成功后才缓存；取消、网络或服务失败不会缓存未验证口令，也不自动重发结果未知的写请求。
- `1a18fef` 修复小字预览和名单分排不一致：`generateSmall()` 不再隐式合并相邻夫妻排，预览与保存严格服从当前名单结构；五排整理为三排再撤销时同步恢复五排及空白姓名位置。
- 2026-09-10 现行五组自动回归实际结果为 `5/0 + 7/0 + 11/0 + 16/0 + 25/0 = 64/0`。本轮未做新的独立 AI 代码审核、浏览器/真机验证或部署，因此只记录为当前回归证据，不追加到旧七步方案的审核结论。

## 以下为已取消方案的历史记录

## 测试先行记录

### RED-01 核心状态与边界

- 日期：2026-09-07
- 测试：`tools/test-elder-entry.mjs`
- 命令：`node --experimental-strip-types tools/test-elder-entry.mjs`
- 预期失败：候选隔离、日期状态、任务所有权、OCR 判定与发布门尚未实现。
- 实际结果：退出码 1，`ERR_MODULE_NOT_FOUND`，首个缺失模块为 `utils/stele/elder-entry/candidate.ts`。
- 结论：RED 有效；开始补最小实现。

### GREEN-01 核心状态与边界

- 日期：2026-09-07
- 命令：`node --experimental-strip-types tools/test-elder-entry.mjs`
- 实际结果：退出码 0，`9 passed, 0 failed`。
- 结论：候选隔离、日期原子更新、任务互斥与晚回调拒绝、OCR 三设备严格 AND 及发布门均已具备最小实现。

## 实现记录

- 新建/详情两页各保留一个 `useOrderForm()` 权威实例，并统一由 `requestSave('normal' | 'elder')` 进入原保存主体。
- 新增共享 `ElderEntryPanel.vue` 与 `useElderEntry.ts`，完成固定七步、大字单列、逐步确认、总确认保存门、本地模板候选和退出清理。
- 正式表单只接受已确认白名单字段；语音/模板候选与会话状态保持在内存中，`user`、`remark` 不可被候选覆盖。
- 父母日期与立碑日期改由原子命令同时更新表单和显示引用；页面原直接写 `dateQingming` 的 watcher 已移除。
- 语音识别仅在运行时能够证明端侧中文包时出现，否则安全关闭；朗读继续按设备能力降级。
- 图片预检覆盖 MIME/魔数一致性、JPEG/PNG/WebP、动画格式、尺寸/像素/文件大小和 Worker 超时释放。
- OCR 生产发布常量保持 `disabled`；当前无三台真机、冻结样本和受控证据，因此不安装模型资产、不开放入口、不虚构 OCR 可用结论。
- 已为 SFC 静态编译精确增加 `@vue/compiler-sfc@3.5.32`；未添加 `type=module`，避免只为消除 Node 警告改变 UniApp 工程兼容面。

### RED-02 页面接线

- 日期：2026-09-07
- 测试：`tools/test-elder-entry-integration.mjs`
- 预期失败：共享面板、单实例表单和统一保存入口尚未实现。
- 实际结果：退出码 1，首个缺失文件为 `components/stele/ElderEntryPanel.vue`。
- 结论：RED 有效；随后补共享面板、页面组合根和保存门。

### RED-03 图片安全预检

- 日期：2026-09-07
- 测试：`tools/test-image-preflight.mjs`
- 预期失败：图片头解析和危险格式拒绝尚未实现。
- 实际结果：退出码 1，首个缺失模块为 `utils/stele/elder-entry/image-preflight.ts`。
- 结论：RED 有效；随后补 Worker 预检与纯头部解析测试。

### GREEN-02 最终自动回归

- 日期：2026-09-07
- `npm run test:elder-entry`：`11 passed, 0 failed`。
- `npm run test:elder-entry-integration`：`4 passed, 0 failed`。
- `npm run test:image-preflight`：`4 passed, 0 failed`。
- `npm run test:elder-entry-sfc`：4 个 SFC 静态编译通过。
- `node tools/test-order-cloudfunctions.mjs`：`25 passed, 0 failed`。
- `npm run test:stele-regressions`：`11 passed, 0 failed`。
- HBuilderX `uniapp-cli-vite` 生产 H5 构建：退出码 0，Compiler version 4.76（Vue 3）。

### 浏览器验收

- 新建页和详情页均能切入同一套老人友好面板，完整展示 7 个步骤。
- 未点击当前步骤“本步核对无误”时不能进入下一步；总确认未完成时点击保存只显示持久错误，不调用订单保存。
- 当前浏览器无法证明端侧语音处理，语音入口按设计关闭，手工路径不受影响。
- 320 CSS px 视口下单列重排，无横向业务操作区；最终构建重新加载成功，控制台日志为空。
- 未执行三台真实设备、200% 系统字体、端侧语音可用设备和 OCR 冻结样本评估；这些项目不得记为通过，OCR 生产继续关闭。

## 03 代码审核

### 第 1 轮

- 评审 Agent：`/root/elder_entry_code_review_r1`
- 强度：标准，单一隔离只读 Agent
- 冻结快照：`1ca7a1643de7c7e377fb39af968db3f3ab04ad7993b3fa4f2db0f3b4f9c334cc`；评审前后复算一致。
- 结论：不通过；阻断 1、严重 5、一般 1、建议 0。

| 编号 | 级别 | 发现 | 主 Agent 裁决 | 状态 |
|---|---|---|---|---|
| R1-B01 | 阻断 | 语音任务切段、页面隐藏时未停止，晚回调按新步骤解释；缺少停止按钮与原型端侧能力核验 | 成立；补完整 token+启动步骤绑定、切段/隐藏/离开幂等清理、显式停止与能力检查 | 待修复 |
| R1-S01 | 严重 | `structuredClone` 直接处理 Vue `reactive/readonly` Proxy 会抛 `DataCloneError` | 成立；改为显式白名单普通 DTO 克隆，并补真实 Proxy 测试 | 待修复 |
| R1-S02 | 严重 | 父母日期语音候选确认绕过公历校验和原子日期入口 | 成立；禁止日期走通用字段确认，转为明确公历候选并调用日期命令 | 待修复 |
| R1-S03 | 严重 | 客户标识弹窗确认直接 `doSave()`，形成统一保存门之外的第二写路径 | 成立；弹窗只收集标识，确认后重新进入 `requestSave()`，去除缓存载荷旁路 | 待修复 |
| R1-S04 | 严重 | 总确认和 TTS 未展示/朗读完整生卒日期与名单正文 | 成立；建立完整确认条目，页面和朗读共用 | 待修复 |
| R1-S05 | 严重 | 详情横向布局固定 `100vh/overflow:hidden`，老人长表单可能不可达 | 成立；老人模式增加独立可滚动布局类 | 待修复 |
| R1-G01 | 一般 | 测试未覆盖 Proxy、保存旁路、切段/隐藏释放与滚动布局 | 成立；随上述修复补定向测试 | 待修复 |

Reviewer 复跑已有脚本均为绿色，但明确指出这些脚本不覆盖上述运行时问题。OCR 生产常量保持 `disabled`，没有入口或开关旁路；真机/OCR 冻结证据缺失不作为本轮代码缺陷。

### 第 1 轮修复与新增 RED/GREEN

- RED-04：新增 Vue `reactive/readonly` 表单测试后稳定复现 `DataCloneError: #<Object> could not be cloned`；改为显式白名单普通 DTO 后转绿。
- RED-05：扩展页面集成测试，首先在 `pendingPayload` 第二写路径断言失败；移除旁路后转绿。
- R1-B01：语音启动时绑定步骤，切段、显式停止、`visibilitychange`、`pagehide`、退出/卸载均先失效 token 并释放；结果、失败、结束收敛任务；能力探测增加 `Recognition.prototype.processLocally` 证明。
- R1-S01：新增 `form-snapshot.ts`，对响应式/只读表单作显式白名单投影，不再直接 `structuredClone` Proxy。
- R1-S02：父母日期候选按“完整公历/年份/未知”调用 `setParentDateChoice()`；非法或不完整候选保持未确认并提示手填；通用确认入口对父母日期直接拒绝。
- R1-S03：两个客户标识弹窗仅写回 `form.user`，随后重新进入 `requestSave()`；每页只剩保存主体内一处 `doSave()`。
- R1-S04：新增共享总确认模型，完整列出四组可见生卒日期、立碑日期和逐排名单正文；同一模型供总确认页面和 TTS 使用，并提供返回修改按钮。
- R1-S05：详情根节点增加 `elder-mode-active`，老人模式恢复纵向滚动，不改变普通左右/上下 splitter。
- R1-G01：核心测试增至 `13 passed`，页面集成增至 `6 passed`；覆盖 Proxy、任务完成、完整确认、保存旁路、隐藏释放和滚动布局。
- 修复后 HBuilderX Vue 3 生产 H5 构建退出码 0；浏览器复核详情长日期页出现纵向滚动条，总确认完整展示日期/名单，控制台为空。

### 第 2 轮定向复审

- 评审 Agent：`/root/elder_entry_code_review_r2`
- 强度：标准，单一隔离只读 Agent
- 冻结快照：`bc72551bedff2413e57aac5699955d41d859c34b69661a1a9aa71e3574c14d39`；评审前后复算一致。
- 结论：不通过；阻断 0、严重 1、一般 1、建议 0。
- 首轮关闭情况：R1-S01～R1-S05 已关闭；R1-B01 因资源释放失败后会失守而仅部分关闭；R1-G01 因缺少释放失败注入测试而未完全关闭。

| 编号 | 级别 | 发现 | 主 Agent 裁决 | 状态 |
|---|---|---|---|---|
| R2-S01 | 严重 | `cancelActiveTask()` 在等待 release 前清空活动资源；若 release 抛错或超时，首次切换虽失败，但后续 `begin()` 会重新放行，旧麦克风/Worker 可能仍活动；语音 `stop()` 同时吞掉 abort 失败 | 成立；应立即失效旧 token，但保留失败释放锁和资源引用，仅在释放成功后解锁；失败/超时期间持续拒绝新任务或只允许显式重试释放，并向调用方暴露 abort 失败 | 阻塞；本审核项两轮已耗尽，待用户决定另开定向修复审核项、缩小范围或明确接受条件风险 |
| R2-G01 | 一般 | 缺少 release 抛错/超时后重复 begin 持续拒绝，以及 abort 失败与晚回调组合的行为测试 | 成立；应随 R2-S01 修复补故障注入测试 | 阻塞 |

### 审核收敛状态

- `03-代码审核` 已执行允许的 2 轮，仍有 1 个严重项，按 `dev-flow` 收敛规则标记为阻塞。
- 自动流程停止在 03，不进入 04-自测、不提交当前功能代码，也不以主 Agent 自证代替新的独立审核。
- 推荐续作：另开边界固定的“资源释放失败关闭”修复审核项，修复 R2-S01/R2-G01 后重新独立审核；其余已关闭问题不扩项。

## 03 定向修复审核项：资源释放失败关闭

- 用户决定：2026-09-07 明确选择推荐方案，授权另开固定边界修复审核项，完成后收工。
- 审核边界：仅处理 R2-S01/R2-G01；不重开已关闭的 R1-S01～R1-S05，不改变需求、公共数据契约、OCR 发布策略或保存语义。
- 目标不变量：旧语音/Worker 的释放抛错或超时后，任务控制器保持失败关闭，任何新任务都不能启动。
- 相邻不变量：释放开始即使旧 token 失效；成功释放仍可启动下一任务；显式重试释放成功后可恢复；停止/释放成功路径保持幂等；晚回调不能写候选。
- 唯一权威数据源：修改前后都由 `task-controller.ts` 持有活动资源、token 有效性和释放失败锁；`speech.ts` 只执行实际 `abort()` 并如实传播结果。
- 最小处理范围：`task-controller.ts`、`speech.ts`、相关故障注入测试及本节控制面记录。

### RED-06 释放失败与超时必须持续锁闭

- 日期：2026-09-07
- 测试：`tools/test-elder-entry.mjs`、`tools/test-elder-entry-integration.mjs`
- 反例：release 首次抛错后再次 `begin()`；release 永不结束触发超时后再次 `begin()`；语音 `abort()` 首次抛错后显式重试。
- 组合回归：失败释放开始后旧 token 立即失效；只有显式释放重试成功后才允许新任务；语音适配器不得吞掉 abort 失败。
- 预期：当前实现至少在“失败后再次 begin”或“abort 失败传播”断言上失败，证明测试能捕获 R2-S01。

### GREEN-06 失败关闭与显式恢复

- RED 结果：核心测试在第二次 `begin()` 的“应拒绝”断言得到 `Missing expected rejection`；页面集成测试在吞掉 `recognition.abort()` 异常的源码断言失败，均准确命中 R2-S01。
- 实现：活动任务新增独立 `valid` 标志和释放失败锁；释放开始立即令 token 失效，但保留资源引用；释放抛错或超时后，普通 `begin()`/切换持续返回 `TASK_RELEASE_FAILED_LOCKED`；只有 `retryFailedRelease()` 或显式全量停止重试成功才清锁。
- 语音：`stop()` 先断开回调，再执行 `abort()`；仅在 `abort()` 成功后标记 stopped，失败向上传播并允许显式重试，不再静默吞错。
- 页面：切段、模板、进入/退出、语音结束和启动失败均消费释放结果；失败时显示持久提示并保持新任务锁闭，不继续切段或应用模板。
- 定向结果：`npm run test:elder-entry` 为 `16 passed, 0 failed`；`npm run test:elder-entry-integration` 为 `6 passed, 0 failed`。
- 全量自动回归：图片预检 `4 passed`；4 个 SFC 静态编译通过；云函数回归 `25 passed`；碑文回归 `11 passed`。
- 生产 H5 构建：HBuilderX Compiler 4.76（Vue 3），`DONE Build complete`，退出码 0；仅有 Browserslist 数据过期提示。
- 跨不变量核对：原 fail-open 反例已由 RED 转绿；旧 token 在失败/超时时均为非当前；显式重试成功后恢复；成功释放与重复停止仍通过；任务状态仍只有控制器一处权威源。

### 新审核项第 1 轮

- 评审 Agent：`/root/elder_release_failclosed_audit_r1`
- 隔离方式：原生全新上下文；项目指令自动注入：是；只读白名单评审。
- 风险档位：R3，标准强度单 Reviewer，合并覆盖安全/隐私与异步一致性。
- 冻结快照：`029cc607d2883b5ccffa6f605e3febebf5f3d626e0bc6e874f6216187d50f0d8`；Reviewer 复算完整匹配。
- 结论：不通过；阻断 0、严重 3、一般 2、建议 0。

| 编号 | 级别 | 发现 | 主 Agent 裁决与最小处理 | 状态 |
|---|---|---|---|---|
| FCR1-S01 | 严重 | 失败锁可被普通 `invalidate()`/`disposeAll()` 隐式重试清除，导航可能继续 | 成立，修复；普通停止与切换在已有失败锁时持续拒绝，只有专用 `retryFailedRelease()` 可重试 | 待修复 |
| FCR1-S02 | 严重 | 释放失败时 UI 先设置未聆听/已退出，可能掩盖仍未确认停止的麦克风，且退出后重试入口不可见 | 成立，修复；新增 `stopping/releaseFailed` 状态，成功后才清监听和退出，失败时保留老人面板、警告和专用重试按钮 | 待修复 |
| FCR1-S03 | 严重 | 朗读快速双击或失败锁会让 `begin('tts')` 拒绝逃逸，朗读启动异常也缺清理 | 成立，修复；组合式逻辑消费 begin/启动/完成拒绝并给出持久提示，已取得 token 的启动失败走受控停止 | 待修复 |
| FCR1-G01 | 一般 | 并发重复停止返回 `TASK_TRANSITION_BUSY`，不满足幂等 | 成立并随严重项修复；等价停止/完成/销毁共享同一释放 Promise，新任务启动仍拒绝 | 待修复 |
| FCR1-G02 | 一般 | 现有测试以顺序和源码正则为主，缺普通 invalidate 失败锁、并发停止、complete/invalidate/begin、真实 UI 状态和快速双击 | 成立并修复；增加 deferred release 与伪语音/TTS 适配器的运行时组合测试 | 待修复 |

### RED-07 并发停止与真实会话状态

- 原问题反例：失败锁后普通 `invalidate()`/`disposeAll()` 不得增加 release 次数；当前实现会隐式重试。
- 跨时序组合：两个并发 `invalidate()` 与 `complete()+invalidate()` 必须共享同一 release，当前实现第二个调用报 `TASK_TRANSITION_BUSY`。
- 真实会话：伪端侧语音 `abort()` 首次失败后，`listening/enabled` 必须保持、专用失败状态和重试入口必须可见；普通退出不得隐式重试；显式重试成功后才允许退出。
- 朗读组合：快速双击与启动抛错均不得产生未处理 Promise 拒绝，并须回收已取得 token。

### GREEN-07 审核项首轮修复

- FCR1-S01：普通 `invalidate()`/`disposeAll()` 在已有失败锁时只返回 `TASK_RELEASE_FAILED_LOCKED`，不再调用 release；专用 `retryFailedRelease()` 是唯一失败恢复入口。
- FCR1-S02：会话新增 `stopping/releaseFailed`；释放成功前不清 `listening`、不退出老人模式；面板持续显示红色警告和“重试停止”，并禁用新语音、朗读、步骤切换与保存。
- FCR1-S03：朗读的 begin、启动、自然结束和释放拒绝均由组合式逻辑消费；快速双击不产生未处理拒绝，启动失败后释放已取得 token。
- FCR1-G01：同一活动资源的并发 `complete()/invalidate()/disposeAll()` 共享单一 `releaseInFlight` Promise；新任务在释放期间继续拒绝。
- FCR1-G02：核心测试加入 deferred release、失败锁后普通停止、并发 complete/invalidate/begin、伪端侧语音真实会话、排队晚回调、退出与专用重试、朗读快速双击和启动异常。
- 定向结果：核心 `19 passed, 0 failed`；页面集成 `6 passed, 0 failed`；4 个 SFC 静态编译通过。
- 全量回归：图片预检 `4 passed`；云函数回归 `25 passed`；碑文回归 `11 passed`。
- 修后生产构建：HBuilderX Compiler 4.76（Vue 3），`DONE Build complete`，退出码 0。
- 跨不变量核对：失败锁无法被普通导航清除；失败时旧 token 非当前且排队晚回调不写候选；并发停止只释放一次；显式重试成功后恢复；UI 与控制器资源状态一致。

### 新审核项第 2 轮定向复审

- 评审 Agent：`/root/elder_release_failclosed_audit_r2`
- 隔离方式：原生全新上下文；项目指令自动注入：是；只读白名单定向复审。
- 冻结快照：`d75b883dcf4d1d630d7335576c23e8589738fb96b4a0dd7f8f172a0a0b915ebf`；Reviewer 复算 base/head、祖先关系、提交集合和全部文件哈希均匹配。
- 逐项结论：FCR1-S01、FCR1-S02、FCR1-S03、FCR1-G01、FCR1-G02 全部关闭。
- Reviewer 复跑：核心 `19 passed, 0 failed`；页面集成 `6 passed, 0 failed`。
- 修复直接诱发回归：阻断 0、严重 0、一般 0、建议 0。
- 最终结论：通过。

### 03 出口结论

- 原 `03-代码审核` 两轮不通过历史保留；用户明确授权后建立的固定边界修复审核项已在两轮内收敛通过，关闭唯一残余严重风险。
- design.md 改动点已完成，无新增关键未知项；TDD RED/GREEN、生产构建、全量自动回归和独立代码审核证据齐全。
- 03-阶段评审未启用，按配置不适用；形成尚未 commit/push 的待测变更集，进入 04-自测。

## 04 自测增量审核：按钮对比度

- 触发原因：生产 H5 浏览器探针发现“本步核对无误”白字/绿色背景对比度约 `2.24:1`，低于设计 T04 的 `4.5:1` 普通文本门槛。
- 最小修复：仅在 `ElderEntryPanel.vue` 作用域内为 primary/success/danger 操作状态指定深色背景；不改组件结构、普通模式或业务逻辑。
- 第 1 轮 Reviewer：`/root/elder_contrast_review`；结论为阻断 0、严重 0、一般 1、建议 0。一般项是 primary 的强制背景覆盖 `.is-disabled`，禁用按钮视觉上近似可点击。
- 主 Agent 处理：成立；把深色 default/hover/focus/active 限定到 `:not(.is-disabled)`，仅对所有 primary 强制清除页面级渐变，并为 `.is-disabled` 恢复 `var(--el-button-disabled-bg-color)`。
- 定向复核：同一 Reviewer 确认原一般项关闭，无直接诱发回归；scoped 编译错误 0，普通模式不受影响。
- 最终浏览器证据：primary/success 文本对比度约 `7.08:1`，普通按钮约 `6.11:1`；主要按钮高 48/58px；320 CSS px 时 `scrollWidth=310 <= innerWidth=320`；控制台 warning/error 0。
- 自动回归：核心 `19/0`、页面集成 `6/0`、图片预检 `4/0`、SFC `4/0`、云函数 `25/0`、碑文回归 `11/0`；最终生产 H5 构建退出码 0。
- 结论：该增量审核通过。

## 04 自测增量审核：保存并发、失败重试与平台超时

- 审核边界：`package.json`、新建/详情两页保存主体、`quality-save-guard.ts` 和 `test-elder-save-runtime.mjs`；不改变保存载荷、服务端 API、数据库契约，不执行真实订单写入。
- RED-08：首版测试新增后为 `2 passed, 2 failed`；稳定命中平台超时反馈尚不存在，以及新建页带 `editId` 时客户标识为空却直接保存。
- GREEN-08：定向运行时测试为 `4 passed, 0 failed`；覆盖两页 T30/T50/T51、保存期间防重、失败/平台超时后保留草稿并独立重试、客户标识回填后统一进入 `requestSave()`。
- 全量验证：核心 `19/0`、页面集成 `6/0`、图片预检 `4/0`、SFC `4/0`、保存运行时 `4/0`、云函数 `25/0`、碑文回归 `11/0`，共 `73/0`；HBuilderX 4.76 Vue 3 生产构建退出码 0。

### 第 1 轮

- Reviewer：`/root/elder_save_runtime_review_r1`；标准强度，R3 数据/一致性风险，只读白名单。
- 冻结快照：`be356394df8ae07a6682e062d5b3c6a74082cf1f36c2e88d92914f12dcf81e93`；Reviewer 与主 Agent 评审前后复算一致。
- 结论：不通过；阻断 0、严重 2、一般 0。

| 编号 | 级别 | 发现 | 主 Agent 裁决与最小处理 | 状态 |
|---|---|---|---|---|
| SR1-S01 | 严重 | 超时分类漏读平台常见 `errMsg`，同时自由文本包含 `timeout/超时` 会把业务错误误判成平台超时 | 成立；补平台 `errMsg` 正例与业务错误反例，改为明确超时代码或通用包装码加传输层超时格式 | 待复审 |
| SR1-S02 | 严重 | 新建页 `editId` 非空且 `form.user` 为空时绕过客户标识回填，直接进入保存 | 成立；去掉 `editId` 例外，并让两页已有订单 ID 的运行时测试覆盖统一回填与防重 | 待复审 |

### 第 1 轮修复与第 2 轮定向复审

- 修复 RED：增加平台 `errMsg` 与业务自由文本正反例、已有订单 ID 缺客户标识用例后，当前代码得到 `2 passed, 2 failed`，准确命中两项发现。
- 修复 GREEN：客户标识条件统一为 `!form.user`；超时分类增加 `errMsg`、明确代码和通用包装码判断；定向测试恢复 `4/0`，全量自动回归与生产构建均通过。
- Reviewer：`/root/elder_save_runtime_review_r2`；全新隔离只读 Agent。
- 修后冻结快照：`79562ac875183f6c6cef129cce3de75ef48ff262d3af8b2d47f67a17ec3e244d`；Reviewer 与主 Agent 评审前后复算一致。
- SR1-S02：已关闭；两页只要 `form.user` 为空都先回填，再统一进入 `requestSave()`，等待期重复点击不增加写调用。
- SR1-S01：未关闭；无错误码或通用包装码时，`request ... timeout 字段格式错误` 仍会被宽正则误判；只取首个代码字段还会漏掉后续明确超时代码。
- 修复直接诱发回归：阻断 0、严重 0、一般 0。
- 最终结论：不通过；阻断 0、残余严重 1、一般 0。该审核项已用满 2 轮，按 dev-flow 标记阻塞，不创建第 3 个 Reviewer。
- 推荐续作：经用户决定后另开固定边界的“平台超时结构化分类”审核项，只处理 SR1-S01；采用全部错误码字段集合判断，平台超时只接受明确超时代码，或经确切格式约束的传输层 `errMsg`，并补无错误码/通用包装码业务文本反例。

## 04 定向修复审核项：平台超时结构化分类

- 用户决定：2026-09-07 回复“继续”，授权按推荐方案另开固定边界审核项。
- 审核边界：只处理 SR1-S01，修改 `quality-save-guard.ts` 与 `test-elder-save-runtime.mjs`；不重开已关闭的客户标识旁路，不改变页面保存流程、载荷、API、数据库契约或用户文案。
- 目标不变量：任一明确超时代码均判为超时；只有通用平台包装码配合严格匹配的传输层 `errMsg` 才允许从文本判为超时；无错误码、普通业务码或业务自由文本一律使用通用失败反馈。
- 相邻不变量：T30/T50/T51 两页保存时序、保存中防重、失败保留草稿、`finally` 解锁和独立重试保持不变；不引入客户端 `Promise.race` 或不可取消的第二写入。
- 唯一权威数据源：超时分类只由 `getSaveFailureMessage()` 解释错误对象；页面继续只消费其固定文案，不自行解析或显示原始错误。
- 原问题反例：无错误码字符串 `请求参数 timeout 字段格式错误`、无业务码 `Error('request validation failed: timeout 字段格式错误')` 均不得判超时；`code=SYSTEM_ERROR, errCode=TIMEOUT` 必须识别后一个明确超时代码。

### 新审核项第 1 轮

- Reviewer：`/root/elder_timeout_classifier_audit_r1`；标准强度单 Reviewer，R3 数据/一致性与契约/依赖，只读白名单。
- 冻结快照：`298b20c1846fff9dd2a6495189aa6695d2ea75ae40be15b7e3f6e4aa19f79188`；Reviewer 与主 Agent 评审前后复算一致。
- 结论：不通过；阻断 0、严重 3、一般 0、建议 0。

| 编号 | 级别 | 发现 | 主 Agent 裁决与最小处理 | 状态 |
|---|---|---|---|---|
| TCR1-S01 | 严重 | 明确超时代码正则未识别标准错误名 `TimeoutError` | 成立；补 `name=TimeoutError` 与混合字段顺序用例，精确支持该名称 | 待修复 |
| TCR1-S02 | 严重 | 空字符串代码被当成具体业务码，数值 `code/errCode` 又被过滤，分别造成超时漏报与误报 | 成立；字符串先 trim 并丢弃空值，非字符串非空代码作为具体业务码阻断文本推断；不猜测数值超时代码 | 待修复 |
| TCR1-S03 | 严重 | 页面运行时测试未证明分类函数是唯一权威源，也未断言 toast/消息不含原始错误 | 成立；注入计数与唯一哨兵文案的分类 spy，分别断言两页失败路径只消费 spy 结果且所有错误通道不泄漏原错误 | 待修复 |

- 修复不变量保持不变：目标仍是结构化超时分类；相邻 T30/T50/T51、防重、草稿、解锁和重试不可回归；分类权威源仍只在 `getSaveFailureMessage()`，页面不自行解析错误。

### 新审核项第 1 轮修复与第 2 轮定向复审

- RED：补 `TimeoutError`、空字符串代码、数值业务码和两页分类 spy 后，定向脚本为 `4 passed, 1 failed`，准确命中标准错误名漏识别；新增的统一分类/不泄露测试直接通过，证明页面实现本身满足该项，缺口仅在测试证据。
- GREEN：收集全部字符串代码并 `trim`/丢弃空值，非字符串 `code/errCode` 作为具体业务码阻断文本推断，明确模式支持 `TimeoutError`；定向脚本为 `5 passed, 0 failed`。
- 全量验证：核心 `19/0`、页面集成 `6/0`、图片预检 `4/0`、SFC `4/0`、保存运行时 `5/0`、云函数 `25/0`、碑文回归 `11/0`，共 `74/0`；HBuilderX 4.76 Vue 3 生产构建退出码 0。
- Reviewer：`/root/elder_timeout_classifier_audit_r2`；全新隔离只读 Agent，仅复审 TCR1-S01～TCR1-S03 与直接诱发回归。
- 修后冻结快照：`379113dd2f01ddbadf49eccf1dbe30088aceba14ac1dd28d0217d853c0558044`；Reviewer 与主 Agent 评审前后复算一致。
- TCR1-S01、TCR1-S02、TCR1-S03：全部关闭。
- 修复直接诱发回归：阻断 0、严重 0、一般 0；T30/T50/T51、防重、草稿、`finally` 解锁、独立重试均保持；未新增 `Promise.race`、写路径或 payload/API/DB 变化。
- 最终结论：通过。

## 04 自测增量审核：详情异步回写与模板本地工作流

- 审核边界：`package.json` 与 `test-elder-local-workflows.mjs`；生产页面、组合式逻辑、API、数据库和真实订单均只读，不执行外部写入。
- T02：从 `detail.vue` 提取并运行实际 `onMounted` 加载回调，以两个内存 deferred 请求模拟路由 ID 切换和旧响应晚到；只允许新快照提交，随后老人模式往返 3 次表单不变。
- T24：使用真实模板工具与 `useElderEntry`，分别提取并执行 `index.vue`、`detail.vue` 的实际 adapter/session 初始化；内存 storage 完成保存、读取、预览、候选、逐项确认、删除清空，并验证敏感字段不落模板、不被改写。

### 第 1 轮

- Reviewer：`/root/elder_local_workflows_review_r1`；标准强度，R3 数据/一致性风险，只读白名单。
- 冻结快照：`bd4c0ab7e7b07b59fbc63c542f9c9f522a899167fc1e7ea07c44af23f701a860`；Reviewer 前后复算一致。
- 结论：不通过；阻断 0、严重 3、一般 1。一般项为 `package.json` 同时引用已由上一独立审核项覆盖的保存运行时脚本，本审核项不重开。

| 编号 | 级别 | 发现 | 主 Agent 裁决与最小处理 | 状态 |
|---|---|---|---|---|
| LWR1-S01 | 严重 | T24 的 `mobile/detail` 仅是同一路径的标签循环，破坏任一页面接线仍会通过 | 成立；分别读取两页源码，提取并执行各自唯一 adapter/session 初始化，同时固定两页到共享面板及共享面板模板事件接线 | 待复审 |
| LWR1-S02 | 严重 | 只要求候选数不少于 5，未核对父亲生日和立碑日期实际落值 | 成立；固定精确候选路径，并逐项核对生日、完整公历立碑、模式/ref、名单和文本字段 | 待复审 |
| LWR1-S03 | 严重 | 只证明模板与目标表单不含/保留敏感字段，未证明源表单保存前后不变 | 成立；保存前冻结完整源表单，删除闭环后 deepEqual，同时保留存储文本与预览不含 `user/remark` 的断言 | 待复审 |

### 第 1 轮修复与第 2 轮定向复审

- 修复过程：首次运行发现 Vue `readonly(form)` 返回代理，改用结构一致性断言；再次运行发现夹具完整立碑日期仍沿用默认清明模式，显式固定为公历自定义后恢复 `2 passed, 0 failed`。两次均为测试夹具/断言修正，未改生产代码。
- Reviewer：`/root/elder_local_workflows_review_r2`；全新隔离只读 Agent，仅复审 LWR1-S01～S03 与直接诱发回归。
- 修后冻结快照：`3f5444a3a150e76c4ee19059c25158886e7e9977aa3b68b4ef5388fc975c9852`；测试文件 SHA-256 `c85b68b5cdf3c2e7502622804c158a12cae9525a89cf2a141da5f92c914c51a2`；Reviewer 与主 Agent 前后复算一致，三份生产来源哈希亦一致。
- LWR1-S01、LWR1-S02、LWR1-S03：全部关闭；Reviewer 破坏 6 处页面/面板接线均被测试拒绝，移除详情 epoch guard 后 T02 也会失败。
- 修复直接诱发回归：阻断 0、严重 0、一般 0；定向测试 `2/0`。
- 证据边界：T24 仅证明 Node 本地源码提取、静态接线和逻辑执行，不冒充浏览器 UI 或真机证据，因此测试报告仍记“部分通过”。
- 最终结论：通过。

## 04 交互语义增量：取消多余确认并增加名单实时预览

- 用户目标：父母完整生卒日期不再要求额外“按公历核对”；7 个聚焦步骤不再逐步确认，只在最后总览统一“确认并保存”；名单步骤直接展示与最终输出同源的小字排版预览。
- 需求与设计复审：`/root/elder_interaction_requirement_review_r2`、`/root/elder_interaction_design_review` 均通过，阻断 0、严重 0；“生卒/生卒日期”简称差异不改变验收语义。
- 测试用例增量复审：第 1 轮发现保存门优先级和两页真实保存入口证据不足；补表驱动优先级矩阵、两页实际 `requestSave()` 运行时提取和分层调用计数。第 2 轮仅剩 loading/error 少两条显式零调用断言，随后已补齐并保持 `test:elder-save-runtime` `7/0`。同一审核项已到两轮上限，不创建第 3 个同类 Reviewer，也不冒充独立复审通过。

### 代码审核第 1 轮与修复

- Reviewer：`/root/elder_interaction_code_review`；冻结快照 `c246f8e5…e42e2f3`；结论不通过，阻断 0、严重 1、一般 0。
- 发现：`stageTemplate()` 直接以模板 patch 覆盖整个候选数组；已有未处理语音/OCR 候选会静默消失，可能绕过最终保存门。
- RED：增加“语音候选 + 旧模板候选 + 空/变更模板”真实会话用例；旧实现得到空候选，断言应保留 `speech-existing`，按预期失败。
- 最小修复：每次模板操作仅剔除旧 `source=template` 候选，保留语音/OCR，再追加本次模板候选；不改变正式表单、保存载荷、API 或数据库契约。
- GREEN：新增核心用例通过；未处理候选数和 `assertSavable()` 始终继续阻断，旧模板候选不累积。

### 代码审核第 2 轮定向复审

- Reviewer：`/root/elder_interaction_code_review_r2`；仅复审上述严重项及直接回归。
- 修后冻结快照：`300ec58d444d52522c412f0dacef2a028460e013193953d34a590fb941ee211e`；Reviewer 前后复算一致，`dist` 34 个文件未漂移。
- 定向证据：空模板、变更模板、OCR `needs-review` 及 100 轮快速连续双模板均通过；最后一次模板生效，旧模板不累积，语音/OCR 不丢失，保存门不旁路。
- 全量自动回归：核心 `21/0`、页面集成 `8/0`、图片预检 `4/0`、SFC `4/0`、保存运行时 `7/0`、本地工作流 `2/0`、云函数 `25/0`、碑文回归 `11/0`，共 `82/0`。
- 生产构建：HBuilderX Compiler 4.76（Vue 3），`DONE Build complete`，退出码 0；34 个文件，`index.html` SHA-256 `1ca492301ec0acb0ba32d849ebbe830954b838ea81bf07b31d0a96841351bfa2`。
- 浏览器回查：第 1～6 步可直接前进；名单输入“最终预览测试”后真实碑面立即显示对应小字；第 7 步才出现唯一“确认并保存”；未点击保存，warning/error 0，本地服务已停止并回查端口关闭。
- 最终结论：通过；阻断 0、严重 0、一般 0。
- 提交记录：`26db49c feat: 完善老人友好录入与保存流程`；包含业务代码、测试与最终 `dist`，流程文档保持本地未提交；未 push。
