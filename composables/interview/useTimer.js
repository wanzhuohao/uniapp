// composables/interview/useTimer.js
import { ref, computed, onUnmounted } from 'vue'

export function useTimer() {
  const remaining = ref(0) // 剩余秒数
  const isRunning = ref(false)
  let timer = null

  const minutes = computed(() => Math.floor(remaining.value / 60))
  const seconds = computed(() => remaining.value % 60)
  const display = computed(() =>
    `${String(minutes.value).padStart(2, '0')}:${String(seconds.value).padStart(2, '0')}`
  )
  const isWarning = computed(() => remaining.value <= 60 && remaining.value > 30)
  const isDanger = computed(() => remaining.value <= 30)

  function start(totalSeconds, onEnd) {
    remaining.value = totalSeconds
    isRunning.value = true
    timer = setInterval(() => {
      remaining.value--
      if (remaining.value <= 0) {
        stop()
        onEnd && onEnd()
      }
    }, 1000)
  }

  function stop() {
    isRunning.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function reset() {
    stop()
    remaining.value = 0
  }

  onUnmounted(() => stop())

  return { remaining, isRunning, display, isWarning, isDanger, start, stop, reset }
}
