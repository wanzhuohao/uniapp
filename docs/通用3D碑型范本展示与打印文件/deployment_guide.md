# 通用3D碑型范本展示与打印文件 · 部署手册

- 日期: 2026-09-03
- 环境: 前端网页托管（先准上线/测试地址验证，再由用户决定生产发布）
- 代码版本: `uniapp` / `feature/generic-stele-models` / 当前尚未提交；部署前必须替换为与完整自测一致的 commit SHA
- 部署范围: 老万石雕 UniApp H5 前端静态包；不部署云函数、数据库或后台服务

## 一、变更清单

| 类型 | 目标 | 操作 | 具体内容 | 不涉及说明 |
|---|---|---|---|---|
| 应用服务 | 后端/云函数 | 不适用 | 无 | 不新增或修改 API、云函数 |
| 前端 | `uniapp` H5 | 升级 | 新增首页 No.02、`pages/stele/models.vue`、静态范本配置与不可变 GLB/STL release | 不修改现有 `pages/stele/preview.vue` 业务语义 |
| 配置中心 | Nacos/uniCloud 配置 | 不适用 | 无 | 范本配置随前端包编译，不是环境配置 |
| MySQL DDL | 数据库 | 不适用 | 无 | 无数据库变更 |
| MySQL DML | 数据库 | 不适用 | 无 | 无数据修复或初始化 |
| Redis/MongoDB | 缓存/数据库 | 不适用 | 无 | 不使用 |
| MQ/XXL-Job | 消息/调度 | 不适用 | 无 | 不使用 |
| 网关/Nginx/负载均衡 | 静态托管 | 不适用 | 沿用现有 hash 路由和静态资源路径 | 不新增域名、转发或白名单 |
| 其他外部依赖 | 构建校验 | 新增 | 精确开发依赖 `gltf-validator@2.0.0-dev.3.10`，只在本地发布门禁使用 | 不进入 H5 运行依赖；不直连打印机 |

## 二、部署前检查

- [ ] 当前 commit SHA 与 `test_report.md` 完整自测版本一致，工作区没有未纳入构建的本需求代码
- [ ] `npm ls gltf-validator --depth=0` 精确为 `2.0.0-dev.3.10`，`npm ls --omit=dev --depth=0` 未新增运行依赖
- [ ] `node tools/stele-models/validate-and-publish.mjs --build-guard` 返回 `exitCode=0`
- [ ] `.stele-publish/active` 不存在，`source-photos` 为空
- [ ] 配置 releaseId 为 `classic-v1-9b5d9060bd06`，仓内 GLB/STL 完整 SHA 与报告一致
- [ ] 配置中心、数据库、缓存、MQ、调度、网关、白名单、权限和日志配置均确认不适用
- [ ] 已准备上一版可用 H5 静态包或对应 commit，具备网页托管回滚权限

## 三、部署顺序

1. 在 `D:\code\uniapp-unpacked\uniapp` 切到已完整自测的 commit；需要安装依赖时使用 npm 国内镜像后执行 `npm install`。
2. 运行 `node tools/stele-models/validate-and-publish.mjs --build-guard`，失败立即停止，不打开 HBuilderX 发行。
3. 使用 HBuilderX“发行 → 网站-H5 手机版”导出 Web，输出目录必须是 `D:\code\uniapp-unpacked\uniapp\unpackage\dist\build\web`；不得从资源管理器直接打开验证。
4. 对构建产物运行带输出目录的门禁：

   ```powershell
   node --input-type=module -e "import {buildGuard} from './tools/stele-models/validate-and-publish.mjs';const r=await buildGuard({buildOutputDir:'./unpackage/dist/build/web'});console.log(JSON.stringify(r));process.exitCode=r.exitCode"
   ```

5. 回查构建包包含 `classic-v1-9b5d9060bd06` 三文件，GLB SHA 为 `aa0a390b3f893d883ce33d878e283f45dc5bc29fd5e82fd0fd356de6a8a4f6bd`，STL SHA 为 `409a716fcd8be4bb2b2d179abac594829552d01870414f1ee9292159b4e9030d`。
6. 先把完整静态包部署到测试/准上线地址；部署由用户执行，本流程不自动上传。
7. 完成 `test_report.md` 中浏览器、下载、Bambu 和性能硬门禁后，再由用户决定是否替换生产前端网页托管静态包。

## 四、部署后验证

| # | 验证项 | 操作/请求 | 预期结果 | 证据 |
|---|---|---|---|---|
| 1 | 首页入口 | 打开 `<base>/#/`，点击 No.02 | 进入独立“3D 碑型范本”页并可返回 | 页面截图/录屏 |
| 2 | GLB 资产 | GET `<base>/static/models/stele/releases/classic-v1-9b5d9060bd06/stele-template-classic-v1.glb` | HTTP 200，10,188 bytes，SHA 与冻结值一致 | URL、状态、响应头、SHA |
| 3 | STL 资产 | GET `<base>/static/models/stele/releases/classic-v1-9b5d9060bd06/stele-template-classic-v1.stl` | HTTP 200，6,684 bytes，SHA 与冻结值一致 | URL、状态、响应头、SHA |
| 4 | 页面功能 | 旋转、缩放、重置、全屏、失败重试、下载 | 均符合 T03～T08；页面文案不宣称照片复刻 | 页面证据、控制台、HAR |
| 5 | 数据边界 | 检查页面 Network/Storage | 无订单云函数、上传或第三方建模请求，无订单/草稿 Storage 变更 | HAR、Storage 前后快照 |
| 6 | 回归 | 进入一条既有订单的个性化 3D 预览 | 原预览仍按订单渲染 | 页面截图；只读订单 |

## 五、监控观察

- 观察窗口: 部署后至少 30 分钟；首轮主动验证覆盖冷缓存和重复缓存两种访问
- 关键指标/日志: 静态资源 404/5xx、GLB/STL 响应字节与 SHA、浏览器控制台 GLTF/WebGL/Promise 错误、页面首次可交互耗时、下载失败提示
- 异常判定与联系人: 任一模型 404/哈希不一致、指定浏览器无法加载、桌面超过 1.5 s 或 Pixel 7 Fast 3G 超过 3.0 s、出现照片/订单/上传请求即停止发布并由部署操作人执行回滚

## 六、回滚方案

1. 停止继续扩大静态包发布范围，把网页托管恢复为部署前已验证 H5 静态包或对应 commit 的重新导出包。
2. 清除或等待 CDN 页面入口缓存失效后，验证首页、订单列表、既有个性化 3D 预览和静态资源均回到上一版。
3. 不删除 `static/models/stele/releases/classic-v1-9b5d9060bd06`；不可变 release 无页面引用时不会影响旧版本，删除不属于回滚动作。

- 数据是否可回滚: 不适用；无数据库、缓存、云函数或业务数据变更
- 回滚后验证: 首页可打开、订单只读查询正常、既有个性化 3D 预览正常、控制台无新增资源错误
