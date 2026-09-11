# 通用3D碑型范本展示与打印文件 · 自测报告

- 日期: 2026-09-03
- 自测方案: [design.md](design.md) §9～§10
- 环境: 本地待提交工作区；HBuilderX 4.76（Vue 3）正式 web 构建；Codex 内置浏览器、Chrome 152.0.7977.77（本轮优化探针）、此前 Chrome 152.0.7977.66、Edge 152.0.4191.53 与 Chrome Pixel 7 模拟；Bambu Studio 未安装；生产地址尚未部署本次构建
- test_guide: 项目未提供独立 test_guide；使用仓库 `AGENTS.md`、需求和设计作为前置
- 接口文档: 不适用；本需求不新增或变更 API、云函数、数据库或外部协议

## 冻结测试用例

以下清单来自审核通过时的 `design.md` §9，执行时不得改写预期；如需改变用例语义，必须重新走 04-测试用例审核。

| # | 对应验收标准 / 风险 | 场景类型 | 前置条件与数据 | 步骤 | 可判定预期 | 证据与清理 |
|---|---|---|---|---|---|---|
| T01 | AC-01、现有预览回归 | 正常 / 回归 / 数据边界 | 本次 H5 构建；至少一条仅供查看的既有订单；已开启 Network 并保存 localStorage/sessionStorage/cookie 初始快照 | 从首页点击 No.02 进入范本页并返回；再从既有订单进入 `pages/stele/preview.vue` 后返回；比较浏览器存储快照和范本页期间请求 | 新入口进入独立范本页且返回路径正确；既有个性化预览仍按原订单渲染；范本页期间订单/草稿相关 Storage 键零增删改，订单查询/更新/删除云函数调用均为 0，两页互不串数据 | 首页、范本页、既有预览截图与 URL，Network HAR、Storage 前后 JSON；不新增/修改订单，无清理 |
| T02 | AC-02、AC-06 | 正常 / 安全 | 正式 `classic-v1-9b5d9060bd06` release 与配置 | 在浏览器观察正、背、左、右、顶、底六个方向，并检查底座凹槽与装饰近景；核对来源文案、参数版本、配置和报告 | 六个方向和近景均无姓名、日期、落款、名单或纹理；页面明确显示“参数化通用设计”“非真实石碑或照片复刻”，不存在“照片可验证”口径；配置/报告参数版本一致 | 六方向与近景截图、配置与报告字段摘录；只读，无清理 |
| T03 | AC-03 | 正常 / 边界 | 桌面浏览器；Network 对 GLB 设置至少 800 ms 的确定性响应延迟 | 冷启动记录 loading 出现与消失；拖动旋转、滚轮缩放；执行重置；进入和退出全屏 | 请求未完成期间 loading 必然可见，完成后消失；旋转/缩放有效；重置恢复默认机位；全屏状态与按钮文案一致且退出后仍可操作 | 带时间戳的 loading/交互录屏、Network 和控制台；解除延迟规则，不改业务数据 |
| T03B | AC-03、AC-07 | 异常 / 能力边界 | 隔离浏览器页面；可在页面加载前注入 Fullscreen API stub | 分别令 `requestFullscreen` 不存在、返回 rejected Promise；每次点击全屏，再执行旋转/返回 | 两种情况都出现可判定、非阻断提示，页面仍保持 ready 并可旋转/返回，无未捕获 Promise | 注入脚本、页面提示和控制台截图；关闭隔离页即清理 |
| T04 | AC-04 | 兼容 / 正常 | 同一构建与同一 GLB；记录实际 Chrome、Edge 版本和 Chrome DevTools Pixel 7（412×915、DPR 2.625）配置 | 三个环境分别清缓存加载范本页并旋转模型；运行官方 glTF Validator | 三个冻结环境均真实出现模型且可交互，无 GLB 解析错误；Validator 为 `2.0.0-dev.3.10`，error/warning 均为 0。实体移动真机仅作补充，不替代也不增加本用例硬门禁 | 浏览器/设备配置、截图、Validator 原始输出；只读，无清理 |
| T05 | AC-07 | 异常 / 重试 | 本地隔离测试配置；浏览器网络面板 | 分别把 GLB URL 改为不存在地址、在请求前切为 Offline；每次观察错误后恢复条件并点击重试 | 两种场景均显示可判定错误且不影响返回；恢复后重试成功，旧失败请求不会覆盖成功状态 | 错误与恢复截图、请求/控制台记录；结束后还原配置并复算正式文件哈希 |
| T06 | AC-07 | 异常 / 能力降级 | 可用浏览器启动参数或加载前 stub 确实使 `WebGLRenderingContext/WebGL2RenderingContext` 创建失败的隔离环境 | 在 WebGL 不可用环境进入页面；再在正常环境通过 `WEBGL_lose_context` 触发 context lost | 两种场景均显示 WebGL/渲染不可用的可判定提示；返回首页与其他碑文页面正常；无未捕获异常循环。只运行源码断言或 SFC 编译不得代替本浏览器用例 | 环境注入、页面与控制台截图；关闭隔离环境，不改业务数据 |
| T07 | AC-08 | 并发 / 生命周期 / 性能回归 | Node 测试；浏览器在首次导航前注入 RAF/cancelRAF 和 EventTarget add/remove 计数；可执行 OrbitControls、renderer、geometry、material 的 dispose spy；支持切换 `document.visibilityState`、强制 GC/堆快照 | 运行加载/下载会话测试；浏览器连续进入/退出范本页 5 次，每次等待模型可交互再离开；逐轮验证静止、拖动/重置、自动旋转、后台/前台切换并采集资源计数，在两次 GC 后取堆快照 | A 慢 B 快、连续重试、卸载后完成只允许当前会话生效且旧 fetch `signal.aborted=true`；模型 ready 且阻尼收敛后待处理 RAF=0，拖动/重置与自动旋转期间 RAF 不超过 1，停止交互/关闭自动旋转并收敛后恢复 0；`document` hidden 后 RAF=0，visible 后至少重绘一帧且自动旋转开启时恢复为 1；离开后 RAF 和该页新增 listener 净值均为 0；每轮 OrbitControls/renderer 各 dispose 1 次，geometry/material 的 dispose 数等于已创建数，纹理创建数为 0，DOM canvas 回到进入前数量；第 5 轮 GC 后堆相对首轮基线增长不超过 `max(2 MiB, 20%)`，控制台无新增未捕获异常 | 会话测试原始输出、状态分段 RAF 计数、逐轮资源计数表、dispose spy、canvas/堆快照和控制台；关闭测试页即清理 |
| T08 | AC-05、AC-09 | 正常 / 完整性 / 打印 | 正式 STL；本次 H5 构建与已部署静态地址；Bambu Studio 可用并记录版本和所选拓竹机型 | 从报告读取完整 STL SHA-256 `409a716fcd8be4bb2b2d179abac594829552d01870414f1ee9292159b4e9030d`；逐字计算并比较 exports、仓内 release、H5 构建产物、实际 HTTP 200 响应和浏览器下载五段；记录 URL、releaseId、响应缓存头/命中状态；把同一下载文件导入 Bambu Studio，回查 X/Y/Z 并执行切片 | 五段完整 64 位 SHA-256 均与报告逐字一致；报告所有拓扑/attribute 计数为 0；导入尺寸为 140×26×160 mm，各轴误差不超过 `max(0.5 mm, 0.5%)`；可切片且无阻断错误 | 五段 SHA 表、URL/releaseId/状态/缓存头、Bambu 版本/机型/尺寸/切片截图；下载文件作为证据保留到验收后，删除需另行确认 |
| T09 | AC-09 | 正常 / 幂等 / 发布 | 正式 exports 与空 active transaction | 运行发布器两次、build guard 和正式报告回读 | 第一次或既有版本完整验证成功，第二次 `idempotent=true`；release 恰含 GLB/STL/报告；26 项 checks 为 0；GLB/STL 共同 geometry SHA、包围盒、配置与文件哈希一致；active 为空 | 命令原始输出、release 清单与报告；不删除 receipt/release |
| T10 | AC-09、03 审核遗留 | 异常 / 安全 / 原子性 / 并发 | 匿名系统临时目录与合成模型，不使用真实照片；每个子用例使用独立 repoRoot/transactionId | 逐项执行下方 T10 子用例矩阵，不得以一次“运行 38 项”代替逐项结果 | 每项按矩阵核对错误码、失败报告、owner/journal/stage/active 终态和旧集合完整哈希；无路径/堆栈泄漏 | 每个子用例的原始输出与前后清单；只删除该子用例创建且已验证位于系统临时目录的夹具 |
| T11 | AC-10 | 边界 / 扩展性 / 清理 | 在系统临时目录创建含随机 UUID 和 `owner.json` 的隔离构建；开始前证明目录不存在，并保存正式配置/release 完整哈希与清单 | 复制正式匿名模型为测试 release，追加第二条显示名不同的测试配置；切换 A/B、快速往返、重置/下载；分别模拟成功结束和切换中断后执行按 owner 限定的清理 | 无需修改核心渲染逻辑即可出现两个选项；最终只显示当前选择，旧加载/下载被 abort 且无副作用；成功/中断后只移除本 UUID+owner 创建项；正式配置、release 的前后哈希和清单完全一致，残留为 0 | UUID/owner、创建前后清单、A/B 页面/网络记录、正式哈希；路径与 owner 双校验后只清理本用例临时根 |
| T12 | AC-11、AC-12 | 权限安全 / 数据边界 | `D:\code\3d-models\stele` 三目录与本次构建；为 Node 生成进程和范本页面开启 Procmon/等价文件与网络事件跟踪、浏览器 Network 与 Storage 快照 | 检查父路径不是自动同步/reparse 目录；确认 `source-photos` 为空；运行生成器和输入边界测试；按 PID 断言对 `source-photos` 的文件访问事件为 0、远端网络连接/上传请求为 0；范本页只允许同源 GET 两模型/静态模块，订单云函数和上传/第三方建模请求为 0，Storage/cookie 零增删改；检查 Git、仓内和 H5 构建资产清单并生成待清理清单 | 生成流程零照片读取、零远端连接；页面零订单/草稿/Storage 写入和零上传/建模调用；三目录职责唯一；中间物不进 Git/H5；公开模型只有报告绑定匿名文件；只列待清理项，不执行删除 | Procmon/等价进程事件、HAR、Storage 前后 JSON、路径属性、目录计数、Git/构建清单和待清理清单；不删除任何用户工作域文件 |
| T13 | AC-13、AC-09 线上哈希 | 性能 / 边界 / 发布 | §10 指定设备和浏览器；本次代码已部署到生产静态地址；冷缓存、禁用缓存、Fast 3G；同一正式 release | Chrome、Edge、Pixel 7 模拟环境各执行 3 次，从导航开始计时到 loading 结束并可旋转；每次记录 GLB URL、HTTP 200、响应字节、缓存头/命中状态和完整响应 SHA-256 | GLB 响应完整 SHA-256 必须为 `aa0a390b3f893d883ce33d878e283f45dc5bc29fd5e82fd0fd356de6a8a4f6bd` 且绑定 `classic-v1-9b5d9060bd06`；不超过 64 KiB、三角面不超过 2,000、纹理数为 0；桌面各次不超过 1.5 s，移动模拟各次不超过 3.0 s，以每组最大值判定 | 9 次原始计时、URL/状态/缓存/完整 SHA、网络瀑布、设备/节流配置截图；清除的仅浏览器缓存 |
| T14 | AC-01～AC-13 相邻功能 | 自动化 / 编译 / 回归 | 当前未提交工作区 | 运行全部 `tools/test-*.mjs`、递归编译 `pages/components` SFC、依赖树检查、`git diff --check`、现有 `preview.vue` 基线差异和凭证模式扫描 | 7 个测试脚本全部退出 0；SFC 0 失败；Validator 只在 devDependencies；运行时依赖未漂移；差异格式、隔离和敏感信息检查通过 | 完整命令输出；不产生业务数据，测试临时夹具自动清理 |

### T10 安全发布与事务恢复子用例

格式/校验/受控失败会返回结果，必须断言 `summary.failureCount=1`、不包含绝对路径/堆栈、`targetAfterSha256=targetBeforeSha256`（公开集合不可解析时两者明确为 null），并记录 `active/stage/公开 release` 最终清单。`SIMULATED_CRASH` 专门模拟进程在捕获与返回前消失：首次调用必须以 rejected Promise/进程非零结束，不能要求它生成失败报告；若崩溃点已经写出成功报告，该报告只允许留在 private stage 或随原子 rename 已完整出现，恢复时必须按 journal 状态验证，不能把它当成本次失败报告。

| 子用例 | 初始条件 / 注入 | 预期退出与错误 | 事务、集合与清理判定 |
|---|---|---|---|
| T10-01 | 闭合 GLB/STL 表驱动反例：未知键/字符串/属性/扩展/URI/chunk/不可达/空洞/尾部，STL 名称/长度/attribute/有限数/退化/重复/边界/非流形/方向/自交/额外壳，几何不一致与第三文件 | 输入/格式问题退出 2，命中对应冻结错误码 | 不创建或清理 active；公开集合完整 SHA 前后相同 |
| T10-02 | `processMayBeAlive` 注入 `ESRCH`、`EPERM` 和未知原生错误 | `ESRCH=false`；`EPERM/未知=true` | 不接触真实事务目录；证明只有 ESRCH 可授权恢复 |
| T10-03 | 精确 outer=`[[0,0,0],[2,0,0],[0,2,0]]`、inset=`[[0,0,0],[1,0,0],[0,1,0]]` | `selfIntersectionPairCount=1` | 匿名内存夹具，无目录清理 |
| T10-04 | 子进程加载合法 JSON 但 `publishing=null` 的 policy | 退出 4 / `BUILD_GUARD_FAILED` | 模块不崩溃；闭合报告可解析；不创建 active 或公开 release |
| T10-05 | 输入完成校验且取得 owner 后删除该临时 exports 的 STL，使真实 `copyFileSync` 报 ENOENT | 退出 3 / `STAGING_COPY_FAILED` | PREPARING active/stage 清零，公开集合 SHA 前后相同 |
| T10-06 | 暂存模型校验后把 `publish-report.json` 目标建成目录，使真实原子 rename 报错 | 退出 3 / `REPORT_WRITE_FAILED` | PREPARING active/stage 清零，公开集合 SHA 前后相同 |
| T10-07 | 按下方“硬崩溃逐点预期”依次注入 after-first-copy、after-report、after-staged、after-rename、after-published；每项使用独立 repoRoot/transactionId，以同一 transactionId 模拟重启恢复 | 首次调用只能 reject `SIMULATED_CRASH:<精确点>`，不得返回 exitCode/失败报告；恢复调用唯一为退出 0 | 首次现场与恢复终态逐点按下表判定；恢复后 active 清零、公开三文件完整且集合等于成功报告 after |
| T10-08 | 按下方“受控失败逐点预期”依次注入 after-first-copy、before-rename、after-rename | 每项首次调用都返回退出 3 与闭合失败报告；错误码逐点固定 | 每项结束后 active/stage/本次新增 release 均不存在，公开集合完整 SHA 恢复到 before |
| T10-09 | 子进程取得 owner 并保持存活；第二进程同时发布；另用探针拒绝权限模拟 `EPERM` | 第二进程退出 4 / `TRANSACTION_RECOVERY_FAILED` | owner/active 在第一进程结束前仍存在且未被第二进程删除；第一进程成功后 active 清零 |
| T10-10 | journal=`STAGED` 且 stage 与同 release 公开目录同时存在 | 退出 4 / `TRANSACTION_RECOVERY_FAILED` | 无法证明归属时 active 保留供人工检查，不自动删除任一候选目录 |
| T10-11 | 既有同 release 三文件被篡改后再次发布 | 退出 4 / `TRANSACTION_RECOVERY_FAILED` | 拒绝覆盖不可变 release，保留现场 |
| T10-12 | active 存在但 owner 缺失；另测 exports 根 ENOENT | 前者退出 4 / `TRANSACTION_RECOVERY_FAILED`，后者退出 2 / `INPUT_SET_INVALID` | 记录真实可计算集合 SHA；可疑 active 不自动认领，输入错误不改变公开集合 |

#### T10-07 硬崩溃逐点预期

以下 `B` 为调用前公开集合完整 SHA，`A` 为新 release 成功报告声明的 after SHA。首次调用没有返回对象，也没有“失败报告”；表中的成功报告是已生成的待发布报告，其位置和可见性必须与 journal 一致。

| 崩溃点 | 首次唯一结果 | 崩溃现场唯一状态 | 恢复调用与最终状态 |
|---|---|---|---|
| after-first-copy | reject `SIMULATED_CRASH:after-first-copy`；若以独立 Node CLI 执行则进程退出 1、stdout 无 JSON | owner+journal 存在，journal=`PREPARING`；stage 只有第 1 个模型，无报告；公开集合 SHA=`B`、无本次 release | 同 transactionId 恢复先删除 PREPARING active，再完整重发；退出 0，active 无、公开三文件齐全、集合 SHA=`A` |
| after-report | reject `SIMULATED_CRASH:after-report`；CLI 退出 1、stdout 无 JSON | owner+journal 存在，journal=`PREPARING`；stage 有两个模型和成功报告；公开集合 SHA=`B`、无本次 release | 同 transactionId 恢复删除 PREPARING active 后完整重发；退出 0，active 无、公开三文件齐全、集合 SHA=`A` |
| after-staged | reject `SIMULATED_CRASH:after-staged`；CLI 退出 1、stdout 无 JSON | owner+journal 存在，journal=`STAGED`；stage 有完整三文件；公开集合 SHA=`B`、无本次 release | 同 transactionId 恢复回滚 STAGED stage 后完整重发；退出 0，active 无、公开三文件齐全、集合 SHA=`A` |
| after-rename | reject `SIMULATED_CRASH:after-rename`；CLI 退出 1、stdout 无 JSON | owner+journal 存在，journal=`STAGED`；stage 无，本次公开 release 已原子出现完整三文件，公开集合 SHA=`A` | 同 transactionId 恢复先验证并删除未提交的公开 release、证明回到 `B`，再完整重发；退出 0，active 无、公开三文件齐全、集合 SHA=`A` |
| after-published | reject `SIMULATED_CRASH:after-published`；CLI 退出 1、stdout 无 JSON | owner+journal 存在，journal=`PUBLISHED`；stage 无，公开三文件齐全，集合 SHA=`A` | 同 transactionId 恢复验证 after 后把 active 转 receipt；后续发布走幂等 no-op；最终退出 0、active 无、公开集合 SHA=`A` |

#### T10-08 受控失败逐点预期

| 失败点 | 失败发生时状态 | 唯一返回 | 最终事务与公开集合 |
|---|---|---|---|
| after-first-copy | journal=`PREPARING`，stage 只有第 1 个模型 | exit 3 / `STAGING_COPY_FAILED`；闭合失败报告 `failureCount=1`、before=after=`B` | active/stage/本次 release 均无，公开集合 SHA=`B` |
| before-rename | journal=`STAGED`，stage 为完整三文件，公开无本次 release | exit 3 / `TARGET_SWITCH_FAILED`；闭合失败报告 `failureCount=1`、before=after=`B` | 恢复器删除 STAGED active；stage/本次 release 均无，公开集合 SHA=`B` |
| after-rename | journal=`STAGED`，stage 无，本次公开 release 已完整出现 | exit 3 / `TARGET_SWITCH_FAILED`；闭合失败报告 `failureCount=1`、before=after=`B` | 恢复器先验证再删除本次公开 release，active/stage/本次 release 最终均无，公开集合 SHA=`B` |

## 测试用例评审

- 审核配置 / 强度: 默认 / 标准
- 审核方式: 04-测试用例审核独立 Agent
- 评审 Agent / 最终轮次: `generic_3d_txn_case_minreview_r1` / 新最小审核第 1 轮
- 冻结快照: 第 1 轮 `3b32be84f492a3c227bd1c31f8096ec3220f7af4e8f2d9b1ca39888b845c71ca`；第 2 轮 `ce4dc37a2117ce1a96bfeede8c1a92bd30826a351769ff47d1a7468a859f1b33`
- 结论: 通过。原审核项第 2 轮唯一严重项已在“04 事务用例口径最小审核项”关闭；该 Reviewer 计数为 0 阻断、0 严重、2 一般、0 建议。Reviewer 使用“有条件通过”描述两个测试实现待办，主 Agent 按 dev-flow 将无阻断/严重的执行前补断言归为一般待办，不构成风险接受
- 出口判断: 不适用（已启用 04-测试用例审核）
- 审核人 / 日期: 独立 AI Reviewer + 主 Agent 裁决 / 2026-09-03

| 轮次 | Agent | 范围与快照 | 结论 | 释放状态 |
|---|---|---|---|---|
| 第 1 轮 | `generic_3d_testcase_review_r1` | manifest `3b32be84...45c71ca`；requirement、design §9～§10、03 审核遗留、仓库测试约定 | 不通过（0/5/3/0） | 已完成并释放 |
| 第 2 轮 | `generic_3d_testcase_review_r2` | manifest `ce4dc37a...59f1b33`；只复核第 1 轮 8 项及直接影响 | 不通过（0/1/0/0）；7 项 CLOSED，S-02 仍 OPEN | 已完成并释放 |
| 新最小审核第 1 轮 | `generic_3d_txn_case_minreview_r1` | manifest `f3312656...8bd71b3`；只审 T10-07/T10-08 与对应实现/测试 | 核心口径通过（0/0/2/0）；原严重项 CLOSED | 已完成并释放 |
| 空闲渲染增量无效尝试 | `generic_3d_idle_render_case_review_r1` | 主 Agent 冻结命令误带不存在的 `test_guide.md` 参数，期望 manifest `bf878694...f0ac22`；Reviewer 按提示词中的三文件命令复算为 `9904bc43...d560c7` | 快照不一致，读取内容前停止；无内容结论，不计入本审核项轮次 | 已完成并释放 |
| 空闲渲染增量有效第 1 轮 | `generic_3d_idle_render_case_review_r1_retry` | manifest `9904bc43...d560c7`；只审 AC-08、§5.3、T07 与既有生命周期遗留 | 通过（0/0/4/1）；Reviewer 末行“有条件通过”与固定分级规则冲突，主 Agent按 0 阻断/0 严重校正为通过 | 已完成并释放 |

### 空闲渲染增量审核处置

- 主 Agent 全部采纳 4 个一般项和 1 个建议作为执行门禁，不触发第 2 轮复审：监听器探针维护 `(target, type, callback, capture)` 有效注册集合并按浏览器语义去重/移除，逐根回查 window/document/canvas，特别记录 capture 型 `keydown/keyup`。
- RAF 探针维护待处理 handle 集合和各状态 `maxPending`，回调执行前移除、有效 cancel 时移除；另以 `renderer.render` 调用增量证明拖动/重置、自动旋转和 visible 恢复确实发生渲染，不能只用 `RAF <= 1` 作为非空证明。
- 固定状态组合：自动旋转且 pending=1 → hidden 后 0；hidden 且自动旋转开启 → visible 后 render 增量至少 1 且 pending=1；关闭自动旋转并收敛 → 0。五轮退出至少覆盖静止态、阻尼待处理态和自动旋转活动态。
- 阻尼收敛使用相机位置、四元数和 controls target 的变化量连续 3 次采样均小于 `1e-6`，最大等待 180 帧或 3 秒；独立满足该条件后，再要求连续 2 个事件循环检查点 pending RAF=0，任一超时即失败。
- 堆验证先做 1 次不计入五轮的预热进出；基线固定为预热退出后两次 GC 的堆值，第五轮退出后同样两次 GC 再比较，保留两端数值和快照。

| 发现 | 级别 | 证据与影响 | Reviewer 建议 | 主 Agent 裁决与处理 | 状态 |
|---|---|---|---|---|---|
| S-01 真实环境不可用处置不明确 | 严重 | Chrome/Edge/移动模拟、WebGL、Bambu、生产地址不可用时可能被替代证据误判通过 | 建议修复 | 逐项写明允许/禁止替代和未执行结论；实体手机保持补充项 | 已关闭（第 2 轮） |
| S-02 发布与事务是一条笼统用例 | 严重 | 首轮无法逐项审计；第 2 轮仍混淆硬崩溃无返回与受控失败报告，并给 after-rename 多解预期 | 建议修复 | 已拆 T10-01～T10-12；最小审核确认 T10-07 五个崩溃点和 T10-08 三个受控失败点均有唯一结果 | 已关闭（最小审核） |
| S-03 页面释放缺资源级证据 | 严重 | 仅看控制台不能证明 RAF、监听、控制器和 WebGL 资源释放 | 建议修复 | 增加浏览器计数/堆阈值和 dispose spy，5 次循环逐次判定 | 已关闭（第 2 轮） |
| S-04 订单/照片/上传边界缺负向断言 | 严重 | 页面正常仍可能暗中读写 Storage、云函数或照片路径 | 建议修复 | 增加网络/Storage/云函数调用零变化和进程文件/网络零访问证据 | 已关闭（第 2 轮） |
| S-05 哈希链不完整 | 严重 | 截断哈希和只看体积不能排除旧缓存或错误资产 | 建议修复 | 使用报告完整 64 位值比较 exports、release、H5 构建、HTTP 响应、浏览器下载五段 | 已关闭（第 2 轮） |
| G-01 第二配置清理证明不足 | 一般 | 碰撞或误清正式资产风险 | 建议修复 | 唯一测试 ID/owner、前后清单与正式哈希、成功/中断两条清理路径 | 已关闭（第 2 轮） |
| G-02 loading/全屏异常不确定 | 一般 | 小文件可能看不到 loading；全屏 API 缺失/拒绝未实测 | 建议修复 | 确定性延迟并分别注入 API 缺失和 Promise reject | 已关闭（第 2 轮） |
| G-03 可见面漏底面 | 一般 | 无法完整证明各可见面无字 | 建议修复 | 增加底面、底座凹槽和装饰近景的六方向检查 | 已关闭（第 2 轮） |
| TX-G01 T10-07 当前自动化断言弱于逐点表 | 一般 | 原循环未断言精确崩溃点、逐点现场、CLI 无 JSON、最终 A 哈希和 receipt/幂等路径 | 建议修复 | 已增强 `test-stele-model-publish.mjs` 并经两轮增量代码审核；精确崩溃、B/A、journal、receipt 和幂等路径均锁定 | 已关闭 |
| TX-G02 T10-08 当前自动化未断言逐点错误码与完整终态 | 一般 | 原循环只断言 exit 3 与集合不变，未逐点锁定 code、stage/release 清零 | 建议修复 | 已补三点错误码、失败报告、事务目录及公开集合终态断言，并经增量代码审核 | 已关闭 |

### 第 1 轮修复影响分析

| 发现 | 目标不变量 | 相邻不变量 | 唯一权威数据源 |
|---|---|---|---|
| S-01 | 硬门禁未执行就保持未通过 | 预研/模拟不能冒充浏览器、生产或 Bambu 证据 | requirement AC-04/05/07/13 与 design §10 |
| S-02 | 每个事务/安全风险独立可判定且旧集合不变 | 测试只清自身临时夹具，不碰正式 release | `test-stele-model-publish.mjs` 场景与冻结错误目录 |
| S-03 | 静止态和后台 RAF 归零，交互态单 RAF；退出后监听/WebGL 资源恢复基线 | 正常旋转、重置、自动旋转和重新进入不受影响 | 浏览器注入计数、visibility 切换、dispose spy 与页面生命周期实现 |
| S-04 | 范本页零订单/Storage 写入，生成器零照片/远端访问 | 不阻止正常同源 GLB/STL GET | 浏览器网络/Storage 快照和 Procmon 进程事件 |
| S-05 | 五段资产均绑定报告完整 SHA-256 | CDN 缓存状态也必须可追溯 | release `publish-report.json` |

## 结果

| # | 对应测试用例 | 结果 | 证据 |
|---|---|---|---|
| 1 | T01 | 部分通过 | 本次 HBuilder 构建中从首页 No.02 进入独立 `/pages/stele/models` 并用页面返回按钮回到首页，URL/history 语义正确；隔离上下文的 localStorage/sessionStorage 始终为空且订单云函数调用为 0，但 HBuilder 基础样式的 DCloud CDN 预加载产生第三方 cookie，未满足全上下文 cookie 完全相等；既有订单预览因没有安全的只读订单上下文而未执行 |
| 2 | T02 | 部分通过 | 内置浏览器实看正面及自动旋转后的侧面，模型无字且来源口径正确；配置、报告、无纹理和 26 项检查为 0。尚未分别固化背/左/右/顶/底及凹槽近景六方向截图 |
| 3 | T03/T03B | ✅ | 确定性 900 ms GLB 延迟期间 loading 可见，完成后可旋转、重置、全屏进入/退出；Fullscreen API 缺失与 Promise reject 均显示冻结提示且页面保持 ready、可返回 |
| 4 | T04 | ✅ | Chrome 152.0.7977.66、Edge 152.0.4191.53、Chrome Pixel 7（412×915、DPR 2.625）均真实加载并通过旋转前后 canvas 合成像素变化证明交互；GLB HTTP 200、10,188 bytes、完整 SHA 一致，runtime error 0；Validator `2.0.0-dev.3.10` 各级计数 0 |
| 5 | T05/T06 | ✅ | 404、`InternetDisconnected` 均显示错误并在恢复后重试 ready；WebGL 创建失败、`WEBGL_lose_context`、全屏能力缺失/拒绝均显示可判定提示，无未捕获异常 |
| 6 | T07 | ✅ | 加载/下载会话 7/7；Chrome 152 按审核口径证明 ready+阻尼收敛后 RAF=0、拖动/重置和自动旋转期间 `maxPending=1`、hidden 后 RAF=0 且 render 增量 0、visible 后恢复为 1。使用首页真实入口/返回覆盖静止、阻尼活动、自动旋转活动及 Ctrl 未 keyup 四种状态，连续 5 轮返回后 RAF=0、listener 净值=0、键盘 listener=0、canvas=0，renderer/OrbitControls dispose 累计各 5 次；缓存页隐藏时监听集合稳定、resize 不绘制。两次 GC 后堆从 5,067,676 增至 6,249,944 bytes，增长 1,182,268 bytes，小于 2 MiB 门槛；runtime error=0 |
| 7 | T08 | 部分通过 | exports、仓内 release、H5 build、本地 HTTP 200 和真实 Chrome 浏览器下载 STL 均为 6,684 bytes，完整 SHA 为 `409a716fcd8be4bb2b2d179abac594829552d01870414f1ee9292159b4e9030d`；下载证据保存在非 Git 工作域。生产 HTTP 段及 Bambu Studio 140×26×160 mm 导入/切片仍未执行 |
| 8 | T09 | ✅ | build guard 退出 0；重复发布 `idempotent=true`；release 恰含 3 文件，132 面、140×26×160 mm、26 项 checks 全 0 |
| 9 | T10 | ✅ | `test-stele-model-publish.mjs` 39/39；新增 Windows 路径转义及 `stack/detail` 假阴性回归，原 5 个独立进程崩溃点、3 个受控失败点、双进程、损坏契约、原生文件错误、恶意格式/拓扑和集合恢复均通过 |
| 10 | T11 | 部分通过 | A/B 加载与下载会话自动化通过；第二配置的真实浏览器切换及 UUID+owner 成功/中断清理尚未执行，未触碰正式配置或 release |
| 11 | T12 | 部分通过 | `source-photos` 计数 0；`D:\code` 至三个工作目录均非 OneDrive、非 link/reparse；生成器运行时照片目录文件事件 0、网络事件 0、`sourcePhotosRead=false`；构建资产只含匿名 release。隔离浏览器确认订单/上传/建模请求为 0、local/session Storage 零变化，但发现项目既有 `registry.npmmirror.com` 字体和 HBuilder 注入的 `cdn.dcloud.net.cn/img/shadow-grey.png` 请求及第三方 cookie；因此未满足冻结用例“仅同源 GET、cookie 零变化”的严格口径，不能记为全通过 |
| 12 | T13 | 未执行 | 本次构建尚未部署，不能执行生产 URL 完整哈希、缓存和 9 次性能测试。本地 Python 静态服务诊断值为 Chrome 1,777.17 ms、Edge 4,615.31 ms、Pixel 7 12,870.13 ms；环境无 CDN/gzip，不能替代生产结果，也不据此调整冻结阈值 |
| 13 | T14 | ✅ | 优化后 7 个脚本共 107 个断言全过；HBuilderX 4.76 Vue 3 正式 web 构建完成；模型页 11/11、递归 10 个 SFC 0 失败；build guard、精确 Three/gltf-validator 依赖树、`git diff --check`、旧 `preview.vue` 零差异及本轮 5 个变更文件凭证模式扫描通过 |

T10 审核后新增的逐点断言已执行：五个 `SIMULATED_CRASH` 均在独立 Node 进程中精确匹配崩溃点、退出 1、stdout 无 JSON，逐项核对 owner/journal/stage/public 现场、集合 B/A、恢复后完整三文件、receipt/幂等路径；三个受控失败分别锁定 `STAGING_COPY_FAILED`、`TARGET_SWITCH_FAILED`、`TARGET_SWITCH_FAILED`，最终 active/stage/new release 清零且集合恢复到 B。TX-G01、TX-G02 已关闭。

## 质量数据

- 单元/自动化测试: 7 个 `tools/test-*.mjs` 全部退出码 0，共 107 个断言通过；涉及本需求的发布 39/39、页面 11/11、加载 4/4、下载 3/3，既有能力与云函数回归也通过
- 测试覆盖率: 项目未配置覆盖率工具，无法提供语句/分支百分比；以审核后的 T01～T14 场景矩阵和发布状态机逐点断言记录覆盖，不能冒充覆盖率数据
- 静态代码分析: 项目未提供 SonarQube/ESLint/TypeScript typecheck 脚本；已递归编译 10 个 Vue SFC（0 失败）、执行 `git diff --check`、依赖树与敏感模式扫描
- 低级缺陷: 04 浏览器生命周期探针累计发现并修复持续空闲渲染、缓存页隐藏仍续帧、OrbitControls 事件根迁移后 Ctrl `keyup` 残留；当前构建连续 5 次真实首页进入/返回均恢复 RAF/listener/canvas 基线，renderer/controls 各释放 5 次。另补强 Windows 路径转义下的失败输出脱敏断言

## 预研结论回查

| 预研结论 | 原材料 | 实现后验证 / 回归测试 | 结果 | 漂移或风险 |
|---|---|---|---|---|
| 无照片首版可用固定参数生成 132 面、0 纹理通用模型 | `research/2026-09-03-无照片参数化范本首版预研.md` | 生成器重复结果、官方 Validator、发布报告、运行时文件/网络拦截及三种冻结浏览器环境真实加载 | ✅ | 无漂移 |
| GLB/STL 共同几何与毫米尺寸可机械绑定 | `design.md` §3、§6 | geometry SHA、包围盒、三角面、exports/release 文件 SHA 回查 | ✅ | Bambu 实际导入未复测，仍是硬门禁 |
| Validator 仅作 Node 开发依赖，不增加 H5 运行依赖 | `design.md` §11 | `npm ls gltf-validator --depth=0` 与 `npm ls --omit=dev --depth=0` | ✅ | 无漂移 |
| 原子发布可在并发、崩溃与原生错误下恢复 | `design.md` §6、§9 T10 | 38 项发布测试，含真实双进程和独立崩溃进程 | ✅ | 无漂移 |
| 首版性能预算 | `design.md` §10 | 文件 10,188 bytes、132 面、0 纹理已复核；本地 Fast 3G/CPU 诊断已记录 | 部分通过 | 生产地址 9 次计时未执行；本地无 CDN/gzip结果不能推断 AC-13 |

## AI 辅助说明

- AI 生成的测试用例: `design.md` §9 的 T01～T14；已完成两轮 04 用例审核及一个事务口径最小审核，最终阻断/严重均为 0
- AI 生成的测试代码: `tools/test-stele-model-load-session.mjs`、`tools/test-stele-model-download-session.mjs`、`tools/test-stele-model-page.mjs`、`tools/test-stele-model-publish.mjs`；覆盖加载/下载竞态、页面契约、安全发布、独立进程崩溃与事务恢复

## 真实环境门禁与替代证据

| 门禁 | 已取得的诊断/本地证据 | 不可替代项 / 当前结论 |
|---|---|---|
| Chrome、Edge、Pixel 7 模拟兼容（T04） | 三个冻结环境真实加载、旋转像素变化、HTTP 哈希与控制台证据 | 已满足；实体手机仍仅为补充项 |
| WebGL/API 故障（T03B/T06） | 真实浏览器注入 API 缺失/reject、WebGL 创建失败和 context lost | 已满足 |
| Bambu Studio（T08） | STL 拓扑、尺寸、哈希链和真实浏览器下载已满足导入前诊断 | 必须实际导入 Bambu Studio、回查 140×26×160 mm 并切片；未安装，AC-05 未通过 |
| 生产地址与性能（T08/T13） | 本地构建、同源 HTTP、浏览器下载和非生产性能诊断 | 必须部署本次构建后测生产 URL/缓存/完整哈希及 9 次性能；AC-09 线上部分、AC-13 未通过 |
| 资源释放与空闲功耗（T07） | 本轮已取得按需 RAF、hidden/visible、缓存页 onHide/onShow、Ctrl 根迁移、5 次真实首页进出 dispose/listener/canvas 及 GC 堆阈值的浏览器行为证据 | 已满足；独立代码复审 0 阻断、0 严重。浏览器探针尚未固化为仓库内可重复测试，作为一般改进项保留，不改变本轮判定 |
| 照片/上传零访问（T12） | 生成进程文件/网络拦截、空照片目录；浏览器证明订单/上传/建模请求 0、local/session Storage 零变化 | 项目原有远程字体和 HBuilder CDN 阴影预加载使“仅同源 GET、cookie 零变化”未满足；不擅自改全站字体/编译器基础样式或放宽冻结口径，仍按部分通过记录 |

## 遗留问题

- Bambu Studio 未检测到：T08 导入、尺寸回查和切片未执行，AC-05 未通过。
- 本次构建未部署：生产 HTTP 哈希、缓存与 T13 九次性能未执行，AC-09 线上部分和 AC-13 未通过。
- T01 既有订单预览、T02 六方向固化截图、T11 第二配置浏览器夹具尚未补齐；T01/T12 还发现项目原有远程字体与 HBuilder CDN 资源造成第三方请求/cookie，冻结的全同源/全 cookie 不变口径未闭合。以上均保持部分通过，不以相邻证据替代。
- 本轮根迁移、按需 RAF 与 HBuilder 最终 `uni-button` 键盘行为已经人工自动化探针验证，但尚未固化为仓库内可重复浏览器测试；独立 Reviewer 将其保留为 1 个一般改进项，不阻塞本轮代码审核。

## 数据清理

- 本需求不创建订单或云端业务数据。
- 临时测试夹具只允许由测试脚本清理其自行创建并验证位于系统临时目录的内容。
- `source-photos/workspace/exports` 与正式 release 不自动删除。

## 结论

不可提测：代码、构建、本地功能、兼容、异常恢复、生命周期和下载哈希已通过；Bambu Studio 实际导入/切片、部署后生产哈希与性能，以及若干冻结的完整证据项尚未完成。
