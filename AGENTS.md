# AGENTS.md

本文件适用于当前 `uniapp` 仓库。上级工作区规则仍然生效；进入仓库后，还应先阅读 `CLAUDE.md`、`progress.md`，并按任务读取 `docs/` 下相关设计或测试记录。

## 项目定位

这是“老万石雕”碑文在线排版和订单管理项目，面向 UniApp H5，使用 Vue 3。主要能力包括碑文录入、亲属与日期信息编排、名单拖拽排版、预览图片导出、3D 墓碑预览，以及订单的新增、查询、更新和删除。

技术组成：

- UniApp + Vue 3 Composition API
- Element Plus：表单、弹窗等桌面端 H5 组件
- `vuedraggable`：碑文名单拖拽排序
- `html2canvas`：碑文预览转图片
- Three.js：墓碑 3D 预览
- 支付宝版 uniCloud：`order` 集合和订单云函数

## 代码结构与职责

```text
pages/index/index.vue                  总入口
pages/stele/index.vue                 新建碑文订单
pages/stele/list.vue                  订单查询、搜索、分页和删除
pages/stele/detail.vue                编辑已有订单
pages/stele/preview.vue               Three.js 3D 预览
pages/stele/help.vue                  操作说明
components/stele/WordPreview.vue      二维碑文排版及图片导出
components/stele/SmallTextPreview.vue 手机名单步骤固定的小字实时预览
composables/stele/useOrderForm.ts      表单状态、日期归一化、校验、草稿和保存
utils/stele/stele-utils.ts             日期、称谓和排版工具
utils/common/toast.js                 印章式 Toast
types/order.ts                        订单、表单、预览和保存载荷类型
uniCloud-alipay/database/             order schema 和索引说明
uniCloud-alipay/cloudfunctions/       order-query/update/delete
```

`pages.json` 是页面注册的唯一入口；所有现有页面都使用 `navigationStyle: custom`。新增页面时必须同时登记路由，并沿用自定义导航样式。

## 核心数据流

1. `pages/stele/index.vue` 和 `detail.vue` 通过 `useOrderForm()` 管理同一套表单行为。
2. `useOrderForm.ts` 把自由格式日期转换为存储格式，生成 `PreviewData` 和 `SavePayload`，并通过 `order-update` 保存。
3. `pages/stele/list.vue` 调用 `order-query` 获取列表或单条记录，调用 `order-delete` 删除订单。
4. `WordPreview.vue` 负责二维展示和 `html2canvas` 导出；`preview.vue` 单独负责 Three.js 场景。
5. `order.schema.json` 禁止客户端直接读写，订单访问必须经过云函数。

调整订单字段时，必须同时核对以下位置，不能只改页面：

- `types/order.ts`
- `composables/stele/useOrderForm.ts`
- 新建页、详情页、列表页和预览组件的使用点
- `order-update` 的字段白名单
- `order-query` 的搜索和返回逻辑
- `uniCloud-alipay/database/order.schema.json`

新增与更新由 `order-update` 的 `id` 判断区分：`id` 为 `''`、`undefined` 或 `null` 时新增，否则更新。不要改变这个边界而不补对应验证。

## 开发约定

- 项目是 Vue 3，页面优先使用 Composition API；不要引入 Vue 2 Options API 假设。
- 表单共同行为放在 `useOrderForm.ts`，不要在新建页和编辑页复制两套日期、校验或保存逻辑。
- 订单结构以 `types/order.ts` 为准；新增字段要保持前端类型、保存载荷和云函数白名单一致。
- 全局视觉变量定义在 `App.vue`，优先复用 `--paper-*`、`--ink-*`、`--gold-*`、`--vermilion-*`，不要在页面另建冲突色板。
- Element Plus 的全局覆盖集中在 `App.vue`；页面局部样式保持 `scoped`，确需覆盖弹层时再使用全局选择器或深度选择器。
- 提示统一走 `utils/common/toast.js`；不要混入另一套无必要的提示组件。
- 预览排版规则同时影响屏幕显示和图片导出，修改 `WordPreview.vue` 后必须验证两种结果。
- Three.js 页面必须在卸载时释放监听器、动画帧、几何体、材质、纹理和 renderer，避免重复进入页面后泄漏。
- 不直接修改 `node_modules/`、`unpackage/`；它们是依赖或构建产物。
- 不在代码、文档、云函数或提交记录中写入 uniCloud 密钥及其他凭证。

## 构建与运行

`package.json` 当前有碑文专项测试脚本，但没有 `dev`、通用 `test` 或 `build` 脚本。不要声称存在 `npm run dev`、`npm test` 或 `npm run build`。

现行测试命令：

```powershell
npm run test:stele-sfc
npm run test:stele-save-runtime
npm run test:stele-local-workflows
npm run test:stele-regressions
node tools/test-order-cloudfunctions.mjs
```

Node/npm 已在 PowerShell PATH。首次安装依赖时使用：

```powershell
npm install
```

开发和发行使用 HBuilderX：

- 运行到浏览器：用于 H5 页面联调
- 发行到前端网页托管：用于正式 H5 构建
- 云函数上传/部署：必须有明确外部写授权；可把多个云函数、环境和部署步骤组成不可变清单一次批准，逐项回查后自动继续，不要求每个函数或步骤单独确认

## 验证要求

仓库已有上节列出的碑文自动化测试脚本。修改后先执行直接覆盖问题的最小测试，再按影响范围完成以下检查，并如实区分静态检查、浏览器验证和云端验证：

- 首页及所有受影响路由可正常进入、返回。
- 新建页与编辑页的父母信息、日期、立碑日期和名单增删/拖拽行为一致。
- 草稿 `stele-draft` 的保存、恢复、清除符合预期。
- 二维预览、PNG 导出和 3D 预览分别验证。
- 涉及订单字段或云函数时，检查新增、单条查询、分页/关键词查询、更新和删除完整链路。
- 云端测试会写入或删除订单数据，必须先展示测试数据、目标环境、清理方式和副作用并取得明确授权；同一份固定测试清单可一次批准全部写入、验证和定向清理，逐项回查。新增数据、扩大删除范围或结果不一致时立即停止并重新确认。

浏览器或 HBuilderX 未实际运行时，只能报告“代码检查完成”，不得报告“功能正常”或“自测通过”。

## 文档与仓库卫生

- 当前开发进度维护在根目录 `progress.md`；设计、计划和测试记录在 `docs/`。
- 需求范围之外不要顺手整理历史文档或重构页面。
- 提交前排除 `node_modules/`、`unpackage/`、本地日志、临时截图和无关文档。
- `CLAUDE.md` 与本文件描述冲突时，以实际代码和用户当前指令为准，并在任务中指出差异。
