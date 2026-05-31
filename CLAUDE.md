# CLAUDE.md — 老万石雕（碑文排版）

## 项目概述

碑文在线排版下单系统，支持 3D 预览、订单管理、飞机肉鸽小游戏。

## 技术栈

- UniApp Vue3
- Element Plus
- Three.js（3D 预览）
- html2canvas（打印导出）
- uniCloud-alipay（云函数）

## 目录结构

```
uniapp/
├── pages/
│   ├── stele/          # 碑文业务（index/list/detail/preview/help）
│   └── game/plane/     # 飞机肉鸽游戏
├── components/
│   └── stele/WordPreview.vue
├── composables/
│   └── stele/useOrderForm.ts
├── utils/
│   ├── stele/stele-utils.ts
│   └── common/toast.js
├── types/order.ts
└── uniCloud-alipay/cloudfunctions/
    ├── order-delete/
    ├── order-query/
    └── order-update/
```

## 构建与运行

```bash
npm install
# HBuilderX → 运行到浏览器 / 发行到前端网页托管
```

## 开发规范

- 所有页面 `navigationStyle: custom`
- CSS 变量：`--paper-*` / `--ink-*` / `--gold-*`
- Element Plus 全局覆盖用 `!important` 穿透 scoped
- 打印用 html2canvas 转图片
- 印章式 Toast：`utils/common/toast.js`
- 存储用 `uni.getStorageSync/setStorageSync`，固定 key

## 线上地址

https://env-00jxhanvoaj1-static.normal.cloudstatic.cn/
