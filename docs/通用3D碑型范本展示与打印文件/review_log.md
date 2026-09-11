# 通用3D碑型范本展示与打印文件 · 开发审查记录

- 阶段: 03-开发
- 阶段基线: `ee297cb55bdb854867694bbaf76976d77b542191`
- 工作分支: `feature/generic-stele-models`
- 代码审核: 已启用；03 主审核及遗留最小审核已通过，04 自测新增的事务断言与生命周期修复均完成增量审核

## 测试先行

### RED-01 · 异步模型加载所有权

- 测试: `tools/test-stele-model-load-session.mjs`
- 目标: A 慢 B 快、卸载后解析完成、连续重试 abort、当前网络错误。
- RED 结果: 2026-09-03 执行 `node tools/test-stele-model-load-session.mjs`，退出码 1；`ERR_MODULE_NOT_FOUND` 指向尚未实现的 `utils/stele/model-load-session.js`，符合预期。

### RED-02 · 模型发布事务

- 测试: `tools/test-stele-model-publish.mjs`
- 目标: 首次发布、幂等 no-op、报告投影、STAGED/rename/PUBLISHED 崩溃恢复、既有 release 冲突、构建门禁与集合哈希。
- RED 结果: 2026-09-03 执行 `node tools/test-stele-model-publish.mjs`，退出码 1；`ERR_MODULE_NOT_FOUND` 指向尚未实现的 `tools/stele-models/validate-and-publish.mjs`，符合预期。

## 实现后定向测试

- `node tools/test-stele-model-load-session.mjs`：4/4 通过，覆盖 A 慢 B 快、卸载后完成、重试取消和当前请求失败。
- `node tools/test-stele-model-download-session.mjs`：3/3 通过，行为级覆盖 A/B 下载切换、卸载后完成和哈希失败无保存。
- `node tools/test-stele-model-page.mjs`：7/7 通过，结构级覆盖路由/配置、加载与下载会话接线、深度释放、全屏失败可见提示、失败重试、个性化预览隔离和 SFC 编译；实际 DOM/浏览器交互保留为 04 验收，不以源码断言冒充浏览器证据。
- `node tools/test-stele-model-publish.mjs`：38/38 通过；覆盖可重复无照片参数生成、固定生成出口、官方 Validator 版本证据、损坏 policy 的模块加载失败报告、EPERM/ESRCH 进程探测、首次/幂等发布、报告投影、5 个崩溃点恢复、3 个可恢复失败点、真实复制/报告原子写入错误归类、真实双进程争锁、异常双目录、两类共面重叠/拓扑计数、表驱动 GLB/STL 恶意样本、闭合失败报告与真实/不可得集合哈希、构建门禁、报告版本/配置面数篡改和仓内四方哈希一致。
- 官方 `gltf-validator@2.0.0-dev.3.10` 对正式 GLB 返回 glTF 2.0、0 error、0 warning、无纹理；报告强制记录同一精确版本。
- 正式参数化模型：132 三角面、0 纹理、140×26×160 mm；共同几何摘要 `c01194239cabd72ac659b6d919e5340b7eb498d3a66bf1373fad0b402c9cbcaa`。
- 正式资产：GLB 10,188 bytes / `aa0a390b...a4f6bd`；STL 6,684 bytes / `409a716f...e9030d`；不可变 release 为 `classic-v1-9b5d9060bd06`。
- 修订后全量 `tools/test-*.mjs`：7 个脚本全部退出码 0；既有碑文端能力、25 项云函数测试、3 项下载会话、4 项加载会话、7 项页面、38 项发布、11 项碑文回归均通过。
- 全量 SFC 编译：递归检查 `pages/` 与 `components/` 共 10 个 `.vue` 文件，0 失败。
- `node tools/stele-models/validate-and-publish.mjs --build-guard`：退出码 0；随后重复发布返回 `idempotent=true`，没有覆盖不可变 release。
- `npm ls gltf-validator --depth=0`：精确解析 `2.0.0-dev.3.10`；`npm ls --omit=dev --depth=0` 显示 H5 运行依赖未新增 glTF Validator。
- `git diff --check`：退出码 0；`pages/stele/preview.vue` 相对阶段基线无差异；本轮代码/配置凭证模式扫描无命中。

## 代码审核

### 第 1 轮

- Reviewer: `/root/generic_3d_code_review_r1`
- manifest: `4706e4f1d8055224f435ac1b09d1e8b2675d7ac97cdf982b3fa58106f53e95c8`（起止复算一致）
- 结论: 不通过
- 阻断 / 严重 / 一般 / 建议: 1 / 4 / 3 / 1
- Reviewer 已完成并释放。

主 Agent 裁决全部修复：

- 活事务增加 owner/PID 存活门禁和真实双进程交错测试，存活事务只能失败关闭。
- 共边共面三角形继续检查共享边外的正面积重叠，并加入正反例。
- 全屏不支持/权限拒绝改为 ready 状态可见提示。
- 所有失败输出 schema 可校验、`failureCount=1`、before/after 相等的闭合报告，去除底层 detail、路径和堆栈。
- 新增下载会话行为测试和 GLB/STL 表驱动恶意样本；收窄原先对页面源码测试的证据表述，真实 DOM/浏览器行为明确留在 04。
- 下载目标在请求开始时冻结，切换/卸载均 abort 且过期响应无副作用。
- schema 将 Validator 改为精确版本并在运行时实际递归校验；配置面数与真实资产强绑定。
- 生成器 CLI 只允许固定 exports 目录。

### 第 2 轮

- Reviewer: `/root/generic_3d_code_review_r2`
- manifest: `84903132d4889c85dba0498e7a82c427abc27de305a6c5594a24bfdd797d5638`（起止复算一致）
- 结论: 不通过；原 03 代码审核项已用满 2 轮
- 阻断 / 严重 / 一般 / 建议: 1 / 2 / 1 / 0
- Reviewer 已完成并释放。

末轮 OPEN 为：`EPERM` 活进程误恢复、共面边界包含型正面积重叠、契约损坏/启动恢复/build guard 的失败报告真实性，以及下载测试未断言 abort。主 Agent 不接受风险，依据用户既有自主裁决授权另开“03 末轮遗留最小修复审核项”，只修这 4 项，不重开完整代码审核。

末轮后最小修复：

- 进程探测仅 `ESRCH` 判定停止，`EPERM`/未知错误均按可能存活；加入注入式 EPERM/ESRCH 正反例。
- 共面检测增加三角形质心严格包含判定，并加入 Reviewer 原始 `outer/inset` 反例。
- 契约文件解析/哈希校验进入捕获边界；冻结错误文本内置并与磁盘目录互验；可计算时失败报告记录真实集合快照，不可计算时以 null 明示；原生文件系统 code 只在冻结枚举内保留。
- 下载行为测试现在直接断言切换与卸载后的 `AbortSignal.aborted=true`。
- 定向结果：下载会话 3/3、发布与安全事务 35/35 通过。

## 03 末轮遗留最小修复审核

- 范围: 仅复核上述 4 个 OPEN 及相邻的原子发布、报告 schema、页面下载副作用不变量。
- 第 1 轮 Reviewer: `/root/generic_3d_code_tail_fix_r1`
- 第 1 轮 manifest: `6ea79b87f217ed48685e7333fc6f65c1bc861de5a83e7863504774d81a0aeac7`（起止复算一致）
- 第 1 轮结论: 不通过；阻断 / 严重 / 一般 / 建议为 0 / 2 / 0 / 0，Reviewer 已完成并释放。

第 1 轮确认原 4 项中的进程探测、共面边界包含和下载 abort 已关闭；仅失败报告真实性还剩两个严重项。主 Agent 裁决均修复：

- 文件名和 release 正则改为实现内冻结常量，完成契约校验后再使用磁盘 policy 的深层结构；增加独立子进程加载合法 JSON 但 `publishing=null` 的回归，必须稳定输出 `BUILD_GUARD_FAILED` 报告。
- 文件复制与报告原子写入分别建立阶段错误边界，未知原生文件系统错误固定映射为 `STAGING_COPY_FAILED`、`REPORT_WRITE_FAILED`；回归测试通过删除已校验输入和把报告目标建成目录触发真实文件系统错误，并验证旧公开集合不变。
- 定向结果：发布与安全事务 38/38 通过。

- 第 2 轮 Reviewer: `/root/generic_3d_code_tail_fix_r2`
- 第 2 轮 manifest: `e55b85cfa0ea665e10a660dd5975845d37516290dffaa1e4ce8549ab49710275`（起止复算一致）
- 第 2 轮结论: 通过；阻断 / 严重 / 一般 / 建议为 0 / 0 / 0 / 0，Reviewer 已完成并释放。
- Reviewer 实际复跑：发布 38/38、下载 3/3、build guard 退出码 0；两个严重项和进程探测、共面边界包含、下载 abort 三个相邻不变量全部 CLOSED。
- 最终裁决: 关闭“03 末轮遗留最小修复审核项”。原 03 代码审核两轮的遗留风险已通过独立最小修复审核收敛，03 代码审核门满足阻断/严重清零。

## 04 执行前事务断言增量审核

- 第 1 轮 Reviewer: `/root/generic_3d_test_assertion_code_review_r1`
- 第 1 轮 manifest: `4fe8062c...`；结论 PASS，阻断 / 严重 / 一般 / 建议为 0 / 0 / 3 / 0。
- 三个一般项均已修复：硬崩溃 stderr 改为提取后精确等值；逐点锁定 B/A、owner/journal/receipt/transactionId/state；受控失败结果递归检查路径与 `stack/detail`。
- 第 2 轮 Reviewer: `/root/generic_3d_test_assertion_code_review_r2`
- 第 2 轮 manifest: `172435c9993a70ae67801c1f10fdd37671f862cf8c42d406a166b79c9766dc56`；结论 PASS，阻断 / 严重 / 一般 / 建议为 0 / 0 / 1 / 0。
- 原三个发现均关闭；新增一般项为旧 GLB 恶意样本分支仍使用 `JSON.stringify(result).includes(sandbox.root)`，Windows 转义可能产生测试假阴性，且该分支未复用 `stack/detail` 检查。主 Agent裁决为非阻断测试待办：生产失败契约和 T10 受控失败主路径已由闭合 schema 与递归检查覆盖，本轮不扩大修改范围。

## 04 生命周期监听泄漏最小修复审核

- 触发证据: 修前真实 Chrome 连续进入/退出 5 次，RAF、canvas 和 dispose 均回收，但 `document` 捕获型 `keydown` 每轮净增 1；调用栈指向 `OrbitControls.connect()`。原因是 UniApp 卸载时 canvas 可能已脱离原 document，依赖自身 `getRootNode()` 的清理落在错误目标。
- 修复范围: `pages/stele/models.vue` 保存 OrbitControls 创建时的事件根，销毁时以同一回调和 `capture=true` 显式移除 `keydown/keyup`，再执行原有 `controls.dispose()`；`tools/test-stele-model-page.mjs` 增加对应契约断言。
- RED/GREEN: 修复前页面测试 6/7；修复后 7/7。修复后真实 Chrome 5 轮中每轮退出均恢复 window=12、document=4、canvas listener=0、RAF=0、canvas=0；renderer/controls/geometry/material 各 dispose 5 次，texture=0，runtime error=0。
- Reviewer: `/root/generic_3d_test_assertion_code_review_r2`
- manifest: `8dc5385f819ccf81834d926dd83e42a8aae44e9fe39e2e6260f76c6ab1e83fa6`（两文件 SHA 与 base/head 复算匹配）
- 结论: PASS；阻断 / 严重 / 一般 / 建议为 0 / 0 / 0 / 1。
- 建议项: 当前实现依赖 Three 0.183.2 的 OrbitControls 私有回调字段；后续升级 Three 时应补回调存在性门禁或把五轮 listener 基线探针固化为行为测试。当前锁定版本下不阻塞。

## 04 同范围性能与可访问性优化增量审核

### 测试先行与实现

- 第一批 RED：页面契约对按需 RAF、visibility、精确 Three 版本和 aria 状态为 7/10，通过实现后 10/10；发布测试对 Windows 路径转义脱敏 helper 为 38/39，通过实现后 39/39。
- 浏览器发现 UniApp H5 把源码 `<button>` 编译为无原生按钮角色的 `<uni-button>`；补键盘语义用例后页面测试 10/11，再为本页 8 处按钮补 `role/tabindex/Enter/Space/aria-disabled`，转为 11/11，实际 Chrome Enter/Space 行为通过。
- 缓存页隐藏场景先复现自动旋转 RAF 持续；补 `onHide/onShow`、`pageActive` 和 OrbitControls 断连/重连后转绿，hidden RAF=0、resize render 增量=0、shown RAF=1。
- 根迁移回归先复现第二轮缓存隐藏后临时页面根残留键盘监听；先按保存根清理仍被第 1 轮 Reviewer 复现 Ctrl `keyup` 残留，最终改为保存根与当前根去重双清理，并把 `_controlActive` 复位。

### 第 1 轮

- Reviewer: `/root/generic_3d_idle_render_code_review_r1`
- manifest: `09a20d4fda7b6ca6a192b3bca554d2d3fe3b915ddeac27a1acf3580b6d3a964c`（评审前后复算一致）
- 结论: 不通过；阻断 / 严重 / 一般 / 建议为 0 / 1 / 1 / 0，Reviewer 已完成并释放。
- 严重项: `onShow` 早于 DOM 重挂时，OrbitControls 的 `keyup` 可注册到当前 document，而旧实现只清保存的旧根；Ctrl 未 keyup 就隐藏会残留回调。主 Agent接受并修复。
- 一般项: 页面测试仍以源码正则和通用 SFC 编译为主，根迁移及 HBuilder 最终按钮行为未固化为可重复浏览器测试。

### 第 2 轮

- Reviewer: `/root/generic_3d_idle_render_code_review_r2`
- manifest: `324d5ec77a24fd4f9ae084878bf0b45018178c49c71d5cda009ead4de8e3c6cc`；worktree diff `44027aadb2a3136fee84ba2a5493dc2692e3d5d8d2f3a66dc03413f4b3390e99`（评审前后复算一致）
- S-01: CLOSED。保存根与当前根均使用同一 callback、`capture=true` 移除 keydown/keyup；隐藏先清根再 disconnect，销毁先清根再 dispose，重复执行安全。
- G-01: OPEN（一般）。本轮 HBuilderX 构建和 Chrome 根迁移/真实键盘证据足以支撑修复，但浏览器探针尚未固化到仓库测试。
- 新发现: 无。
- 结论: 通过；阻断 / 严重 / 一般 / 建议为 0 / 0 / 1 / 0，Reviewer 已完成并释放。

### 最终行为证据

- Chrome 152.0.7977.77：空闲 RAF=0，交互/自动旋转 `maxPending=1`，hidden render 增量=0；两次 GC 后堆增长 1,182,268 bytes，低于 2 MiB 门槛，runtime error=0。
- 首页真实入口与返回连续 5 轮：阻尼、自动旋转活动态和 Ctrl 未 keyup 均覆盖；每轮返回后 RAF=0、listener 净值=0、键盘 listener=0、canvas=0；renderer/OrbitControls dispose 累计各 5 次。
- 最终自动化：7 个 `tools/test-*.mjs` 共 107 个断言通过；HBuilderX 4.76 web 构建、10 个 SFC、build guard、精确依赖、差异格式、旧预览隔离与敏感信息扫描均通过。
