<template>
  <view class="container">
    <view class="paper-noise" />

    <!-- 墨迹扩散装饰（入场仪式） -->
    <svg class="ink-splash" viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <radialGradient id="inkBlot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#A13732" stop-opacity="0.35"/>
          <stop offset="50%" stop-color="#8B2923" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#6E2824" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="320" cy="80" r="0" fill="url(#inkBlot)">
        <animate attributeName="r" from="0" to="180" dur="1.2s" begin="0.15s" fill="freeze" calcMode="spline" keySplines="0.2 0.6 0.3 1"/>
      </circle>
    </svg>

    <!-- 品牌带 -->
    <view class="brand-band">
      <view class="brand-main">
        <view class="title-wrap">
          <text class="title">老万石雕</text>
        </view>
        <text class="subtitle">Lǎo Wàn · Stone Carving</text>
        <text class="motto">— 一凿一刻，传世可期 —</text>
      </view>
      <view class="title-seal">万</view>
    </view>

    <!-- 分隔线 -->
    <view class="section-divider">
      <view class="divider-line" />
      <view class="divider-seal">匠</view>
      <view class="divider-line" />
    </view>

    <!-- 章节小标（左突出） -->
    <view class="section-label">
      <text class="section-label-no">壹</text>
      <text class="section-label-text">工坊器用</text>
      <text class="section-label-en">Tools of the Trade</text>
    </view>
    <view class="brush-line section-brush" />

    <!-- 工具网格：首张突出，副张收窄 -->
    <view class="tool-grid">
      <view class="tool-card tool-card-lead" @click="goTo('/pages/stele/list')">
        <view class="tool-card-inner">
          <view class="tool-meta">
            <text class="tool-no">No. 01</text>
            <text class="tool-tag">启用中</text>
          </view>
          <svg class="tool-icon" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="6" y="2" width="36" height="58" rx="3" ry="3"
              fill="none" stroke="#96700A" stroke-width="2" />
            <rect x="10" y="6" width="28" height="50" rx="2" ry="2"
              fill="none" stroke="#96700A" stroke-width="0.6" opacity="0.55" />
            <line x1="24" y1="12" x2="24" y2="50" stroke="#96700A" stroke-width="1" stroke-dasharray="1 3" opacity="0.45" />
            <text x="24" y="22" text-anchor="middle" font-size="9" fill="#96700A" font-family="serif">碑</text>
            <text x="24" y="34" text-anchor="middle" font-size="9" fill="#96700A" font-family="serif">文</text>
            <text x="24" y="46" text-anchor="middle" font-size="9" fill="#96700A" font-family="serif">記</text>
          </svg>
          <text class="tool-title">碑文排版</text>
          <text class="tool-desc">订单管理 · 文字排版 · 预览导出</text>
          <view class="tool-arrow">
            <text class="tool-arrow-txt">入</text>
            <text class="tool-arrow-line">──→</text>
          </view>
        </view>
      </view>

      <view class="tool-sub-column">
        <view class="tool-card tool-card-coming">
          <text class="coming-no">02</text>
          <text class="coming-txt">敬请期待</text>
          <text class="coming-en">Coming Soon</text>
        </view>
        <view class="tool-card tool-card-coming">
          <text class="coming-no">03</text>
          <text class="coming-txt">敬请期待</text>
          <text class="coming-en">Coming Soon</text>
        </view>
      </view>
    </view>

    <!-- 页脚落款 -->
    <view class="footer-signature">
      <text class="footer-dash">·</text>
      <text class="footer-txt">石上春秋 · 字字千年</text>
      <text class="footer-dash">·</text>
    </view>

    <!-- 墨竹角饰：右下角极低调装饰 -->
    <svg class="corner-bamboo" viewBox="0 0 120 180" aria-hidden="true">
      <g stroke="#2C2420" stroke-linecap="round" fill="none" opacity="0.18">
        <path d="M 20 170 Q 30 120, 45 70 T 60 10" stroke-width="2.5"/>
        <line x1="30" y1="135" x2="36" y2="138" stroke-width="1"/>
        <line x1="38" y1="100" x2="44" y2="103" stroke-width="1"/>
        <line x1="45" y1="68" x2="51" y2="71" stroke-width="1"/>
        <path d="M 45 70 Q 65 62, 82 55" stroke-width="1.5"/>
        <path d="M 38 100 Q 58 92, 75 85" stroke-width="1.5"/>
        <path d="M 30 135 Q 48 128, 62 122" stroke-width="1.5"/>
        <path d="M 80 55 Q 86 50, 90 42" stroke-width="1"/>
        <path d="M 82 55 Q 92 56, 100 60" stroke-width="1"/>
        <path d="M 75 85 Q 82 80, 86 72" stroke-width="1"/>
        <path d="M 75 85 Q 86 87, 95 92" stroke-width="1"/>
      </g>
    </svg>
  </view>
</template>

<script setup>
function goTo(url) {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.container {
  position: relative;
  min-height: 100vh;
  padding: 60rpx 40rpx 80rpx;
  background:
    radial-gradient(ellipse at top left, #F3ECE0 0%, transparent 55%),
    radial-gradient(ellipse at bottom right, #EFE8DC 0%, transparent 60%),
    #F6F1E8;
  overflow: hidden;
  box-sizing: border-box;
}

.paper-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.588  0 0 0 0 0.439  0 0 0 0 0.039  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

/* 墨迹扩散 */
.ink-splash {
  position: absolute;
  top: -40rpx;
  right: -40rpx;
  width: 520rpx;
  height: 520rpx;
  pointer-events: none;
  z-index: 0;
}

/* ===== 品牌带 ===== */
.brand-band {
  position: relative;
  padding: 40rpx 20rpx 60rpx;
  z-index: 1;
}

.brand-main {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.title-wrap {
  overflow: hidden;
  padding: 6rpx 0;
}

.title {
  display: inline-block;
  font-size: 110rpx;
  font-weight: 500;
  color: #2C2420;
  font-family: var(--font-display);
  letter-spacing: 16rpx;
  line-height: 1.1;
  padding-left: 4rpx;
  /* 墨染开：从左向右显形 */
  background: linear-gradient(90deg, #2C2420 0%, #2C2420 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: #2C2420;
  animation: inkReveal 1.1s cubic-bezier(.55, .2, .3, 1) 0.45s both;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: #96700A;
  letter-spacing: 10rpx;
  text-transform: uppercase;
  font-style: italic;
  opacity: 0.75;
  padding-left: 6rpx;
  font-family: Georgia, "Cormorant Garamond", serif;
  animation: reveal 0.9s ease 1.0s both;
}

.motto {
  margin-top: 20rpx;
  font-size: 30rpx;
  color: #8C6A1B;
  letter-spacing: 8rpx;
  font-family: var(--font-display);
  opacity: 0;
  animation: reveal 0.9s ease 1.15s both;
}

.title-seal {
  position: absolute;
  top: 60rpx;
  right: 30rpx;
  width: 96rpx;
  height: 96rpx;
  border: 3rpx solid #A13732;
  color: #A13732;
  font-family: var(--font-display);
  font-size: 54rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6rpx;
  transform: rotate(-8deg) scale(0);
  box-shadow: 0 0 0 2rpx #F6F1E8 inset;
  opacity: 0;
  animation: sealStamp 0.55s cubic-bezier(.34,1.56,.64,1) 1.35s forwards;
  z-index: 2;
  cursor: pointer;
  transition: transform 0.3s ease;
}
.title-seal:hover {
  animation: sealJitter 0.4s ease;
}
/* 印章晕染扩散 */
.title-seal::before {
  content: "";
  position: absolute;
  inset: -20rpx;
  background: radial-gradient(circle, rgba(161, 55, 50, 0.25) 0%, transparent 70%);
  opacity: 0;
  z-index: -1;
  animation: sealBleed 0.8s ease 1.55s forwards;
}

/* ===== 分隔线 ===== */
.section-divider {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin: 20rpx 0 40rpx;
  position: relative;
  z-index: 1;
  animation: reveal 0.7s ease 1.65s both;
}

.divider-line {
  flex: 1;
  height: 0;
  border-top: 1rpx solid rgba(150, 112, 10, 0.35);
  box-shadow: 0 3rpx 0 rgba(150, 112, 10, 0.15);
}

.divider-seal {
  width: 48rpx;
  height: 48rpx;
  border: 2rpx solid rgba(150, 112, 10, 0.5);
  color: rgba(150, 112, 10, 0.85);
  font-family: var(--font-display);
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4rpx;
}

/* ===== 章节标：左突出 ===== */
.section-label {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  margin: 0 0 28rpx -16rpx; /* 向左突出 */
  padding-left: 0;
  position: relative;
  z-index: 1;
  animation: reveal 0.7s ease 1.8s both;
}

.section-label-no {
  font-size: 48rpx;
  font-family: var(--font-display);
  color: #A13732;
  letter-spacing: 2rpx;
  line-height: 1;
}

.section-label-text {
  font-size: 32rpx;
  font-family: var(--font-display);
  color: #2C2420;
  letter-spacing: 8rpx;
}

.section-label-en {
  margin-left: auto;
  font-size: 20rpx;
  color: #96700A;
  letter-spacing: 4rpx;
  font-style: italic;
  opacity: 0.6;
  text-transform: uppercase;
  font-family: Georgia, serif;
}

/* 毛笔横画：章节下的装饰 */
.section-brush {
  height: 16rpx;
  margin: 0 0 28rpx -16rpx;
  position: relative;
  z-index: 1;
  animation: brushDraw 1.2s ease 1.9s both;
}
@keyframes brushDraw {
  from { clip-path: inset(0 100% 0 0); opacity: 0; }
  50%  { opacity: 1; }
  to   { clip-path: inset(0 0 0 0); opacity: 1; }
}

/* ===== 工具网格：3fr 2fr 不对称 ===== */
.tool-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20rpx;
  position: relative;
  z-index: 1;
}

.tool-card {
  position: relative;
  background: #FFFDF8;
  border-radius: 8rpx;
  box-shadow:
    0 1rpx 0 rgba(150, 112, 10, 0.12) inset,
    0 12rpx 32rpx rgba(44, 36, 32, 0.07),
    0 2rpx 8rpx rgba(150, 112, 10, 0.05);
  overflow: hidden;
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.tool-card:active {
  transform: translateY(2rpx);
}

.tool-card-lead {
  min-height: 460rpx;
  animation: reveal 0.8s ease 1.9s both;
}

.tool-card-inner {
  position: relative;
  padding: 48rpx 40rpx 40rpx 80rpx;
  height: 100%;
  box-sizing: border-box;
}

.tool-card-lead .tool-card-inner::before {
  content: "";
  position: absolute;
  left: 18rpx;
  top: 36rpx;
  bottom: 36rpx;
  width: 14rpx;
  background-image:
    linear-gradient(to bottom, #96700A, #96700A),
    linear-gradient(to bottom, #96700A, #96700A);
  background-repeat: no-repeat;
  background-size: 4rpx 100%, 1rpx 100%;
  background-position: 0 0, 12rpx 0;
}

.tool-card-lead::after {
  content: "";
  position: absolute;
  top: -80rpx;
  right: -80rpx;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(150, 112, 10, 0.12) 0%, transparent 70%);
  pointer-events: none;
  transition: transform 0.5s ease;
}

.tool-card-lead:hover::after {
  transform: rotate(15deg) scale(1.15);
}

.tool-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 28rpx;
}

.tool-no {
  font-size: 38rpx;
  font-family: Georgia, "Cormorant Garamond", serif;
  font-style: italic;
  color: #96700A;
  letter-spacing: 2rpx;
}

.tool-tag {
  font-size: 24rpx;
  padding: 5rpx 16rpx;
  border: 1rpx solid #A13732;
  color: #A13732;
  font-family: var(--font-display);
  letter-spacing: 4rpx;
  border-radius: 2rpx;
}

.tool-icon {
  width: 110rpx;
  height: 146rpx;
  margin-bottom: 24rpx;
}

.tool-title {
  display: block;
  font-size: 60rpx;
  font-weight: 500;
  color: #2C2420;
  font-family: var(--font-display);
  letter-spacing: 10rpx;
  margin-bottom: 14rpx;
}

.tool-desc {
  display: block;
  font-size: 28rpx;
  color: #8C8078;
  letter-spacing: 3rpx;
  font-family: var(--font-display);
  line-height: 1.7;
}

.tool-arrow {
  position: absolute;
  right: 40rpx;
  bottom: 32rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #96700A;
  font-family: var(--font-display);
  letter-spacing: 2rpx;
  opacity: 0.85;
  transition: transform 0.3s ease;
}

.tool-card-lead:hover .tool-arrow {
  transform: translateX(6rpx);
}

.tool-arrow-txt { font-size: 32rpx; }
.tool-arrow-line { font-size: 26rpx; letter-spacing: 0; }

/* 副列：两张堆叠的小卡 */
.tool-sub-column {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  animation: reveal 0.8s ease 2.05s both;
}

.tool-card-coming {
  flex: 1;
  min-height: 220rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  background: transparent;
  border: 1rpx dashed rgba(150, 112, 10, 0.3);
  box-shadow: none;
  color: rgba(150, 112, 10, 0.55);
  transition: border-color 0.3s;
}

.tool-card-coming:hover {
  border-color: rgba(150, 112, 10, 0.55);
}

.coming-no {
  font-size: 50rpx;
  font-family: Georgia, serif;
  font-style: italic;
  opacity: 0.55;
}

.coming-txt {
  font-size: 30rpx;
  font-family: var(--font-display);
  letter-spacing: 6rpx;
}

.coming-en {
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  opacity: 0.6;
  font-style: italic;
  font-family: Georgia, serif;
}

/* ===== 页脚落款 ===== */
.footer-signature {
  margin-top: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  color: rgba(150, 112, 10, 0.6);
  font-family: var(--font-display);
  font-size: 24rpx;
  letter-spacing: 8rpx;
  position: relative;
  z-index: 1;
  animation: reveal 0.9s ease 2.25s both;
}

.footer-dash { font-size: 28rpx; opacity: 0.5; }

/* 墨竹角饰：右下极低调装饰 */
.corner-bamboo {
  position: absolute;
  right: 30rpx;
  bottom: 30rpx;
  width: 160rpx;
  height: 240rpx;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  animation: bambooReveal 1.5s ease 2.4s forwards;
}
@keyframes bambooReveal {
  from { opacity: 0; transform: translateY(10rpx); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ===== 入场仪式关键帧 ===== */
@keyframes reveal {
  from { opacity: 0; transform: translateY(16rpx); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 标题墨染：左 clip 展开 */
@keyframes inkReveal {
  0% {
    opacity: 0;
    clip-path: inset(0 100% 0 0);
    filter: blur(6rpx);
  }
  50% {
    opacity: 1;
    filter: blur(1rpx);
  }
  100% {
    opacity: 1;
    clip-path: inset(0 0 0 0);
    filter: blur(0);
  }
}

@keyframes sealStamp {
  0%   { opacity: 0; transform: rotate(-30deg) scale(0.3); }
  55%  { opacity: 1; transform: rotate(4deg) scale(1.18); }
  85%  { transform: rotate(-5deg) scale(0.96); }
  100% { opacity: 0.9; transform: rotate(-8deg) scale(1); }
}

@keyframes sealBleed {
  0%   { opacity: 0; transform: scale(0.6); }
  60%  { opacity: 0.9; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(1.6); }
}

/* 印章 hover 轻微抖动：像要再盖一次 */
@keyframes sealJitter {
  0%   { transform: rotate(-8deg) scale(1); }
  25%  { transform: rotate(-2deg) scale(1.06); }
  50%  { transform: rotate(-12deg) scale(1.04); }
  75%  { transform: rotate(-5deg) scale(1.02); }
  100% { transform: rotate(-8deg) scale(1); }
}
</style>
