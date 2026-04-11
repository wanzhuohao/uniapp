# Toast Wrapper 统一提示组件 设计

> 日期：2026-04-11
> 状态：待评审 → 实施
> 关联：方案二第 2 项第 2 小节（基础设施批次）

## 背景

项目中 `uni.showToast` / `uni.showLoading` / `uni.hideLoading` 散落在 16 个文件共 99 处调用。每处都写完整参数对象，容易：

- 不同调用点参数风格不一（duration 有写 1500、2000、3000 的，也有不传的）
- 成功/错误的 `icon` 和消息经常对不上（比如 "保存失败" 用 `icon: 'success'`）
- 未来若要加日志、埋点、节流，需改所有调用点

## 目标

抽一个薄 wrapper `utils/common/toast.js`，统一 5 个方法 API，一次性迁移 99 处调用。

**非目标**：
- 不改 `stele/detail.vue` 及 `useOrderForm.ts` 的 `ElMessage.xxx`（PC 端 Element Plus，不同交互范式）
- 不改 `uni.showModal` 确认弹框（对话框语义，不是 toast）
- 不做错误上报 / 不做日志
- 不做 TypeScript 类型定义（项目主体是 JS）

## 范围

### In scope

所有 `uni.showToast(...)`、`uni.showLoading(...)`、`uni.hideLoading(...)` 调用。分布：

| 文件 | showToast 次数 | loading 次数 |
|------|-----|-----|
| pages/study/data-admin.vue | 8 | ~3 |
| pages/stele/photo.vue | 10 | - |
| pages/stele/index.vue | 12 | - |
| pages/stele/list.vue | 4 | - |
| pages/interview/settings.vue | 6 | - |
| pages/interview/index.vue | 6 | ~3 |
| pages/interview/practice.vue | 6 | ~3 |
| pages/interview/exam-result.vue | 1 | - |
| pages/interview/record-detail.vue | 1 | - |
| pages/index/index.vue | 2 | - |
| pages/study/learn.vue | 1 | - |
| pages/study/mental-math.vue | - | - |
| store/game.js | 1 | - |
| 其他 | 少量 | - |

### Out of scope

- `composables/stele/useOrderForm.ts`、`pages/stele/detail.vue` 的 `ElMessage.success/error/warning/info` 调用 — 桌面编辑器专用，不变
- `uni.showModal` 确认对话框 — 不同交互范式
- `uni.showActionSheet`（未使用）

## 组件 API

### 文件：`utils/common/toast.js`

```js
// utils/common/toast.js
// 薄 wrapper，统一封装 uni.showToast / uni.showLoading / uni.hideLoading
// 不做响应式，不做日志，不做埋点

const DEFAULTS = {
  success: 1500,
  error: 2000,
  info: 1500,
}

export const toast = {
  /**
   * 成功提示，绿色对勾图标
   * @param {string} msg
   * @param {number} [duration]
   */
  success(msg, duration) {
    uni.showToast({
      title: String(msg ?? ''),
      icon: 'success',
      duration: duration ?? DEFAULTS.success,
    })
  },

  /**
   * 错误提示，红色叉图标。
   *
   * **uniapp H5 限制**：`icon: 'error'` 的 title 最长 7 个汉字，超过会自动降级为
   * 无图标的纯文字。本 wrapper 内部检测长度 >7 时主动降级为 `icon: 'none'`，
   * 保持"长错误消息无图标"的一致视觉。短错误（≤7 字）仍保留红叉。
   *
   * @param {string} msg
   * @param {number} [duration]
   */
  error(msg, duration) {
    const title = String(msg ?? '')
    uni.showToast({
      title,
      icon: title.length <= 7 ? 'error' : 'none',
      duration: duration ?? DEFAULTS.error,
    })
  },

  /**
   * 信息 / 警告提示，纯文字无图标
   * @param {string} msg
   * @param {number} [duration]
   */
  info(msg, duration) {
    uni.showToast({
      title: String(msg ?? ''),
      icon: 'none',
      duration: duration ?? DEFAULTS.info,
    })
  },

  /**
   * 显示加载。默认不 mask（与 uni.showLoading 一致，保持迁移向后兼容）。
   * 若需要阻止底层交互，显式传 `{ mask: true }`。
   *
   * 连续调用会覆盖当前文案（uniapp 语义，不计数），与 uni.showLoading 一致。
   *
   * @param {string} [msg]
   * @param {{ mask?: boolean }} [options]
   */
  loading(msg = '加载中', options = {}) {
    uni.showLoading({
      title: String(msg),
      mask: options.mask === true,
    })
  },

  /**
   * 隐藏加载遮罩
   */
  hideLoading() {
    uni.hideLoading()
  },
}
```

### 使用示例

```js
import { toast } from '@/utils/common/toast.js'

// 成功
toast.success('保存成功')
toast.success('已切换到 ' + name, 1200)

// 错误
toast.error('保存失败')
toast.error('网络异常', 3000)

// 信息 / 警告
toast.info('请输入用户名')

// Loading
toast.loading('加载中')
try {
  await someAsyncOp()
} finally {
  toast.hideLoading()
}
```

## 迁移规则

### 转换表

| 旧代码 | 新代码 |
|------|------|
| `uni.showToast({ title: 'X', icon: 'success' })` | `toast.success('X')` |
| `uni.showToast({ title: 'X', icon: 'success', duration: 2000 })` | `toast.success('X', 2000)` |
| `uni.showToast({ title: 'X', icon: 'none' })` | `toast.info('X')` 或 `toast.error('X')`（按消息语义判断） |
| `uni.showToast({ title: 'X', icon: 'error' })` | `toast.error('X')` |
| `uni.showLoading({ title: 'X' })` | `toast.loading('X')` |
| `uni.showLoading()` | `toast.loading()` |
| `uni.hideLoading()` | `toast.hideLoading()` |

### 错误 vs 信息 的判断规则

`icon: 'none'` 的调用需要决定走 `toast.error` 还是 `toast.info`。判断规则：

**走 `toast.error`**（消息包含以下关键字）：
- 失败 / 错误 / 异常 / 出错
- 无权 / 不支持 / 未授权
- 缺失 / 无效 / 必填
- 网络 / 超时 / 断网

**走 `toast.info`**（其他情况）：
- 提示类、引导类、状态类
- 例如 "请输入..."、"已复制..."、"请选择..."、"没有更多数据"
- **注意**："没有"开头的消息通常是空态提示不是错误，走 info

若难以判断，默认 `toast.info`（更保守，不会无故让用户感觉操作失败）。

### 不自动迁移的情况

以下保持原样，不替换：

- `uni.showToast` 被动态参数或解构调用（极罕见）
- `uni.showToast` 在 catch 里直接传 error 对象（无法自动转 String）—— 显式改写
- 任何 `uni.showModal` 调用

## 迁移步骤

按文件批次迁移，每批一个 commit：

**Batch 1**: `utils/common/toast.js`（新建）
- 单独一个 commit

**Batch 2**: 学习模块
- `pages/study/data-admin.vue`
- `pages/study/learn.vue`
- `pages/study/mental-math.vue`（如有 loading/toast 调用）
- `store/game.js`

**Batch 3**: 碑文模块
- `pages/stele/index.vue`
- `pages/stele/list.vue`
- `pages/stele/photo.vue`
- ⚠️ **不动** `pages/stele/detail.vue`（用的是 ElMessage，桌面 UX）

**Batch 4**: 面试模块
- `pages/interview/index.vue`
- `pages/interview/practice.vue`
- `pages/interview/settings.vue`
- `pages/interview/exam-result.vue`
- `pages/interview/record-detail.vue`

**Batch 5**: 首页 + 其他
- `pages/index/index.vue`
- `App.vue`（如果有）
- 其他剩余 .vue / .js 文件（靠最后的 grep 兜底发现）

## 验证清单

1. **编译无误**：每个 batch 完成后静态语法检查通过
2. **grep 兜底（范围扩到全项目源码）**：
   ```bash
   grep -rn "uni.showToast\|uni.showLoading\|uni.hideLoading" \
     pages/ store/ components/ composables/ utils/ App.vue
   ```
   预期：只剩 `toast.js` 自身那几行（wrapper 内部的原生调用）
3. **浏览器实测**：
   - 学习 → 数据维护 → 新增一条题目 → 看到"新增成功" toast
   - 首页切换用户 → 看到"已切换到 X" toast
   - 触发任意错误场景（如断网情况下加载题库）→ 看到错误提示
   - 加载过程中出现 loading 遮罩
4. **未引入回归**：所有原有 toast 都能正常触发，文案一致

## 风险与回滚

**风险**：
- 某处 `icon: 'none'` 被错误归类为 error / info，但消息语义不匹配 —— 视觉差异小，用户可能感知到"这里本来没红色图标现在有了"
- 少数调用点用 `uni.showToast({ title: error.message })` 直接传对象 —— wrapper 已用 `String(msg ?? '')` 兜底

**回滚**：
- 每个 batch 独立 commit
- 可 `git revert <batch-sha>` 精准回退某一批
- `utils/common/toast.js` 文件可保留不动（没有依赖就是 dead file）

## 不在本次范围

- 错误上报 / Sentry / 日志收集
- toast 频率限制 / 去重
- 自定义 toast 样式 / 动画
- TypeScript 类型定义
- 单元测试
- 替换 `ElMessage`（PC 编辑器专用）
