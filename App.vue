<script setup>
import { onLaunch } from '@dcloudio/uni-app'
</script>

<style>
page {
  background-color: var(--paper-base);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
}

:root {
  /* ===== 中式色板（Ink & Paper） ===== */
  /* 宣纸 */
  --paper-white:   #FFFDF8;
  --paper-light:   #FAF5EC;
  --paper-base:    #F6F1E8;
  --paper-tint:    #F3ECE0;
  --paper-dust:    #EFE8DC;
  --paper-deep:    #E8DCC3;

  /* 金棕（主色） */
  --ink-gold:      #96700A;
  --ink-gold-hi:   #B8860B;
  --ink-gold-lo:   #6B5010;
  --ink-gold-pale: #D4A528;

  /* 朱砂红（强调/印章） */
  --ink-vermilion:   #A13732;
  --ink-vermilion-hi:#C24942;
  --ink-vermilion-lo:#6E2824;

  /* 墨 */
  --ink-black:     #2C2420;
  --ink-dark:      #1A1A18;
  --ink-soft:      #3C342E;
  --ink-mist:      #5C4E42;
  --ink-grey:      #8C8078;
  --ink-grey-lo:   #A49A8E;

  /* 透明色阶 */
  --gold-a10:  rgba(150, 112, 10, 0.10);
  --gold-a15:  rgba(150, 112, 10, 0.15);
  --gold-a25:  rgba(150, 112, 10, 0.25);
  --gold-a35:  rgba(150, 112, 10, 0.35);
  --gold-a60:  rgba(150, 112, 10, 0.60);

  --vermilion-a10: rgba(161, 55, 50, 0.10);
  --vermilion-a35: rgba(161, 55, 50, 0.35);

  /* ===== 字体 ===== */
  --font-display: "LXGW WenKai Screen", "LXGW WenKai", "KaiTi", "楷体", "STKaiti", "华文楷体", serif;
  --font-en:      Georgia, "Times New Roman", serif;

  /* ===== 阴影 ===== */
  --shadow-paper:
    0 1px 0 var(--gold-a15) inset,
    0 6px 20px rgba(44, 36, 32, 0.06),
    0 2px 6px var(--gold-a10);
  --shadow-paper-deep:
    0 1px 0 var(--gold-a15) inset,
    0 12px 32px rgba(44, 36, 32, 0.08),
    0 2px 8px var(--gold-a10);
  --shadow-seal: 0 2px 8px rgba(161, 55, 50, 0.25);

  /* ===== 纹理背景 ===== */
  --paper-bg:
    radial-gradient(ellipse at top left, var(--paper-tint) 0%, transparent 55%),
    radial-gradient(ellipse at bottom right, var(--paper-dust) 0%, transparent 60%),
    var(--paper-base);
  --paper-noise-url: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.588  0 0 0 0 0.439  0 0 0 0 0.039  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");

  /* 毛笔横画：起笔墨色，收笔金色 */
  --brush-line-url: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 12' preserveAspectRatio='none'><defs><linearGradient id='b' x1='0' x2='1'><stop offset='0%25' stop-color='%232C2420' stop-opacity='0.15'/><stop offset='12%25' stop-color='%232C2420' stop-opacity='0.9'/><stop offset='88%25' stop-color='%2396700A' stop-opacity='0.65'/><stop offset='100%25' stop-color='%2396700A' stop-opacity='0'/></linearGradient></defs><path d='M 4 7 Q 40 3 100 5 T 240 6 Q 320 6.5 395 5.5 L 398 7 L 395 8.5 Q 300 9 200 7.5 T 60 7 Q 30 7 4 8 Z' fill='url(%23b)'/></svg>");

  /* ===== 兼容旧变量（保持 Element 等旧代码可用） ===== */
  --color-primary: var(--ink-gold);
  --color-primary-hover: var(--ink-gold-hi);
  --color-primary-light: var(--ink-gold-lo);
  --color-border: var(--gold-a35);
  --color-border-light: var(--gold-a15);
  --color-bg-blue: var(--paper-light);
  --color-bg-blue-light: var(--paper-white);
  --color-success: var(--ink-gold);
  --color-success-hover: var(--ink-gold-hi);
  --color-danger: var(--ink-vermilion);
  --color-danger-hover: var(--ink-vermilion-hi);
  --color-warning: #D4A017;
  --color-warning-hover: #E8BF3A;
  --color-text: var(--ink-black);
  --color-text-light: var(--ink-grey);
  --radius-btn: 16rpx;
  --radius-card: 20rpx;
}

/* ===== 共用毛笔横画 ===== */
.brush-line {
  display: block;
  width: 100%;
  height: 12px;
  background-image: var(--brush-line-url);
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
.brush-line-sm {
  height: 8px;
}

/* ===== 全局文字选中 / 滚动条 / focus ===== */
::selection {
  background: var(--vermilion-a35);
  color: var(--ink-black);
}
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--paper-light); }
::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--ink-gold-hi), var(--ink-gold));
  border-radius: 5px;
  border: 2px solid var(--paper-light);
}
::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--ink-gold), var(--ink-gold-lo));
}

/* ===== 全局 Element 定制（影响所有 Dialog/按钮/表单） ===== */
.el-dialog {
  background: var(--paper-white) !important;
  border-radius: 8px !important;
  border: 1px solid var(--gold-a25) !important;
  box-shadow: var(--shadow-paper-deep) !important;
  overflow: hidden;
}
.el-dialog__header {
  background: var(--paper-light) !important;
  border-bottom: 1px solid var(--gold-a25) !important;
  padding: 16px 24px !important;
  margin: 0 !important;
  position: relative;
}
.el-dialog__header::after {
  content: "";
  position: absolute;
  left: 24px; right: 24px; bottom: -1px;
  height: 1px;
  background: repeating-linear-gradient(to right,
    var(--gold-a35) 0, var(--gold-a35) 3px,
    transparent 3px, transparent 7px);
}
.el-dialog__title {
  color: var(--ink-gold) !important;
  font-family: var(--font-display) !important;
  font-weight: 500 !important;
  letter-spacing: 4px !important;
  font-size: 17px !important;
}
.el-dialog__body { padding: 24px !important; }
.el-dialog__footer {
  padding: 14px 24px !important;
  border-top: 1px solid var(--gold-a15) !important;
  background: var(--paper-light) !important;
}
.el-dialog__close {
  color: var(--ink-gold) !important;
  transition: all 0.2s !important;
}
.el-dialog__close:hover {
  color: var(--ink-vermilion) !important;
  transform: rotate(90deg);
}
.el-dialog__headerbtn:focus .el-dialog__close {
  color: var(--ink-vermilion) !important;
}

/* 键盘聚焦可见轮廓（无障碍） */
:focus-visible {
  outline: 2px solid var(--ink-gold) !important;
  outline-offset: 2px;
}
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--ink-vermilion) !important;
  outline-offset: 3px;
}

/* 表单控件中式化（覆盖 input / select / textarea / date-picker 等） */
.el-input__wrapper,
.el-select__wrapper,
.el-textarea__inner {
  background: var(--paper-light) !important;
  box-shadow: 0 0 0 1px var(--gold-a25) inset !important;
  border-radius: 4px !important;
  color: var(--ink-black) !important;
}
.el-input__wrapper.is-focus,
.el-input__wrapper:focus-within,
.el-select__wrapper.is-focused,
.el-select__wrapper.is-hovering,
.el-textarea__inner:focus {
  box-shadow: 0 0 0 1.5px var(--ink-gold) inset !important;
}
.el-input__inner,
.el-select__selected-item,
.el-select__placeholder > span {
  color: var(--ink-black) !important;
}
/* 下拉面板里的选项（弹出层） */
.el-select__popper.el-popper .el-select-dropdown__item {
  color: var(--ink-black);
  font-family: var(--font-display);
  letter-spacing: 2px;
}
.el-select__popper.el-popper .el-select-dropdown__item.hover,
.el-select__popper.el-popper .el-select-dropdown__item:hover {
  background: var(--paper-light);
}
.el-select__popper.el-popper .el-select-dropdown__item.selected {
  color: var(--ink-gold);
  background: var(--gold-a10);
  font-weight: 500;
}
.el-form-item__label {
  color: var(--ink-gold) !important;
  font-family: var(--font-display) !important;
  letter-spacing: 2px !important;
  font-weight: 500 !important;
}
.el-radio-button__inner,
.el-radio__label {
  font-family: var(--font-display) !important;
  letter-spacing: 1px !important;
}
.el-radio-button__inner {
  background: var(--paper-white) !important;
  border-color: var(--gold-a35) !important;
  color: var(--ink-gold) !important;
  font-weight: 500 !important;
  box-shadow: none !important;
  transition: all 0.2s !important;
}
.el-radio-button__inner:hover {
  background: var(--paper-light) !important;
  color: var(--ink-gold-lo) !important;
  border-color: var(--ink-gold) !important;
}
.el-radio-button.is-active .el-radio-button__inner,
.el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: linear-gradient(180deg, var(--ink-gold-hi) 0%, var(--ink-gold-lo) 100%) !important;
  border-color: var(--ink-gold-lo) !important;
  color: #FFFDF5 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25) !important;
  box-shadow:
    0 2px 6px var(--gold-a35) !important,
    0 0 0 1px var(--gold-a35) inset !important;
}

/* 通用按钮楷体字距 */
.el-button {
  font-family: var(--font-display) !important;
  letter-spacing: 2px !important;
  border-radius: 4px !important;
}

/* Checkbox */
.el-checkbox__inner {
  background: var(--paper-light) !important;
  border: 1px solid var(--gold-a35) !important;
  border-radius: 2px !important;
  width: 16px !important;
  height: 16px !important;
}
.el-checkbox__input.is-checked .el-checkbox__inner,
.el-checkbox__input.is-indeterminate .el-checkbox__inner {
  background: var(--ink-vermilion) !important;
  border-color: var(--ink-vermilion) !important;
}
.el-checkbox__input.is-checked .el-checkbox__inner::after {
  border-color: var(--paper-white) !important;
}
.el-checkbox__label {
  color: var(--ink-black) !important;
  font-family: var(--font-display) !important;
  letter-spacing: 2px !important;
}
.el-checkbox__input.is-checked + .el-checkbox__label {
  color: var(--ink-vermilion) !important;
}

/* Radio (非 radio-button) */
.el-radio__input.is-checked .el-radio__inner {
  background: var(--ink-vermilion) !important;
  border-color: var(--ink-vermilion) !important;
}
.el-radio__input.is-checked + .el-radio__label {
  color: var(--ink-vermilion) !important;
}
.el-radio__inner {
  border: 1.5px solid var(--gold-a35) !important;
  background: var(--paper-light) !important;
}

/* Switch */
.el-switch__core {
  background: var(--gold-a25) !important;
  border-color: var(--gold-a25) !important;
}
.el-switch.is-checked .el-switch__core {
  background: linear-gradient(180deg, var(--ink-gold-hi), var(--ink-gold)) !important;
  border-color: var(--ink-gold) !important;
}

/* Dropdown 菜单 */
.el-dropdown-menu {
  background: var(--paper-white) !important;
  border: 1px solid var(--gold-a25) !important;
  border-radius: 4px !important;
  box-shadow: var(--shadow-paper) !important;
  padding: 6px !important;
}
.el-dropdown-menu__item {
  font-family: var(--font-display) !important;
  letter-spacing: 2px !important;
  color: var(--ink-black) !important;
  border-radius: 3px !important;
  transition: all 0.2s !important;
}
.el-dropdown-menu__item:not(.is-disabled):hover,
.el-dropdown-menu__item:not(.is-disabled):focus {
  background: var(--paper-light) !important;
  color: var(--ink-gold) !important;
}
.el-popper.is-light {
  background: var(--paper-white) !important;
  border-color: var(--gold-a25) !important;
}
.el-popper.is-light .el-popper__arrow::before {
  background: var(--paper-white) !important;
  border-color: var(--gold-a25) !important;
}

/* 分页器 */
.el-pagination {
  font-family: var(--font-display) !important;
  --el-pagination-button-color: var(--ink-gold);
  --el-pagination-hover-color: var(--ink-vermilion);
}
.el-pagination .el-pager li {
  background: transparent !important;
  color: var(--ink-gold) !important;
  border-radius: 3px !important;
  min-width: 28px !important;
  transition: all 0.2s !important;
}
.el-pagination .el-pager li:hover {
  color: var(--ink-vermilion) !important;
}
.el-pagination .el-pager li.is-active {
  background: linear-gradient(180deg, var(--ink-gold-hi), var(--ink-gold-lo)) !important;
  color: #FFFDF5 !important;
  box-shadow: 0 2px 4px var(--gold-a35) !important;
}
.el-pagination .btn-prev,
.el-pagination .btn-next {
  background: transparent !important;
  color: var(--ink-gold) !important;
}
.el-pagination .btn-prev:hover,
.el-pagination .btn-next:hover {
  color: var(--ink-vermilion) !important;
}

/* Element Message（如项目改用） */
.el-message {
  background: var(--paper-white) !important;
  border: 1px solid var(--gold-a25) !important;
  box-shadow: var(--shadow-paper) !important;
  border-radius: 4px !important;
}
.el-message--success { border-left: 3px solid var(--ink-gold) !important; }
.el-message--warning { border-left: 3px solid #D4A017 !important; }
.el-message--error { border-left: 3px solid var(--ink-vermilion) !important; }
.el-message__content {
  font-family: var(--font-display) !important;
  letter-spacing: 2px !important;
  color: var(--ink-black) !important;
}

/* 尊重用户"减少动画"偏好 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ===== 印章式 Toast ===== */
.seal-toast-host {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.seal-toast {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 28px 36px 24px;
  background: var(--paper-white);
  border: 1px solid var(--gold-a25);
  border-radius: 6px;
  box-shadow: var(--shadow-paper-deep);
  min-width: 200px;
  max-width: 80vw;
  position: relative;
}
.seal-toast::before,
.seal-toast::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  height: 1px;
  background: repeating-linear-gradient(to right,
    var(--gold-a35) 0, var(--gold-a35) 3px,
    transparent 3px, transparent 7px);
}
.seal-toast::before { top: 8px; }
.seal-toast::after { bottom: 8px; }
.seal-toast-stamp {
  width: 72px;
  height: 72px;
  border: 3px solid var(--ink-vermilion);
  background: var(--paper-white);
  color: var(--ink-vermilion);
  font-family: var(--font-display);
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: var(--shadow-seal);
  animation: sealStamp 0.55s cubic-bezier(.34,1.56,.64,1) both;
}
.seal-toast-stamp.is-gold {
  border-color: var(--ink-gold);
  color: var(--ink-gold);
}
.seal-toast-stamp.is-loading {
  animation: sealSpin 1.2s linear infinite;
  border-color: var(--ink-gold);
  color: var(--ink-gold);
  border-top-color: transparent;
  font-size: 0;
}
.seal-toast-stamp.is-loading::before {
  content: "墨";
  font-size: 32px;
  animation: sealCounterSpin 1.2s linear infinite;
}
.seal-toast-msg {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--ink-black);
  letter-spacing: 3px;
  text-align: center;
  max-width: 320px;
  line-height: 1.6;
}
.seal-toast-wrap {
  animation: toastIn 0.28s ease both;
}
.seal-toast-wrap.is-leaving {
  animation: toastOut 0.2s ease both;
}
@keyframes sealStamp {
  0%   { opacity: 0; transform: rotate(-18deg) scale(0.3); }
  50%  { opacity: 1; transform: rotate(4deg) scale(1.15); }
  100% { opacity: 1; transform: rotate(-3deg) scale(1); }
}
@keyframes sealSpin {
  to { transform: rotate(360deg); }
}
@keyframes sealCounterSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}
@keyframes toastIn {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes toastOut {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.95); }
}
</style>
