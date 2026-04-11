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
