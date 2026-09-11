# 老人友好录入模式 · 02 设计 AI 评审

- 日期：2026-09-07
- 审核项：02-阶段评审
- 评审模式：默认
- 评审强度：标准
- 风险等级：R3（权限/隐私、外部图片与识别文本、异步并发、现有保存契约）
- 最多轮次：2
- 最终结论：通过
- 最终评审 Agent：`/root/elder_entry_design_r2`
- 最终轮次：第 2 轮定向复审

## 1. 评审范围

语义产物：

- `docs/老人友好录入模式/requirement.md`
- `docs/老人友好录入模式/research/2026-09-07-老人友好录入能力可行性.md`
- `docs/老人友好录入模式/design.md`

只读代码/契约证据：

- 两个碑文页面、`useOrderForm()`、模板管理、文本解析、质检、诊断、存储注册表；
- `package.json` 与 `package-lock.json`；
- 现有碑文回归脚本；
- 第 2 轮增加订单云函数、数据库 schema 与云函数回归脚本，用于核对 `info` 和生成文案的真实服务端边界。

控制记录 `progress.md` 与 `reviews/*` 排除在语义 manifest 外。

## 2. 基线与差异证明

- 仓库：`D:\code\uniapp-unpacked\uniapp`
- 基线/HEAD：`cbf77ce6c486b5d75d027e0cac3d2727322cbced`
- base 来源：每轮设计冻结时的本地 HEAD
- `baseIsAncestor=true`
- `baseEqualsHead=true`
- 预期提交集合：空
- 已提交差异 SHA-256：`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- 工作树差异 SHA-256：`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- 差异为空原因：02 只评审未提交文档及相关只读代码证据，不包含业务代码提交。

## 3. 第 1 轮评审

### 3.1 快照

生成命令：

```powershell
node D:\code\.agents\skills\dev-flow\scripts\review_snapshot.mjs --repo D:\code\uniapp-unpacked\uniapp --base cbf77ce6c486b5d75d027e0cac3d2727322cbced --head cbf77ce6c486b5d75d027e0cac3d2727322cbced --base-source "2026-09-07 02设计冻结时本地HEAD" --base-head-reason "02仅评审未提交设计产物及相关只读代码证据；无已提交差异" --path components/stele/SteleTemplateManager.vue --path composables/stele/useOrderForm.ts --path docs/老人友好录入模式/design.md --path docs/老人友好录入模式/requirement.md --path docs/老人友好录入模式/research/2026-09-07-老人友好录入能力可行性.md --path package.json --path package-lock.json --path pages/stele/index.vue --path pages/stele/detail.vue --path types/order.ts --path utils/common/diagnostics.ts --path utils/stele/quality-check.ts --path utils/stele/quality-save-guard.ts --path utils/stele/stele-utils.ts --path utils/stele/storage-registry.ts --path utils/stele/templates.ts --path tools/test-stele-regressions.mjs
```

完整 manifest：

```json
{
  "schemaVersion": 1,
  "repo": "D:/code/uniapp-unpacked/uniapp",
  "baseSource": "2026-09-07 02设计冻结时本地HEAD",
  "base": "cbf77ce6c486b5d75d027e0cac3d2727322cbced",
  "head": "cbf77ce6c486b5d75d027e0cac3d2727322cbced",
  "baseIsAncestor": true,
  "baseEqualsHead": true,
  "baseHeadReason": "02仅评审未提交设计产物及相关只读代码证据；无已提交差异",
  "paths": [
    "components/stele/SteleTemplateManager.vue",
    "composables/stele/useOrderForm.ts",
    "docs/老人友好录入模式/design.md",
    "docs/老人友好录入模式/requirement.md",
    "docs/老人友好录入模式/research/2026-09-07-老人友好录入能力可行性.md",
    "package-lock.json",
    "package.json",
    "pages/stele/detail.vue",
    "pages/stele/index.vue",
    "tools/test-stele-regressions.mjs",
    "types/order.ts",
    "utils/common/diagnostics.ts",
    "utils/stele/quality-check.ts",
    "utils/stele/quality-save-guard.ts",
    "utils/stele/stele-utils.ts",
    "utils/stele/storage-registry.ts",
    "utils/stele/templates.ts"
  ],
  "expectedCommits": [],
  "committedDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "worktreeDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "untrackedFiles": [
    { "path": "docs/老人友好录入模式/design.md", "type": "file", "sha256": "03a2d66b56d46a22e68c341a1f3153cbe9a5fd62953fa5260bd0f5716a9b98ae" },
    { "path": "docs/老人友好录入模式/requirement.md", "type": "file", "sha256": "ab72cb65b6b80cb59070b49c6733bf7780d29aea8d48a1765b531cdd88f681c7" },
    { "path": "docs/老人友好录入模式/research/2026-09-07-老人友好录入能力可行性.md", "type": "file", "sha256": "49c9c9391e7fc2c6f9eb1431fc7ab0b65cb16d44bee8fb9b5ced568b3ce8f2c1" }
  ],
  "artifacts": [],
  "manifestSha256": "a06562765e5ea2d24731802b0eceef8c6641ed3538c094997ffea2dc51a1d544"
}
```

- 评审 Agent：`/root/elder_entry_design_r1`
- 快照复算：成功，实际 manifest 与预期完全匹配
- 结论：不通过
- 统计：阻断 0、严重 6、一般 2、建议 0
- 附加只读基线回归：`node tools/test-stele-regressions.mjs`，`11 passed, 0 failed`

### 3.2 问题、裁决与修复

| 编号 | 等级 | 问题 | 主 Agent 裁决 | 设计修复 |
|---|---|---|---|---|
| S-01 | 严重 | 共享面板与权威表单/保存门协议未唯一化 | 成立 | 页面只创建一个 `useOrderForm()`；显式只读 `ElderOrderFormAdapter`；所有按钮统一进入 `requestSave()`，老人模式页面级复核会话门 |
| S-02 | 严重 | 立碑日期会被两页现有 watcher 在原子方法后异步覆盖 | 成立 | 删除直接写关联状态的 watcher，普通/老人都走统一日期控制器；即时和 `nextTick` 后都核对四份状态 |
| S-03 | 严重 | 详情/复制异步加载缺少就绪门，晚响应可覆盖用户输入 | 成立 | `loading/ready/error`、`loadEpoch`、只读快照和受 epoch 保护提交；失败禁止带原 ID 保存 |
| S-04 | 严重 | 语音、OCR、朗读没有跨能力任务互斥和所有权 | 成立 | 单一 `activeTask`，完整 `kind+id+epoch` token；新任务等待旧资源释放；补跨能力和双击反例 |
| S-05 | 严重 | 父母日期没有历法判别，严格校验与历史兼容冲突 | 成立 | 老人完整日期明确为公历；历史未标历法仅保持普通模式兼容；老人保存前须明确语义，识别不明不确认 |
| S-06 | 严重 | 外部候选没有可执行的大小和形状硬上限 | 成立 | 冻结 code point/byte/字段数/名单形状上限，解析前、构造后、正式写入三层整次拒绝；对照服务端 `info` 100 KiB 契约 |
| G-01 | 一般 | 未明确拒绝 APNG 和动画 WebP | 成立 | PNG 检测 `acTL`；WebP 检测动画位与 `ANIM/ANMF`；加入截断/扫描预算失败关闭 |
| G-02 | 一般 | 相册和拍照入口可能被单个 `capture` input 混用 | 成立 | 固定两个按钮和两个 input，只有拍照 input 带 `capture="environment"` |

本轮没有扩大需求、订单契约或仓库范围；修订只补足原设计的一致性、安全和可执行边界。

## 4. 第 2 轮定向复审

### 4.1 快照

生成命令：

```powershell
node D:\code\.agents\skills\dev-flow\scripts\review_snapshot.mjs --repo D:\code\uniapp-unpacked\uniapp --base cbf77ce6c486b5d75d027e0cac3d2727322cbced --head cbf77ce6c486b5d75d027e0cac3d2727322cbced --base-source "2026-09-07 02设计第2轮冻结时本地HEAD" --base-head-reason "02仅评审未提交设计产物及相关只读代码证据；无已提交差异" --path components/stele/SteleTemplateManager.vue --path composables/stele/useOrderForm.ts --path docs/老人友好录入模式/design.md --path docs/老人友好录入模式/requirement.md --path docs/老人友好录入模式/research/2026-09-07-老人友好录入能力可行性.md --path package.json --path package-lock.json --path pages/stele/index.vue --path pages/stele/detail.vue --path types/order.ts --path utils/common/diagnostics.ts --path utils/stele/quality-check.ts --path utils/stele/quality-save-guard.ts --path utils/stele/stele-utils.ts --path utils/stele/storage-registry.ts --path utils/stele/templates.ts --path tools/test-stele-regressions.mjs --path tools/test-order-cloudfunctions.mjs --path uniCloud-alipay/cloudfunctions/order-update/index.js --path uniCloud-alipay/database/order.schema.json
```

完整 manifest：

```json
{
  "schemaVersion": 1,
  "repo": "D:/code/uniapp-unpacked/uniapp",
  "baseSource": "2026-09-07 02设计第2轮冻结时本地HEAD",
  "base": "cbf77ce6c486b5d75d027e0cac3d2727322cbced",
  "head": "cbf77ce6c486b5d75d027e0cac3d2727322cbced",
  "baseIsAncestor": true,
  "baseEqualsHead": true,
  "baseHeadReason": "02仅评审未提交设计产物及相关只读代码证据；无已提交差异",
  "paths": [
    "components/stele/SteleTemplateManager.vue",
    "composables/stele/useOrderForm.ts",
    "docs/老人友好录入模式/design.md",
    "docs/老人友好录入模式/requirement.md",
    "docs/老人友好录入模式/research/2026-09-07-老人友好录入能力可行性.md",
    "package-lock.json",
    "package.json",
    "pages/stele/detail.vue",
    "pages/stele/index.vue",
    "tools/test-order-cloudfunctions.mjs",
    "tools/test-stele-regressions.mjs",
    "types/order.ts",
    "uniCloud-alipay/cloudfunctions/order-update/index.js",
    "uniCloud-alipay/database/order.schema.json",
    "utils/common/diagnostics.ts",
    "utils/stele/quality-check.ts",
    "utils/stele/quality-save-guard.ts",
    "utils/stele/stele-utils.ts",
    "utils/stele/storage-registry.ts",
    "utils/stele/templates.ts"
  ],
  "expectedCommits": [],
  "committedDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "worktreeDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "untrackedFiles": [
    { "path": "docs/老人友好录入模式/design.md", "type": "file", "sha256": "0bd887569b86ae8ff4a9fea6bbaede174a4a6c294c3919999ab1d75dbc94f87d" },
    { "path": "docs/老人友好录入模式/requirement.md", "type": "file", "sha256": "ab72cb65b6b80cb59070b49c6733bf7780d29aea8d48a1765b531cdd88f681c7" },
    { "path": "docs/老人友好录入模式/research/2026-09-07-老人友好录入能力可行性.md", "type": "file", "sha256": "49c9c9391e7fc2c6f9eb1431fc7ab0b65cb16d44bee8fb9b5ced568b3ce8f2c1" }
  ],
  "artifacts": [],
  "manifestSha256": "cdef7915e3e40b62f49e2451e828617b51ca5e9bf150b0434492e104b02f3f97"
}
```

### 4.2 结论

- 评审 Agent：`/root/elder_entry_design_r2`
- 评审前与结论前复算：两次均成功，manifest 都与预期完全匹配
- 主 Agent 回填本报告与 `progress.md` 后复算：仍为 `cdef7915e3e40b62f49e2451e828617b51ca5e9bf150b0434492e104b02f3f97`，控制记录未污染语义快照
- 结论：通过
- 统计：阻断 0、严重 0、一般 0、建议 0
- 首轮 8 项：S-01～S-06、G-01～G-02 全部“已修复”
- 新增回归：无

专项结论：

| 专项 | 结论 | 说明 |
|---|---|---|
| 需求覆盖 | 通过 | AC-01～AC-16 全部有设计与可判定自测闭环 |
| 架构与一致性 | 通过 | 单一正式表单、页面组合根、加载/保存/日期/任务控制器边界明确 |
| 安全与权限 | 通过 | 端侧语音失败关闭、OCR 默认关闭、外部输入三层限额、敏感内容禁止持久化 |
| 契约与依赖 | 通过 | 不新增订单字段/后端 API，普通保存语义不变，依赖锁版和同源资源明确 |
| 测试可执行性 | 通过 | 竞态、交错、动画图片、双 input 和 `nextTick` 后一致性均有反例 |

## 5. 主 Agent 只读核验

设计修订后实际执行：

```text
node tools/test-stele-regressions.mjs
=== 11 passed, 0 failed ===

node tools/test-order-cloudfunctions.mjs
=== 25 passed, 0 failed ===
```

这些结果只证明当前设计基线的既有前端回归和订单云函数契约正常；02 未实现业务代码，因此不宣称老人模式测试通过。真实设备、OCR 性能与 S1～S7 证据仍属于 04 门禁。

## 6. 阶段出口

- AI 设计门禁：通过。
- 阻断/严重问题：0。
- 设计可执行性：满足进入 03 的技术条件。
- 当前授权：只到 02；未获 03 开发授权。
- 分支前置条件：03 开工前回查实际主分支及当前 `feature/generic-stele-models` 依赖；若设计依赖未进入实际主分支，由用户明确选择先合并依赖或以指定提交为新分支基线。
- 最终动作：停在 03-开发前等待用户明确指令。
