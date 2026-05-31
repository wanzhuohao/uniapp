# 碑文排版 项目概要

> 项目路径: `C:\claude code\uniapp`
> 技术栈: UniApp Vue3 + uniCloud-alipay
> 状态: **已上线**
> 域名: https://env-00jxhanvoaj1-static.normal.cloudstatic.cn/
> 品牌: **老万石雕**

## 模块

- **碑文排版**（stele）—— 唯一业务模块，支持 3D 预览、订单管理

> **已迁移/删除的模块**
> - 飞机大战（2026-05-31）：迁至 `uniapp-aliyun/pages/games/plane/`
> - 数学模块（2026-04）：迁至 `uniapp-aliyun`
> - 语文练习（2026-04-17）：迁至 `uniapp-aliyun`
> - 面试模块（2026-04-20）：已删除
> - 相册模块（2026-04-20）：已删除
> - 用户系统（2026-04-20）：已删除

## 目录结构

```
pages/stele/           # 订单列表、编辑、预览、帮助
components/stele/      # WordPreview 预览组件
utils/stele/           # 排版工具、CSS
composables/stele/     # useOrderForm
utils/common/          # toast 等公共工具
uniCloud-alipay/
  cloudfunctions/      # order-delete / order-query / order-update
  database/            # order.schema.json
```

## 保留的云资源

- 云函数：`order-delete`、`order-query`、`order-update`
- 数据库集合：`order`

## 相关文档

- `progress.md` — 开发进度（按日期倒序）
- `pending-issues.md` — 待解决问题
- `online-test-checklist.md` — 线上自测清单
- `testing-notes.md` — 测试注意事项
