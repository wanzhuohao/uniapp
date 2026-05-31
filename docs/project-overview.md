# 碑文排版 项目概要

> 项目路径: `D:\code\uniapp`
> 技术栈: UniApp Vue3 + Pinia + uniCloud-alipay
> 状态: **已上线**
> 域名: https://env-00jxhanvoaj1-static.normal.cloudstatic.cn/

## 模块

- **碑文排版**（libei）—— 唯一保留的业务模块

> **历史变更**
> - 数学模块（2026-04 前）：迁至独立项目 `D:\code\uniapp-aliyun`
> - 语文练习模块（2026-04-17）：迁至 `D:\code\uniapp-aliyun` 纯前端版
> - 面试模块（2026-04-20）：已删除
> - 相册模块（2026-04-20）：已删除
> - 用户系统（2026-04-20）：已删除（碑文无需多用户）
> - 口算模块：已删除

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
