# 通用3D碑型范本展示与打印文件 · 01-需求 STL 字段最小修复 AI 评审报告

- 评审日期: 2026-09-03
- 初评 Agent: `generic_3d_stl_attr_minfix_r1`
- 复审 Agent: `generic_3d_stl_attr_minfix_r2`
- AI 评审模式 / 强度: 默认 / 标准
- 评审构成: 1 个通用 Agent 合并覆盖安全与权限、格式契约和跨工作域发布边界
- 上下文隔离方式: Codex `fork_turns="none"`
- 轻量加载方式: 原生 Agent（项目指令自动注入: 是）
- 评审档位: R3
- 评审收敛策略: 新审核项最多 2 轮；第 2 轮通过并退出
- 评审时间预算: 默认 45 分钟
- 冻结验收矩阵: 二进制 STL 每三角面 attribute byte count、通过报告非零计数、AC-09 对应恶意反例；相邻安全与功能不变量
- 当前结论: 通过
- 当前有效轮次: 第 2 轮
- 当前快照核验模式: Agent 自复算
- 第 2 轮 manifest SHA-256: `a8a9f375b26856230c6d98f8441d7b92b673431abdbcad53e5681d70ef4a199b`

## 新审核项授权与边界

前一最小修复审核项使用满 2 轮后，仅剩二进制 STL 每三角面末尾 2 字节 attribute byte count 未闭合。2026-09-03 用户明确授权后续由 Agent 自行判断；主 Agent据此在不接受风险、不扩大功能且不执行外部写入的前提下，新开本审核项。

- 修改范围: requirement 的 STL 安全条款与 AC-09，对应 research 格式证据和决定。
- 不纳入范围: 其他 GLB/PNG/STL 规则、页面设计、代码实现、模型生成、照片读取、复制/删除、提交、推送、部署。
- 目标不变量: 二进制 STL 每个三角面末尾 2 字节字段只能为 `0x0000`，非零必须使整批发布失败。
- 相邻不变量: 已通过复审的 JSON/GLB/PNG/目录/原子复制门禁不变；不补拍、不上传/云端建模、不自动删除、不直连打印机；GLB 展示与 STL 打印格式不变。
- 唯一权威源: requirement 安全—STL 容器条款与 AC-09。
- 原问题反例: 二进制 STL 的头部匿名、总长度满足 `84 + 50 × N` 且 EOF 正常，但某一三角面的 attribute byte count 非零，旧门禁仍通过。
- 组合回归: 合法全零 STL 通过；任一三角面非零时报告计数非零、退出码非零、整批不复制且 UniApp 目标目录哈希不变；Bambu Studio 导入/尺寸/切片契约保持。

## 第 1 轮冻结快照

- 仓库 / HEAD: `D:/code/uniapp-unpacked/uniapp` / `ee297cb55bdb854867694bbaf76976d77b542191`
- base: 同 HEAD；审核语义材料均未跟踪，预期提交集合为空，两层规范 diff 均为空哈希。
- requirement SHA-256: `39e1122b04a21a0ceaff05774c88e5032d2a35f9f2b440bcbc1fa67f7429509c`
- research SHA-256: `feaa53262b21a53e6fd365fed1ba2a9be094aa1cc6a78fb97fab9a9fa64076d6`
- 非 Git 工作域: `D:/code/3d-models/stele`，文件清单为空。
- manifest SHA-256: `c04fd35b4f0d6838334a3a082487864f19875cb5d108c8ed29360b8b088dfb85`
- 核验: Agent 评审前后各复算一次，全部字段匹配。

## 第 1 轮全量初评

- 结论: 不通过；阻断 0、严重 1、一般 0、建议 0。
- Agent 状态: 结果已捕获，并由主 Agent 调用 `interrupt_agent` 释放。

| ID | 级别 | 发现 / 证据 | Reviewer 建议 | 主 Agent 裁决 / 修复 |
|---|---|---|---|---|
| STL-R1-S01 | 严重 | AC-09 的合法样本未锁定为逐面全零的二进制 STL；错误实现可拒绝全部二进制 STL，再用 ASCII STL完成正例与 AC-05 | 固定同一份全零二进制 STL，贯穿报告、复制、下载和 Bambu 验收 | **修复**；AC-05/AC-09 与 research 增加逐面全零、非零计数为 0、退出码 0、复制成功、四处 SHA-256 一致和同文件完成导入/尺寸/切片 |

### 定向复审不变量

- 目标不变量: 非零 attribute byte count 必须失败，同时合法逐面全零二进制 STL 必须完整通过发布与打印链路。
- 相邻不变量: 其他安全门禁及目录、照片、云端、删除、打印机边界均不变。
- 唯一权威源: requirement AC-05、STL 安全条款与 AC-09；research 同步正向回归和实现/自测追踪。
- 原反例: 扫描器拒绝全部二进制 STL，却用 ASCII STL 通过合法正例和 Bambu 验收。
- 组合回归: 同一全零二进制 STL 从报告 SHA-256 → exports → UniApp → 页面下载 → Bambu Studio；非零反例仍必须非零退出、整批不复制、目标目录哈希不变。

## 第 2 轮定向复审

- 快照核验: base/HEAD、空预期提交集合、两层空 diff、两个未跟踪文件哈希与非 Git 空文件清单全部匹配；manifest 为 `a8a9f375...a199b`。
- 原严重项: 已关闭。AC-05 与 AC-09 已固定同一份逐三角面全零的合法二进制 STL，并以报告、exports、UniApp、页面下载四处 SHA-256 串联至 Bambu Studio 导入、尺寸与切片；非零反例继续验证失败退出与整批不复制。
- 相邻不变量: 其他安全门禁、目录层级、不补拍、不上传/云端建模、不自动删除、不直连打印机、GLB 展示与 STL 打印交付均保持。
- 分级计数: 阻断 0、严重 0、一般 0、建议 0。
- 结论: 通过。
- Agent 状态: 结果已捕获，并由主 Agent 调用 `interrupt_agent` 释放。

## 当前阶段出口审核

- 关联 AI 轮次: 第 2 轮
- 审核状态: 通过
- 审核人 / 日期: 主 Agent / 2026-09-03
- 意见: 根据用户后续 Agent 自主判断授权，01 出口 checklist 满足且无未决风险接受或外部写授权，判断通过并进入 02。
