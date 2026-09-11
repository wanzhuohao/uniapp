# 老人友好录入模式 · 设计文档

- 日期：2026-09-07
- 阶段：02-设计
- 状态：已取消，历史归档（不再作为当前实现或部署设计）
- 适用仓库：`D:\code\uniapp-unpacked\uniapp`
- 设计基线：`cbf77ce6c486b5d75d027e0cac3d2727322cbced`
- 合码策略：上线后合

> 本文主体记录 2026-09-07 的七步老人模式设计和当时的评审证据。该方案已于 2026-09-08 定向回退；主体内容、文件清单和 T01～T51 不再用于当前验收。当前有效设计如下，部署以 [deployment_guide.md](deployment_guide.md) 为准。

## 当前有效设计（2026-09-10）

1. 手机新建页继续使用 `pages/stele/index.vue` 原有三阶段流程；名单阶段挂载 `SmallTextPreview.vue`，固定在可视区域且只向 `WordPreview` 传入 `small`，最终阶段才渲染完整碑面。
2. 电脑详情页 `pages/stele/detail.vue` 不挂载小字浮窗，继续使用原完整预览区；手机和电脑通过同一个 `useOrderForm()` 获得名单规整、撤销、预览和保存数据。
3. `organizeNameRows()` 先按当前排/列顺序展平全部条目，再按现有称谓的辈分和支系归组；同类第 N 个子/媳、女/婿按录入顺序配对。空白姓名、重名、人数不齐、自定义称谓和空称谓均原样保留，不推测、不补人、不删人。
4. 规整前后快照由 `useOrderForm()` 管理。仅当名单仍等于刚规整结果时允许撤销；之后的输入、增删或拖动会使旧快照失效。规整、撤销、预览和保存都读取同一个 `form.names`。
5. `generateSmall()` 严格逐排渲染 `form.names`，不再识别或隐式合并相邻夫妻排；夫妻同排只能由自动规整或用户拖动真实改变名单结构。
6. `callOrderFunction()` 在 401 时清除缓存并循环回到口令输入；口令只在 `code === 0` 后缓存。用户取消立即结束本次操作，其他错误清除未验证口令且不自动重发结果未知的请求。
7. 当前变更只影响 H5 前端及本地测试，不改变订单 API、云函数、数据库 schema 或保存载荷。

## 以下为已取消方案的历史设计

## 1. 设计结论

本需求采用“共享老人录入面板 + 正式表单单一保存契约 + 临时候选隔离层 + 增强能力按运行时证据降级”的方案：

1. 新建页和详情页各保留现有普通模式，在首屏嵌入同一个 `ElderEntryPanel`，老人模式不新建路由、不新建订单结构，也不新增后端接口。
2. 手工输入直接更新 `OrderForm`；语音、OCR 和模板解析先写入内存候选 DTO，候选确认前不能进入表单、草稿、模板或保存载荷。
3. 日期继续兼容现有 `OrderForm` 与文本日期引用，但新增唯一的原子写入接口，同时更新两份状态，防止保存前 `syncDatesToForm()` 用旧引用覆盖屏幕确认值。
4. 大字分段不设逐步确认，整单只在总览执行一次“确认并保存”；名单步骤复用现有成品预览实时展示小字排版。手工录入、模板、日期、总确认和保存是首版核心能力；语音只有在浏览器能证明 `zh-CN` 端侧处理时才出现；OCR 只有通过冻结评估协议后才按“试用”或“正式辅助入口”发布。
5. 02 阶段没有可用的三台真实设备、冻结样本和受控证据目录，无法完成需求规定的真实冷启动性能实测。因此首个生产发布策略明确为 `disabled`，OCR 不作为首版承诺能力；03 只实现受发布策略约束的懒加载模块与评估入口，04 依据完整证据唯一决定 `disabled / trial / official`。这不阻塞其余老人模式交付。

## 2. 当前行为与约束

### 2.1 已核对的现状

- `pages/stele/index.vue` 与 `pages/stele/detail.vue` 都使用 `useOrderForm()`，但各自维护页面按钮、模板和保存交互。
- `useOrderForm()` 同时维护 `form.*` 日期字段和 `fatherBirth`、`fatherDeath`、`motherBirth`、`motherDeath`、`libeiDate`、`qingmingYear` 等文本引用；`buildSavePayload()` 会先执行 `syncDatesToForm()`。
- `applyTextCommands(text, form)` 会原地修改传入表单，不能把正式 `OrderForm` 交给候选解析。
- 模板投影已经通过 `SteleTemplateData` 白名单排除 `user`、`remark`，可复用现有本机存储。
- 当前日期质检只检查通用数值范围，未覆盖真实公历月份天数、闰年和农历立碑日 1～30。
- 项目当前没有标准 `scripts`，也没有正式声明测试框架；已有回归脚本以 `tools/test-*.mjs` 运行。
- 当前工作区处于既有 `feature/generic-stele-models` 分支，并有本需求范围外的未跟踪 3D 产物。02 仅写流程文档，不切分支、不触碰这些产物。

### 2.2 不变式

以下约束贯穿实现、测试与发布：

- 保存仍只调用当前页面的现有保存入口和 `SavePayload`，云函数、数据库、订单字段保持不变。
- 普通模式必须保持可用；增强能力失败不能阻断手工路径。
- 未确认候选永远不能改变 `OrderForm`，也不能被任何自动保存机制持久化。
- `user` 与 `remark` 不能被模板、语音或 OCR 候选覆盖。
- 音频、图片、OCR 原文、候选文本和置信度不得写入日志、订单、草稿、模板、LocalStorage、IndexedDB 或 Cache Storage。
- 不连接云 OCR、远端 Web Speech 或其他新增 SaaS，不在前端放置第三方密钥。
- 不修改、调用或耦合 `D:\code\3d-models\stele`。

当前订单云函数的只读契约核验结果：`order-update` 要求 `info` 为可序列化普通对象且 UTF-8 JSON 不超过 100 KiB，生成文案 `title` 不超过 200 字符、`big/small/birth/date` 各不超过 20000 字符；数据库 schema 与云函数一致。本设计的候选上限显著小于这些载荷上限，且 03 不修改云函数或 schema。

## 3. 范围与非目标

### 3.1 本设计覆盖

- 新建页和详情页的老人模式入口、共享大字分段面板和总确认。
- 手工输入、模板候选、日期选择、名单单击排序、朗读。
- 可证明端侧处理的语音候选。
- 本地图片安全预检、缩放、本地 OCR 候选、取消与释放。
- 候选隔离、逐字段确认、低置信度提示、诊断脱敏。
- OCR 冻结评估工具、发布判定和证据边界。
- 现有普通模式与保存契约回归。

### 3.2 非目标

- 不新增路由、云函数、数据库字段、Redis/Nacos 配置或外部服务。
- 不自动生成完整碑文，不允许一键覆盖和自动保存。
- 不做农历/公历自动换算。
- 不承诺书法体、风化、严重反光或遮挡图片的识别准确率。
- 不在 Git 中保存评估原图、真值、逐样本输出、授权证明或个人身份信息。

## 4. 总体架构

```text
pages/stele/index.vue ─┐
                       ├─ ElderEntryPanel.vue ── useElderEntry.ts
pages/stele/detail.vue ┘          │                    │
                                  │                    ├─ candidate.ts
                                  │                    ├─ speech.ts / tts.ts
                                  │                    ├─ image-preflight.worker.ts
                                  │                    ├─ image-preflight.ts / ocr.ts
                                  │                    └─ release-policy.ts
                                  │
                                  └─ useOrderForm.ts
                                       ├─ 原子日期写入
                                       ├─ 已确认 patch 写入
                                       ├─ 现有质检/预览
                                       └─ 现有 SavePayload / 保存接口
```

核心分层：

- **页面层**：只负责模式入口、加载态、保存态和调用原有页面保存方法。
- **老人交互层**：负责分段导航、大按钮、无障碍状态和候选确认，不直接调用云函数。
- **会话层**：维护当前步骤、临时候选、运行中任务和资源释放，不维护逐步确认状态。
- **能力适配层**：语音、朗读、图片预检、OCR 均以可取消适配器提供，不持久化业务内容。
- **正式数据层**：只有 `useOrderForm()` 可以将手工输入或已采用候选写入 `OrderForm` 并生成现有载荷。

## 5. 文件级改动设计

| 文件 | 计划改动 | 目的 |
|---|---|---|
| `pages/stele/index.vue` | 增加首屏模式入口，挂载共享面板；建立唯一表单/会话实例、加载就绪门和统一保存门 | 新建/复制/草稿路径复用现有保存链路且不被晚响应覆盖 |
| `pages/stele/detail.vue` | 同上；详情数据先读取快照，校验加载代次后一次提交到表单 | 详情页不产生分叉订单模型，不允许失败后用默认值覆盖原单 |
| `components/stele/ElderEntryPanel.vue` | 新增共享大字单列面板；步骤、候选卡、模板卡、日期控件、名单成品预览、总确认与保存反馈 | 两页只维护一套老人交互与预览 |
| `components/stele/SteleTemplateManager.vue` | 增加“直接应用 / 返回候选”两种受控模式；候选模式先展示变更字段 | 老人模式模板不直接入表 |
| `composables/stele/useElderEntry.ts` | 新增会话状态机、全会话任务所有权、候选确认、保存门、退出清理和能力探测编排 | 隔离交互与异步生命周期，跨能力也只能有一个活动任务 |
| `composables/stele/useOrderForm.ts` | 新增已确认 patch、统一立碑日期控制器、日期原子写入、只读加载快照与受代次保护的提交 API；保留兼容入口 | 收敛正式写入口，消除日期 watcher 回写和异步加载覆盖 |
| `types/elder-entry.ts` | 新增步骤、候选、日期选择、能力状态、任务状态与适配器类型 | 候选和正式数据类型隔离 |
| `utils/stele/elder-entry/candidate.ts` | 输入硬限额后克隆表单、调用现有文本解析器，再对白名单字段做有界差异映射 | 复用解析能力且不污染正式表单、不接受无界外部结构 |
| `utils/stele/elder-entry/date.ts` | 日期选择规范化、真实公历校验、农历边界和显示文本 | 保证屏幕、引用、表单和载荷一致 |
| `utils/stele/elder-entry/speech.ts` | 端侧能力探测、语言包安装、主动启动、停止和代次隔离 | 禁止隐式远端语音 |
| `utils/stele/elder-entry/tts.ts` | 中文语音筛选、单段朗读、停止与队列清理 | 可选朗读不阻塞流程 |
| `utils/stele/elder-entry/image-preflight.worker.ts` | 读取魔数、尺寸和动画标记，拒绝危险/动画图片，在可用时完成 Worker 解码缩放 | 大位图解码前失败关闭 |
| `utils/stele/elder-entry/image-preflight.ts` | 文件选择、Worker RPC、Object URL/缓冲管理 | 页面不直接持有预检细节 |
| `utils/stele/elder-entry/ocr.ts` | 按需创建 Tesseract Worker、识别、结构化置信度、取消和销毁 | 本地 OCR 候选适配 |
| `utils/stele/elder-entry/release-policy.ts` | 编译期发布状态和评估结果解释器 | 未经门禁的 OCR 不进入生产入口 |
| `utils/stele/elder-entry/ocr-evaluation.ts` | 纯函数指标、三设备 AND、短路判定与 manifest 校验 | 04 可独立复算 |
| `utils/stele/quality-check.ts` | 补真实公历、年份精度、立碑日期与生卒比较规则 | 老人日期状态与现有质检一致 |
| `utils/common/diagnostics.ts` | 扩展固定枚举的能力、阶段、耗时字段；继续拒绝业务文本 | 满足脱敏诊断证据 |
| `static/ocr/v7/` | 自托管 Worker、全部匹配 core 变体、简体中文横/竖模型、许可证和资源哈希清单 | 同源、固定版本、可复现 |
| `package.json` / `package-lock.json` | 精确锁定 OCR、模型资产和 SFC 测试解析器；新增真实可执行脚本 | 可复现构建与验证，不虚构现有命令 |
| `tools/test-elder-entry.mjs` | 新增纯 TypeScript 状态/日期/候选/策略测试 | 覆盖复杂不变式 |
| `tools/test-elder-entry-sfc.mjs` | 编译两页和共享面板，做 SFC 静态契约检查 | 捕获模板/事件接线错误 |
| `tools/test-stele-regressions.mjs` | 增补订单契约、模板白名单、普通模式回归断言 | 证明未破坏现有行为 |
| `tools/test-order-cloudfunctions.mjs` | 不修改；在 04 作为既有服务端契约回归直接执行 | 验证 `info` 100 KiB、生成文案长度、白名单和鉴权边界未回归 |
| `tools/ocr-evaluation/` | 新增受控目录外路径校验、冻结/结果 manifest 校验和聚合 CLI | 评估证据不进入仓库 |

`pages.json` 不改；订单 API、云函数和 `types/order.ts` 的现有持久化字段不改。若实现时发现必须新增持久化字段或后端接口，视为范围变化，停止 03 并回到 02 重新确认。

## 6. 状态模型与交互流程

### 6.1 分段状态机

步骤固定为：

```text
type → parents → lifeDates → title → erectDate → names → review
```

页面 `setup` 只创建一次 `useOrderForm()`，并基于它创建一次 `ElderOrderFormAdapter` 和一次 `useElderEntry(adapter)`；共享面板只能接收这两个实例，禁止在面板内部再次调用 `useOrderForm()`。老人会话控制器在页面加载状态为 `ready` 前保持未初始化、不可编辑、不可保存。

会话只保存当前步骤、临时候选和异步任务状态，不再维护每一步的 `confirmed` 标记。详情页或草稿加载出的已有值可直接显示和修改；“下一步”只负责停止当前异步任务并导航，不要求先点击步骤确认。语音、OCR、模板产生的候选仍必须逐字段采用或放弃，因为它们尚未写入正式表单。

允许前后跳转，但进入 `review` 时重新计算：

- 当前正式值是否满足必填与日期规则；
- 是否仍存在未处理候选；
- 现有质检是否存在 blocker/warning。

名单步骤在编辑区下方直接渲染 `WordPreview`，数据由页面适配器调用现有 `buildPreview()` 实时生成。这样称谓、姓名、分排和顺序变化会立即反映到与普通模式最终预览同源的小字区域，不另写一套排版规则。

### 6.2 三类状态严格隔离

| 状态 | 存放位置 | 可否持久化 | 可否进入保存载荷 |
|---|---|---|---|
| 正式表单值（手工输入或已采用候选） | 现有 `OrderForm` | 按现有草稿/模板规则 | 可以 |
| 老人会话元数据 | `useElderEntry()` 内存 | 不可以 | 不可以 |
| 语音/OCR/模板候选与置信度 | `useElderEntry()` 内存 | 不可以 | 不可以 |

候选 DTO 只包含白名单路径：`selected`、父母姓名与生卒、`bigTitle`、立碑日期语义、`names`。`user`、`remark` 不在类型和运行时白名单中，即使外部文本含有同名键也会丢弃。

### 6.3 候选协议

```ts
type CandidateSource = 'speech' | 'ocr' | 'template';
type CandidateStatus = 'pending' | 'confirmed' | 'discarded' | 'needs-review';

interface ElderCandidateField {
  id: string;
  path: ElderWritablePath;
  displayLabel: string;
  proposedValue: ElderCandidateValue;
  source: CandidateSource;
  confidence: number | null;
  status: CandidateStatus;
  taskToken: { kind: ElderTaskKind; id: string; epoch: number };
}

interface ElderCandidatePatch {
  source: CandidateSource;
  taskToken: { kind: ElderTaskKind; id: string; epoch: number };
  fields: ElderCandidateField[];
}
```

- 语音候选只能生成当前步骤允许的路径；解析出其他字段也丢弃。
- OCR 与模板可以给多个步骤生成建议，但每个字段独立确认。
- 候选不保存原始音频、图片或全文；UI 所需文本只在当前内存对象中存在。
- 无最小单元置信度、映射失败、字段为空或任一单元 `<80` 时，该字段为 `needs-review`，不制造字符级分数。
- 确认时先按类型和业务规则验证，然后调用唯一正式写入口；验证失败时 `OrderForm` 保持原样。

### 6.4 外部输入硬边界

语音/OCR 是外部输入，不能引用当前并不存在的服务端长度约束。03 在解析前、候选构造时和正式确认写入时三层执行同一组硬限制，任一超限整次拒绝、不截断、不部分写入：

| 对象 | 硬上限 |
|---|---|
| 单次语音最终文本 | 512 个 Unicode code point 且 UTF-8 不超过 4096 byte |
| 单次 OCR 原始文本 | 8192 个 Unicode code point 且 UTF-8 不超过 32768 byte |
| 单个父/母姓名或名单姓名 | 64 个 Unicode code point |
| 单个称谓 | 32 个 Unicode code point |
| 横批 | 32 个 Unicode code point |
| 单次候选字段 | 128 个；序列化候选不超过 64 KiB |
| 名单形状 | 精确三层数组；最多 8 排、每排最多 8 项、总计最多 50 项；每项必须恰为 `[称谓, 姓名]` |
| 其他嵌套值 | 不接受；日期必须匹配固定 DTO，文本必须为字符串 |

这些限制只约束增强能力候选，避免改变普通模式对既有订单的兼容；超限后用户仍可返回手工路径。64 KiB 候选预算为当前服务端 `info` 100 KiB 硬上限预留生成结构、已有字段和 JSON 开销，字段上限也使生成文案保守低于服务端 200/20000 字符边界。实现必须按 code point 而非 UTF-16 `length` 计数，并先检查字节/节点预算再运行 `applyTextCommands()`。固定错误码为 `CANDIDATE_TEXT_LIMIT`、`CANDIDATE_FIELD_LIMIT`、`CANDIDATE_SHAPE_INVALID`。

### 6.5 结构化文本解析隔离

OCR 文本解析按以下顺序执行：

1. 对输入文本执行 §6.4 的 code point、UTF-8 byte 和节点预算检查。
2. 从 `OrderForm` 创建深克隆，移除 `user`、`remark` 并保留候选允许字段。
3. 对克隆调用现有 `applyTextCommands()`。
4. 对解析后对象再次执行精确形状、深度和数量硬限额，再对白名单路径做差异比较。
5. 将有界差异转为 `ElderCandidatePatch`，不保留整段 OCR 原文。
6. 用户逐字段确认时再次执行相同边界，才调用 `applyConfirmedElderPatch()`。

任何异常只返回固定错误码，丢弃当前克隆和候选，不修改正式表单。

### 6.6 全会话任务所有权

语音、朗读、图片预检和 OCR 共用一个任务登记器，而不是各自维护可能碰撞的数字代次：

```ts
type ElderTaskKind = 'speech' | 'tts' | 'image-preflight' | 'ocr';
interface ElderTaskToken { kind: ElderTaskKind; id: string; epoch: number }
interface ActiveTask { token: ElderTaskToken; release: () => Promise<void> }
```

- `beginTask(kind)` 首先禁止重复点击，调用并等待 `cancelActiveTask()` 完整释放旧任务；释放失败或超时则新任务不启动并手工降级。
- 任务 ID 使用当前会话内不可重复值，`epoch` 在切段、模式切换、加载重置和卸载时递增；每个进度/成功/失败回调都比较 `kind + id + epoch` 全 token。
- 语音和朗读明确互斥；OCR/预检与语音/朗读也互斥。手工输入无需占用任务，可在 OCR 等待期间继续操作，但一旦离开当前段就取消活动任务。
- `cancelActiveTask()`、`disposeAll()` 幂等；旧资源未确认释放前，不能创建新的 Worker、麦克风实例或朗读队列。
- 双击启动、OCR→语音、语音→OCR、朗读→语音以及旧回调晚到均为必测交错。

### 6.7 模式切换与退出

- 普通模式切到老人模式：复用同一个 `OrderForm`，不复制、不重置、不保存。
- 老人模式切回普通模式：先停止语音、朗读、预检与 OCR；如有未确认候选，显示“返回继续核对 / 放弃候选并退出”，只有用户明确放弃才清空候选。
- 已确认内容始终保留在 `OrderForm`；只清除会话状态和未确认候选。
- `visibilitychange(hidden)`、`pagehide`、组件卸载和路由离开都调用幂等 `disposeAll()`。
- 会话不增加 LocalStorage 键；刷新后回到普通模式，正式草稿仍由现有机制恢复。

### 6.8 页面加载就绪门

页面统一维护 `PageLoadState = 'loading' | 'ready' | 'error'` 与递增 `loadEpoch`：

- 新建页在检查复制来源/草稿并完成同步初始化后才进入 `ready`；详情页和带来源 ID 的复制页必须等远端数据成功后进入 `ready`。
- `useOrderForm()` 将现有“请求并立即改表单”拆为 `fetchOrderSnapshot(id)` 和 `commitOrderSnapshot(snapshot, epoch)`：前者只返回校验后的深克隆，不写响应式状态；页面只在响应 epoch 仍等于当前值时提交快照。
- 路由 ID 变化、重试、离页都会递增 epoch；旧响应即使晚到也只能被丢弃，不能修改表单或会话。
- `ready` 后才调用 `elderSession.initialize(snapshotVersion)` 并允许编辑/保存；`loading` 只显示加载状态；`error` 只允许重试或返回。
- 详情/复制加载失败时禁止携带原订单 ID 调用保存，避免默认表单覆盖原单。加载成功前所有普通与老人保存入口都经过页面统一保存门并被拒绝。

## 7. 正式写入与日期一致性

### 7.1 通用已确认写入

`useOrderForm()` 新增 `applyConfirmedElderPatch(patch)`：

- 运行时再次校验路径白名单、精确数据结构和 §6.4 的硬上限；
- 普通文本执行 NFKC、去首尾空白和明确候选字段上限，不做简繁/异体替换；
- 名单深克隆并保证至少一排一列；
- 模板/OCR/语音均不能传入 `user`、`remark`；
- 日期字段不能走通用 patch，必须走专用原子日期接口。

### 7.2 日期选择协议

```ts
type ParentDateChoice =
  | { precision: 'full'; calendar: 'gregorian'; year: string; month: string; day: string }
  | { precision: 'year'; year: string }
  | { precision: 'unknown' };

type ErectDateChoice =
  | { mode: 'qingming'; year: string }
  | { mode: 'gregorian'; year: string; month: string; day: string }
  | { mode: 'lunar'; year: string; month: string; day: string };
```

`setParentDateChoice(target, choice)` 与 `setErectDateChoice(choice)` 是老人模式唯一日期写入口。`ParentDateChoice.calendar='gregorian'` 仅是现有 `YYYY-MM-DD` 完整日期格式的内部类型，不对应一个用户确认动作。手工选择完整日期时直接按年月日写入；详情或草稿加载的完整父母日期沿用原值，不建立 `untyped-legacy` 会话状态，也不要求在总确认前重新声明历法。语音/OCR 日期仍先停在候选层，用户选择“采用完整日期 / 只保留年份 / 不知道”后才写入。

父母日期不新增持久化历法字段，也不增加老人模式专属的公历保存门。完整日期继续执行现有真实月份/闰年与生卒顺序质检，`SavePayload` 和历史订单契约不变化。

两个接口先在局部变量中完成规范化和校验，全部通过后在同一同步调用内同时更新：

- 父母 `form.*.birth/death` 与对应文本引用；
- 立碑 `dateQingming`、`dateShowLunar`、`form.libei`、`libeiDate`、`qingmingYear`、`lastCustomLibei`。

映射规则：

- `full`：保存补零后的年月日，引用显示完整日期。
- `year`：只保存年份，月日为空，质检不报“日期不完整”。
- `unknown`：三项全空，确认页显示“未填写”。
- `qingming`：`dateQingming=true`、`dateShowLunar=false`、`libei=[year,'','']`。
- `gregorian`：`dateQingming=false`、`dateShowLunar=false`，按真实公历校验。
- `lunar`：`dateQingming=false`、`dateShowLunar=true`，只校验月 1～12、日 1～30，不换算。

当前两页中会直接改 `dateQingming/dateShowLunar/libei/lastCustomLibei` 的 watcher 必须删除。其行为收敛为 `useOrderForm()` 内的 `selectQingmingDate()`、`selectCustomErectDate(calendar)` 和上述原子写入，普通模式与老人模式都调用同一控制器，页面 watcher 不再写关联字段。

确认日期后立即以及 `await nextTick()` 后分别调用 `buildSavePayload()`，都必须证明屏幕文本、日期引用、`OrderForm` 和载荷一致；测试覆盖清明→公历→农历→清明和历史自定义值恢复。`syncDatesToForm()` 保留给普通文本输入兼容，但统一控制器先同步引用，不能回写旧值。

### 7.3 日期质检

- 父母完整日期和公历立碑日期使用完整闰年规则：400 整除为闰年，100 整除非闰年，其余 4 整除为闰年；历史父母完整日期不增加历法声明门禁。
- 月或日单独缺失为 `DATE_INCOMPLETE`；只有年份视为合法精度。
- 非法公历、非法农历边界、清明年份非法均提示“发生了什么、如何修改”。
- 两个日期都有完整值时按完整日期比较；只有年份时仅在出生年大于去世年时提示倒置；混合精度仅在年份已经确定倒置时提示，不静默补值。

## 8. 语音输入设计

### 8.1 启用条件

只在以下条件全部满足时展示可启动的“开始说话”：

1. 存在 `SpeechRecognition` 或 `webkitSpeechRecognition` 构造器；
2. 实例原型支持 `processLocally`；
3. 构造器支持 `available()`，用 `{ langs: ['zh-CN'], processLocally: true }` 查询；
4. 返回 `available`，或返回 `downloadable` 后用户对语言包下载单独同意、`install()` 成功并重新查询为 `available`；
5. 当前识别由用户主动点击启动，且实例显式设置 `lang='zh-CN'`、`processLocally=true`。

`unavailable`、`downloading` 长时间未完成、API 缺失、异常或不确定全部按“不支持应用内语音”处理。不得退回可能联网的普通 Web Speech。系统输入法听写只能以免责声明提示，不能标记为本应用端侧能力。

参考接口：MDN 的 [`SpeechRecognition.processLocally`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally)、[`SpeechRecognition.available()`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/available_static) 与 [`SpeechRecognition.install()`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/install_static)。这些接口仍属实验能力，所以设计采用失败关闭。

### 8.2 权限与生命周期

- 第一次点击前展示语音独立说明；拒绝后不调用 `install()`、不构造识别实例、不申请麦克风。
- 语言包下载同意与麦克风/识别总同意分开记录，均只保存在当前页面内存。
- `interimResults=true` 只用于屏幕临时展示，`continuous=false`，最终结果仍是候选。
- 启动前必须通过 §6.6 的 `beginTask('speech')` 取得完整 token；停止、切段或退出后，旧回调即使晚到也因 token 不匹配被忽略。
- `stop()`/`abort()`/事件解绑都收敛到该活动任务的幂等 `release()`；任何退出路径不留活动麦克风。
- 不记录浏览器原始异常文本，仅映射为固定安全码，例如 `SPEECH_UNSUPPORTED`、`LANG_PACK_DECLINED`、`MIC_DENIED`、`NO_SPEECH`、`SPEECH_TIMEOUT`。

## 9. 朗读设计

- 探测 `speechSynthesis` 与可用 `zh-CN`/中文 voice；没有合适 voice 时禁用并提示手工核对。
- 朗读文本由当前屏幕的正式已确认显示模型生成，禁止读取未确认候选或隐藏字段。
- 一次只朗读当前段，调用前先 `cancel()`；不自动接续下一段。
- 停止、切段、切模式、页面隐藏、`pagehide` 和卸载都执行 `cancel()` 并清理监听。
- 朗读必须由用户按钮触发，不在加载、聚焦或步骤切换时自动开始。

## 10. 图片与 OCR 设计

### 10.1 独立同意与文件入口

- 用户先点击“OCR 识别碑文照片”，看到本机处理、不上传、不持久化、不记日志、退出释放和取消方式。
- 只有点击“同意继续”后才程序触发隐藏的文件输入；拒绝不打开系统选择器。
- 固定为两个独立按钮和两个独立 input：相册 input 使用 `accept="image/jpeg,image/png,image/webp"` 且不带 `capture`；拍照 input 使用同一 `accept` 并带 `capture="environment"`。两者在选择后进入同一个预检函数。拍照提示不生效不算错误，用户仍可使用独立相册入口。

### 10.2 失败关闭的图片预检

预检 Worker 接收文件切片/ArrayBuffer，不接收业务表单：

1. 先检查文件声明 MIME 与 15 MiB 上限。
2. 读取头部魔数、尺寸和动画结构：PNG 读取 IHDR 并有界扫描首个 IDAT 前的 chunk，出现 `acTL` 即拒绝 APNG；JPEG 遍历段直到合法 SOF；WebP 分别处理 VP8/VP8L/VP8X，有动画位或 `ANIM/ANMF` chunk 即拒绝动画 WebP。chunk 长度溢出、截断或扫描预算超限一律拒绝。
3. MIME 与魔数必须同时匹配；只接受单帧静态图片，拒绝 SVG、GIF、HEIC、APNG、动画 WebP、未知、截断和损坏文件。
4. 宽高均不得超过 8000 px，总像素不得超过 2400 万。
5. 只有头部校验通过后，才允许在支持 `createImageBitmap` 与可控画布的 Worker 路径完整解码；解码尺寸再次比对头部，随后立即等比缩放到长边不超过 2400 px。
6. 所需非阻塞解码/缩放原语不可用、尺寸不一致、内存失败或超时，直接拒绝并手填降级；不改用未经保护的主线程大位图解码。

每个任务持有明确资源登记表：预检 Worker、OCR Worker、ArrayBuffer、ImageBitmap、OffscreenCanvas、Blob/Object URL。所有终态均走同一 `disposeJob()`，逐项关闭、终止、撤销并清空引用；释放可以重复调用。

### 10.3 OCR 运行时

- `tesseract.js` 只在用户通过同意、选图、预检后动态导入。
- 采用精确版本 `tesseract.js@7.0.0`，同源自托管匹配的 Worker、全部 core 变体以及 `chi_sim@1.0.0`、`chi_sim_vert@1.0.0` 模型；实现前核对包内许可证和文件哈希。
- `workerPath`、`corePath`、`langPath` 都解析成当前站点同源 URL，并在运行时再次比较 `origin`；任何跨源或版本不匹配直接失败。
- `corePath` 指向包含全部匹配 core 变体的目录，让运行库按 SIMD/LSTM 能力选择，不硬绑某一个 core 文件。
- 使用 `cacheMethod: 'none'`，防止模型进入 IndexedDB；不注册 Service Worker 缓存。普通 HTTP 浏览器缓存仅承载同源静态模型，并在评估冷启动前按协议清除。
- 创建 Worker 时同时请求 `chi_sim+chi_sim_vert`；是否因双模型影响性能由冻结评估决定，不在评估后暗改。
- `recognize()` 显式请求结构化输出，以最小可用 OCR 单元的真实置信度映射字段；没有可映射置信度则整字段待核对。
- 加载、初始化、预处理、识别均可取消且受 §6.6 的完整任务 token 隔离；完成、失败、超时、取消、切段/模式、页面隐藏/离开后都终止 Worker，不复用跨任务 Worker。
- OCR 库可能以空结果而非异常表示未识别到文字，空结果统一进入 `OCR_EMPTY` 并手填降级。

版本和本地安装依据：Tesseract.js [v7.0.0 官方发布](https://github.com/naptha/tesseract.js/releases/tag/v7.0.0)、[本地资源安装说明](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md)和[官方 API 文档](https://github.com/naptha/tesseract.js/blob/master/docs/api.md)。

### 10.4 发布策略

```ts
type OcrReleaseMode = 'disabled' | 'evaluation' | 'trial' | 'official';
```

- 生产默认 `disabled`：不渲染 OCR 入口，不下载 OCR 资源。
- 受控评估构建为 `evaluation`：仅供 04 测试，不能由公开查询参数、LocalStorage 或浏览器控制台开关绕过。
- 评估唯一结果为“下线”时保持 `disabled`；为“试用”时发布 `trial`，所有候选整段待核对；为“正式辅助入口”时发布 `official`，仍必须逐字段确认。
- 状态是源码/构建时常量，变更需要新的评估结果 manifest 哈希、代码审核和完整回归，不能从远端不受审配置动态开启。

## 11. OCR 评估与证据设计

### 11.1 受控目录边界

评估 CLI 只接受显式环境变量 `STELE_OCR_EVIDENCE_ROOT`，无默认值。启动时必须：

- 将路径解析为绝对真实路径；
- 拒绝仓库目录、仓库父/子路径、符号链接/Junction 指向仓库、网络公开目录；
- 拒绝把真实路径、图片名、真值或授权人信息写入控制台和流程文档；
- 只输出随机样本编号、证据 ID、聚合指标与固定错误码。

原图、真值、图片/真值哈希、逐样本结果、授权台账和证明只存在受控目录。Git 只保存 schema、纯计算代码、非敏感协议版本、应用/模型哈希、聚合结论和销毁回查。

### 11.2 冻结与计算

评估 manifest 为写一次文件，包含需求 FR-04 列出的全部冻结项和 S1～S7 预期证据路径；结果写入新文件，引用评估 manifest SHA-256，不回写原文件。

纯函数计算器必须覆盖：

- NFKC + 移除 Unicode 空白的唯一规范化；
- CER 与 `max(0,1-CER)`；
- 姓名、日期字段完全匹配；
- `<80` 及无映射置信度的待核对；
- 错误暴露召回率和误标率的空分母规则；
- `device_nonempty` 和三设备严格 AND 的 `sample_nonempty`，缺失为 `false`；
- cold-start nearest-rank P95，超时/崩溃/批次中取消为 40001 ms；
- “先下线、再正式、否则试用”的短路唯一判定。

计算代码以输入 manifest 和结果记录为纯数据，不读取浏览器状态，不允许手工覆盖派生值。04 由未参与首次计算的人使用同一冻结输入独立复算。

### 11.3 当前技术验证结论

本阶段没有合法样本管理员、20 张冻结样本、受控证据目录及三台指定真实设备，不能伪造 20 秒实测或发布结论。按需求“未达标则不作为首版承诺能力”和缺失项优先下线规则，02 的保守结论是：

- OCR 生产状态固定 `disabled`；
- 03 可以实现评估所需的受控、不可公开绕过代码，但不得宣称 OCR 可用；
- 只有 04 完成完整冻结批次并独立复算，才能变更为 `trial` 或 `official`；
- 无论 OCR 结论如何，大字手工核心、日期、模板、朗读与总确认继续验收。

## 12. 隐私、安全与诊断

### 12.1 同意记录

语音总同意、语言包下载同意和 OCR 同意是三个独立的页面会话布尔状态，不写 LocalStorage。刷新或重新进入页面需要再次说明。拒绝只关闭相应增强能力，不影响正式表单。

### 12.2 诊断白名单

诊断只允许固定结构：

```ts
interface ElderDiagnosticEvent {
  at: number;
  module: ElderDiagnosticModule;
  code: ElderDiagnosticCode;
  stage: ElderDiagnosticStage;
  durationMs?: number;
}
```

- `module`、`code`、`stage` 都是源码枚举；`durationMs` 只接受非负有限数并设上限。
- 禁止 `message`、`stack`、文件名、URL 查询、路径、浏览器原始异常、输入值或任意上下文字段。
- 安全错误先映射固定码再记录；开发控制台也不得直接输出原始 OCR/语音内容或文件对象。

### 12.3 网络与存储验证

- 运行时网络允许现有订单接口，以及 OCR 触发后的同源静态 Worker/core/model；语音识别期间不得有第三方音频/文本请求。
- OCR 前后扫描 LocalStorage、IndexedDB、Cache Storage、草稿、模板和应用诊断，确认无图片、OCR 原文、候选和置信度。
- 静态扫描生产产物中的密钥模式、第三方 OCR/语音域名和非同源资源引用。
- 资源计数在每个退出路径前后比较活动 Worker、Object URL、语音实例和朗读队列。

## 13. 无障碍与视觉交互

- 共享面板为单列，正文默认至少 20 CSS px，关键确认值至少 24 CSS px，主要触控目标至少 48×48 CSS px。
- 步骤标题获得程序化焦点；状态变化使用可见文字、图标和 `aria-live`，不只靠颜色。
- 320 CSS px 和 200% 字体缩放下允许纵向重排；除现有碑文预览外不得产生横向业务操作区。
- 名单增删、上移、下移均有按钮；拖拽可以保留，但不能是唯一方式。
- 对比度最低按 WCAG 2.2 AA：普通文本 4.5:1，大文本 3:1。
- 错误文案统一包含“问题 + 当前位置 + 下一步”，保存结果在面板内持续显示，不能只依赖 Toast。

## 14. 页面接线与保存协议

页面是表单、老人会话和保存的唯一组合根。页面在 `setup` 中创建一次 `useOrderForm()`，用 `readonly(form)` 和命令方法构造适配器，再创建一次老人会话；`ElderEntryPanel` 不调用 `useOrderForm()`、`buildSavePayload()` 或 `doSave()`：

```ts
interface ElderOrderFormAdapter {
  form: DeepReadonly<OrderForm>;
  dateDisplay: DeepReadonly<ElderDateDisplayRefs>;
  buildPreview(): PreviewData;
  applyConfirmedFields(patch: ConfirmedElderPatch): void;
  setParentDateChoice(target: ParentDateTarget, choice: ParentDateChoice): void;
  setErectDateChoice(choice: ErectDateChoice): void;
}

interface ElderEntryPanelProps {
  mode: 'create' | 'edit';
  loadState: PageLoadState;
  orderAdapter: ElderOrderFormAdapter;
  elderSession: ElderSessionController;
  saving: boolean;
  saveFeedback: { state: 'idle' | 'success' | 'error'; message: string };
}

interface ElderEntryPanelEmits {
  save: [];
  exit: [];
}
```

页面现有保存函数拆成私有 `performSave()` 与唯一公开入口 `requestSave(source: 'normal' | 'elder')`。普通和老人界面的所有保存按钮都只能调用 `requestSave()`；老人模式开启时隐藏普通保存按钮，并且页面无论收到哪个 `source` 都再次执行 `elderSession.assertSavable()`，防止事件或快捷路径绕过。通过后，新建页继续执行原 `onSubmit` 的保存主体，详情页继续执行原 `onSave` 的保存主体；已有防重入、客户标识、质检确认和云函数调用顺序不变。

`requestSave()` 的固定顺序是：`loadState==='ready'` → 当前无保存进行中 → 老人模式必须位于总确认且没有未处理候选（普通模式跳过）→ 现有质量检查 → 用户对 warning 的现有确认 → `buildSavePayload()` → 原 `doSave()`。任何一步失败都不调用后续步骤。成功或失败后，页面把稳定的 `saveFeedback` 回传为大字消息和明确重试动作。

老人模式保存前额外门禁检查：

- 是否存在未处理候选；
- 是否位于总确认步骤；
- 页面来源数据是否已成功加载且本会话绑定的是最新 `snapshotVersion`；
- 现有质量检查结果。

它不改造 `SavePayload`。普通模式不会受到步骤核对状态限制，但同样必须通过加载就绪、防重入和现有质检门。

## 15. 依赖与构建

03 计划精确锁定：

- 运行依赖 `tesseract.js: 7.0.0`；
- 资源复制/核验依赖 `tesseract.js-core: 7.0.0`；
- 中文模型资产 `@tesseract.js-data/chi_sim: 1.0.0`、`@tesseract.js-data/chi_sim_vert: 1.0.0`；
- SFC 静态编译检查 `@vue/compiler-sfc: 3.5.32`，与当前 Vue 3.5.32 对齐。

新增依赖前先用国内 npm 镜像安装并检查许可证、包内容和 lockfile；只提交从锁定包复制且哈希匹配的必要静态资源与许可证。不引入服务端 SDK、云识别 SDK、状态管理库或通用测试框架。

计划新增真实脚本（当前不存在，03 才写入）：

```text
npm run test:elder-entry
npm run test:stele-regressions
npm run test:elder-entry-sfc
npm run test:ocr-evaluation
```

底层使用 Node 24 的 `--experimental-strip-types` 执行纯 TypeScript 模块，以及 `@vue/compiler-sfc` 编译 SFC。构建命令仍以项目实际可用的 HBuilderX/UniApp 工具链为准；未实际运行不得声称通过。

## 16. 复杂度、设计权衡与实现顺序

### 16.1 复杂度评估

| 子项 | 复杂度 | 原因 |
|---|---|---|
| 大字分段与两页复用 | 中 | 交互多但数据契约稳定 |
| 候选隔离与异步代次 | 高 | 需防跨段晚回调、误写和资源泄漏 |
| 日期原子同步 | 中 | 要兼容现有双状态和普通模式 |
| 端侧语音 | 高 | 实验 API、权限和语言包状态复杂，必须失败关闭 |
| 图片预检与 OCR | 高 | 文件安全、内存、Worker、模型与跨设备性能风险 |
| OCR 评估治理 | 高 | 涉及授权、证据、可复算指标和销毁规则 |
| 保存契约回归 | 中 | 两页路径不同，但共用 composable |

### 16.2 关键取舍

- 不重构全部日期为新的单一事实源：这会扩大普通模式风险；选择新增原子写入口，保持最小兼容改动。
- 不让共享面板直接保存：页面继续拥有创建/编辑语义，避免复制订单 ID、客户标识和防重入逻辑。
- 不缓存 OCR Worker/模型到应用存储：牺牲重复识别速度，换取隐私、释放和冷启动指标可解释性。
- 不根据浏览器名称启用能力：只依据实际 API 与运行时结果，避免错误承诺。
- 不因缺少 OCR 证据拖延核心模式：初始生产关闭 OCR，其余能力独立交付。

### 16.3 TDD 与实施顺序

03 每项先写失败测试（RED），再写最小实现（GREEN），再只做必要整理：

1. 候选解析克隆隔离、白名单、三层硬限额、`user/remark` 永不覆盖。
2. 页面只创建一个权威表单实例；普通/老人按钮都不能绕过唯一 `requestSave()`。
3. 加载门：延迟响应、失败、路由 ID 变化和旧响应晚到都不能覆盖已就绪的新快照，也不能以默认值保存原 ID。
4. 全会话任务所有权：停止/切段后晚回调，以及 OCR→语音、语音→OCR、朗读→语音、快速双击不能写候选或遗留资源。
5. `disposeAll()`/`disposeJob()` 多次调用仍完整释放且不抛错。
6. 日期原子写入后立即和 `nextTick` 后，屏幕引用、表单和载荷都一致；现有直接写日期 watcher 已不存在。
7. 父母完整日期沿用现有格式和严格日期校验；历史完整日期可直接进入总确认，不增加历法声明门禁。
8. 公历闰年、年份精度、农历边界和混合精度生卒比较。
9. 三设备 `T/T/T=true`、`T/F/T=false`、`T/missing/T=false`，以及空白/标点/映射失败/超时的非空规则。
10. 下线优先、正式次之、否则试用的唯一发布判定；生产默认关闭且不能被查询参数绕过。
11. 两页 SFC 接线、模式往返、模板候选、普通保存回归。
12. 图片魔数/尺寸/动画边界、拒绝早于正式解码、相册与拍照独立入口、每个终态资源归零。
13. 权限拒绝路径不触发系统 API，诊断结构不能接受业务文本。

## 17. 验收自测设计

| ID | AC / 场景类型 | 前置条件与数据 | 执行步骤 | 可判定预期 | 证据与清理 |
|---|---|---|---|---|---|
| T01 | AC-01 正常/回归：新建页模式往返 | 新建页填入父母、四组日期、横批、立碑日期、2 条名单、客户标识和备注；保存调用计数器为 0 | 记录 `OrderForm` 快照；普通→老人→普通往返 3 次，每次进入七步并返回 | 每次 UI 与初始快照逐字段一致；名单顺序不变；未产生保存调用；页面只有一个 `useOrderForm()` 权威实例 | 前后快照、页面截图、集成测试输出；清草稿，不创建订单 |
| T02 | AC-01 正常/回归：详情页加载后往返 | 可只读加载的固定详情快照，禁止真实写单 | 等加载状态为 ready 后按 T01 往返 3 次，并触发一次路由 ID 旧响应晚到模拟 | 已加载字段和当前快照不丢失、不重复；旧响应不覆盖新快照；未产生保存调用或第二表单实例 | 加载/快照断言和截图；不修改远端订单 |
| T03 | AC-02/11 边界/无障碍：320 CSS px 七步、名单预览与详情滚动 | 最终 H5 构建；视口宽 320 CSS px、高度不少于 568 CSS px；新建页和含长日期/名单的详情页各一组 | 两页分别从类型到总确认走完 7 步，不点击任何步骤确认；在名单步逐个修改称谓、姓名、排数和同排顺序并观察小字预览；检查 `scrollWidth <= clientWidth`、详情老人面板纵向滚动容器与页脚可达 | 步骤可直接前后切换；名单预览随每次编辑同步变化，文字、顺序与分行和同一时刻 `buildPreview().small` 及最终 `WordPreview` 一致；两页除碑文预览外均无横向业务操作区；长详情完整可纵向到达且不受根 `overflow` 裁切；名单不依赖拖拽 | 两页尺寸探针、小字值与最终组件比对、滚动容器属性与逐步截图；恢复视口并清表单 |
| T04 | AC-02 边界/无障碍：200% 字体、视觉语义与触控目标 | 新建/详情两页各执行；代表桌面浏览器 200% 页面缩放；真机系统字体 200% 仅在有设备时执行 | 走完 7 步；读取正文/确认值字号、主要按钮边界和文本/背景对比度；触发步骤、成功、错误、停止失败状态并检查文字/图标冗余、步骤标题焦点和 `aria-live` | 正文至少 20 CSS px、关键确认值至少 24 CSS px；主要按钮宽高至少 48 CSS px；普通/大文本对比度分别至少 4.5:1/3:1；状态不只靠颜色；步骤切换焦点可判定、动态状态可播报；两页无需双向滚动 | 两页 DOM 样式/边界/焦点/可访问树清单和截图；恢复缩放。无真机时必须记“未执行 + 设备缺失”，不得填通过 |
| T05 | AC-03 正常/隐私：可证明端侧语音 | 支持 `available/install/processLocally` 且 `zh-CN` 本地包可用的代表设备；已打开网络抓包 | 阅读并同意告知后主动点语音；检查实例 `processLocally=true`；说当前段内容；确认前后比对表单；停止并离页 | 同意前不申请麦克风；有明确收音状态；第三方音频/识别请求为 0；结果只进当前候选；确认前表单不变；停止/离页后麦克风释放 | 实例属性、HAR、表单快照、资源计数；停止语音并按设备策略处理语言包。缺该设备时记未执行，不得推断通过 |
| T06 | AC-03 权限安全/降级：无法证明端侧处理 | 依次模拟 API 缺失、`available()` 抛错/不确定、实例无 `processLocally` | 进入老人模式并尝试找到或触发应用内语音 | 不出现可启动按钮或启动被失败关闭；不申请麦克风、不创建识别实例；手填仍可用 | 系统 API 调用计数、UI 截图；恢复适配器 |
| T07 | AC-04 异常：语音 API 不支持 | `SpeechRecognition` 不存在 | 进入当前步骤，尝试语音后手填并进入下一步 | 持久提示说明“不支持 + 当前步骤 + 手填下一步”；表单原值不变；手填可走到保存门 | 固定错误码/文案、表单快照；恢复适配器 |
| T08 | AC-04 权限：拒绝麦克风 | 端侧能力可证明；模拟权限拒绝 | 同意页面告知后点击语音并拒绝系统权限，再手填 | 显示拒绝原因和手填入口；不产生候选；既有确认值不变；手填流程可完成 | API 调用计数、截图；重置权限模拟 |
| T09 | AC-04 异常：断网但本地识别可用 | `zh-CN` 本地包已安装；适配器固定返回端侧成功；断网模拟 | 断网后启动端侧语音并说当前段内容，确认候选前后比对表单 | 仍得到本地候选；第三方音频/识别请求为 0；确认前表单不变，不发生远端回退 | 网络记录、候选/表单快照；恢复网络 |
| T10 | AC-04 边界：无语音结果 | 识别实例返回 no-speech/onend，无结果 | 启动后保持静音直至结束，再手填 | 收音状态收敛；显示无语音原因；候选为空、表单不变；可继续手填 | 适配器事件记录、资源计数；停止实例 |
| T11 | AC-04 超时/重试：识别或释放超时 | 可控 deferred 识别/释放适配器 | 触发超时；在释放未确认时连续点语音/朗读/切段；再点“重试停止” | 旧 token 立即失效；普通操作持续被锁；没有晚候选或未处理拒绝；专用重试成功后才能恢复 | 核心并发测试、UI 状态截图；完成专用释放 |
| T12 | AC-05 发布门禁/权限安全：当前生产 OCR 关闭 | 最终生产构建，发布常量为 `disabled`；无合法三设备与冻结样本 | 检查新建/详情页面、查询参数、LocalStorage 和控制台是否能出现或开启 OCR 文件入口 | 无可触发 OCR 的相册/拍照入口；任何非审计开关都不能启用；手填核心不受影响 | 生产包静态扫描和浏览器截图；无样本、无临时对象需清理 |
| T13 | AC-05 正常/边界：图片头预检纯函数 | 最小/最大边界内静态 JPEG、PNG、WebP；MIME 与魔数一致 | 分别读取头部，验证尺寸/像素/大小边界和静态标记 | 三种格式在边界内通过；不进行网络上传；结果只含必要元数据 | `test:image-preflight` 输出；释放 ArrayBuffer |
| T14 | AC-05 安全/边界：危险与超限图片早拒绝 | `15MiB+1`、单边 `8001`、`24000001` 像素、SVG/GIF/HEIC/APNG/动画 WebP/未知/魔数错/损坏夹具 | 逐个调用预检并记录是否进入正式位图解码/Worker | 每项在大位图解码前以固定原因拒绝；表单、候选、存储均不变 | 预检测试与解码调用计数；删除非敏感夹具 |
| T15 | AC-05 异常/资源：取消、失败、离页 | 可控 Worker/Object URL/缓冲计数器；仅评估构建适用 | 分别在文件选择取消、预检失败、识别失败和页面离开时终止 | Worker、Object URL、缓冲和任务计数全部归零；无上传/持久化；已确认表单不变 | 资源计数、存储/网络扫描；释放全部对象。生产 OCR 关闭时只执行资源纯函数证据并标 UI 路径不适用 |
| T16 | AC-06 数据/复算：冻结样本批次 | 已指定样本管理员；受控目录外置且通过路径校验；20+ 授权样本、姓名/日期有效字段各 20+；冻结构建/模型/阈值/设备清单 | 生成写一次评估 manifest；三设备逐样本执行；由另一人员用同一冻结输入复算全部指标 | 样本分层、字段下限和 manifest 字段完整；结果引用 manifest SHA-256；逐样本 evidence_id 与聚合哈希一致 | 受控 manifest、复算签记；按 T43/T44 期限销毁。前置缺任一项时不得执行，转 T19 |
| T17 | AC-06 边界/一致性：三设备非空矩阵 | 固定 `T/T/T`、`T/F/T`、`T/缺失/T`，以及空白、仅标点、目标字段空、映射失败、超时/崩溃记录 | 运行纯函数派生 `device_nonempty`/`sample_nonempty` | 仅 `T/T/T=true`；其余均 false；超时/崩溃按 40001ms 和非空 false 处理，缺值不被默认成 true | 核心测试/评估脚本输出；无业务数据 |
| T18 | AC-06 边界/发布：短路判定 | 固定四组指标：安全失败、必需指标缺失、全部正式门槛通过、未下线但正式门槛未全过 | 逐组执行发布判定并核对生产入口 | 唯一得到 `disabled/disabled/official/trial`；先下线、再正式、否则试用；入口与判定一致 | 判定测试输出；恢复生产固定 `disabled` |
| T19 | AC-06/12/13/16 失败关闭：评估前置缺失 | 当前无三台真机、冻结样本、管理员或独立复算证据中的任一项 | 构建生产包并检查发布常量/入口 | 发布必须为 `disabled`，报告逐项列缺失，不生成虚假 manifest/evidence_id，不影响手填老人模式 | 生产包哈希、静态扫描、缺口清单；无敏感样本 |
| T20 | AC-07 正常/权限安全：低或无置信度候选 | 低置信度、有文本无字符置信度、空字段三组结果 | 生成候选；检查表单/草稿/模板/载荷；分别手改、确认和丢弃 | 低/无置信度可见“待核对”；空字段不生成有效写入；确认前四个正式目标均不变；手改/确认后标记消失且只改目标字段 | 候选/UI 快照；清候选和草稿 |
| T21 | AC-07 边界/原子性：硬限额与 Vue Proxy 克隆 | 文本、字段、名单数量分别准备 max、max+1，含 `user/remark` 注入；同一表单分别包装为 Vue `reactive`、`readonly` | 逐组生成日期状态/候选并尝试确认，前后逐字段比较 Proxy 源对象 | max 可生成候选；任一 max+1 整次拒绝；`user/remark` 永不进入候选；两类 Proxy 均不抛 `DataCloneError`，只输出白名单普通 DTO，源表单不变；失败不产生部分写入 | 核心测试输出和前后表单 diff；清候选 |
| T22 | AC-08 正常：逐项朗读与屏幕同源 | 支持中文 TTS；父亲姓名、生卒、横批、立碑、名单和总确认均有值 | 逐步骤点击朗读并截取传给 utterance 的文本 | 朗读输入与屏幕完整确认模型逐字一致；名单包含称谓和姓名，总确认包含四组日期 | 伪 TTS 调用记录/真机录屏；`speechSynthesis.cancel()` |
| T23 | AC-08 异常/幂等：停止、双击与不支持 | 可控 TTS；模拟快速双击、启动抛错、切段、切模式、离页及 API 不存在 | 对每种路径触发朗读和停止 | 不出现未处理拒绝；等价停止只释放一次；离页队列归零；不支持时给手填/阅读提示且不阻塞 | 核心并发测试、资源计数；清空队列 |
| T24 | AC-09 正常/回归：模板完整生命周期 | 创建只含允许字段的测试模板 | 在新建和详情页分别读取、预览、应用为候选、逐项采用候选、保存模板、删除模板 | 应用不直接写正式表单；采用后只改允许字段；保存/删除沿用现有本机模板语义 | 两页截图、模板存储 diff；删除测试模板 |
| T25 | AC-09 安全：模板敏感字段反例 | 模板输入植入客户标识、备注、照片/音频/OCR 原文/置信度 | 预览、应用并扫描落盘 schema | 敏感字段全部被白名单丢弃；不进入候选、表单和本机存储 | schema 扫描、表单 diff；删除测试模板 |
| T26 | AC-10 正常/一致性：日期六种模式 | 完整公历、仅年份、不知道、清明、公历自定义、农历自定义数据 | 新建/详情逐种选择；记录屏幕、日期 refs、`OrderForm`；立即与 `nextTick` 后调用 `buildSavePayload()` | 四份状态逐字段一致；保存载荷保持现有契约；模式往返不回写旧值 | 日期测试输出、两页快照；清测试日期 |
| T27 | AC-10 异常/边界：真实日期和先后顺序 | 闰年 2/29、平年 2/29、2/30、生卒倒置、历史完整日期、识别候选未采用 | 逐项输入并触发候选采用/保存门 | 合法闰日通过；非法完整日期和倒置被明确阻断；历史完整日期不要求额外公历核对；未采用的识别候选不得保存 | 固定错误、表单/载荷快照；恢复日期 |
| T28 | AC-10 原子性：识别日期候选到载荷 | 父母日期候选分别为完整合法公历、年份、不知道及非法日期 | 点击确认后立即和 `nextTick` 后调用 `buildSavePayload()` | 合法候选走唯一日期命令且四份状态一致；非法/不完整不改正式状态；保存前同步不覆盖确认值 | 核心测试和 payload diff；清候选/日期 |
| T29 | AC-11 异常/保存门：状态与质检 | 未处理候选、加载中、加载失败、旧 snapshot、非总确认页程序旁路、blocker、warning 未确认各一组；另设加载+旧快照+候选+非总览同时失败的表驱动组合 | 先用纯策略矩阵证明加载→快照→候选→总览的固定优先级；再从新建/详情页面源码执行真实 `requestSave()`，分别从老人和普通来源进入，注入质检、警告确认、载荷构建与 `doSave` 计数器 | 每组只在固定顺序处阻断；加载/会话门失败时质检调用数为 0，blocker 后警告调用数为 0，warning 取消后载荷与 `doSave` 调用数为 0；步骤未逐项确认和父母完整日期未声明公历不再构成门禁；页面有持久“问题+位置+下一步”提示 | 策略优先级矩阵、两页真实入口执行输出、各层调用计数、UI 截图；无订单产生 |
| T30 | AC-11 并发/幂等：连续成功保存与客户标识 | 所有门通过；保存适配器 deferred 后成功；新建页首次缺客户标识 | 连续快速点击保存；补客户标识确认；第一次有效保存等待中再次点击，随后完成 deferred | 客户标识弹窗只回写字段后重新走统一门；等待期间新增写调用为 0；全程仅一次订单写入；`saving` 收敛且成功结果在面板持久显示 | 保存调用时序/计数；只用伪适配器，不写真实订单 |
| T31 | AC-12 真机：Android Chrome 核心手工矩阵 | 代表 Android + Chrome 真机；最终候选包 | 完整执行 T01/T03/T04/T24/T26/T29 的手工核心，并记录语音/TTS/OCR能力 | 核心手工全部通过；增强能力逐项标 `可用/降级/不适用` 与真实原因 | 设备/浏览器版本、录屏、矩阵；清设备草稿。无设备时记未执行 |
| T32 | AC-12 真机：iOS Safari 核心手工矩阵 | 代表 iOS + Safari 真机；最终候选包 | 同 T31 | 同 T31，且不以 Android 结果代替 | 设备/浏览器版本、录屏、矩阵；清设备草稿。无设备时记未执行 |
| T33 | AC-12 真机：当前微信核心手工矩阵 | 当前微信内置浏览器真机；最终候选包 | 同 T31 | 同 T31，且不以系统浏览器结果代替 | 微信/系统版本、录屏、矩阵；清设备草稿。无设备时记未执行 |
| T34 | AC-13 安全/证据完整性：S1～S7 | 受控评估已按 T16 完成 | 读取结果 manifest，逐项解析 S1～S7 的布尔值和 evidence_id，并故意删除一个证据索引复算 | 完整时每项可访问且与结论一致；任一缺值/不可访问自动失败并使 OCR `disabled` | 非敏感聚合报告与索引检查；按期限删逐样本证据 |
| T35 | AC-13 安全/隐私：密钥、日志、网络、存储 | 最终生产包；浏览器 DevTools；若 OCR 评估构建可用则用授权非敏感夹具 | 扫生产包密钥/第三方域；执行语音/OCR路径后检查日志、HAR、LocalStorage/IndexedDB/Cache/草稿/模板 | 无前端第三方密钥；诊断无姓名、日期、名单、识别文本、媒体或可还原内容；语音无第三方识别请求；OCR 只允许同源静态资源且不持久化 | 扫描计数、脱敏 HAR/存储清单；删除网络文件和夹具。OCR 生产关闭时记录运行路径不适用及静态替代证据 |
| T36 | AC-13 安全/资源：全退出路径计数 | 语音、TTS、Worker/Object URL 的可控计数器 | 完成、失败、取消、超时、切段、切模式、隐藏、离页、重复停止各执行一次 | 每个终态资源归零或在释放失败时保持可见失败锁；失败锁仅专用重试可恢复；无晚回调写入 | 核心并发测试和计数表；完成所有专用释放 |
| T37 | AC-14 回归：普通模式业务路径 | 新建/详情固定本地数据；禁止真实写单 | 验证普通新建、详情加载、草稿保存/恢复/清除、模板、二维预览、质检；进入 3D 预览检查资源页面可达 | 普通行为与基线一致；老人步骤状态不限制普通模式；无新增字段要求 | 既有回归输出、页面截图；清草稿/模板，不写订单 |
| T38 | AC-14 契约回归：载荷/schema/云函数 | 基线与当前 `SavePayload`、订单 schema、三个云函数白名单；边界数据 | 生成新增/更新载荷并做字段集合/语义 diff；运行云函数静态/模拟回归 | 保存载荷和订单字段无新增、删除或语义变化；鉴权、白名单、大小边界和异常脱敏不回归 | `test-order-cloudfunctions`、payload/schema diff；无远端数据 |
| T39 | AC-15 权限/隐私：语音总同意与拒绝 | 首次进入页面的新会话；麦克风调用计数器 | 展示语音告知；分别同意后启动、拒绝后继续手填 | 系统权限前完整展示用途、端侧、可选下载、不保留、取消；拒绝时麦克风/识别调用数为 0，表单不变 | 文案截图和调用计数；重置会话模拟 |
| T40 | AC-15 权限/网络：语言包与输入法免责声明 | 设备支持端侧语音但缺 `zh-CN` 包；下载/麦克风计数器 | 分别单独同意下载与拒绝下载；查看输入法听写说明 | 只有单独同意才请求语言包；拒绝时下载、麦克风、识别均为 0且可手填；输入法明确厂商负责且可能联网，不沿用应用端侧承诺 | 请求计数、文案截图；按设备策略清语言包状态 |
| T41 | AC-15 权限/隐私：OCR 独立告知 | OCR 评估构建或告知组件适配器；与语音会话同页 | 在文件选择前分别同意/拒绝 OCR，并验证语音同意不替代 OCR 同意 | 独立展示用途、本机处理、不上传/持久化/日志、退出释放和取消；拒绝时文件选择/Worker 调用数为 0，表单可手填 | 文案与调用计数；清会话。生产 OCR `disabled` 时入口测试不适用，但独立同意状态纯函数仍需验证 |
| T42 | AC-16 安全/数据治理：管理员、授权、EXIF 与路径 | 有/无样本管理员两组；授权台账；含 EXIF/无关个人信息的受控夹具；仓库内/外路径 | 无管理员时尝试征集；有管理员时校验 authorization_id、去 EXIF/遮挡，再分别把仓库、父子目录、链接/Junction、公开网络目录和合规外置目录传给评估 CLI | 无管理员被阻止；每样本授权有效；进入受控目录前已脱敏；危险路径全部拒绝，只有合规真实外置目录可用；控制台不输出路径/身份/真值 | 台账角色与固定错误码、路径测试；删除夹具。无管理员时不得创建真实样本 |
| T43 | AC-16 一致性/清理：独立复算与 7 天销毁 | T16 完成；独立复算人员；可注入时间 | 独立复算并签记；推进至 7 天期限，执行精确销毁并回查 | 复算一致后才可保留结论；原图、真值、图片/真值哈希、逐样本结果均不存在；长期档案只留允许的非敏感字段 | 复算签记与删除状态；回查受控路径。未执行 T16 时标不适用，不制造数据 |
| T44 | AC-16 权限/清理：撤回和 180 天期限 | 一条可撤回授权和可注入时间的非敏感治理夹具 | 模拟授权撤回、24 小时和 180 天+7 天边界 | 1 个工作日内停用、24 小时内删样本并使结果失效；台账/证明/撤回记录到期后 7 天内删除；其他样本不受影响 | 状态转换与定向删除回查；删除治理夹具 |
| T45 | AC-04 异常：断网且端侧执行失败 | 断网；适配器固定在端侧启动/执行阶段返回失败；远端回退调用计数器为 0 | 启动语音，观察失败后手填并进入下一步 | 显示固定错误、当前位置和手填入口；表单原数据不变；远端调用数始终为 0；手填可继续 | 固定错误码、调用计数、表单快照；恢复网络/适配器 |
| T46 | AC-05 条件正常：相册与拍照合规图片 UI | 仅 `evaluation/trial/official` 构建且 T16/T34 门禁已满足时适用；相册与 `capture="environment"` 各一张授权合规图 | 两入口分别执行：先检查独立告知并同意，再打开选择器；通过同一预检链，观察 OCR 资源懒加载、候选与确认 | 同意前文件选择/Worker 调用为 0；两入口走同一安全链；OCR 仅触发后加载；结果只进候选，确认前表单不变；完成/取消后资源归零 | 两 input 属性、加载/候选/资源计数、UI 录屏；释放对象并按治理期限删样本。生产 `disabled` 时明确不适用，绝不记通过 |
| T47 | AC-04/08/13 异常：release/abort 同步抛错与异步拒绝 | 两组资源夹具：release/abort 同步 throw、返回 rejected Promise；记录 release 次数、token、`listening/stopping/releaseFailed` | 启动语音后分别触发停止；失败后尝试普通停止、切段和退出 | 释放仅调用 1 次；旧 token 立即无效；普通操作不得隐式重试；UI 保留监听/老人模式并显示停止失败和专用重试；无未处理 Promise | 核心故障注入输出、UI 状态和资源计数；最后用专用重试释放 |
| T48 | AC-04/13 并发/幂等：停止交错共享释放 | deferred release；记录调用次数和每个 Promise 结果 | 分别执行两个并发 `invalidate()`，以及 `complete()+invalidate()`；释放等待中调用 `begin()` | 每组只调用一次 release；等价停止共享同一释放结果；释放中 `begin()` 固定拒绝；成功后资源归零且可启动新任务 | Promise 时序、release 次数、token/资源状态；完成 deferred |
| T49 | AC-04/08/13 失败锁/晚回调：TTS 与专用恢复 | 先制造语音释放失败锁；排队一条旧语音晚回调；监听未处理拒绝；记录候选和 release 次数 | 失败锁期间调用普通 `invalidate/disposeAll`、`begin('tts')` 并触发晚回调；随后只点“重试停止”，成功后再启动 TTS | 普通停止不增加 release 次数；TTS begin 拒绝被会话内部消费；晚回调不写候选；只有专用重试成功才清 `releaseFailed/listening` 并允许 TTS | 核心运行时测试、候选 diff、UI 状态/release 次数；专用释放并清 TTS 队列 |
| T50 | AC-11 异常/重试：保存 reject 后成功 | 所有门通过；伪保存适配器第一次 reject、第二次 resolve；预存表单和草稿快照 | 点击保存等待 reject；核对错误与状态；不改数据直接点明确重试；等待中连续点击 | 第一次只调用 1 次并显示大字持久错误/重试动作；`saving` 收敛；表单/草稿不变；第二次有效尝试只新增 1 次调用并成功；等待中点击不新增调用 | 调用时序、状态、表单/草稿快照；不写真实订单 |
| T51 | AC-11 超时/恢复：保存超时后重试 | 所有门通过；第一次保存 deferred 至超时，第二次可控成功；预存表单/草稿快照 | 触发保存超时；等待期连续点击；超时收敛后触发明确重试并完成 | 超时期间只有 1 次调用且无重复写；显示持久超时原因和重试动作；`saving` 可恢复；表单/草稿不变；重试是独立一次有效调用并成功 | 虚拟时钟、调用计数、状态与快照；终止旧 deferred，不写真实订单 |

上表是 04 执行前的最终用例清单。真实设备、合法样本、管理员、受控目录或外部写授权缺失时，必须按对应行写“未执行/不适用 + 原因 + 替代证据 + 风险”，不能借自动化、模拟器或其他平台结果标记通过。OCR 生产始终先执行 T12/T19；只有 T16、T31～T36、T42～T44 的所有适用发布证据齐全且判定不再为 `disabled`，才允许执行或报告 OCR UI 正常路径。

## 18. 需求到设计追踪

| 需求主题 | 设计落点 | 主要实现文件 | 主要验收 |
|---|---|---|---|
| 模式兼容与加载门 | §4、§6.7、§6.8、§14 | 两页、共享面板、`useOrderForm.ts` | AC-01、AC-11、AC-14 |
| 大字分段/名单按钮与实时小字预览 | §6.1、§13、§14 | `ElderEntryPanel.vue`、两页适配器、`WordPreview.vue` | AC-02、AC-11、AC-12 |
| 端侧语音 | §8 | `speech.ts`、`useElderEntry.ts` | AC-03、AC-04、AC-15 |
| 本地 OCR/图片安全 | §10 | `image-preflight*`、`ocr.ts` | AC-05、AC-06、AC-13、AC-16 |
| 候选、限额与置信度 | §6.2～§6.5 | `candidate.ts`、`types/elder-entry.ts` | AC-07 |
| 朗读 | §9 | `tts.ts` | AC-08 |
| 模板 | §6.3、§5 | 模板管理器、`candidate.ts` | AC-09 |
| 日期 | §7 | `date.ts`、`useOrderForm.ts`、`quality-check.ts` | AC-10 |
| 总确认/保存 | §6.1、§14 | 共享面板、两页 | AC-11、AC-14 |
| 隐私/权限/诊断 | §11～§12 | 发布策略、评估工具、诊断 | AC-13、AC-15、AC-16 |

研究证据到决策：

| 已核对证据 | 设计决策 | 实现/测试闭环 |
|---|---|---|
| 两页共用 `useOrderForm()` | 共享面板，不新增路由/订单模型 | 两页 SFC 接线 + AC-01/14 |
| 保存前会从日期引用回写表单，页面 watcher 还会异步改立碑状态 | 删除页面写状态 watcher，新增统一日期控制器与原子 API | 立即/`nextTick` 日期 RED 测试 + AC-10 |
| 现有文本解析器会原地修改对象 | 深克隆解析 + 白名单 diff | 候选隔离测试 + AC-07 |
| Web Speech 本地接口为实验能力 | 运行时证明、独立下载同意、失败关闭 | 适配器矩阵 + AC-03/04/15 |
| Tesseract Worker/core/model可本地托管，但碑刻表现未知 | 精确锁版、同源自托管、初始禁用、冻结实测后发布 | AC-05/06/12/13/16 |
| 模板已有白名单 | 复用同一存储，老人模式只改变应用为候选 | 模板 schema/交互回归 + AC-09 |

## 19. 风险与回退

| 风险 | 触发信号 | 处理/回退 |
|---|---|---|
| 语音 API 看似存在但实际联网或状态不确定 | 本地 API/语言包证明缺失、网络出现第三方请求 | 立即禁用应用内语音，只保留手填和输入法免责声明 |
| OCR 冷启动或准确率不达门槛 | 任一缺失项、安全失败、准确率/非空/P95 命中下线 | 生产 `disabled`，不影响其他老人能力 |
| iOS/微信缺少安全预检/缩放原语 | 运行时能力探测失败 | 拒绝 OCR 文件，手填降级；不得主线程冒险解码 |
| 日期双状态再次分叉 | 即时载荷与屏幕/引用不一致 | 停止实现，保留原普通模式，修复唯一日期 API 后重测 |
| 异步晚回调或跨能力并发污染新步骤 | 完整任务 token 不匹配仍产生候选/写表，或旧资源未释放就启动新任务 | 停止发布，全会话任务互斥与清理测试必须先通过 |
| 详情/复制晚响应覆盖当前编辑 | 旧 loadEpoch 仍能提交表单或加载失败可保存原 ID | 停止发布，只读快照 + epoch 提交门修复后重测 |
| 共享面板改坏普通保存或绕过候选门 | 第二份表单、普通回归 payload/schema 变化、老人模式可直达 `performSave()` | 回退页面接线，恢复单实例与唯一 `requestSave()`，不改保存主体 |
| 当前分支依赖未合并 | 03 前实际主分支缺少模板/质检等设计基线能力 | 暂停 03，由用户决定先合并依赖分支或明确以其提交为新分支基线 |

## 20. 工期与阶段出口

按单人估算：

- 核心大字模式、候选隔离、日期、模板、朗读、两页接线与回归：6～9 人日。
- OCR 安全预检、Worker、自托管资产、评估工具与受控评估：另 4～6 人日，不含样本授权等待和设备协调。
- 三设备完整评估、复算与缺陷修正会受设备、样本和网络整形条件影响，不承诺固定日历时间。

02 阶段出口条件：

- 本文覆盖技术方案、逐文件改动、协议、数据一致性、安全、依赖、复杂度、TDD 和 AC-01～AC-16 自测设计；
- 涉及仓库仍唯一为 `D:\code\uniapp-unpacked\uniapp`，合码策略为“上线后合”；
- 独立 AI 设计评审无阻断/严重问题，或相关问题已在最多两轮内修复；
- 只完成本地流程文档，不修改业务代码；
- 03 开工前必须重新只读回查实际主分支与当前依赖分支。若依赖提交未在实际主分支，需用户明确选择分支基线后才能开发。

通过 02 后停在 03-开发前，等待用户明确指令。
