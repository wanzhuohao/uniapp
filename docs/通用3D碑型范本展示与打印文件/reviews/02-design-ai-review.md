# 通用3D碑型范本展示与打印文件 · 02-设计 AI 评审报告

- 评审日期: 2026-09-03
- 初评 Agent: `/root/generic_3d_no_photo_design_r1`
- AI 评审模式 / 强度: 默认 / 标准
- 评审构成: 1 个通用 Agent 合并覆盖安全与权限、契约与依赖、发布与生产专项
- 上下文隔离方式: Codex `fork_turns="none"`
- 轻量加载方式: 原生 Agent（项目指令自动注入: 是）
- 评审档位: R3
- 评审时间预算: 默认 45 分钟（开始: 15:10:00；截止: 15:55:00；实际结束: 15:13 前）
- 当前结论: 两轮均未通过；末轮阻断已由主 Agent 修订，按评审上限待人工确认
- 当前有效轮次: 第 2 轮
- 第 1 轮 manifest: `30e8546a80c130682a348f0522dd58219d8498fca65bdf95d171386bb1dc290b`（Agent 自复算匹配）

## 第 1 轮范围与快照

- 受审：requirement、design、两份 research，以及非 Git 原型根的 7 个文件。
- 未纳入：progress、评审历史、业务代码、正式 exports/static 资产。
- 仓库 base/HEAD：`ee297cb55bdb854867694bbaf76976d77b542191`；02 无已提交代码，committed/worktree diff 均为空哈希。
- 原型证据：132 面、0 纹理、GLB 10,188 bytes、STL 6,684 bytes、共同 geometry SHA-256。

## 第 1 轮全量初评

- 结论: 不通过
- 阻断: 2
- 严重: 3
- 一般: 1
- 建议: 0
- Reviewer 已完成并释放。

| ID | 级别 | 发现 | Reviewer 建议 |
|---|---|---|---|
| D-R1-B01 | 阻断 | 安全策略与报告契约未真正闭合：缺工具版本、checks/错误枚举、规范 JSON 和预期 policy hash，且 name 规则矛盾 | 给出完整闭合 policy/report/error 契约并统一 name 规则 |
| D-R1-B02 | 阻断 | 目录切换后才写最终报告，崩溃可使未绑定资产可见；恢复状态机和首次发布未定义 | 报告切换前生成回读；穷举事务状态，未提交状态恢复旧集合 |
| D-R1-S01 | 严重 | 暂存/备份/日志位于公开 `static` 树，残留物可能进入 H5 构建 | 事务区移到 static 外；构建前残留门禁 |
| D-R1-S02 | 严重 | 异步 A/B 模型乱序或卸载后回调可覆盖状态、重启循环或泄漏 GPU | 请求代次 + 可取消请求 + 过期结果自释放；补竞态测试 |
| D-R1-S03 | 严重 | 同名 URL/CDN 缓存及生产部署可造成旧 GLB + 新 STL 混批 | 使用不可变版本 URL/单一版本引用；补线上哈希与回滚步骤 |
| D-R1-G01 | 一般 | 移动端性能只冻结 DevTools 模拟，缺实际手机型号/系统/浏览器 | 进入 03 前补物理手机环境 |

## 主 Agent 裁决

- 裁决人 / 日期: 主 Agent / 2026-09-03
- D-R1-B01/B02/S01/S02/S03：全部修复。原因是它们直接影响安全、发布一致性或 AC-08/09，且可在既定范围内最小收口。
- D-R1-G01：进入 04 真实设备待办，不阻塞 02。需求要求移动 H5 环境而未限定物理设备，02 已冻结可复现的 DevTools 环境；04 在用户可用手机上补充型号、系统、浏览器与三次冷加载证据，如真机结果更差则按更差结果判定。
- 需用户决策: 无。

## 修复不变量矩阵

| 发现 | 目标不变量 | 相邻不变量 | 权威源 | 反例与组合回归 |
|---|---|---|---|---|
| D-R1-B01 | 策略/报告只有唯一机器解释 | 未知项默认拒绝、报告无敏感路径 | 冻结 policy/schema/error JSON + SHA | 未知字段/错误码/name 反例；合法报告 schema 回归 |
| D-R1-B02/S01 | 失败或崩溃不改变已发布集合，内部状态不进 static | 首次发布与成功发布可完成 | 版本目录 + 私有事务 journal | 复制/报告/rename/marker 各时点崩溃及启动恢复 |
| D-R1-S02 | 只有当前请求可更新页面/启动循环 | 切换、重试、卸载仍释放资源 | requestGeneration + AbortController | A/B 乱序、卸载后成功、连续重试 |
| D-R1-S03 | 同一页面配置始终引用同批 GLB/STL | CDN 缓存和回滚不造成错配 | 不可变 releaseId 路径 + build guard | 旧/新 JS 缓存组合、线上 GET/hash 回查、回指旧 release |

## 第 2 轮定向复审

- 复审 Agent: `/root/generic_3d_no_photo_design_r2`
- 状态: 不通过；Reviewer 已完成并释放
- 第 2 轮 manifest: `3f1877fa9f2a04d9c1c68181a743b1c17fad5dd96a6ec4d4b3d7f35660533f94`（Agent 起止复算匹配）
- 范围: D-R1-B01/B02/S01/S02/S03、精确设计差异及直接影响；不重新全量发散。

| 级别 | 数量 | 结论 |
|---|---:|---|
| 阻断 | 1 | D-R1-B02 未完全关闭 |
| 严重 | 0 | D-R1-S01/S02/S03 均关闭 |
| 一般 | 0 | 未发现直接回归；物理手机沿用第 1 轮裁决转 04 |
| 建议 | 0 | 无 |

### 第 2 轮核验结果

- D-R1-B01：关闭。policy/schema/error 三份闭合契约、哈希、26 项 checks、15 组错误码/消息和首版禁用全部 GLB `name` 均一致。
- D-R1-B02：未完全关闭。`targetBeforeSha256`/`targetAfterSha256` 缺唯一集合哈希算法；已有同 release 的幂等路径在 `STAGED + stage/目标同时存在` 崩溃组合中无法自动恢复，journal 也未记录发布前目标是否存在。
- D-R1-S01：关闭。事务区在 `static` 外，build guard 阻断未提交事务。
- D-R1-S02：关闭。请求代次、abort、卸载与过期结果自释放契约完整。
- D-R1-S03：关闭。不可变 release URL、单一配置引用、线上哈希和回滚链路完整。

## 末轮后主 Agent 修订

- 修订日期: 2026-09-03
- 裁决: 接受 Reviewer 对 D-R1-B02 的判断并修复，不接受带风险进入 03。
- 集合哈希：报告只排除两个自引用 target 字段后执行 RFC 8785 JCS，生成 `reportProjectionSha256`；releaseId 与投影摘要按 ASCII 排序逐行计算公开集合 SHA-256，空集合为 SHA-256 空字节串。
- 幂等与事务：已有同 release 在创建 active/journal 前完成完整验证并 no-op，正常事务只允许 `targetExistedBefore=false`；唯一 `.stele-publish/active` 作为原子单写者锁。
- 恢复：穷举 PREPARING/STAGED/PUBLISHED 的 stage/目标组合；正常 rename 后未提交状态可按 journal 投影和 after 集合证明后删除本事务目标、回到 before；不可能或无法证明的组合返回 4。
- 测试：补首次发布、幂等 no-op、同 release 冲突、状态表全组合和 target/report 投影篡改故障注入。
- 说明: 上述修订发生在第 2 轮结束后，未获得新的独立 Reviewer 结论；按 dev-flow 单审核项最多 2 轮的上限，不创建第 3 轮。

## 当前门禁

- 剩余阻断: Reviewer 末轮阻断已修订，但修订结果尚待人工确认
- 剩余严重: 无
- 一般待办: D-R1-G01 转 04 物理手机补充验证
- 02 出口: 暂停；评审轮次已用满，不能由主 Agent 自审替代独立评审。人工确认末轮修订后方可进入 03
