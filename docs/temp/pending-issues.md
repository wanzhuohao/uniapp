# 碑文排版 - 待解决问题

> 最后更新: 2026-05-31

---

## ⚠️ [待验证] html2canvas 导出 PNG 的楷体兼容性

引入霞鹜文楷 Web Font（npmmirror CDN）。`WordPreview.exportImage()` 用 html2canvas 截取 `.word-area` 导出 PNG。**未实测**跨画布字体是否降级为系统 STKaiti/KaiTi。

- 验证方法：下单编辑页 → 填内容 → 点"保存图片" → 检查 PNG 中大字是否霞鹜文楷笔锋
- 若失败方案：
  - A. `document.fonts.load("16px 'LXGW WenKai Screen'")` 等字体就绪后再截图
  - B. html2canvas `onclone` 回调注入 `@font-face`
  - C. 预览区改用系统楷体栈（去掉 LXGW WenKai）

## ⚠️ [兼容性备注] backdrop-filter

下单页底部操作栏用了 `backdrop-filter: blur(6px)`，Safari 15.4 以下不支持。表现：半透明失效、底栏变纯不透明底。非 blocking，不需要主动处理。
