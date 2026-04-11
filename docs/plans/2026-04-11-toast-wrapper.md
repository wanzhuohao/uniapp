# Toast Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development.

**Goal:** 抽出 `utils/common/toast.js` 统一 84+ 处 `uni.showToast` / 15+ 处 `showLoading` 调用，5 个方法 API（success/error/info/loading/hideLoading）。

**Architecture:** 薄 wrapper，无响应式状态，纯函数封装。一次性迁移全部调用点，按模块分 5 批 commit。

**Tech Stack:** UniApp Vue 3 H5

**Spec:** [docs/specs/2026-04-11-toast-wrapper-design.md](../specs/2026-04-11-toast-wrapper-design.md)

**Import 路径**：项目无 `@/` 别名配置，所有 import 使用相对路径（`../../utils/common/toast.js` 等）。

**验证策略**：项目无单元测试，**不用逐文件 `new Function` 检查**（Vue `<script setup>` 的顶层 import/export 会让这种检查不可靠）。验证走：

1. 每 batch 后 grep 确认该批文件无 `uni.showToast` / `uni.showLoading` / `uni.hideLoading` 残留
2. 每 batch 后看 HBuilderX dev server 和浏览器控制台是否有编译 / 运行报错（HMR 会实时反馈）
3. 最后 Batch 6 手工跑几个典型 toast 场景验证视觉

---

## 文件清单

| 操作 | 路径 | 批次 |
|------|------|------|
| 新建 | `utils/common/toast.js` | Batch 1 |
| 改 | `pages/study/data-admin.vue` | Batch 2 |
| 改 | `pages/study/learn.vue` | Batch 2 |
| 改 | `store/game.js` | Batch 2 |
| 改 | `pages/stele/index.vue` | Batch 3 |
| 改 | `pages/stele/list.vue` | Batch 3 |
| 改 | `pages/stele/photo.vue` | Batch 3 |
| 改 | `pages/interview/index.vue` | Batch 4 |
| 改 | `pages/interview/practice.vue` | Batch 4 |
| 改 | `pages/interview/settings.vue` | Batch 4 |
| 改 | `pages/interview/exam-result.vue` | Batch 4 |
| 改 | `pages/interview/record-detail.vue` | Batch 4 |
| 改 | `pages/index/index.vue` | Batch 5 |
| 改 | `App.vue`（若需要） | Batch 5 |

**不动**：`pages/stele/detail.vue` / `composables/stele/useOrderForm.ts`（用的是 `ElMessage`，桌面 UX）

---

## Batch 1: 创建 toast.js

**Files:** Create `D:\code\uniapp\utils\common\toast.js`

- [ ] **Step 1: 创建文件**

完整内容（原样写入）：

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
   * 错误提示。uniapp H5 下 icon='error' 只支持 title ≤ 7 字符，
   * 超过会自动降级为纯文字。wrapper 主动检测长度保持一致行为：
   * 短错误保留红叉图标，长错误降级为 icon:'none'。
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
   * 显示加载。默认不 mask（与 uni.showLoading 一致）。
   * 若需阻止底层交互，显式传 { mask: true }。
   * 连续调用覆盖文案，不计数。
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
   * 隐藏加载
   */
  hideLoading() {
    uni.hideLoading()
  },
}
```

- [ ] **Step 2: 语法检查**

```bash
cd D:/code/uniapp && node --check utils/common/toast.js
```
预期：无输出（通过）

- [ ] **Step 3: 提交**

```bash
cd D:/code/uniapp && git add utils/common/toast.js && git commit -m "feat(common): toast wrapper 统一 uni.showToast / showLoading

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Batch 2: 学习模块迁移

**Files:** 4 个文件

对每个文件：加 import + 替换所有 `uni.showToast(...)` / `uni.showLoading(...)` / `uni.hideLoading(...)`。

### 通用替换规则

| 旧 | 新 |
|------|------|
| `uni.showToast({ title: 'X', icon: 'success' })` | `toast.success('X')` |
| `uni.showToast({ title: 'X', icon: 'success', duration: N })` | `toast.success('X', N)` |
| `uni.showToast({ title: 'X', icon: 'error' })` | `toast.error('X')` |
| `uni.showToast({ title: 'X', icon: 'none' })` | `toast.info('X')` 或 `toast.error('X')`（语义判断） |
| `uni.showLoading({ title: 'X' })` | `toast.loading('X')` |
| `uni.showLoading({ title: 'X', mask: true })` | `toast.loading('X', { mask: true })` |
| `uni.hideLoading()` | `toast.hideLoading()` |

**错误 vs 信息判断**：
- 包含"失败/错误/异常/无权/不支持/必填/无效/网络/超时" → error
- 其他（请输入/已复制/已切换/没有更多...）→ info

### Step 1: 处理 `pages/study/data-admin.vue`

- [ ] grep 当前调用：
  ```bash
  cd D:/code/uniapp && grep -n "uni.showToast\|uni.showLoading\|uni.hideLoading" pages/study/data-admin.vue
  ```
- [ ] 在 `<script setup>` import 区加：
  ```js
  import { toast } from '../../utils/common/toast.js'
  ```
- [ ] 按规则替换每一处，典型转换（参考设计文档第 186、227、267、278、292、317、322 行）：
  - `uni.showToast({ title: '加载失败: ' + e.message, icon: 'none' })` → `toast.error('加载失败: ' + e.message)`
  - `uni.showToast({ title: '汉字、单元必填', icon: 'none' })` → `toast.error('汉字、单元必填')`
  - `uni.showToast({ title: '新增成功', icon: 'success' })` → `toast.success('新增成功')`
  - `uni.showToast({ title: '保存成功', icon: 'success' })` → `toast.success('保存成功')`
  - `uni.showToast({ title: '保存失败: ' + e.message, icon: 'none' })` → `toast.error('保存失败: ' + e.message)`
  - `uni.showToast({ title: '已删除', icon: 'success' })` → `toast.success('已删除')`
  - `uni.showToast({ title: '删除失败: ' + e.message, icon: 'none' })` → `toast.error('删除失败: ' + e.message)`
- [ ] 替换 loading 调用（查找 `uni.showLoading` / `uni.hideLoading`）
- [ ] grep 确认该文件无残留：
  ```bash
  grep -n "uni.showToast\|uni.showLoading\|uni.hideLoading" pages/study/data-admin.vue
  ```
  预期：无匹配

### Step 2: 处理 `pages/study/learn.vue`

- [ ] 同样 grep + import + 替换流程。这个文件只有 1 处调用。

### Step 3: 处理 `store/game.js`

- [ ] 这是 pinia store，非 vue 文件。import 路径 `../utils/common/toast.js`
- [ ] 只有 1 处调用（`_syncCloud` 失败时的 toast），替换

### Step 4: 本批文件 grep 兜底

```bash
cd D:/code/uniapp && grep -n "uni.showToast\|uni.showLoading\|uni.hideLoading" \
  pages/study/data-admin.vue pages/study/learn.vue store/game.js
```
预期：无匹配。若有残留就继续补改。

### Step 5: `store/game.js` 语法检查（纯 JS 文件可用 node --check）

```bash
cd D:/code/uniapp && node --check store/game.js
```
预期：无输出

Vue 文件不做单独语法检查，靠 HBuilderX dev server HMR 实时反馈：看浏览器/控制台有无报错。

### Step 6: 提交

```bash
cd D:/code/uniapp && git add pages/study/data-admin.vue pages/study/learn.vue store/game.js && git commit -m "refactor(study): 统一 toast 调用走 toast wrapper

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Batch 3: 碑文模块（非 PC 编辑页）

**Files:** 3 个文件（不含 `stele/detail.vue`）

- [ ] **Step 1**: 处理 `pages/stele/index.vue`（12 处调用）
  - import `toast`
  - 按规则替换

- [ ] **Step 2**: 处理 `pages/stele/list.vue`（4 处调用）

- [ ] **Step 3**: 处理 `pages/stele/photo.vue`（10 处调用，最多）

- [ ] **Step 4**: 不单独做 Vue 文件语法检查，靠 HBuilderX HMR 实时反馈

- [ ] **Step 5**: grep 确认 3 个文件无残留：
  ```bash
  grep -n "uni.showToast\|uni.showLoading\|uni.hideLoading" \
    pages/stele/index.vue pages/stele/list.vue pages/stele/photo.vue
  ```

- [ ] **Step 6**: 提交
  ```bash
  cd D:/code/uniapp && git add pages/stele/index.vue pages/stele/list.vue pages/stele/photo.vue && git commit -m "refactor(stele): 统一 toast 调用走 toast wrapper（不含 detail.vue）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  ```

---

## Batch 4: 面试模块

**Files:** 5 个文件

- [ ] **Step 1-5**: 依次处理：
  - `pages/interview/index.vue`（6 toast + ~3 loading）
  - `pages/interview/practice.vue`（6 toast + ~3 loading，注意连续 loading 更新文案的场景）
  - `pages/interview/settings.vue`（7 toast）
  - `pages/interview/exam-result.vue`（1 toast）
  - `pages/interview/record-detail.vue`（1 toast）

- [ ] **Step 6**: 不单独做 Vue 文件语法检查，靠 HBuilderX HMR 实时反馈

- [ ] **Step 7**: grep 确认无残留

- [ ] **Step 8**: 提交
  ```bash
  cd D:/code/uniapp && git add pages/interview/*.vue && git commit -m "refactor(interview): 统一 toast 调用走 toast wrapper

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  ```

**注意**：面试模块虽然入口已屏蔽，但代码仍在运行时可达（若将来恢复入口），应该一起迁移保持一致性。

---

## Batch 5: 首页 + 剩余

- [ ] **Step 1**: 处理 `pages/index/index.vue`（2 处 toast + 1 处 reLaunch 前的 toast）
- [ ] **Step 2**: 检查 `App.vue`:
  ```bash
  grep -n "uni.showToast\|uni.showLoading\|uni.hideLoading" App.vue
  ```
  有则处理，无则跳过
- [ ] **Step 3**: 全项目兜底 grep：
  ```bash
  cd D:/code/uniapp && grep -rn "uni.showToast\|uni.showLoading\|uni.hideLoading" \
    --include="*.vue" --include="*.js" --include="*.ts" . \
    2>/dev/null | grep -v "node_modules\|unpackage\|utils/common/toast.js"
  ```
  预期：无输出（除了 `utils/common/toast.js` 自身的原生调用）

- [ ] **Step 4**: 不单独做 Vue 语法检查，靠 HBuilderX HMR 实时反馈
- [ ] **Step 5**: 提交
  ```bash
  cd D:/code/uniapp && git add pages/index/index.vue App.vue 2>/dev/null && git commit -m "refactor(home,app): 统一 toast 调用走 toast wrapper（收尾）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  ```

---

## Batch 6: 浏览器手工验证

- [ ] **Step 1**: 启动 dev 服务（用户已在浏览器打开）

- [ ] **Step 2**: 触发几个典型场景，验证视觉一致：
  - 学习 → 数据维护 → 新增一条 → 看到 `toast.success('新增成功')` 绿色 ✓
  - 学习 → 数据维护 → 触发一个错误（比如空字段）→ 看到 `toast.error('汉字、单元必填')` 红色 ✗
  - 首页点用户名 → 切用户 → 看到"已切换到 X"
  - 错题本 → 开始重练 → 跑一个场景看有没有 toast 触发
  - 碑文 → 下单页（stele/index）→ 提交 → 看 toast
  - 浏览器控制台无 error / warning（和本次变更相关的）

- [ ] **Step 3**: 更新 progress.md 追加小节

- [ ] **Step 4**: 提交文档更新

---

## 风险与回滚

每个 batch 独立 commit，可精准回退。**关键**：必须**逆序**回退（最后的 batch 先退），否则中间 batch 引用了 `toast` 但被删的 Batch 1 会让后续 batch 编译失败。

```bash
cd D:/code/uniapp
git log --oneline -10  # 找到 sha
# 逆序回退：先 Batch 5, 再 Batch 4, ..., 最后 Batch 1
git revert --no-edit <batch5-sha>
git revert --no-edit <batch4-sha>
git revert --no-edit <batch3-sha>
git revert --no-edit <batch2-sha>
# Batch 1 的 toast.js 若确定不再被引用可单独 revert
git revert --no-edit <batch1-sha>
```

或直接 reset 到 Batch 1 之前的 commit（只有未 push 时）。
