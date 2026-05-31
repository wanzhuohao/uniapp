# 碑文排版 - 待修问题清单

> 最后更新: 2026-05-29
> 2026-04-20 精简：语文/面试/相册/用户系统相关条目全部已随模块删除失效，历史可查 git log（删除前版本包含 P0/P1/P2 完整列表）

---

## 2026-05-29 飞机肉鸽 — 难度曲线后续

> 难度曲线长尾化 + 子弹大小 + 磁吸三项已上(详见 progress.md §2026-05-29 第 1 节)。**剩余可选方向**:
> - boss 节点(每 90-120s 一只高血厚甲)作"阶段标尺"
> - 同屏 enemy 上限 cap + 上限本身随时间抬高
> - 周期性"波次"瞬时多生成(每 60s 一波)
> - 子弹速度 / 敌弹密度 / 弹幕花样加 elapsed 系数,避免后期只是 HP 海

---

## 2026-04-21 UI 重构后遗留

### ⚠️ [待验证] html2canvas 导出 PNG 的楷体兼容性
本次引入霞鹜文楷 Web Font（通过 npmmirror CDN）。`WordPreview.exportImage()` 用 html2canvas 截取 `.word-area` 导出 PNG。**未实测**跨画布字体是否降级为系统 STKaiti/KaiTi。
- 验证方法：下单编辑页 → 填内容 → 点"保存图片" → 检查 PNG 中大字是否霞鹜文楷笔锋
- 若失败方案：
  - A. 在 `WordPreview` 强制 `document.fonts.load("16px 'LXGW WenKai Screen'")` 等字体就绪后再截图
  - A2. html2canvas 的 `onclone` 回调中注入 `@font-face`
  - B. 预览区纯用系统楷体栈（去掉 LXGW WenKai），牺牲安卓以保证导出一致

### ⚠️ [兼容性备注] backdrop-filter
下单页底部操作栏用了 `backdrop-filter: blur(6px)`，Safari 15.4 以下不支持。表现：半透明失效、底栏变纯不透明底。非 blocking，不需要主动处理。

---

## 已修复

### ✅ [P1-5] stele/list.vue 云端响应未做错误分支校验（2026-04-20 修）
`fetchList` 早已补齐校验；`order-delete` 调用也补了 `res.result.code` 判断，失败不再误报"已移除"。

### ✅ [P2-6] stele/preview.vue Three.js 资源释放（2026-04-20 确认 + 加固）
`onBeforeUnmount` 已完整释放 animationFrame / geometry / material / texture / controls / renderer / resize 监听。本次补齐 `renderThreeStele` 内部重渲染分支的 `cancelAnimationFrame`（防御 double-animate）。

### [误判已澄清] 3D 预览手势
`preview.vue` 用的 `OrbitControls`（three.js 内置）默认支持触屏 two-finger pinch zoom + 单指旋转，无需额外开发。

---

## 云资源用量

原"云函数调用量偏高"预警（2026-04-10）随语文/面试/相册删除已不再适用。当前仅 `order-delete/query/update` 3 个低频函数 + `order` 集合，用量无压力。
