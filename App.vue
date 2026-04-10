<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useAuth } from './composables/common/useAuth.js'
import { useGameStore } from './store/game.js'

const { hasUsername, setUsername } = useAuth()

onLaunch(() => {
  if (!hasUsername()) {
    uni.showModal({
      title: '欢迎使用',
      content: '请输入你的用户名',
      editable: true,
      placeholderText: '输入用户名',
      success(res) {
        if (res.confirm && res.content && res.content.trim()) {
          setUsername(res.content.trim())
          // 从云端拉取用户数据
          const store = useGameStore()
          store.loadFromCloud()
        }
      }
    })
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
  --color-gold: #D4A528;
}
</style>
