<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useAuth } from './composables/common/useAuth.js'
import { useGameStore } from './store/game.js'

const { hasUsername, setUsername } = useAuth()

function promptUsername() {
  uni.showModal({
    title: '请输入你的名字',
    content: '',
    editable: true,
    placeholderText: '例如：小明',
    showCancel: false,
    confirmText: '确定',
    success(res) {
      const name = (res.content || '').trim()
      if (res.confirm && name) {
        setUsername(name)
        const store = useGameStore()
        store.loadFromCloud()
        uni.$emit('username-changed', name)
      } else {
        // 空输入 → 再弹一次
        setTimeout(promptUsername, 100)
      }
    }
  })
}

onLaunch(() => {
  if (!hasUsername()) {
    promptUsername()
  } else {
    // 已有用户名，启动时从云端拉取数据
    const store = useGameStore()
    store.loadFromCloud()
  }
})
</script>

<style>
page {
  background-color: #F5F7FA;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
}

:root {
  /* 碑文模块主色 */
  --color-primary: #96700A;
  --color-primary-hover: #B8860B;
  --color-primary-light: #8B6914;
  --color-border: #8C8078;
  --color-border-light: #D5CEC8;
  --color-bg-blue: #F5F0EB;
  --color-bg-blue-light: #FAF7F4;
  --color-success: #5B8C3E;
  --color-success-hover: #7AAD56;
  --color-danger: #C0392B;
  --color-danger-hover: #D95B4E;
  --color-warning: #D4A017;
  --color-warning-hover: #E8BF3A;
  --color-text: #2C2420;
  --color-text-light: #888;
  --color-gold: #D4A528;
  --color-star: #FFB300;
  --color-stroke: #42A5F5;
  --radius-btn: 16rpx;
  --radius-card: 20rpx;
}
</style>
