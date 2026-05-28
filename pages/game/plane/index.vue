<template>
  <view class="game-page">
    <view class="game-area">
      <view
        class="canvas-wrap"
        @touchstart.prevent="onTouch"
        @touchmove.prevent="onTouch"
        @touchend.prevent="onTouchEnd"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      >
        <canvas
          id="gameCanvas"
          canvas-id="gameCanvas"
          type="2d"
          class="game-canvas"
        />
      </view>

      <!-- 顶部 HUD -->
      <view class="hud-top">
        <view class="hud-row">
          <view class="hud-label">HP</view>
          <view class="hp-bar">
            <view
              v-for="i in stats.maxHp"
              :key="i"
              class="hp-cell"
              :class="{ filled: i <= stats.hp }"
            />
          </view>
          <view v-if="stats.shield > 0" class="shield-badge">护盾 x{{ stats.shield }}</view>
        </view>
        <view class="hud-row">
          <view class="hud-label">Lv {{ stats.level }}</view>
          <view class="xp-bar">
            <view class="xp-fill" :style="{ width: xpPct + '%' }" />
          </view>
        </view>
        <view class="hud-row hud-meta-row">
          <text class="hud-meta">击杀 {{ stats.kills }}</text>
          <text class="hud-meta">{{ formatTime(stats.time) }}</text>
        </view>
      </view>

      <view class="back-btn" @click="goBack">
        <text class="back-txt">← 返回</text>
      </view>
    </view>

    <!-- 升级三选一 -->
    <view v-if="upgradeChoices.length" class="modal-mask">
      <view class="upgrade-modal">
        <text class="upgrade-title">Lv {{ stats.level }} 升级！</text>
        <text class="upgrade-sub">选择一项强化</text>
        <view class="upgrade-list">
          <view
            v-for="s in upgradeChoices"
            :key="s.id"
            class="upgrade-card"
            :style="{ borderColor: s.color }"
            @click="pickUpgrade(s)"
          >
            <view class="upgrade-dot" :style="{ background: s.color }" />
            <text class="upgrade-name">{{ s.name }}</text>
            <text class="upgrade-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 结算 -->
    <view v-if="overInfo" class="modal-mask">
      <view class="over-modal">
        <text class="over-title">阵亡</text>
        <view class="over-stats">
          <view class="over-row"><text>等级</text><text>Lv {{ overInfo.level }}</text></view>
          <view class="over-row"><text>击杀</text><text>{{ overInfo.kills }}</text></view>
          <view class="over-row"><text>时长</text><text>{{ formatTime(overInfo.time) }}</text></view>
        </view>
        <view class="over-actions">
          <view class="over-btn primary" @click="restart">再来一局</view>
          <view class="over-btn" @click="goBack">返回首页</view>
        </view>
      </view>
    </view>

    <view v-if="showHint" class="hint" @click="showHint = false">
      <text>手指拖拽 / 键盘 WASD · 方向键 移动</text>
      <text>自动开火 · 经验满升级三选一</text>
      <text class="hint-tap">点击任意处开始</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { createEngine } from './engine.js';

const cssW = ref(0);
const cssH = ref(0);
const stats = reactive({ hp: 3, maxHp: 3, shield: 0, xp: 0, xpNeed: 6, level: 1, kills: 0, time: 0 });
const upgradeChoices = ref([]);
const overInfo = ref(null);
const showHint = ref(true);

let engine = null;
let canvasNode = null;
let canvasCtx = null;
let canvasDpr = 1;
const canvasRect = { left: 0, top: 0 };

const xpPct = computed(() => Math.min(100, (stats.xp / stats.xpNeed) * 100));

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 从真 canvas DOM 实际渲染尺寸读出 CSS 宽高
function readCanvasCssSize() {
  // #ifdef H5
  let dom = document.getElementById('gameCanvas');
  if (dom && dom.tagName !== 'CANVAS') dom = dom.querySelector('canvas');
  if (dom) {
    const rect = dom.getBoundingClientRect();
    cssW.value = Math.round(rect.width);
    cssH.value = Math.round(rect.height);
    return dom;
  }
  // #endif
  const sys = uni.getSystemInfoSync();
  cssW.value = sys.windowWidth;
  cssH.value = sys.windowHeight;
  return null;
}

onMounted(async () => {
  await nextTick();
  setTimeout(initCanvas, 50);

  // #ifdef H5
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onWindowResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onWindowResize);
  }
  // #endif
});

onBeforeUnmount(() => {
  if (engine) engine.stop();
  // #ifdef H5
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('resize', onWindowResize);
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', onWindowResize);
  }
  // #endif
});

let resizeTimer = null;
function onWindowResize() {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(applyResize, 120);
}

function applyResize() {
  if (!canvasNode || !canvasCtx) return;
  // #ifdef H5
  const area = document.querySelector('.game-area');
  if (area) {
    const r = area.getBoundingClientRect();
    cssW.value = Math.round(r.width);
    cssH.value = Math.round(r.height);
    canvasRect.left = r.left;
    canvasRect.top = r.top;
  }
  canvasNode.style.width = cssW.value + 'px';
  canvasNode.style.height = cssH.value + 'px';
  // #endif
  canvasNode.width = cssW.value * canvasDpr;
  canvasNode.height = cssH.value * canvasDpr;
  canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
  canvasCtx.scale(canvasDpr, canvasDpr);
  if (engine) engine.resize(cssW.value, cssH.value);
}

function initCanvas() {
  // #ifdef H5
  // 1) 用 .game-area 容器尺寸作为 cssW/cssH 真相源（不依赖 canvas 包装层）
  const area = document.querySelector('.game-area');
  if (!area) { setTimeout(initCanvas, 50); return; }
  const areaRect = area.getBoundingClientRect();
  cssW.value = Math.round(areaRect.width);
  cssH.value = Math.round(areaRect.height);
  if (!cssW.value || !cssH.value) { setTimeout(initCanvas, 50); return; }

  // 2) 拿真 <canvas> DOM
  let dom = document.getElementById('gameCanvas');
  if (dom && dom.tagName !== 'CANVAS') dom = dom.querySelector('canvas');
  if (!dom) { setTimeout(initCanvas, 50); return; }

  // 3) 强制 canvas 视觉尺寸 = 容器尺寸（绕开 uni-canvas 包装层可能的尺寸不正确）
  dom.style.display = 'block';
  dom.style.width = cssW.value + 'px';
  dom.style.height = cssH.value + 'px';
  dom.style.position = 'absolute';
  dom.style.left = '0';
  dom.style.top = '0';

  // 4) 内部 buffer = CSS × dpr
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  dom.width = cssW.value * dpr;
  dom.height = cssH.value * dpr;

  // 5) 触屏坐标基准用 .game-area 的位置
  canvasRect.left = areaRect.left;
  canvasRect.top = areaRect.top;

  const ctx = dom.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  canvasNode = dom;
  canvasCtx = ctx;
  canvasDpr = dpr;
  const raf = (cb) => window.requestAnimationFrame(cb);
  const caf = (id) => window.cancelAnimationFrame(id);
  startEngine(ctx, cssW.value, cssH.value, dpr, raf, caf);
  return;
  // #endif
  // 小程序 / App 端走 selectorQuery
  const query = uni.createSelectorQuery();
  query.select('#gameCanvas')
    .fields({ node: true, size: true, rect: true })
    .exec((res) => {
      if (!res || !res[0] || !res[0].node) return;
      const node = res[0].node;
      const sys = uni.getSystemInfoSync();
      cssW.value = res[0].width || sys.windowWidth;
      cssH.value = res[0].height || sys.windowHeight;
      const dpr = Math.min(sys.pixelRatio || 1, 2);
      node.width = cssW.value * dpr;
      node.height = cssH.value * dpr;
      const ctx = node.getContext('2d');
      ctx.scale(dpr, dpr);
      canvasNode = node;
      canvasCtx = ctx;
      canvasDpr = dpr;
      canvasRect.left = res[0].left || 0;
      canvasRect.top = res[0].top || 0;
      let raf, caf;
      if (node.requestAnimationFrame) {
        raf = (cb) => node.requestAnimationFrame(cb);
        caf = (id) => node.cancelAnimationFrame(id);
      } else {
        raf = (cb) => setTimeout(() => cb(Date.now()), 16);
        caf = (id) => clearTimeout(id);
      }
      startEngine(ctx, cssW.value, cssH.value, dpr, raf, caf);
    });
}

function startEngine(ctx, w, h, dpr, raf, caf) {
  engine = createEngine({
    ctx, width: w, height: h, dpr, raf, caf,
    onStats: (s) => Object.assign(stats, s),
    onUpgrade: (choices) => { upgradeChoices.value = choices; },
    onGameOver: (info) => { overInfo.value = info; }
  });
  engine.start();
}

function pickUpgrade(s) {
  if (!engine) return;
  engine.applySkill(s);
  upgradeChoices.value = [];
}

function restart() {
  overInfo.value = null;
  if (engine) engine.reset();
}

function goBack() {
  if (engine) engine.stop();
  uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) });
}

function onTouch(e) {
  if (!engine) return;
  showHint.value = false;
  const t = e.touches && e.touches[0];
  if (!t) return;
  const x = (t.clientX !== undefined ? t.clientX : t.pageX) - canvasRect.left;
  const y = (t.clientY !== undefined ? t.clientY : t.pageY) - canvasRect.top;
  engine.setTarget(x, y);
}
function onTouchEnd() {
  if (engine) engine.clearTarget();
}

let mouseDown = false;
function onMouseDown(e) {
  mouseDown = true;
  showHint.value = false;
  if (engine) engine.setTarget(e.clientX - canvasRect.left, e.clientY - canvasRect.top);
}
function onMouseMove(e) {
  if (!mouseDown || !engine) return;
  engine.setTarget(e.clientX - canvasRect.left, e.clientY - canvasRect.top);
}
function onMouseUp() {
  mouseDown = false;
  if (engine) engine.clearTarget();
}

function onKeyDown(e) {
  if (!engine) return;
  const k = mapKey(e.key);
  if (k) {
    engine.keyDown(k);
    showHint.value = false;
    if (['up', 'down', 'left', 'right'].includes(k)) e.preventDefault();
  }
}
function onKeyUp(e) {
  if (!engine) return;
  const k = mapKey(e.key);
  if (k) engine.keyUp(k);
}
function mapKey(key) {
  switch (key) {
    case 'ArrowUp': case 'w': case 'W': return 'up';
    case 'ArrowDown': case 's': case 'S': return 'down';
    case 'ArrowLeft': case 'a': case 'A': return 'left';
    case 'ArrowRight': case 'd': case 'D': return 'right';
    default: return null;
  }
}
</script>

<style scoped>
.game-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #0E1530 0%, #02030A 100%);
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
.game-area {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  background: #02030A;
}
.canvas-wrap {
  position: absolute;
  inset: 0;
  touch-action: none;
}
.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.hud-top {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  z-index: 5;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
  background: rgba(11,19,43,0.45);
  padding: 10px 12px;
  border-radius: 10px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.08);
}
.hud-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hud-label {
  color: #FFE066;
  font-size: 12px;
  font-weight: bold;
  min-width: 38px;
}
.hp-bar {
  display: flex;
  gap: 4px;
  flex: 1;
}
.hp-cell {
  width: 16px;
  height: 11px;
  border: 1px solid rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.08);
  border-radius: 2px;
}
.hp-cell.filled {
  background: linear-gradient(180deg, #FF6B8A, #D63558);
  border-color: #FF6B8A;
  box-shadow: 0 0 4px rgba(239,71,111,0.5);
}
.shield-badge {
  font-size: 11px;
  color: #5EC8FF;
  background: rgba(94,200,255,0.12);
  border: 1px solid #5EC8FF;
  padding: 1px 7px;
  border-radius: 8px;
}
.xp-bar {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}
.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #06D6A0 0%, #FFE066 100%);
  box-shadow: 0 0 6px rgba(255,224,102,0.4);
  transition: width 0.15s linear;
}
.hud-meta-row {
  justify-content: space-between;
  margin-top: 2px;
}
.hud-meta {
  color: rgba(255,255,255,0.7);
  font-size: 11px;
  letter-spacing: 0.5px;
}
.back-btn {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 5;
  background: rgba(0,0,0,0.5);
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.2);
}
.back-txt {
  color: #fff;
  font-size: 12px;
}
.modal-mask {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upgrade-modal, .over-modal {
  background: #1C2541;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 20px;
  width: 86%;
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.upgrade-title {
  display: block;
  color: #FFE066;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}
.upgrade-sub {
  display: block;
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  text-align: center;
  margin-top: 4px;
  margin-bottom: 16px;
}
.upgrade-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.upgrade-card {
  background: rgba(255,255,255,0.04);
  border: 2px solid;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  position: relative;
}
.upgrade-card:active {
  background: rgba(255,255,255,0.12);
}
.upgrade-dot {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.upgrade-name {
  color: #fff;
  font-size: 15px;
  font-weight: bold;
}
.upgrade-desc {
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  margin-top: 3px;
}
.over-title {
  display: block;
  color: #EF476F;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
}
.over-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
.over-row {
  display: flex;
  justify-content: space-between;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  padding: 6px 12px;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
}
.over-actions {
  display: flex;
  gap: 10px;
}
.over-btn {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  color: #fff;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
}
.over-btn.primary {
  background: #06D6A0;
  border-color: #06D6A0;
  color: #0B132B;
  font-weight: bold;
}
.hint {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(11,19,43,0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255,255,255,0.9);
  font-size: 14px;
}
.hint-tap {
  margin-top: 12px;
  color: #FFE066;
  font-size: 12px;
}
</style>
