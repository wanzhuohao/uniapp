# UserSwitcher 多用户切换 UI 设计

> 日期：2026-04-11
> 状态：待评审 → 实施
> 关联：方案二第 2 项（基础设施批次 - 其一）

## 背景

当前首页点击右上角用户名直接弹出 `uni.showModal`（带 editable input）让用户改名，不支持**快速切换到最近用过的用户**。家庭场景下（果果 / 妈妈 / 爸爸 / 奶奶）不同成员会轮流使用，每次切换都要手输名字，容易写错（写错会跳到新用户，看不到自己的错题和星星）。

## 目标

在首页新增一个模态浮层 UI，展示最近用过的用户列表（最多 5 个），支持：

- 一键切换到最近用户
- 删除误输入的错误用户名
- 添加新用户（保留现有文本输入流程）

**不做**：跨设备同步、头像、排序、导入/导出、云端用户列表。

## 存储

**位置**：`localStorage` key = `recent_users`
**格式**：JSON 字符串化的 `string[]`，最新使用的在数组头
**容量上限**：5（超出时最老的被挤出）

**时机**：每次 `setUsername(name)` 成功后，调用 `addRecentUser(name)`：

1. 从数组中移除 `name`（如已存在）
2. `unshift(name)` 到头部
3. 截断数组到前 5 个
4. 回写 localStorage

**边界**：

- 首次启动（localStorage 无 `recent_users`）→ 视为空数组 `[]`
- 用户通过 App.vue 的弹框第一次输入用户名 → setUsername 调用 → 自动 add 到 recent_users → 进入首页即看到自己
- 空字符串 / whitespace-only 不入列表（setUsername 层面已 trim）

## 组件 API

### `composables/common/useRecentUsers.js`

```js
export function useRecentUsers() {
  const STORAGE_KEY = 'recent_users'
  const MAX_SIZE = 5

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
    const next = getRecentUsers().filter(u => u !== name)
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(next))
    } catch (e) {}
  }

  return { getRecentUsers, addRecentUser, removeRecentUser }
}
```

**注意**：沿用项目其他 storage 惯例（`uni.getStorageSync` 而非 `localStorage`），兼容未来跨端编译。

### `composables/common/useAuth.js` 不修改

保持 `useAuth` 纯粹（只管 username 存储），**不耦合 recent_users**。由调用方显式 add：

- `App.vue` 首次弹框成功 → `setUsername(name)` + `addRecentUser(name)`
- `index.vue` doSwitch / showAddNewModal → 同上
- 任何其他 setUsername 调用点都需要自行决定是否 add

**理由**：`useAuth` 之前是纯 getter/setter，加 addRecentUser 就变成"带业务的存储"，隐式副作用会让 future 调用者困惑。显式调用模式虽多一行，但行为可读。

### `components/common/UserSwitcher.vue`

**Props**：

```ts
{
  visible: Boolean  // 控制显隐
}
```

**Events**：

- `@close` — 用户点 × 或遮罩关闭
- `@switch-to(name)` — 用户点击某个最近用户行，父组件收到后执行切换 + reLaunch
- `@add-new` — 用户点"添加新用户"，父组件弹原 `uni.showModal` 输入框

**模板**（示意）：

```vue
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
        还没有用过其他用户
      </view>
    </view>

    <view class="us-add-btn" @click="$emit('add-new')">+ 添加新用户</view>
  </view>
</view>
```

**Script**：

```js
import { ref, watch } from 'vue'
import { useRecentUsers } from '../../composables/common/useRecentUsers.js'
import { useAuth } from '../../composables/common/useAuth.js'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close', 'switch-to', 'add-new'])

const { getRecentUsers, removeRecentUser } = useRecentUsers()
const { getUsername } = useAuth()

const recent = ref([])
const currentUser = ref('')

function refresh() {
  const list = getRecentUsers()
  const cur = getUsername()
  currentUser.value = cur
  // 兜底：若当前用户不在 localStorage 列表（极端情况，例如手动清除），UI 层插入展示
  if (cur && !list.includes(cur)) {
    recent.value = [cur, ...list]
  } else {
    recent.value = list
  }
}

watch(() => props.visible, (v) => {
  if (v) refresh()  // 每次打开时刷新列表
})

function handlePick(name) {
  if (name === currentUser.value) {
    emit('close')
    return
  }
  emit('switch-to', name)
}

function handleRemove(name) {
  // 防护：不应通过 UI 到达此处（当前用户行不渲染 × 按钮），
  // 但保险起见双重校验
  if (name === currentUser.value) return
  removeRecentUser(name)
  refresh()
}
```

### `pages/index/index.vue` 修改

**当前**：点击 `.username` → `editUsername()` 直接弹 `uni.showModal`

**改后**：
- 新增 `showSwitcher` ref 控制 UserSwitcher 显隐
- 新增 `switching` ref，标记切换进行中（防止 reLaunch 延迟期内再次触发切换）
- 点击用户名 → `if (!switching.value) showSwitcher.value = true`
- 监听组件事件：
  - `@close` → `showSwitcher.value = false`
  - `@switch-to` → 调 `doSwitch(name)`
  - `@add-new` → `showSwitcher.value = false; showAddNewModal()`

```js
import { useRecentUsers } from '../../composables/common/useRecentUsers.js'
const { addRecentUser } = useRecentUsers()

const showSwitcher = ref(false)
const switching = ref(false)

async function doSwitch(name) {
  if (switching.value) return  // 防重入
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

function showAddNewModal() {
  uni.showModal({
    title: '添加新用户',
    content: '',
    editable: true,
    placeholderText: '输入新用户名',
    async success(res) {
      const newName = (res.content || '').trim()
      if (!res.confirm || !newName) return
      if (newName === username.value) return
      await doSwitch(newName)
    }
  })
}
```

`doSwitch` 是唯一的切换入口，add-new / 列表点击都走它。**防重入 flag `switching`** 在进入时置 true，但**不重置**（reLaunch 会销毁整个页面栈）。这样 1.2s 延迟期内第二次触发会 no-op。

## 样式约定

- 遮罩：`position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999`
- 卡片：居中，白底，圆角 24rpx，最大宽度 600rpx，padding 32rpx
- 列表项：flex 行，padding 24rpx，hover/active 时 `scale(0.98)`
- 当前用户行：左侧绿色 ✓，右侧"当前"标签（小 pill）
- × 删除按钮：圆形灰色背景，小号
- "+ 添加新用户"按钮：橙色渐变背景（和首页"开始学习"同系色），全宽

### `App.vue` 修改（配套）

因为 useAuth 不再自动 add，首次弹框输入后也要显式 add：

```js
import { useRecentUsers } from './composables/common/useRecentUsers.js'
const { addRecentUser } = useRecentUsers()

function promptUsername() {
  uni.showModal({
    ...
    success(res) {
      const name = (res.content || '').trim()
      if (res.confirm && name) {
        setUsername(name)
        addRecentUser(name)   // ← 新增
        const store = useGameStore()
        store.loadFromCloud()
        uni.$emit('username-changed', name)
      } else {
        setTimeout(promptUsername, 100)
      }
    }
  })
}
```

## 验证清单

1. 首次进入项目：用户名弹框输入后，进入首页点用户名 → 模态打开，列表仅有当前用户（有 ✓ 和"当前"标签），无 × 按钮
2. 点右上角 × 关闭，模态消失
3. 点遮罩关闭（点卡片外）
4. 点"添加新用户" → 模态关闭 + 原系统输入框弹出 → 输入新名字确认 → toast + reLaunch 到首页 → 再开模态应看到两个用户，新用户在最上（最近优先），旧用户可见 ×
5. 点最近用户行（非当前）→ toast + reLaunch → 再开模态，这个用户变成 ✓ 当前
6. 点 × 删除非当前用户 → 列表立刻刷新，云端数据不变（重新添加该用户可拿回原错题/星星）
7. 超过 5 个用户：第 6 个挤掉第 1 个
8. 当前用户在列表中始终显示：**由组件 UI 层兜底**，如果 `currentUser` 不在 `recent` 里就在列表顶部插入（仅展示用，不写回 localStorage）。下次任何 add 操作会自动恢复。`addRecentUser` 保持简单，不做特殊处理。

9. 快速连点切换：点列表 A 后 1.2s 内又点 B → 第二次点击被 `switching` flag 拦截，no-op
10. 切换时云端 `loadFromCloud` 失败（断网）→ toast "云端加载失败，使用默认数据"，仍 reLaunch（星星显示本地缓存值）

## 不在本次范围内

- UserSwitcher 的单元测试（项目无测试设施）
- 用户头像 / emoji 选择
- 跨设备用户列表同步（需要新云表）
- 家长密码保护删除操作
- 支持备注 / 昵称（除用户名外）
- 切换历史记录 / 审计日志
