# 通用3D碑型范本展示与打印文件 · 设计文档

- 状态: 人工确认通过，03 开发中；实现期依赖增量已完成两轮 AI 复核
- 对应需求: `requirement.md`
- 设计日期: 2026-09-03
- 合码策略: 上线后合

## 1. 设计目标与约束

在不改变现有个性化 3D 预览业务语义的前提下，为老万石雕 UniApp H5 增加独立的“3D 碑型范本”页面。页面只消费已通过本地安全发布门禁的匿名 GLB/STL，不接收照片、不执行在线建模、不调用打印机。

线下建模使用固定非 Git 工作域 `D:\code\3d-models\stele`：

- `source-photos/`：未来照片增量预留；当前首版保持为空且生成器不得读取。
- `workspace/`：参数、低精度预览、生成报告和中间文件。
- `exports/`：待安全扫描的通用无字 GLB/STL。

首版交付一个参数化圆拱碑型，参考尺寸固定为宽 140 mm、深 26 mm、高 160 mm；页面和 STL 均明确为通用设计，不承诺真实石碑或照片复刻。首版不使用纹理，参数和中间网格不进入 UniApp 仓库。

## 2. 预研结论与设计映射

| 预研结论 | 设计决策 | 落地位置 |
|---|---|---|
| 当前没有照片仍可用固定轮廓、尺寸和倒角层生成封闭实体 | 首版固定为参数化圆拱碑型；照片路线只作为未来独立增量 | 本文 §3、§7；无照片预研 |
| glTF/GLB 适合网页展示，STL 可供 Bambu Studio 导入 | 每个范本固定一对同编号 `.glb` 与 `.stl`；页面只加载 GLB，下载只提供 STL | 本文 §4、§5 |
| GLB JSON、扩展、图片容器和未归属字节可能携带隐私元数据 | 发布前执行闭合白名单扫描；未知项默认失败；整个批次通过后才原子复制 | 本文 §6 |
| 二进制 STL 的三角面记录含 2 字节 attribute byte count | 每个三角面的值必须为 `0x0000`，报告记录非零计数为 0 | 本文 §6、§9 |
| 当前项目已有 Three.js 和 OrbitControls，可直接加载 GLB | 新页面复用现有 Three.js 生命周期模式，引入 `GLTFLoader`，不引入新的运行时 3D 依赖 | 本文 §5、§8 |

依据记录见 `research/2026-09-03-无照片参数化范本首版预研.md`；既有照片预研仅保留其 GLB/STL 格式与安全事实，照片处理部分对当前首版不适用。

## 3. 参数化建模方案

### 3.1 冻结参数

| 参数 | 值 | 说明 |
|---|---:|---|
| `templateId` | `stele-template-classic-v1` | 匿名模型编号与文件名基线 |
| `parameterVersion` | `stele-parametric-classic-v1` | GLB/STL 共同来源版本 |
| 物理包围盒 | X=140 / Y=26 / Z=160 mm | X 宽、Y 深、Z 高；适合先做小型打印样件 |
| 正面轮廓 | 17 个固定点 | 一体化宽底座、直立碑身和对称圆拱近似顶 |
| 深度截面 | Y=-13/-10/10/13 mm | 外侧截面按中心缩小到 0.96，形成前后倒角 |
| 三角面 | 132 | 两个端面 30 面 + 三段环连接 102 面 |
| 纹理 | 0 | GLB 只使用固定灰石色 PBR 材质；STL 无材质 |

物理权威坐标使用 X=宽、Y=深、Z=高和毫米。GLB 按 glTF Y-up 输出为 `(X, Z, -Y)` 且由毫米换算为米；STL 保持 `(X, Y, Z)` 毫米。两个导出器必须消费同一份内存三角面数组，不能分别重建几何。

### 3.2 低精度预览证据

- 参数：`D:\code\3d-models\stele\workspace\stele-template-classic-v1\prototype-spec.json`
- 示意预览：同目录 `prototype-preview.png` / `prototype-preview.svg`
- 一次性原型：同目录 `stele-template-classic-v1.glb` 与 `.stl`，只作为设计证据，不直接发布。
- 实测：132 三角面、0 纹理；GLB 10,188 bytes，STL 6,684 bytes；物理包围盒 140×26×160 mm；共同 `geometrySha256=c01194239cabd72ac659b6d919e5340b7eb498d3a66bf1373fad0b402c9cbcaa`。

该原型证明文件体积和生成链路可控，不替代 03 的测试先行实现、发布扫描或 04 的浏览器/Bambu Studio 验收。

### 3.3 几何摘要

校验器分别解析 GLB 与 STL，转换到物理毫米坐标。每个坐标四舍五入到整数微米，每个三角面的三点按字典序排序，再对全部三角面排序，以 `x,y,z|x,y,z|x,y,z` 每行一面的 UTF-8 文本计算 SHA-256。两种格式的摘要和规范化包围盒必须完全一致。

## 4. 资产与配置契约

### 4.1 发布目录

UniApp 只接收扫描通过的发布资产：

```text
static/models/stele/
└── releases/
    └── <releaseId>/
        ├── stele-template-<id>.glb
        ├── stele-template-<id>.stl
        └── publish-report.json
```

`<id>` 只含小写字母、数字和单连字符，两个模型文件名匹配 `^stele-template-([a-z0-9]+(?:-[a-z0-9]+)*)\.(glb|stl)$`。`releaseSha256=SHA-256(parameterVersion + "\n" + policySha256 + "\n" + glbSha256 + "\n" + stlSha256 + "\n")`，`releaseId=classic-v1-<releaseSha256 前 12 位>`。版本目录一经发布不可覆盖或删除；未来版本新增目录。`publish-report.json` 是唯一允许的非模型文件，与两个资产在同一次目录改名中出现。

首版优先采用无纹理几何 + 固定石材色材质，避免把照片纹理带入发布物。只有低精度预览证明纹理对辨识碑型不可缺少时，才允许内嵌经解码像素重编码的 PNG，并执行 §6 的 PNG 闭合扫描。

### 4.2 前端配置

`utils/stele/model-templates.json` 是构建期唯一范本指针，页面以 TypeScript 接口校验读取，每项字段固定为：

```ts
interface SteleModelTemplate {
  id: string
  name: string
  description: string
  sourceKind: 'parametric-generic'
  sourceNotice: string
  parameterVersion: string
  releaseId: string
  glbUrl: string
  stlUrl: string
  boundsMm: { x: number; y: number; z: number }
  triangleCount: number
  geometrySha256: string
  sha256: { glb: string; stl: string }
}
```

- `id` 必须与文件匿名编号一致；用户可见文字不得含个人碑文信息。
- `sourceKind` 首版只能为 `parametric-generic`，`sourceNotice` 固定含“参数化通用设计，非真实石碑或照片复刻”。
- `parameterVersion` 与本批发布报告一致。
- `releaseId` 与 URL 中不可变版本目录一致；两个 URL 必须位于同一 release 目录。
- `boundsMm` 是 Bambu Studio 尺寸验收唯一基准，三个轴均为正数。
- `geometrySha256` 和两个文件 SHA-256 必须逐字段等于该目录内报告；构建门禁回读文件验证，不允许手工伪造。
- 追加第二条配置即可切换模型，渲染器不按具体范本分支。

本需求不新增 HTTP API、云函数、数据库表或本地业务数据结构；静态配置和资产 URL 是唯一页面协议。

## 5. 页面设计

### 5.1 入口与路由

- 首页将现有 No.02“敬请期待”卡片改为可点击的“3D 碑型范本”，跳转到 `/pages/stele/models`。
- `pages.json` 注册新页面，保持 `navigationStyle: custom`。
- 现有 `/pages/stele/preview` 继续承担个性化文字预览，不改读取 `STELE_STORAGE_KEYS.preview3d`、几何生成或交互语义。

### 5.2 页面状态

页面显式区分以下状态，任何失败都保留返回入口：

1. `loading`：显示加载进度；无法获得精确百分比时显示确定的忙碌状态。
2. `ready`：模型可旋转、缩放、重置视角、全屏；展示属性说明和 STL 下载按钮。
3. `load-error`：GLB URL 无效、断网、解析失败，显示原因类别和“重试”。
4. `webgl-error`：创建渲染器失败或上下文不可用，显示不支持提示，不进入动画循环。
5. `switching`：切换范本时先停止旧循环并释放旧模型，再加载新模型。

下载使用现有 `utils/stele/delivery.ts` 的 `downloadBlob`。`model-download-session.js` 在请求开始时冻结 STL URL、文件名和 SHA-256，并以独立代次和 `AbortController` 管理下载；切换范本或卸载会取消旧请求，过期响应不得触发保存或覆盖提示。下载前用 `fetch` 取得同源 STL 并校验配置哈希；网络、空文件或完整性失败均不产生下载，成功文件名与冻结配置一致。页面提示“请在 Bambu Studio 中选择机型、材料并切片，本页面不直连打印机”。

### 5.3 Three.js 实现

- 使用 `GLTFLoader` 加载 GLB，使用 `OrbitControls` 提供旋转和缩放。
- 加载成功后由 `Box3`/包围球自动计算相机中心、近远裁剪面和适配距离，不写死首个范本尺寸。
- 重置视角恢复由包围盒计算的默认相机和控制器 target。
- 全屏使用浏览器 Fullscreen API；不支持时显示可见提示。
- 渲染采用按需单 RAF：加载完成、控制器变化、尺寸变化和恢复可见时请求一帧；仅在自动旋转开启或阻尼尚未收敛时续帧，静止后待处理 RAF 必须归零。页面进入后台时立即取消 RAF，恢复前台后按当前状态重绘；卸载、切换和失败时同样取消。
- 释放场景内 geometry、material 和 texture，移除 resize/fullscreen/webglcontextlost 监听，调用 controls/renderer 的 dispose；连续进入退出不累积资源。
- 监听 WebGL context lost，阻止默认重启并转入可重试失败状态。

### 5.4 异步加载所有权

加载协调器维护单调递增 `requestGeneration`、当前 `AbortController` 和 `unmounted` 标记。切换、重试或卸载时先递增代次并 abort 旧 fetch；采用 `fetch(url, { signal }) → arrayBuffer → GLTFLoader.parseAsync`，因为解析阶段本身不可取消，所以每个回调在更新状态前必须同时满足“代次仍为当前且页面未卸载”。过期成功结果只执行自身 scene 的深度 dispose，不挂入当前场景、不启动动画；过期失败不覆盖当前错误状态。只有当前代次加载成功后才允许创建/复用唯一动画循环。

模型协调逻辑放入可注入 fetch/parser 的 `utils/stele/model-load-session.js`；下载协调逻辑放入可注入 fetch/verify/save 的 `utils/stele/model-download-session.js`。03 分别验证 A 慢 B 快乱序、卸载后完成、连续重试、abort、哈希失败和过期下载无副作用，再实现页面接入。

## 6. 离线生成与安全发布管线

### 6.1 两阶段事务

发布脚本采用“完整 release 目录一次出现”模型。固定路径为：输入 `D:\code\3d-models\stele\exports`，私有事务区 `D:\code\uniapp-unpacked\uniapp\.stele-publish`，公开根 `D:\code\uniapp-unpacked\uniapp\static\models\stele\releases`。事务区与 `static` 同盘但不在静态资源树内，并加入 `.gitignore`；`.stele-publish/active` 本身就是唯一活动事务目录，以不带 `recursive` 的原子 `mkdir` 取得单写者所有权，不允许并行活动事务。取得目录后立即写入只含 schemaVersion、PID、transactionId 和时间的 `owner.json`；另一进程发现 owner PID 仍存活时必须返回 4，不能把在途事务当作崩溃现场。进程探测只有 `ESRCH` 可证明目标不存在，`EPERM` 和其他未知错误均按“可能存活”失败关闭。只有能证明 owner 进程已退出，或测试/同进程显式携带原 transactionId 时才进入恢复状态机；PID 复用导致的疑似存活一律失败关闭。journal 只记录相对 releaseId、状态、匿名文件名、`targetExistedBefore` 和哈希，不记录绝对路径。

公开 release 集合哈希采用唯一算法，本文中的 `targetBeforeSha256`/`targetAfterSha256` 均指该值：

1. 只枚举 `releases` 的直接子目录，目录名必须匹配冻结的 release 正则，并按 ASCII 字节升序排列；空集合输入为空字节串。
2. 每个目录必须恰含一对 GLB/STL 与 `publish-report.json`，先按冻结 schema、policy、文件 SHA、几何和零失败规则完整验证。
3. 对报告深拷贝后只删除 `summary.targetBeforeSha256` 与 `summary.targetAfterSha256`，其他字段一个不删；对剩余对象执行 RFC 8785 JCS，以其 UTF-8 字节的 SHA-256 作为 `reportProjectionSha256`。这两个字段是唯一排除项，从而消除报告自引用，同时仍绑定报告其余内容。
4. 每个 release 贡献一行 UTF-8：`<releaseId>\t<reportProjectionSha256>\n`；连接所有行后计算 SHA-256。计算拟发布集合时把已完整生成但尚在私有 stage 的新报告按同一投影算法加入；因此可以先填入两个 64 位零占位值求出 `targetAfterSha256`，再写入真实 before/after 值，投影与集合哈希不会变化。

事务和幂等顺序固定为：

1. 启动时先恢复唯一 active transaction，再验证并计算当前公开集合哈希；无法证明状态时返回 4 并禁止构建/发布。
2. 从 `exports` 枚举恰好一对同编号 GLB/STL；不递归读取 `source-photos` 或 `workspace`。在创建事务前先求出 releaseId：若同名公开目标已经存在，则不创建 journal、不生成新的报告，完整验证现有三文件后比较 incoming GLB/STL 字节 SHA、parameterVersion、policySha、geometrySha 和 bounds；全部相同直接以幂等 no-op 返回 0，任一不同返回 4。这样“已有 release”不会进入 `STAGED`，也不会因新的 `createdAt` 或历史 before/after 值产生伪冲突。
3. 仅当目标不存在时原子创建唯一 `.stele-publish/active`，先写 owner，再回算公开集合确认未在抢锁前漂移，最后写 journal；`targetExistedBefore` 必须为 `false`，并记录 `targetBeforeSha256`。owner/journal 均采用临时文件写入、flush、关闭、原子替换，journal 初始状态为 `PREPARING`。
4. 在 `active/stage/<releaseId>` 内复制、解析、全量校验并回读；先按上一算法计算 after，再生成完整 `publish-report.json`，按冻结 schema 再次解析验证，并记录 `stageReportProjectionSha256` 与 `targetAfterSha256`。报告中的 `assetSetSha256` 只覆盖两个模型文件。
5. 全部通过后持久化 journal 状态 `STAGED`，再把完整 stage release 目录以一次同盘 rename 移到公开 `releases/<releaseId>`；因为第 2 步和唯一 active 锁保证目标在事务开始时不存在，rename 遇到目标已存在一律返回 4，禁止覆盖或把它误判为幂等成功。
6. rename 成功后回读公开三文件与 after 集合哈希，持久化 journal 状态 `PUBLISHED`，再把 active 目录改名到 `.stele-publish/receipts/<releaseId>-<transactionId>`。最终报告已经随目录一起出现，不存在“资产已公开、报告后补写”的窗口。

恢复状态机穷举为：

| journal 状态 | 私有 stage | 公开目标 | 恢复动作 |
|---|---|---|---|
| `PREPARING` | 有或无 | 必须无 | 删除 active，并验证集合仍等于 before |
| `STAGED` | 有 | 无 | 删除 active，并验证集合仍等于 before |
| `STAGED` | 无 | 有 | 必须同时满足 `targetExistedBefore=false`、公开报告投影等于 journal、完整集合等于 after；随后删除本事务新增的目标，再验证集合回到 before，最后删除 active |
| `PUBLISHED` | 无 | 有 | 验证公开报告投影等于 journal 且完整集合等于 after，然后转 receipt |

其余组合全部返回 4：包括任一 journal 出现 `targetExistedBefore=true`、`STAGED + stage/目标同时存在`、`PREPARING/PUBLISHED` 出现不允许的目标或 stage、两者都缺失，以及哈希不匹配。它们不属于正常崩溃状态；既有 release 的幂等 no-op 已在 active 创建前结束，所以不会制造 `STAGED + stage/目标同时存在`。首次发布的 before 为 SHA-256 空字节串，使用同一状态机。

脚本运行前后都记录上述公开集合哈希。失败批次在可证明恢复后必须等于 `targetBeforeSha256`；私有 stage 永远不被页面引用。所有失败也输出同一冻结 JSON Schema 可校验的报告：`templates=[]`、`summary.failureCount=1`、`failures` 只含匿名文件名或 null、枚举 code/message，不透传异常 detail、路径或堆栈。能读取有效公开集合时 before/after 必须记录同一真实哈希；契约自身损坏或公开集合已无法按冻结算法解析时两者用 `null` 明示“不可计算”，禁止用全零值冒充。策略/schema/错误目录解析与哈希校验也位于捕获边界内；模块初始化只使用实现内冻结的文件名和 release 正则，磁盘 policy 即使是合法 JSON 但结构损坏，也只能产生 `BUILD_GUARD_FAILED` 报告，不能在加载模块时失控。磁盘错误码只在属于冻结枚举时保留，否则映射到当前阶段的固定错误码；模型复制的原生错误固定为 `STAGING_COPY_FAILED`，报告原子写入的原生错误固定为 `REPORT_WRITE_FAILED`。测试通过显式故障注入覆盖复制第 N 件失败、报告写入/回读失败、STAGED 持久化前后中断、rename 前后中断、PUBLISHED 持久化失败、首次发布、已有同 release 幂等 no-op、已有同 release 内容冲突、每个状态表组合、真实双进程争锁和进程重启恢复；另以真实临时文件操作覆盖输入在校验后消失及报告目标变为目录的原生错误。发布不替换旧版本，只新增一个不可变 release 目录。

退出码固定为：`0` 成功并已提交；`2` 输入/格式/安全/几何校验失败；`3` 暂存复制、报告生成或回读失败且旧发布集合已保持/恢复；`4` 事务恢复、既有 release 冲突或目录切换无法证明旧集合完整，必须人工检查且禁止继续发布；`64` 命令参数错误。

闭合契约原件冻结在设计原型目录：`stele-model-policy-v1.json`、`stele-publish-report-v1.schema.json`、`stele-publish-errors-v1.json`。policy 递归按键排序后无额外空白序列化，预期 `policySha256=954bb2c749216ef276b83fa42b3ce78667183c1680e5a285d0a5a74f8d637abd`；报告 schema 原始字节 SHA-256 为 `273d19fafaf770b814039f01386a8e6d81af399cd8324f61b787f9622c5b9669`，错误目录原始字节 SHA-256 为 `eceda53698da824987f06d1e7f291b758cd37346bc9a2e71414265dd9d722c70`。03 中的运行时副本必须复算相同值，并实际用 schema 递归校验报告，不能只校验 schema 文件哈希。报告 schema 逐层 `additionalProperties=false`，`gltfValidator` 固定为精确版本，成功报告的集合哈希必须为 64 位摘要，失败报告在契约/集合不可解析时允许明确的 null；包含 Node/generator/validator 版本、26 个固定 checks、资产/几何/集合哈希。错误目录穷举 15 个固定 code/message 对，失败项文件名只能为空或匿名模型文件名，禁止路径和堆栈。

### 6.2 GLB 校验

校验器策略版本固定为 `stele-model-policy-v1`，核心格式固定 glTF 2.0，扩展白名单为空，`extensionsUsed/Required` 必须不存在，图片/纹理/采样器必须不存在。策略以键排序、无额外空白的 UTF-8 JSON 计算 `policySha256` 并写入报告；实现与测试使用同一冻结策略常量，禁止运行参数临时扩白。

首版 GLB 子集进一步闭合为：顶层仅允许 `asset/scene/scenes/nodes/meshes/materials/buffers/bufferViews/accessors`；数组数量固定为 1 scene、1 node、1 mesh、1 material、1 buffer、2 bufferViews、2 accessors。`asset` 只允许 `version="2.0"`；scene→node→mesh→单 primitive 必须完整可达；primitive 只允许 `attributes/material/mode`，attributes 只允许 `POSITION/NORMAL`，`mode=4`；材质只允许 `pbrMetallicRoughness.baseColorFactor/metallicFactor/roughnessFactor`；buffer 只允许 `byteLength`；bufferView 只允许 `buffer/byteOffset/byteLength/target` 且 `target=34962`；accessor 只允许 `bufferView/componentType/count/type/min/max`，`componentType=5126`、`type="VEC3"`，仅 POSITION 带 min/max。所有 `name` 在首版禁止，几何使用非索引三角形；任何其他合法 glTF 核心能力也要先升级策略版本和重新评审，不能因“规范允许”自动放行。

必须验证：

- GLB magic/version/总长度、唯一 JSON chunk、至多一个 BIN chunk、chunk 顺序和规范填充；
- 递归遍历所有 JSON 对象键与字符串值，核心键闭合、扩展成员闭合，未知项默认失败；
- `extensionsUsed/Required` 与实际载荷一致；拒绝 `extras`、`asset.generator`、`asset.copyright`、自定义顶点属性和动态映射键；
- 所有 `name` 在首版均禁止；
- 拒绝所有 `buffers[].uri`、`images[].uri`，只允许单文件 GLB；
- 从选定场景遍历有效依赖，拒绝不可达对象/bufferView、重叠区间、非零空洞、尾随字节和其他未归属字节；
- 首版禁止 `images/textures/samplers`，因此任一 PNG 或图片 bufferView 均失败；需求中 PNG 闭合检查保留给未来增量，启用前必须升级策略版本并重新评审。

格式层面再运行 glTF 2.0 Validator；格式校验通过不能替代上述隐私门禁。

### 6.3 STL 校验

- 首版发布固定使用二进制 STL；检测必须无歧义，不能只按前五字节是否为 `solid` 判定。
- 80 字节头只允许全零或同编号 ASCII 名称。
- 文件长度严格等于 `84 + 50 × triangleCount`，末尾立即 EOF。
- 逐三角面验证有限数值、非退化面、法线/顶点结构；每个记录末尾 attribute byte count 必须为 `0x0000`，报告记录非零计数为 0。
- 网格层面报告有限坐标异常、退化面、重复面、边界边、超过两个邻面的边、相邻面方向冲突、自交三角面对和额外连通壳计数；合法首版全部为 0，连通组件总数必须为 1，包围盒三个轴为正并以毫米记录 X/Y/Z。
- GLB 与 STL 都按 §3.3 计算 `geometrySha256`；参数版本、摘要或规范化包围盒任一不一致时整批失败。
- 如以后允许 ASCII STL，必须按需求执行完整语法、首尾名称一致和 EOF 校验；首版不以 ASCII 正例代替二进制正例。

### 6.4 构建、缓存与回滚

构建前必须运行 `validate-and-publish.mjs --build-guard`：要求 `.stele-publish/active` 为空；`model-templates.json` 中每个 releaseId 均存在不可变目录；目录只含一对模型和 `publish-report.json`；配置、报告及回读文件的参数版本、几何摘要、包围盒、真实三角面数和两个文件 SHA-256 完全一致；`source-photos` 为空；构建产物中不得出现 `.stele-publish`、照片扩展名、非匿名模型或未在已发布报告中的模型文件。任一不满足返回退出码 4 并禁止 HBuilderX 发行。

生产 URL 带不可变 releaseId，例如 `/static/models/stele/releases/classic-v1-<12位摘要>/stele-template-classic-v1.glb`。旧页面脚本始终引用旧 release，新页面脚本同时引用同一新 release 中的 GLB/STL，因此 CDN 即使缓存页面脚本也不会混批；发布脚本不得覆盖旧 release。部署顺序固定为：本地发布成功 → 更新并回查 `model-templates.json` → build guard → HBuilderX 导出 → 部署静态包 → 线上分别 GET 两资产并计算 SHA-256，与配置/报告核对。回滚时把配置恢复为上一个已验证 releaseId，重新构建部署；旧 release 保留，所以不依赖删除或 CDN 立即失效。

## 7. 来源标注与未来增量

首版范本全部来源于参数化通用设计，页面只展示固定提示“非真实石碑或照片复刻”，不得出现“照片可验证”或类似暗示。`source-photos` 为空是正常状态；生成脚本不得枚举或读取该目录。

以后取得照片时，先建立独立需求增量并重新评审，再决定新建还是替换范本。未来增量可以复用配置、查看器、下载和发布管线，但必须重新冻结来源标签、模型尺寸、性能预算和隐私验收。

## 8. 难点、方案取舍与文件级变更计划

### 8.1 难点与设计思路

- **跨格式同一几何**：GLB 使用 Y-up/米而 STL 使用 Z-up/毫米，单比包围盒会漏掉同尺寸不同形状。设计以共同物理三角面数组为权威源，再用规范化 `geometrySha256` 独立回查两个文件。
- **无隐私载荷的可证明发布**：通用 exporter 可能自动写 generator/name 或其他合法但不需要的 glTF 字段。首版使用自有最小二进制 writer 和闭合 GLB 子集，牺牲通用性换取可机械证明的最小攻击面。
- **发布过程中断**：直接逐文件覆盖会产生 GLB/STL 版本错配。设计采用同盘暂存、回读、事务日志、目标目录切换和启动恢复，失败时恢复旧目录。
- **Three.js 生命周期**：UniApp 页面可能多次进入退出。设计统一管理一个动画句柄、一个 controls/renderer 实例和全部监听器，切换、错误与卸载都走同一释放函数。

备选方案及弃用原因：不采用云端照片建模（当前无照片且违反本地边界）；不把现有个性化预览改造成双模式（会耦合订单数据并扩大回归）；不直接使用 `GLTFExporter/STLExporter` 成品（输出结构不够闭合且两个 exporter 可能各自处理几何）；不使用缩略图（首版模型极小，缩略图会增加一类发布资产和隐私检查面）。

### 8.2 文件清单

| 文件/目录 | 动作 | 设计内容 |
|---|---|---|
| `pages/stele/models.vue` | 新增 | 范本选择、GLB 加载、交互、全屏、失败重试、STL 下载、来源属性说明和完整资源释放 |
| `utils/stele/model-templates.json` | 新增 | 范本静态配置、来源提示、releaseId、参数版本、毫米包围盒、几何/文件哈希与不可变资产 URL |
| `utils/stele/model-load-session.js` | 新增 | fetch abort、请求代次所有权与过期 GLTF 结果释放协调器 |
| `utils/stele/model-download-session.js` | 新增 | 冻结下载目标、下载代次、abort、哈希失败与过期响应副作用隔离 |
| `pages.json` | 修改 | 注册 `/pages/stele/models` |
| `pages/index/index.vue` | 修改 | 将 No.02 卡片变为范本页面入口；其余首页功能不变 |
| `utils/stele/delivery.ts` | 复用；仅必要时最小修改 | 继续用 `downloadBlob`；若浏览器实测发现错误处理不足，只补本需求所需返回值/异常透传 |
| `tools/stele-models/generate-template.mjs` | 新增 | 从版本化固定参数生成共同物理三角面集合，再导出 GLB/STL；不得读取 `source-photos` |
| `tools/stele-models/validate-and-publish.mjs` | 新增 | 执行 §6 闭合扫描、报告和全批原子复制 |
| `tools/test-stele-model-publish.mjs` | 新增 | 安全发布管线的合法/恶意固定样本与事务回归测试 |
| `tools/test-stele-model-page.mjs` | 新增 | 页面接线、可见失败提示、资源释放结构与 SFC 编译检查 |
| `tools/test-stele-model-load-session.mjs` / `tools/test-stele-model-download-session.mjs` | 新增 | 行为级验证加载/下载乱序、卸载、取消、哈希失败和过期副作用 |
| `package.json` / `package-lock.json` | 修改 | 增加仅供 Node 发布校验使用的 `gltf-validator@2.0.0-dev.3.10` 开发依赖，不进入 H5 运行时包 |
| `.gitignore` | 修改 | 忽略 static 外私有事务目录 `.stele-publish/` |
| `static/models/stele/releases/<releaseId>/stele-template-<id>.glb` | 新增 | 仅在扫描通过后以不可变 release 目录发布的网页模型 |
| `static/models/stele/releases/<releaseId>/stele-template-<id>.stl` | 新增 | 与报告、下载、Bambu 验收同 SHA-256 的二进制 STL |
| `static/models/stele/releases/<releaseId>/publish-report.json` | 新增 | 与两资产同目录一次出现的闭合发布报告 |
| `static/models/stele/stele-template-<id>.webp` | 首版不新增 | 页面直接使用通用线稿图标，避免多一个发布资产 |
| `D:\code\3d-models\stele\workspace\<id>\` | 本地生成，不入 Git | 参数、低精度预览、发布报告、建模中间文件和待清理清单 |
| `D:\code\3d-models\stele\exports\` | 本地生成，不入 Git | 通过前视为敏感的最终候选 GLB/STL |

不修改 `pages/stele/preview.vue` 的业务逻辑。不新增后端、云函数、数据库变更或打印机协议。

### 8.3 数据与配置变更

- DDL/DML/Mongo/uniCloud/Nacos：无。
- API/云函数：无。
- 运行时新增数据只有编译期静态范本配置，不读取订单、草稿或 localStorage。

## 9. 测试设计与验收映射

安全发布和异步加载属于复杂高风险边界，03 阶段按测试先行：先建立合法二进制 STL、合法最小 GLB、每类恶意固定样本、事务逐状态中断恢复，以及 A/B 乱序与卸载后完成测试并记录 RED，再实现扫描、发布和页面接入。

项目没有独立 `test_guide`；测试前置与环境口径以仓库 `AGENTS.md`、本文和 `requirement.md` 为准。浏览器用例必须使用本次待测代码的 HBuilderX H5 构建，通过 HTTP(S) 访问；旧线上版本或直接打开本地文件不能作为证据。

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

### 真实环境门禁与替代证据

| 门禁 | 可用于诊断的替代证据 | 不可替代项 / 环境不可用时结论 |
|---|---|---|
| Chrome、Edge、Pixel 7 模拟兼容（T04） | SFC 编译、Node 会话测试、内置 Chromium 可提前发现问题 | 三个指定环境的真实加载与交互不可被源码或其他浏览器替代；任一未执行则 AC-04 未通过。Pixel 7 DevTools 是冻结的必测移动 H5 环境；实体手机是补充证据，不冒充也不新增硬门禁 |
| WebGL/API 故障（T03B/T06） | Node 错误状态测试可验证状态机 | 必须在浏览器 DOM 中真实注入 API 缺失/reject/WebGL 创建失败或 context lost 并看到提示；无法注入则 AC-07 未通过 |
| Bambu Studio（T08） | STL 拓扑、尺寸与哈希自动校验只作导入前诊断 | 只有实际 Bambu Studio 导入、尺寸回查和切片可通过 AC-05；未安装/不可启动则 AC-05 未通过 |
| 生产地址与性能（T08/T13） | 本地 HTTP 构建可提前验证路由、功能与资产哈希 | 必须部署本次构建后再测生产 URL、缓存与 9 次性能；未部署或地址不可访问则 AC-09 线上部分和 AC-13 未通过 |
| 资源释放（T07） | 源码检查和 SFC 编译只能说明存在清理调用 | 必须取得浏览器计数、dispose spy 与堆阈值；无法注入/采集时 AC-08 未通过 |
| 照片/上传零访问（T12） | 生成器源码不引用 `source-photos` 只是辅助证据 | 必须有按进程的文件/网络事件或等价可观测追踪；没有运行时证据则 AC-11 未通过 |

测试数据仅放测试临时目录，使用匿名合成几何和合成 PNG，不取真实照片。测试清理只删除由测试进程创建且路径已校验位于临时目录的文件；不删除 `source-photos/workspace/exports` 用户数据。测试失败时先保留现场并停止发布。

## 10. 性能预算

预算基于 §3.2 的 10,188-byte / 132-triangle / 无纹理原型，并给正式生成留出约 6 倍文件和 15 倍面数余量：

| 指标 | 冻结值 | 测试口径 |
|---|---|---|
| GLB 文件体积上限 | 64 KiB | 服务端实际响应字节数 |
| 三角面数上限 | 2,000 | GLB/STL 规范化三角面统计一致 |
| 最大纹理尺寸 | 0（首版禁止纹理） | GLB `images/textures/samplers` 均不存在 |
| 桌面设备/浏览器 | Lenovo 20S1A0M8CD / 15.8 GB RAM；Chrome 152.0.7977.65、Edge 152.0.4191.53 | 冷缓存首次加载，各执行 3 次取最大值 |
| 移动 H5 环境 | Chrome DevTools Pixel 7 视口 412×915、DPR 2.625、CPU 4× slowdown | 冷缓存首次加载，各执行 3 次取最大值 |
| 网络条件 | Chrome DevTools Fast 3G：下行 1.6 Mbps、上行 750 Kbps、延迟 150 ms | 禁用缓存、生产静态地址 |
| 首次可交互耗时上限 | 桌面 1.5 s；移动模拟 3.0 s | 页面导航开始至 loading 结束且 OrbitControls 可操作 |

04 必须使用发布后的同一首个模型实测；若超限，先简化网格并重新发布扫描，不能只放宽阈值。物理移动真机作为补充兼容验证；若模拟与真机冲突，以更差结果判定。

## 11. 依赖与环境

- 运行时沿用仓库现有 `three@0.183.2`，从 Three.js examples 引入 `GLTFLoader`；不新增网页运行时依赖。
- 正式生成器使用 Node 内置二进制写入和现有 Three.js `ShapeUtils.triangulateShape`，以便完全控制 GLB JSON、STL 头部和 attribute byte count；不使用会写入 `asset.generator` 的通用 exporter 输出作为最终发布物。
- GLB 容器、JSON 闭合白名单、STL 和网格拓扑校验由仓库内 Node 脚本实现；另以无版本范围的精确依赖 `gltf-validator@2.0.0-dev.3.10` 作为 Khronos glTF Validator 的第二重格式检查。该包只由 `tools/stele-models` 在生成/发布/构建门禁中使用，不被页面导入，不增加 H5 运行时依赖或模型体积；安装失败时发布必须失败。报告中的 `toolVersions.gltfValidator` 必须为非空精确版本，幂等、恢复与 build guard 都要同时验证它等于当前包 `version()` 和本次 `validateBytes` 返回的 `validatorVersion`，不允许以 `null` 或任意字符串冒充已执行。
- Bambu Studio 当前未在本机 PATH 中确认可用，实际导入/切片保留为 04 真实环境门禁。
- 发布报告记录 Node 版本、校验器版本、白名单版本、文件哈希和执行时间；不记录用户照片信息。

## 12. 风险、回退与清理

| 风险 | 控制 | 回退 |
|---|---|---|
| 页面误导为照片/真实复刻 | 配置枚举 + 固定来源提示 + 文案测试 | 阻止发布该页面版本 |
| 模型包含文字或隐私元数据 | 无纹理优先 + 闭合扫描 + 全批原子发布 | 扫描失败不改变线上目录 |
| 大模型导致移动端卡顿 | 在首个低精度预览上冻结预算并优化网格 | 保留旧资源目录，事务回退 |
| WebGL/网络失败 | 可见状态、重试、返回路径 | 不影响既有碑文页面 |
| Three.js 资源泄漏或空闲常驻渲染 | 按需单 RAF、后台暂停、统一 dispose、5 次进出测试 | 页面卸载强制停止并释放；静止态 RAF 归零 |
| STL 无法切片或尺寸错误 | 拓扑、包围盒、全零属性字段检查 + Bambu 实测 | 不发布该批次 |

交付时只生成待清理清单。删除照片、带字工作副本或中间产物必须由用户另行明确授权并定向回查；开发与测试脚本不得自动删除这些目录。

## 13. 02 阶段出口条件

当前设计已由用户人工确认进入 03；实现期新增的精确开发依赖 `gltf-validator@2.0.0-dev.3.10` 也已完成两轮独立 AI 复核。Bambu Studio 未安装属于 04 真实环境门禁，不阻塞 03；若后续实现偏离共同三角面、无纹理或原子发布契约，必须先同步设计并重新评审。
