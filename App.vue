<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useAuth } from './composables/common/useAuth.js'

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
        }
      }
    })
  }
})
</script>

<style>
page {
  background-color: #F5F7FA;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
}
</style>
