<template>
  <view class="game-page">
    <view
      class="game-area"
      @touchstart.prevent="onTouch"
      @touchmove.prevent="onTouch"
      @touchend.prevent="onTouchEnd"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <!-- 静态背景 -->
      <view class="bg-gradient" />
      <view class="bg-glow" />

      <!-- 星空 -->
      <view class="stars stars-far">
        <view v-for="i in 18" :key="'sf'+i" class="star"
          :style="{ left: ((i*97)%100)+'%', top: ((i*53)%100)+'%' }" />
      </view>
      <view class="stars stars-near">
        <view v-for="i in 10" :key="'sn'+i" class="star star-big"
          :style="{ left: ((i*167)%100)+'%', top: ((i*89)%100)+'%' }" />
      </view>

      <!-- 实体层 -->
      <view class="layer">
        <!-- 粒子 -->
        <view
          v-for="p in scene.particles"
          :key="'p'+p.id"
          class="particle"
          :style="{
            transform: `translate3d(${p.x}px,${p.y}px,0)`,
            width: (p.r*2)+'px', height: (p.r*2)+'px',
            background: p.color,
            opacity: Math.max(0, p.life/p.max),
            marginLeft: (-p.r)+'px', marginTop: (-p.r)+'px',
          }" />

        <!-- 宝箱 -->
        <view
          v-for="b in scene.boxes"
          :key="'b'+b.id"
          class="box"
          :style="{
            transform: `translate3d(${b.x}px,${b.y}px,0) rotate(${b.rot}rad)`,
            width: (b.r*2)+'px', height: (b.r*2)+'px',
            marginLeft: (-b.r)+'px', marginTop: (-b.r)+'px',
          }" />

        <!-- 敌人 -->
        <view
          v-for="e in scene.enemies"
          :key="'e'+e.id"
          class="enemy-wrap"
          :style="{
            transform: `translate3d(${e.x}px,${e.y}px,0)`,
            width: (e.r*2)+'px', height: (e.r*2)+'px',
            marginLeft: (-e.r)+'px', marginTop: (-e.r)+'px',
          }"
        >
          <view
            class="enemy"
            :class="{ elite: e.elite }"
            :style="{ background: e.color }"
          />
          <view v-if="e.hp<e.maxHp" class="enemy-hp">
            <view class="enemy-hp-fill" :style="{ width: (e.hp/e.maxHp*100)+'%' }" />
          </view>
        </view>

        <!-- 玩家子弹 -->
        <view
          v-for="b in scene.bullets"
          :key="'pb'+b.id"
          class="p-bullet"
          :style="{
            transform: `translate3d(${b.x}px,${b.y}px,0)`,
            width: b.r+'px', height: (b.r*2.4)+'px',
            marginLeft: (-b.r/2)+'px', marginTop: (-b.r*1.2)+'px',
          }" />

        <!-- 敌弹 -->
        <view
          v-for="b in scene.enemyBullets"
          :key="'eb'+b.id"
          class="e-bullet"
          :style="{
            transform: `translate3d(${b.x}px,${b.y}px,0)`,
            width: (b.r*2)+'px', height: (b.r*2)+'px',
            marginLeft: (-b.r)+'px', marginTop: (-b.r)+'px',
          }" />

        <!-- 玩家飞机 -->
        <view
          class="player"
          :class="{ blink: scene.player.blink }"
          :style="{
            transform: `translate3d(${scene.player.x}px,${scene.player.y}px,0)`,
            width: (scene.player.r*2.4)+'px',
            height: (scene.player.r*2.4)+'px',
            marginLeft: (-scene.player.r*1.2)+'px',
            marginTop: (-scene.player.r*1.2)+'px',
          }"
        >
          <view class="player-art">
            <view class="wing wing-left" />
            <view class="wing wing-right" />
            <view class="fuselage" />
            <view class="cockpit" />
            <view class="flame flame-outer" />
            <view class="flame flame-inner" />
          </view>
          <view v-if="scene.player.shield>0" class="shield-ring" />
          <text v-if="scene.player.shield>0" class="shield-num">x{{ scene.player.shield }}</text>
        </view>

        <!-- 浮动文字 -->
        <text
          v-for="t in scene.floatTexts"
          :key="'t'+t.id"
          class="float-text"
          :style="{
            transform: `translate3d(${t.x}px,${t.y}px,0)`,
            color: t.color,
            opacity: Math.max(0, t.life/t.max),
          }"
        >{{ t.text }}</text>
      </view>

      <!-- 闪屏 -->
      <view v-if="scene.flash>0" class="flash"
        :style="{ opacity: scene.flash/400 }" />

      <!-- HUD -->
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
import { ref, shallowRef, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { createEngine } from './engine.js';

const stats = reactive({ hp: 3, maxHp: 3, shield: 0, xp: 0, xpNeed: 6, level: 1, kills: 0, time: 0 });
const upgradeChoices = ref([]);
const overInfo = ref(null);
const showHint = ref(true);

const scene = shallowRef({
  player: { x: 0, y: 0, r: 10, shield: 0, invuln: 0, blink: false },
  enemies: [], bullets: [], enemyBullets: [], boxes: [],
  particles: [], floatTexts: [], flash: 0,
});

let engine = null;
const stageRect = { left: 0, top: 0, width: 0, height: 0 };

const xpPct = computed(() => Math.min(100, (stats.xp / stats.xpNeed) * 100));

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function measureStage() {
  // #ifdef H5
  const area = document.querySelector('.game-area');
  if (!area) return false;
  const r = area.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  stageRect.left = r.left;
  stageRect.top = r.top;
  stageRect.width = Math.round(r.width);
  stageRect.height = Math.round(r.height);
  return true;
  // #endif
  // #ifndef H5
  const sys = uni.getSystemInfoSync();
  stageRect.left = 0;
  stageRect.top = 0;
  stageRect.width = sys.windowWidth;
  stageRect.height = sys.windowHeight;
  return true;
  // #endif
}

function startEngine() {
  if (!measureStage()) {
    setTimeout(startEngine, 50);
    return;
  }
  let raf, caf;
  // #ifdef H5
  raf = (cb) => window.requestAnimationFrame(cb);
  caf = (id) => window.cancelAnimationFrame(id);
  // #endif
  // #ifndef H5
  raf = (cb) => setTimeout(() => cb(Date.now()), 16);
  caf = (id) => clearTimeout(id);
  // #endif
  engine = createEngine({
    width: stageRect.width,
    height: stageRect.height,
    raf, caf,
    onStats: (s) => Object.assign(stats, s),
    onUpgrade: (choices) => { upgradeChoices.value = choices; },
    onGameOver: (info) => { overInfo.value = info; },
    onFrame: () => {
      scene.value = engine.getRenderState();
    },
  });
  engine.start();
}

onMounted(async () => {
  await nextTick();
  setTimeout(startEngine, 50);

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
  resizeTimer = setTimeout(() => {
    if (!engine || !measureStage()) return;
    engine.resize(stageRect.width, stageRect.height);
  }, 120);
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
  const cx = t.clientX !== undefined ? t.clientX : t.pageX;
  const cy = t.clientY !== undefined ? t.clientY : t.pageY;
  engine.setTarget(cx - stageRect.left, cy - stageRect.top);
}
function onTouchEnd() {
  if (engine) engine.clearTarget();
}

let mouseDown = false;
function onMouseDown(e) {
  mouseDown = true;
  showHint.value = false;
  if (engine) engine.setTarget(e.clientX - stageRect.left, e.clientY - stageRect.top);
}
function onMouseMove(e) {
  if (!mouseDown || !engine) return;
  engine.setTarget(e.clientX - stageRect.left, e.clientY - stageRect.top);
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
  background: #02030A;
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
  touch-action: none;
}

/* 静态背景 */
.bg-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, #1A0E3D 0%, #0B1840 50%, #04081F 100%);
  pointer-events: none;
}
.bg-glow {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center,
    rgba(94,80,200,0.22) 0%, rgba(0,0,0,0) 60%);
  pointer-events: none;
}

/* 星空 */
.stars {
  position: absolute; inset: 0;
  pointer-events: none;
}
.star {
  position: absolute;
  width: 1.5px; height: 1.5px;
  background: rgba(255,255,255,0.55);
  border-radius: 50%;
}
.star-big {
  width: 2.5px; height: 2.5px;
  background: rgba(180,220,255,0.9);
  box-shadow: 0 0 3px rgba(180,220,255,0.8);
}
.stars-far { animation: starscroll 90s linear infinite; }
.stars-near { animation: starscroll 35s linear infinite; }
@keyframes starscroll {
  0% { transform: translateY(0); }
  100% { transform: translateY(100%); }
}

/* 实体层 */
.layer {
  position: absolute; inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.particle {
  position: absolute;
  left: 0; top: 0;
  border-radius: 50%;
  will-change: transform, opacity;
}
.box {
  position: absolute;
  left: 0; top: 0;
  background: #FFD166;
  border: 2px solid #B7791F;
  box-sizing: border-box;
  will-change: transform;
}
.box::after {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 50%;
  height: 4px;
  background: #B7791F;
  transform: translateY(-50%);
}

/* 敌人:外层 wrap 负责定位/HP 条,内层 enemy 负责六边形剪裁 */
.enemy-wrap {
  position: absolute;
  left: 0; top: 0;
  will-change: transform;
}
.enemy {
  width: 100%; height: 100%;
  border: 1.2px solid rgba(255,255,255,0.7);
  box-sizing: border-box;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  position: relative;
}
.enemy::before {
  content: '';
  position: absolute;
  left: 27.5%; top: 27.5%;
  width: 45%; height: 45%;
  background: rgba(255,255,255,0.25);
  border-radius: 50%;
}
.enemy.elite {
  border: 1.8px solid #FFE066;
  filter: drop-shadow(0 0 4px rgba(255,224,102,0.8));
  animation: elitepulse 0.6s ease-in-out infinite alternate;
}
@keyframes elitepulse {
  from { filter: drop-shadow(0 0 2px rgba(255,224,102,0.4)); }
  to { filter: drop-shadow(0 0 6px rgba(255,224,102,1)); }
}
.enemy-hp {
  position: absolute;
  left: 0; right: 0;
  top: -6px;
  height: 3px;
  background: rgba(0,0,0,0.5);
}
.enemy-hp-fill {
  height: 100%;
  background: #06D6A0;
}

.p-bullet {
  position: absolute;
  left: 0; top: 0;
  background: #FFF1A8;
  border-radius: 2px;
  box-shadow: 0 0 6px #FFE066;
  will-change: transform;
}
.e-bullet {
  position: absolute;
  left: 0; top: 0;
  background: #FF6B8A;
  border-radius: 50%;
  box-shadow: 0 0 8px #FF3D5A;
  will-change: transform;
}

/* 玩家飞机 - 纯 CSS 拼装 */
.player {
  position: absolute;
  left: 0; top: 0;
  will-change: transform;
}
.player.blink { opacity: 0; }
.player-art {
  position: relative;
  width: 100%; height: 100%;
}
.fuselage {
  position: absolute;
  left: 50%; top: 0%;
  width: 42%; height: 85%;
  margin-left: -21%;
  background: linear-gradient(180deg, #7FE7FF 0%, #1689B8 100%);
  clip-path: polygon(50% 0%, 100% 70%, 50% 90%, 0% 70%);
  border: 0;
}
.cockpit {
  position: absolute;
  left: 50%; top: 28%;
  width: 18%; height: 18%;
  margin-left: -9%;
  background: rgba(255,255,255,0.85);
  border-radius: 50%;
}
.wing {
  position: absolute;
  top: 42%;
  width: 48%; height: 30%;
  background: #2A5C8A;
}
.wing-left {
  left: 2%;
  clip-path: polygon(0% 40%, 65% 0%, 65% 75%, 30% 85%);
}
.wing-right {
  right: 2%;
  clip-path: polygon(100% 40%, 35% 0%, 35% 75%, 70% 85%);
}
.flame {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
}
.flame-outer {
  width: 24%; height: 18%;
  background: #FF6B6B;
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
  animation: flameflicker 0.12s steps(2) infinite;
}
.flame-inner {
  width: 14%; height: 12%;
  background: #FFE066;
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
  animation: flameflicker 0.12s steps(2) infinite;
}
@keyframes flameflicker {
  from { transform: translateX(-50%) scaleY(1); }
  to { transform: translateX(-50%) scaleY(1.25); }
}
.shield-ring {
  position: absolute;
  left: 50%; top: 50%;
  width: 130%; height: 130%;
  margin-left: -65%; margin-top: -65%;
  border-radius: 50%;
  border: 2px solid #5EC8FF;
  box-shadow: 0 0 8px rgba(94,200,255,0.6);
  animation: shieldpulse 0.4s ease-in-out infinite alternate;
}
@keyframes shieldpulse {
  from { opacity: 0.5; }
  to { opacity: 0.9; }
}
.shield-num {
  position: absolute;
  left: 50%; top: -16px;
  transform: translateX(-50%);
  color: #fff;
  font-size: 10px;
  font-weight: bold;
}

.float-text {
  position: absolute;
  left: 0; top: 0;
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
  pointer-events: none;
}

.flash {
  position: absolute; inset: 0;
  background: #fff;
  pointer-events: none;
}

/* HUD */
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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
