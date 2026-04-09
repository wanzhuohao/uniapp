// utils/speech.js
// 基于 Web Speech API 的中文语音朗读

let speaking = false

export function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // 停止当前朗读
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.8  // 慢一点，适合小朋友
  utterance.pitch = 1.1 // 稍高一点，活泼

  // 优先选中文语音
  const voices = window.speechSynthesis.getVoices()
  const zhVoice = voices.find(v => v.lang.startsWith('zh'))
  if (zhVoice) utterance.voice = zhVoice

  speaking = true
  utterance.onend = () => { speaking = false }
  utterance.onerror = () => { speaking = false }

  window.speechSynthesis.speak(utterance)
}

export function isSpeaking() {
  return speaking
}
