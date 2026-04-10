<template>
  <div class="preview-3d-page">
    <header class="preview-toolbar">
      <el-button @click="onBack" class="preview-back-btn">← 返回</el-button>
      <span class="preview-toolbar-title">3D 墓碑预览</span>
      <div class="preview-toolbar-right">
        <el-switch v-model="autoRotate" active-text="自动旋转" />
      </div>
    </header>
    <div v-if="hasData" class="three-wrapper">
      <div id="three-container" class="three-container"></div>
      <div v-if="showHint" class="three-hint" @click="showHint = false">拖动旋转 · 滚轮缩放</div>
    </div>
    <div v-else class="empty-state">
      <div class="empty-text">{{ errorMsg || '暂无预览数据，请先在编辑页生成预览' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { WebGLRenderer, Scene, PerspectiveCamera, Mesh, Color, AmbientLight, DirectionalLight, BoxGeometry, MeshPhongMaterial, MeshBasicMaterial, CanvasTexture, SRGBColorSpace } from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const onBack = () => {
  window.history.back();
};
const autoRotate = ref(false);
const hasData = ref(false);
const errorMsg = ref('');
const showHint = ref(true);
let hintTimer: number | null = null;

let threeRenderer: WebGLRenderer | null = null;
let threeScene: Scene | null = null;
let threeCamera: PerspectiveCamera | null = null;
let threeAnimateId: number | null = null;
let controls: OrbitControls | null = null;
let resizeHandler: (() => void) | null = null;

// ==================== Canvas 纹理绘制（方案 B：区域边界限制） ====================

const FONT_FAMILY = '"KaiTi", "楷体", "STKaiti", "华文楷体", "Kaiti SC", "SimSun", "宋体", serif';

/** 在指定区域内绘制竖排文字，超出区域自动缩小字号 */
function drawVerticalText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  areaW: number, areaH: number,
  baseFontSize: number, color: string,
  /** 对齐方式：0=顶部, 0.25=1/4处, 0.5=居中, 0.75=3/4处, 1=底部 */
  alignRatio: number = 0
) {
  const chars = text.split('\n');
  if (!chars.length) return;

  let fontSize = baseFontSize;
  const lineHeight = () => fontSize * 1.3;
  while (chars.length * lineHeight() > areaH && fontSize > 8) {
    fontSize -= 1;
  }

  const totalH = chars.length * lineHeight();
  let startY = y + (areaH - totalH) * alignRatio;
  startY = Math.max(y, startY);

  ctx.save();
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < chars.length; i++) {
    const cy = startY + i * lineHeight();
    if (cy + fontSize > y + areaH) break;
    ctx.fillText(chars[i], x + areaW / 2, cy);
  }
  ctx.restore();
}

/** 在指定区域内绘制多列竖排文字（小字用） */
function drawSmallText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  areaW: number, areaH: number,
  baseFontSize: number, color: string
) {
  const lines = text.split('\n');
  if (!lines.length) return;

  let fontSize = baseFontSize;
  while (lines.length * (fontSize * 1.4) > areaH && fontSize > 6) {
    fontSize -= 0.5;
  }
  const lh = fontSize * 1.4;

  ctx.save();
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    const ly = y + i * lh;
    if (ly + fontSize > y + areaH) break;
    ctx.fillText(lines[i], x, ly);
  }
  ctx.restore();
}

/** 在指定区域内绘制大字（横排居中，逐行） */
function drawBigText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number, y: number,
  areaW: number, areaH: number,
  baseFontSize: number, color: string
) {
  const lines = text.split('\n').filter(Boolean);
  if (!lines.length) return;

  let fontSize = baseFontSize;
  const lineHeight = () => fontSize * 1.35;
  while (lines.length * lineHeight() > areaH && fontSize > 12) {
    fontSize -= 1;
  }

  const totalH = lines.length * lineHeight();
  const startY = y + (areaH - totalH) / 2;

  ctx.save();
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/ /g, '');
    const ly = startY + i * lineHeight();
    if (ly + fontSize > y + areaH) break;
    ctx.fillText(line, centerX, ly);
  }
  ctx.restore();
}

/** 生成碑面纹理 */
function createCanvasTexture(preview: any): CanvasTexture {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 512;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const gold = '#D4A528';

  ctx.fillStyle = '#1a1a18';
  ctx.fillRect(0, 0, W, H);

  const titleY = 20, titleH = 60;
  const contentY = 90, contentH = 900;
  const dateX = 20, dateW = 50;
  const birthX = W - 70, birthW = 50;
  const bigX = 160, bigW = 200;
  const smallX = dateX + dateW + 10, smallW = bigX - smallX - 10;

  if (preview.title) {
    ctx.save();
    ctx.font = `bold 42px ${FONT_FAMILY}`;
    ctx.fillStyle = gold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(preview.title, W / 2, titleY + (titleH - 42) / 2);
    ctx.restore();
  }

  if (preview.big) {
    drawBigText(ctx, preview.big, bigX + bigW / 2, contentY, bigW, contentH, 42, gold);
  }

  if (preview.date) {
    drawVerticalText(ctx, preview.date, dateX, contentY, dateW, contentH, 16, gold, 0.75);
  }

  if (preview.birth) {
    drawVerticalText(ctx, preview.birth, birthX, contentY, birthW, contentH, 16, gold, 0.25);
  }

  if (preview.small) {
    drawSmallText(ctx, preview.small, smallX, contentY + 100, smallW, contentH - 100, 14, gold);
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// ==================== Three.js 渲染 ====================

function renderThreeStele(preview: any) {
  const container = document.getElementById('three-container');
  if (!container) return;

  if (threeScene) {
    threeScene.traverse((obj: any) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m: any) => { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
  }
  if (controls) { controls.dispose(); controls = null; }
  if (threeRenderer) { threeRenderer.dispose(); threeRenderer = null; }
  while (container.firstChild) container.removeChild(container.firstChild);

  threeScene = new Scene();
  threeScene.background = new Color(0xF5F0EB);

  threeCamera = new PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
  threeCamera.position.set(0, 1.5, 10);

  controls = new OrbitControls(threeCamera, container);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 15;
  controls.target.set(0, 0.8, 0);
  controls.update();

  threeScene.add(new AmbientLight(0xffffff, 0.6));
  const dirLight = new DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 10);
  threeScene.add(dirLight);
  const fillLight = new DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-3, -5, 5);
  threeScene.add(fillLight);

  const texture = createCanvasTexture(preview);

  const stoneColor = 0x222222;

  const mainMat = [
    new MeshPhongMaterial({ color: stoneColor }),
    new MeshPhongMaterial({ color: stoneColor }),
    new MeshPhongMaterial({ color: stoneColor }),
    new MeshPhongMaterial({ color: stoneColor }),
    new MeshBasicMaterial({ map: texture }),
    new MeshPhongMaterial({ color: stoneColor }),
  ];
  const mainMesh = new Mesh(new BoxGeometry(3, 5.5, 0.35), mainMat);
  mainMesh.position.set(0, 1.25, 0);
  threeScene.add(mainMesh);

  const base1 = new Mesh(
    new BoxGeometry(4, 0.4, 1.2),
    new MeshPhongMaterial({ color: 0x333333 })
  );
  base1.position.set(0, -1.7, 0.2);
  threeScene.add(base1);

  const base2 = new Mesh(
    new BoxGeometry(3.5, 0.35, 0.9),
    new MeshPhongMaterial({ color: 0x2a2a2a })
  );
  base2.position.set(0, -1.32, 0.1);
  threeScene.add(base2);

  threeRenderer = new WebGLRenderer({ antialias: true });
  threeRenderer.outputColorSpace = SRGBColorSpace;
  threeRenderer.setPixelRatio(window.devicePixelRatio);
  threeRenderer.setSize(container.offsetWidth, container.offsetHeight);
  container.appendChild(threeRenderer.domElement);

  function animate() {
    if (controls) {
      controls.autoRotate = autoRotate.value;
      controls.autoRotateSpeed = 2.0;
    }
    controls?.update();
    threeRenderer!.render(threeScene!, threeCamera!);
    threeAnimateId = requestAnimationFrame(animate);
  }
  animate();

  resizeHandler = () => {
    if (!container || !threeCamera || !threeRenderer) return;
    threeCamera.aspect = container.offsetWidth / container.offsetHeight;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(container.offsetWidth, container.offsetHeight);
  };
  window.addEventListener('resize', resizeHandler);
}

onMounted(() => {
  hintTimer = window.setTimeout(() => { showHint.value = false; }, 4000);
  try {
    const preview = localStorage.getItem('stele-3d-preview');
    if (preview) {
      const data = JSON.parse(preview);
      hasData.value = true;
      nextTick(() => renderThreeStele(data));
    }
  } catch (e: any) {
    hasData.value = false;
    if (e?.message?.includes('WebGL') || e?.message?.includes('getContext')) {
      errorMsg.value = '您的设备不支持 3D 预览，请在电脑上查看';
    }
  }
});

onBeforeUnmount(() => {
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
  if (threeAnimateId) { cancelAnimationFrame(threeAnimateId); threeAnimateId = null; }
  if (threeScene) {
    threeScene.traverse((obj: any) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m: any) => { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
    threeScene = null;
  }
  if (controls) { controls.dispose(); controls = null; }
  if (threeRenderer) { threeRenderer.dispose(); threeRenderer = null; }
  if (resizeHandler) { window.removeEventListener('resize', resizeHandler); resizeHandler = null; }
});
</script>

<style scoped>
.preview-3d-page {
  padding: 24px;
  background: linear-gradient(180deg, #EDE8E2 0%, var(--color-bg-blue-light) 100%);
  min-height: 100vh;
}
.preview-toolbar {
  display: flex; align-items: center; gap: 16px; margin-bottom: 16px;
  padding: 12px 16px; background: #fff; border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 12px rgba(184, 134, 11, 0.08);
}
.preview-back-btn { color: var(--color-primary) !important; border-color: var(--color-border); }
.preview-back-btn:hover { background: var(--color-bg-blue) !important; border-color: var(--color-primary) !important; }
.preview-toolbar-title { font-size: 16px; font-weight: 600; color: var(--color-primary); }
.preview-toolbar-right { margin-left: auto; display: flex; align-items: center; }
.preview-3d-page :deep(.el-switch.is-checked .el-switch__core) {
  background: linear-gradient(180deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  border-color: var(--color-primary);
}
.three-container {
  width: 100%; height: calc(100vh - 120px); min-height: 400px;
  border-radius: 12px; overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 16px rgba(184, 134, 11, 0.1);
}
.three-wrapper { position: relative; }
.three-hint {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.6); color: #fff; padding: 8px 20px;
  border-radius: 20px; font-size: 14px; pointer-events: auto; cursor: pointer;
  z-index: 10; animation: hintFade 4s ease forwards;
}
@keyframes hintFade {
  0%, 70% { opacity: 1; }
  100% { opacity: 0; }
}
.empty-state {
  display: flex; align-items: center; justify-content: center;
  height: calc(100vh - 120px); min-height: 300px; background: #fff;
  border-radius: 12px; border: 1px dashed var(--color-border);
}
.empty-text { color: var(--color-primary-light); font-size: 16px; }

@media (max-width: 768px) {
  .preview-3d-page { padding: 12px; }
  .preview-toolbar { gap: 8px; padding: 10px 12px; flex-wrap: wrap; }
  .preview-toolbar-title { font-size: 14px; }
  .three-container { height: calc(100vh - 100px); }
}
</style>
