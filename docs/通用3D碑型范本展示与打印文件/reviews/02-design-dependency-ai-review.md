# 通用3D碑型范本展示与打印文件 · 02 依赖增量 AI 评审

- 评审日期: 2026-09-03
- 审核项: 03 实现期 glTF Validator 开发依赖增量
- AI 评审模式 / 强度: 默认 / 标准
- 上下文隔离: `fork_turns="none"`
- 当前结论: 第 2 轮通过；依赖增量审核闭环

## 第 1 轮

- Reviewer: `/root/generic_3d_dependency_review_r1`
- manifest: `8d35cf81ba66d90fff6621cdec17d313c16af8630b34f512c3834433f8ef3031`（起止复算一致）
- 结论: 不通过
- 阻断 / 严重 / 一般 / 建议: 0 / 1 / 1 / 0
- Reviewer 已完成并释放。

| ID | 级别 | 发现 | 主 Agent 裁决与修复 |
|---|---|---|---|
| DEP-R1-S01 | 严重 | `package.json`/lock 使用 `^2.0.0-dev.3.10`，不是设计要求的精确版本 | 接受；改为无范围的 `2.0.0-dev.3.10`，保留 lock 中 version/integrity/dev 证据 |
| DEP-R1-G01 | 一般 | 报告生成写真实版本，但回读仅接受 null/任意字符串，没有与包版本和 Validator 返回版本核对 | 接受；报告字段强制等于 `version()`，幂等、恢复、公开发布和 build guard 同时核对实际 `validatorVersion` |

## 第 2 轮

- Reviewer: `/root/generic_3d_dependency_review_r2_retry`
- manifest: `55dae162496b2f801c390b7091524ebf0c57f6262f53af7c159953c4fdeeb1ec`（起止复算一致）
- 范围: 只复核 DEP-R1-S01/G01 及页面不导入开发依赖、缺包 fail-closed 的直接回归。
- 结论: 通过
- 阻断 / 严重 / 一般 / 建议: 0 / 0 / 1 / 0
- Reviewer 已完成并释放。

| ID | 级别 | 发现 | 主 Agent 裁决与修复 |
|---|---|---|---|
| DEP-R2-G01 | 一般 | `validateBytes` 不返回 `validatorVersion` 时仍用包版本兜底，与“版本证据必须真实存在”不完全一致 | 接受；新增 `requireOfficialValidatorVersion()`，强制返回值为非空字符串且等于安装包版本，并增加缺失/空串失败关闭测试 |

修复后执行 `node tools/test-stele-model-publish.mjs`，22/22 通过；该修复未新增依赖或改变 H5 运行时。
