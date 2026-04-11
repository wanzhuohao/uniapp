# UserSwitcher 多用户切换 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 给首页增加最近用户列表的模态切换 UI，支持一键切换到最近 5 个用过的用户名 + 删除 + 添加新用户。

**Architecture:** 纯本地 localStorage 存 recent_users 数组（最多 5，最新在前）；新 composable `useRecentUsers` 负责读写；新组件 `UserSwitcher` 负责展示和交互；首页点用户名触发组件；切换走现有 `setUsername + store.switchUser + reLaunch` 流程，加 `switching` 防重入 flag。

**Tech Stack:** UniApp Vue 3 + Composition API + uni.getStorageSync

**Spec:** [docs/specs/2026-04-11-user-switcher-design.md](../specs/2026-04-11-user-switcher-design.md)

**测试约定**：项目无测试基础设施，每个 task 后静态语法检查 + 最后手工浏览器验证。

---

## 文件清单

| 操作 | 路径 | 职责 |
|------|------|------|
| 新建 | `composables/common/useRecentUsers.js` | localStorage 读写 recent_users |
| 新建 | `components/common/UserSwitcher.vue` | 模态浮层 UI + 列表交互 |
| 修改 | `App.vue` | 首次弹框成功后显式 addRecentUser |
| 修改 | `pages/index/index.vue` | 用 UserSwitcher 组件替代 editUsername，加 doSwitch + switching flag |

---

## Task 1: 创建 useRecentUsers composable

**Files:**
- Create: `D:\code\uniapp\composables\common\useRecentUsers.js`

- [ ] **Step 1: 创建文件**

完整内容：

```js
// composables/common/useRecentUsers.js
// 本地 localStorage 最近用户列表，最多 5 个，最新在前
const STORAGE_KEY = 'recent_users'
const MAX_SIZE = 5

export function useRecentUsers() {
  function getRecentUsers() {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY)
      if (!raw) return []
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
      return Array.isArray(arr) ? arr.filter(s => typeof s === 'string' && s) : []
    } catch (e) {
      return []
    }
  }

  function addRecentUser(name) {
    if (!name || typeof name !== 'string') return
    const trimmed = name.trim()
    if (!trimmed) return
    const current = getRecentUsers().filter(u => u !== trimmed)
    current.unshift(trimmed)
    const truncated = current.slice(0, MAX_SIZE)
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(truncated))
    } catch (e) {}
  }

  function removeRecentUser(name) {
    if (!name) return
    const next = getRecentUsers().filter(u => u !== name)
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(next))
    } catch (e) {}
  }

  return { getRecentUsers, addRecentUser, removeRecentUser }
}
```

- [ ] **Step 2: 静态语法检查**

```bash
cd D:/code/uniapp && node -e "
const fs = require('fs');
const c = fs.readFileSync('composables/common/useRecentUsers.js', 'utf8');
const code = c.split('\n').filter(l => !/^\s*export\s/.test(l) && !/^\s*import\s/.test(l)).join('\n');
try { new Function(code); console.log('OK'); } catch (e) { console.log('ERR:', e.message); }
"
```
预期：OK

- [ ] **Step 3: 提交**

```bash
cd D:/code/uniapp && git add composables/common/useRecentUsers.js && git commit -m "feat(common): useRecentUsers composable 读写 localStorage 最近用户列表

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 创建 UserSwitcher 组件

**Files:**
- Create: `D:\code\uniapp\components\common\UserSwitcher.vue`

- [ ] **Step 1: 创建文件**

完整内容：

```vue
<template>
  <view v-if="visible" class="us-mask" @click.self="$emit('close')">
    <view class="us-card">
      <view class="us-header">
        <text class="us-title">选择用户</text>
        <view class="us-close" @click="$emit('close')">✕</view>
      </view>

      <view class="us-list">
        <view
          v-for="name in recent"
          :key="name"
          class="us-item"
          :class="{ current: name === currentUser }"
        >
          <view class="us-item-main" @click="handlePick(name)">
            <text v-if="name === currentUser" class="us-check">✓</text>
            <text class="us-name">{{ name }}</text>
            <text v-if="name === currentUser" class="us-badge">当前</text>
          </view>
          <view
            v-if="name !== currentUser"
            class="us-remove"
            @click.stop="handleRemove(name)"
          >✕</view>
        </view>

        <view v-if="recent.length === 0" class="us-empty">
          <text>还没有用过其他用户</text>
        </view>
      </view>

      <view class="us-add-btn" @click="$emit('add-new')">+ 添加新用户</view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRecentUsers } from '../../composables/common/useRecentUsers.js'
import { useAuth } from '../../composables/common/useAuth.js'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'switch-to', 'add-new'])

const { getRecentUsers, removeRecentUser } = useRecentUsers()
const { getUsername } = useAuth()

const recent = ref([])
const currentUser = ref('')

function refresh() {
  const list = getRecentUsers()
  const cur = getUsername()
  currentUser.value = cur
  // 兜底：当前用户不在 localStorage 时，在 UI 层插入顶部展示
  if (cur && !list.includes(cur)) {
    recent.value = [cur, ...list]
  } else {
    recent.value = list
  }
}

watch(() => props.visible, (v) => {
  if (v) refresh()
})

function handlePick(name) {
  // 点当前用户等于取消切换 → 关闭模态
  if (name === currentUser.value) {
    emit('close')
    return
  }
  emit('switch-to', name)
}

function handleRemove(name) {
  // 双重防护：不允许删除当前用户
  if (name === currentUser.value) return
  removeRecentUser(name)
  refresh()
}
</script>

<style scoped>
.us-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.us-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  width: 600rpx;
  max-width: 90vw;
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.us-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.us-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.us-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f0f0;
  font-size: 28rpx;
  color: #666;
}
.us-close:active { transform: scale(0.9); }

.us-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.us-item {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  border: 3rpx solid transparent;
  transition: all 0.2s;
}

.us-item.current {
  background: #FFF8E1;
  border-color: #FFB300;
}

.us-item-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.us-item-main:active { transform: scale(0.98); }

.us-check {
  color: #4CAF50;
  font-size: 32rpx;
  font-weight: bold;
}

.us-name {
  flex: 1;
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

.us-badge {
  font-size: 22rpx;
  color: #FF8F00;
  background: #FFE0B2;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.us-remove {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ffebee;
  color: #c62828;
  font-size: 24rpx;
  margin-left: 12rpx;
}
.us-remove:active { transform: scale(0.9); }

.us-empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}

.us-add-btn {
  margin-top: 8rpx;
  padding: 24rpx;
  text-align: center;
  background: linear-gradient(135deg, #FFA726, #F57C00);
  color: #fff;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 16rpx rgba(255, 167, 38, 0.3);
}
.us-add-btn:active { transform: scale(0.97); }
</style>
```

- [ ] **Step 2: 静态语法检查**

```bash
cd D:/code/uniapp && node -e "
const fs = require('fs');
const c = fs.readFileSync('components/common/UserSwitcher.vue', 'utf8');
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
const code = m[1].split('\n').filter(l => !/^\s*import\s/.test(l)).join('\n');
try { new Function(code); console.log('OK'); } catch (e) { console.log('ERR:', e.message); }
"
```
预期：OK

- [ ] **Step 3: 提交**

```bash
cd D:/code/uniapp && git add components/common/UserSwitcher.vue && git commit -m "feat(common): UserSwitcher 模态浮层组件

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: App.vue 首次弹框后显式 addRecentUser

**Files:**
- Modify: `D:\code\uniapp\App.vue`

- [ ] **Step 1: 加 import**

在 `<script setup>` 顶部 import 区加一行：

```js
import { useRecentUsers } from './composables/common/useRecentUsers.js'
```

- [ ] **Step 2: 实例化 composable**

在 `const { hasUsername, setUsername } = useAuth()` 下一行加：

```js
const { addRecentUser } = useRecentUsers()
```

- [ ] **Step 3: promptUsername 成功回调新增 addRecentUser**

找到 `promptUsername()` 函数中 `success(res)` 回调，在 `setUsername(name)` 下一行插入 `addRecentUser(name)`：

```js
success(res) {
  const name = (res.content || '').trim()
  if (res.confirm && name) {
    setUsername(name)
    addRecentUser(name)   // ← 新增这一行
    const store = useGameStore()
    store.loadFromCloud()
    uni.$emit('username-changed', name)
  } else {
    setTimeout(promptUsername, 100)
  }
}
```

- [ ] **Step 4: 静态语法检查**

```bash
cd D:/code/uniapp && node -e "
const fs = require('fs');
const c = fs.readFileSync('App.vue', 'utf8');
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
const code = m[1].split('\n').filter(l => !/^\s*import\s/.test(l)).join('\n');
try { new Function(code); console.log('OK'); } catch (e) { console.log('ERR:', e.message); }
"
```
预期：OK

- [ ] **Step 5: 提交**

```bash
cd D:/code/uniapp && git add App.vue && git commit -m "feat(app): 首次弹框成功后显式 addRecentUser

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: index.vue 集成 UserSwitcher

**Files:**
- Modify: `D:\code\uniapp\pages\index\index.vue`

- [ ] **Step 1: 模板中加 UserSwitcher**

`pages/index/index.vue` 当前结构（行号参考）：
- 第 2 行 `<view class="container">`
- 第 8 行 `<view class="cards">`
- 第 21 行 `</view>` — `.cards` 闭合
- 第 22 行 `</view>` — `.container` 闭合
- 第 23 行 `</template>`

在**第 21 行**（`.cards` 闭合）之后、**第 22 行**（`.container` 闭合）之前插入：

```vue
    <UserSwitcher
      :visible="showSwitcher"
      @close="showSwitcher = false"
      @switch-to="doSwitch"
      @add-new="onAddNew"
    />
```

插入后新结构应为：
```
...
    </view>      <!-- .cards 闭合 -->
    <UserSwitcher ... />
  </view>        <!-- .container 闭合 -->
</template>
```

- [ ] **Step 2: 改 import 区**

`<script setup>` 开头 import 区加两行：

```js
import UserSwitcher from '../../components/common/UserSwitcher.vue'
import { useRecentUsers } from '../../composables/common/useRecentUsers.js'
```

紧接着使用 composable：

```js
const { addRecentUser } = useRecentUsers()
```

- [ ] **Step 3: 加 switching + showSwitcher refs**

在 `const username = ref(getUsername())` 后加：

```js
const showSwitcher = ref(false)
const switching = ref(false)
```

- [ ] **Step 4: 先改模板绑定（避免中间态 ReferenceError）**

在模板中找到 `<text class="username" @click="editUsername">`，把 `editUsername` 改为 `openSwitcher`：

```vue
<text class="username" @click="openSwitcher">{{ username || '未设置' }}</text>
```

（必须在 Step 5 之前做，否则删掉 editUsername 函数后模板还绑着它，编译器会报 warning/error）

- [ ] **Step 5: 替换 editUsername 为 openSwitcher + doSwitch + onAddNew**

删除原 `editUsername()` 整个函数，替换为下面 3 个函数：

```js
function openSwitcher() {
  if (switching.value) return
  showSwitcher.value = true
}

async function doSwitch(name) {
  if (switching.value) return
  switching.value = true
  setUsername(name)
  addRecentUser(name)
  username.value = name
  showSwitcher.value = false

  try {
    await store.switchUser()
  } catch (e) {
    uni.showToast({ title: '云端加载失败，使用默认数据', icon: 'none', duration: 1500 })
  }

  uni.$emit('username-changed', name)
  uni.showToast({ title: '已切换到 ' + name, icon: 'success', duration: 1200 })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/index/index' })
  }, 1200)
}

function onAddNew() {
  showSwitcher.value = false
  uni.showModal({
    title: '添加新用户',
    content: '',
    editable: true,
    placeholderText: '输入新用户名',
    showCancel: true,
    async success(res) {
      const newName = (res.content || '').trim()
      if (!res.confirm || !newName) return
      if (newName === username.value) return
      await doSwitch(newName)
    }
  })
}
```

- [ ] **Step 6: 静态语法检查**

```bash
cd D:/code/uniapp && node -e "
const fs = require('fs');
const c = fs.readFileSync('pages/index/index.vue', 'utf8');
const m = c.match(/<script[^>]*>([\s\S]*?)<\/script>/);
const code = m[1].split('\n').filter(l => !/^\s*import\s/.test(l)).join('\n');
try { new Function(code); console.log('OK'); } catch (e) { console.log('ERR:', e.message); }
"
```
预期：OK

- [ ] **Step 7: 提交**

```bash
cd D:/code/uniapp && git add pages/index/index.vue && git commit -m "feat(home): 集成 UserSwitcher 模态，取代直接改名弹框

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 浏览器手工验证

**Files:** 无修改，纯验证

**前置**：HBuilderX 热更新自动 reload，或手工刷新 http://localhost:5173/

- [ ] **Step 1: 清 localStorage 测初次场景**

打开浏览器 DevTools → Application → Local Storage → localhost:5173 → 删除 `username` 和 `recent_users`，刷新页面。

- [ ] **Step 2: 初次弹框**

- [ ] 页面加载后立刻弹出系统输入框"请输入你的名字"
- [ ] 输入 `张三` 确认 → 进入首页
- [ ] DevTools 中 `recent_users` 应为 `["张三"]`

- [ ] **Step 3: 打开切换器**

- [ ] 点首页右上角"张三" → 模态浮层打开
- [ ] 列表显示唯一一个 `张三` 行，有 ✓ 和"当前"标签，无 × 按钮
- [ ] 底部有"+ 添加新用户"按钮
- [ ] 右上角 ✕ 关闭按钮可点 → 模态消失
- [ ] 再打开，点卡片外遮罩 → 模态消失

- [ ] **Step 4: 添加新用户**

- [ ] 点"+ 添加新用户" → 模态关闭 + 系统输入框弹出
- [ ] 输入 `李四` 确认 → toast"已切换到 李四" → 1.2 秒后 reLaunch 回首页
- [ ] 首页用户名显示为 `李四`
- [ ] DevTools 中 `recent_users` 应为 `["李四", "张三"]`

- [ ] **Step 5: 切换回之前的用户**

- [ ] 点用户名 → 模态打开 → 列表显示 `李四`（✓ 当前）+ `张三`（有 × 按钮）
- [ ] 点 `张三` 行 → toast + reLaunch → 首页用户名为 `张三`
- [ ] 再开模态：列表应为 `张三`（✓ 当前）+ `李四`（有 ×）

- [ ] **Step 6: 删除用户 + 数据恢复**

- [ ] 点 `李四` 行右侧 × → 李四行从列表消失，模态不关闭
- [ ] `recent_users` 应为 `["张三"]`
- [ ] 关模态，再开，应只剩张三
- [ ] **数据恢复验证**：通过"+ 添加新用户"重新输入 `李四` → toast + reLaunch → 用户名显示李四 → 进入错题本应看到之前李四用户做过的错题（云端数据保留，删除只影响本地列表）

- [ ] **Step 7: 5 个上限**

快速验证（不用 5 次 reLaunch）：
- [ ] DevTools → Application → Local Storage → 手动把 `recent_users` 设为 `["张三","李四","A","B","C"]`（共 5 个）
- [ ] 刷新首页，点"+ 添加新用户"输入 `D` → reLaunch
- [ ] DevTools 查看 `recent_users` 应为 `["D","张三","李四","A","B"]`（6 个中挤掉最老的 C）

- [ ] **Step 8: 边角场景**

- [ ] 在 DevTools 里手动删 `recent_users` 但保留 `username` → 点用户名 → 模态显示当前用户（UI 兜底）
- [ ] 快速连点同一最近用户 → 只触发一次切换（switching flag 拦截）
- [ ] 控制台无 error/warning（与本次变更相关的）

- [ ] **Step 9: 未引入回归**

- [ ] 学习 / 碑文 / 错题本入口仍可点
- [ ] 切换用户后，错题本/星星数与新用户对应

- [ ] **Step 10: 更新 progress.md**

在 `D:/code/uniapp/docs/progress.md` 顶部追加本轮小节：

```markdown
## 本轮（2026-04-11 后续）UserSwitcher 多用户切换 UI

- 新增 `composables/common/useRecentUsers.js` 管理 localStorage `recent_users`（最多 5）
- 新增 `components/common/UserSwitcher.vue` 模态浮层 UI
- `App.vue` / `pages/index/index.vue` 接入，显式 addRecentUser
- 首页点用户名改为弹浮层，支持一键切换、删除、添加新用户
- 切换逻辑加 `switching` flag 防重入，云端失败时仍 reLaunch + toast 提示
```

- [ ] **Step 11: 提交文档**

```bash
cd D:/code/uniapp && git add docs/progress.md && git commit -m "docs: 记录 UserSwitcher 上线

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## 风险与回滚

如果切换器行为异常，逐个 revert 以降低冲突风险：

```bash
cd D:/code/uniapp
git log --oneline -10  # 找到本次 5 个 commit 的 sha
git revert --no-edit <index-sha>       # Task 4
git revert --no-edit <app-sha>         # Task 3
git revert --no-edit <switcher-sha>    # Task 2
git revert --no-edit <composable-sha>  # Task 1
```

或者若确定所有 commit 都可整体抛弃，用 hard reset（只有未 push 时）：

```bash
git reset --hard <task1-之前-sha>
```

组件文件如果想保留备用，单独从第一个 task commit cherry-pick 回来。
