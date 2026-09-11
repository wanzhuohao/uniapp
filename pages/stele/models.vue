<template>
  <view class="models-page">
    <view class="paper-noise" />
    <header class="models-toolbar">
      <button class="text-button" type="button" role="button" tabindex="0" @click="goBack" @keydown.enter.prevent="goBack" @keydown.space.prevent="goBack">← 返回</button>
      <view class="toolbar-title-wrap">
        <text class="toolbar-title">3D 碑型范本</text>
        <text class="toolbar-subtitle">PARAMETRIC STELE COLLECTION</text>
      </view>
      <button class="text-button" type="button" role="button" tabindex="0" @click="toggleFullscreen" @keydown.enter.prevent="toggleFullscreen" @keydown.space.prevent="toggleFullscreen">{{ isFullscreen ? '退出全屏' : '全屏查看' }}</button>
    </header>

    <main class="models-layout">
      <section ref="viewerShell" class="viewer-shell" :aria-busy="viewState === 'loading' || viewState === 'switching'">
        <div ref="viewerContainer" class="viewer-container" aria-label="3D 碑型查看器" />

        <view v-if="viewState !== 'ready'" class="viewer-state" aria-live="polite">
          <view v-if="viewState === 'loading' || viewState === 'switching'" class="loading-mark" />
          <text class="state-title">{{ stateTitle }}</text>
          <text v-if="stateDetail" class="state-detail">{{ stateDetail }}</text>
          <button v-if="canRetry" class="primary-button" type="button" role="button" tabindex="0" @click="retryLoad" @keydown.enter.prevent="retryLoad" @keydown.space.prevent="retryLoad">重新加载</button>
        </view>

        <view v-if="viewState === 'ready'" class="viewer-hint">拖动旋转 · 滚轮或双指缩放</view>
        <text v-if="interactionMessage" class="interaction-message" aria-live="polite">{{ interactionMessage }}</text>
        <view class="viewer-actions">
          <button v-if="isFullscreen" class="action-button" type="button" role="button" tabindex="0" @click="toggleFullscreen" @keydown.enter.prevent="toggleFullscreen" @keydown.space.prevent="toggleFullscreen">退出全屏</button>
          <button class="action-button" type="button" role="button" :tabindex="viewState === 'ready' ? 0 : -1" :aria-disabled="viewState !== 'ready'" :disabled="viewState !== 'ready'" @click="resetView" @keydown.enter.prevent="viewState === 'ready' && resetView()" @keydown.space.prevent="viewState === 'ready' && resetView()">重置视角</button>
          <button class="action-button" type="button" role="button" :tabindex="viewState === 'ready' ? 0 : -1" :class="{ active: autoRotate }" :aria-pressed="autoRotate" :aria-disabled="viewState !== 'ready'" :disabled="viewState !== 'ready'" @click="toggleAutoRotate" @keydown.enter.prevent="viewState === 'ready' && toggleAutoRotate()" @keydown.space.prevent="viewState === 'ready' && toggleAutoRotate()">
            {{ autoRotate ? '停止旋转' : '自动旋转' }}
          </button>
        </view>
      </section>

      <aside class="model-panel">
        <view class="panel-heading">
          <text class="panel-kicker">范本 No. {{ String(selectedIndex + 1).padStart(2, '0') }}</text>
          <text class="panel-title">{{ selectedTemplate.name }}</text>
          <text class="panel-desc">{{ selectedTemplate.description }}</text>
        </view>

        <view v-if="templates.length > 1" class="template-list">
          <button
            v-for="(template, index) in templates"
            :key="template.id"
            class="template-option"
            :class="{ active: index === selectedIndex }"
            :aria-pressed="index === selectedIndex"
            type="button"
            role="button"
            tabindex="0"
            @click="selectTemplate(index)"
            @keydown.enter.prevent="selectTemplate(index)"
            @keydown.space.prevent="selectTemplate(index)"
          >
            {{ template.name }}
          </button>
        </view>

        <dl class="model-specs">
          <view class="spec-row"><dt>参考宽度</dt><dd>{{ selectedTemplate.boundsMm.x }} mm</dd></view>
          <view class="spec-row"><dt>参考深度</dt><dd>{{ selectedTemplate.boundsMm.y }} mm</dd></view>
          <view class="spec-row"><dt>参考高度</dt><dd>{{ selectedTemplate.boundsMm.z }} mm</dd></view>
          <view class="spec-row"><dt>网格面数</dt><dd>{{ selectedTemplate.triangleCount }}</dd></view>
          <view class="spec-row"><dt>文件格式</dt><dd>GLB / STL</dd></view>
        </dl>

        <view class="source-notice">
          <text class="notice-seal">型</text>
          <text>{{ selectedTemplate.sourceNotice }}</text>
        </view>

        <button class="download-button" type="button" role="button" :tabindex="downloading ? -1 : 0" :aria-disabled="downloading" :disabled="downloading" @click="downloadStl" @keydown.enter.prevent="downloadStl" @keydown.space.prevent="downloadStl">
          {{ downloading ? '正在准备文件…' : '下载 STL 打印文件' }}
        </button>
        <text class="print-note">请在 Bambu Studio 中选择机型、材料并切片。本页面不直连打印机。</text>
        <text v-if="downloadMessage" class="download-message" aria-live="polite">{{ downloadMessage }}</text>
      </aside>
    </main>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
// @ts-ignore three 的 examples 类型由构建器解析。
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// @ts-ignore three 的 examples 类型由构建器解析。
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { downloadBlob } from '../../utils/stele/delivery'
import { createModelDownloadSession } from '../../utils/stele/model-download-session.js'
import { createModelLoadSession } from '../../utils/stele/model-load-session.js'
import templateConfig from '../../utils/stele/model-templates.json'

type ViewState = 'loading' | 'ready' | 'load-error' | 'webgl-error' | 'switching'
type TemplateConfig = typeof templateConfig[number]

const templates = Object.freeze(templateConfig) as readonly TemplateConfig[]
const selectedIndex = ref(0)
const viewState = ref<ViewState>('loading')
const stateDetail = ref('')
const autoRotate = ref(false)
const isFullscreen = ref(false)
const downloading = ref(false)
const downloadMessage = ref('')
const interactionMessage = ref('')
const viewerShell = ref<HTMLElement | null>(null)
const viewerContainer = ref<HTMLElement | null>(null)
const selectedTemplate = computed(() => templates[selectedIndex.value])
const canRetry = computed(() => viewState.value === 'load-error' || viewState.value === 'webgl-error')
const stateTitle = computed(() => ({
  loading: '正在加载碑型…',
  switching: '正在切换范本…',
  'load-error': '模型暂时无法显示',
  'webgl-error': '当前设备无法创建 3D 画布',
  ready: '',
})[viewState.value])

async function assertAssetSha256(bytes: ArrayBuffer, expectedSha256: string) {
  if (!globalThis.crypto?.subtle) throw new Error('浏览器缺少 SHA-256 校验能力')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  const actual = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('')
  if (actual !== expectedSha256) throw new Error('模型文件完整性校验失败')
}

const downloadSession = createModelDownloadSession({
  verify: assertAssetSha256,
  save: ({ bytes, fileName, mimeType }: { bytes: ArrayBuffer, fileName: string, mimeType: string }) => {
    downloadBlob(new Blob([bytes], { type: mimeType }), fileName)
  },
})

let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let renderer: WebGLRenderer | null = null
let controls: OrbitControls | null = null
let controlsEventRoot: EventTarget | null = null
let controlsConnected = false
let pageActive = true
let currentModel: any = null
let animationId: number | null = null
let defaultCameraPosition = new Vector3()
let defaultTarget = new Vector3()
let resizeHandler: (() => void) | null = null
let fullscreenHandler: (() => void) | null = null
let visibilityHandler: (() => void) | null = null
let controlsChangeHandler: (() => void) | null = null
let contextLostHandler: ((event: Event) => void) | null = null

function disposeObject(root: any) {
  if (!root) return
  root.traverse?.((object: any) => {
    object.geometry?.dispose?.()
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : []
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value && typeof value === 'object' && 'isTexture' in value) (value as any).dispose?.()
      }
      material.dispose?.()
    }
  })
}

const gltfLoader = new GLTFLoader()
const loadSession = createModelLoadSession({
  parse: async (bytes: ArrayBuffer, url: string) => {
    const template = templates.find(item => item.glbUrl === url)
    if (!template) throw new Error('模型配置不存在')
    await assertAssetSha256(bytes, template.sha256.glb)
    return await gltfLoader.parseAsync(bytes, url.slice(0, url.lastIndexOf('/') + 1))
  },
  dispose: (gltf: any) => disposeObject(gltf?.scene),
})

function stopAnimation() {
  if (animationId !== null) cancelAnimationFrame(animationId)
  animationId = null
}

function requestRender() {
  if (animationId !== null || !pageActive || viewState.value !== 'ready' || document.visibilityState === 'hidden') return
  if (!renderer || !scene || !camera || !controls) return
  animationId = requestAnimationFrame(() => {
    animationId = null
    if (!renderer || !scene || !camera || !controls || !pageActive || viewState.value !== 'ready' || document.visibilityState === 'hidden') return
    controls.autoRotate = autoRotate.value
    controls.autoRotateSpeed = 1.8
    const controlsChanged = controls.update()
    renderer.render(scene, camera)
    if (autoRotate.value || controlsChanged) requestRender()
  })
}

function removeCurrentModel() {
  if (!currentModel) return
  scene?.remove(currentModel)
  disposeObject(currentModel)
  currentModel = null
}

function fitCamera(model: any) {
  if (!camera || !controls) return
  const box = new Box3().setFromObject(model)
  const sphere = box.getBoundingSphere(new Sphere())
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) throw new Error('模型包围盒无效')
  const halfFov = camera.fov * Math.PI / 360
  const distance = sphere.radius / Math.sin(halfFov) * 1.18
  defaultTarget.copy(sphere.center)
  defaultCameraPosition.set(sphere.center.x + distance * 0.72, sphere.center.y + distance * 0.28, sphere.center.z + distance)
  camera.near = Math.max(distance / 100, 0.0001)
  camera.far = distance * 20
  camera.position.copy(defaultCameraPosition)
  camera.updateProjectionMatrix()
  controls.target.copy(defaultTarget)
  controls.minDistance = Math.max(sphere.radius * 0.65, 0.001)
  controls.maxDistance = distance * 4
  controls.update()
}

function resetView() {
  if (!camera || !controls) return
  camera.position.copy(defaultCameraPosition)
  controls.target.copy(defaultTarget)
  controls.update()
  requestRender()
}

function toggleAutoRotate() {
  autoRotate.value = !autoRotate.value
  requestRender()
}

function resizeRenderer() {
  const container = viewerContainer.value
  if (!container || !camera || !renderer) return
  const width = Math.max(container.clientWidth, 1)
  const height = Math.max(container.clientHeight, 1)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
  requestRender()
}

function removeControlsRootListeners(activeControls = controls as any) {
  if (!activeControls) return
  const eventRoots = new Set<EventTarget>()
  if (controlsEventRoot) eventRoots.add(controlsEventRoot)
  const currentRoot = activeControls.domElement?.getRootNode?.()
  if (currentRoot) eventRoots.add(currentRoot)
  for (const eventRoot of eventRoots) {
    eventRoot.removeEventListener('keydown', activeControls._interceptControlDown, true)
    eventRoot.removeEventListener('keyup', activeControls._interceptControlUp, true)
  }
  activeControls._controlActive = false
}

function destroyRenderer() {
  stopAnimation()
  removeCurrentModel()
  loadSession.invalidate()
  const activeControls = controls as any
  if (controlsChangeHandler) controls?.removeEventListener('change', controlsChangeHandler)
  // UniApp may detach the canvas before unmount cleanup; retain its original root so OrbitControls cannot leak capture listeners on document.
  removeControlsRootListeners(activeControls)
  controls?.dispose()
  controls = null
  controlsEventRoot = null
  controlsConnected = false
  controlsChangeHandler = null
  if (renderer) {
    if (contextLostHandler) renderer.domElement.removeEventListener('webglcontextlost', contextLostHandler)
    renderer.dispose()
    renderer.domElement.remove()
  }
  renderer = null
  scene = null
  camera = null
  contextLostHandler = null
}

function initializeRenderer() {
  const container = viewerContainer.value
  if (!container) throw new Error('找不到 3D 容器')
  destroyRenderer()
  scene = new Scene()
  scene.background = new Color(0xeee8dc)
  camera = new PerspectiveCamera(42, 1, 0.001, 100)
  renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.outputColorSpace = SRGBColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  container.appendChild(renderer.domElement)
  controls = new OrbitControls(camera, renderer.domElement)
  controlsEventRoot = renderer.domElement.getRootNode()
  controlsConnected = true
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.enablePan = false
  controlsChangeHandler = requestRender
  controls.addEventListener('change', controlsChangeHandler)
  scene.add(new AmbientLight(0xffffff, 1.6))
  const key = new DirectionalLight(0xfff7e6, 3.2)
  key.position.set(4, 7, 6)
  scene.add(key)
  const fill = new DirectionalLight(0xdce7ff, 1.25)
  fill.position.set(-5, 2, -4)
  scene.add(fill)
  contextLostHandler = (event: Event) => {
    event.preventDefault()
    stopAnimation()
    loadSession.invalidate()
    viewState.value = 'webgl-error'
    stateDetail.value = '3D 上下文已丢失，请点击重新加载。'
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLostHandler)
  resizeRenderer()
}

function readableLoadError(error: any) {
  if (error?.code === 'MODEL_HTTP_ERROR') return `模型文件请求失败（HTTP ${error.status}），请检查网络后重试。`
  return '模型文件下载或解析失败，请检查网络后重试。'
}

async function loadSelectedModel(switching = false) {
  viewState.value = switching ? 'switching' : 'loading'
  stateDetail.value = ''
  stopAnimation()
  removeCurrentModel()
  const result = await loadSession.load(selectedTemplate.value.glbUrl)
  if (result.status === 'stale' || result.status === 'unmounted') return
  if (result.status === 'error') {
    viewState.value = 'load-error'
    stateDetail.value = readableLoadError(result.error)
    return
  }
  try {
    currentModel = result.model.scene
    scene?.add(currentModel)
    fitCamera(currentModel)
    viewState.value = 'ready'
    requestRender()
  } catch (error) {
    disposeObject(result.model?.scene)
    currentModel = null
    viewState.value = 'load-error'
    stateDetail.value = '模型尺寸无效，无法建立查看视角。'
  }
}

async function retryLoad() {
  try {
    if (!renderer || viewState.value === 'webgl-error') initializeRenderer()
    await loadSelectedModel(false)
  } catch {
    viewState.value = 'webgl-error'
    stateDetail.value = '浏览器未提供可用的 WebGL 能力，请更换最新版浏览器。'
  }
}

async function selectTemplate(index: number) {
  if (index === selectedIndex.value) return
  downloadSession.cancel()
  downloading.value = false
  selectedIndex.value = index
  downloadMessage.value = ''
  await loadSelectedModel(true)
}

async function downloadStl() {
  if (downloading.value) return
  downloading.value = true
  downloadMessage.value = ''
  const result = await downloadSession.download(selectedTemplate.value)
  if (result.status === 'stale' || result.status === 'unmounted') return
  downloading.value = false
  if (result.status === 'saved') {
    downloadMessage.value = 'STL 文件已开始下载。'
    return
  }
  downloadMessage.value = '下载失败，请检查浏览器下载权限、文件完整性或网络后重试。'
}

async function toggleFullscreen() {
  const shell = viewerShell.value
  interactionMessage.value = ''
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else if (shell?.requestFullscreen) await shell.requestFullscreen()
    else interactionMessage.value = '当前浏览器不支持全屏查看。'
  } catch {
    interactionMessage.value = '无法进入全屏，请检查浏览器权限。'
  }
}

function goBack() {
  window.history.back()
}

function suspendRenderer() {
  pageActive = false
  stopAnimation()
  if (controls && controlsConnected) {
    removeControlsRootListeners()
    controls.disconnect()
    controlsConnected = false
  }
}

function resumeRenderer() {
  pageActive = true
  if (controls && renderer && !controlsConnected) {
    controls.connect(renderer.domElement)
    controlsEventRoot = renderer.domElement.getRootNode()
    controlsConnected = true
  }
  requestRender()
}

onHide(suspendRenderer)
onShow(resumeRenderer)

onMounted(async () => {
  resizeHandler = resizeRenderer
  fullscreenHandler = () => {
    isFullscreen.value = Boolean(document.fullscreenElement)
    if (isFullscreen.value) interactionMessage.value = ''
    void nextTick(() => resizeRenderer())
  }
  visibilityHandler = () => {
    if (document.visibilityState === 'hidden') stopAnimation()
    else requestRender()
  }
  window.addEventListener('resize', resizeHandler)
  document.addEventListener('fullscreenchange', fullscreenHandler)
  document.addEventListener('visibilitychange', visibilityHandler)
  await nextTick()
  await retryLoad()
})

onBeforeUnmount(() => {
  loadSession.unmount()
  downloadSession.unmount()
  destroyRenderer()
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (fullscreenHandler) document.removeEventListener('fullscreenchange', fullscreenHandler)
  if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler)
  resizeHandler = null
  fullscreenHandler = null
  visibilityHandler = null
})
</script>

<style scoped>
.models-page {
  position: relative;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  color: #2c2420;
  background: radial-gradient(circle at 88% 12%, rgba(150,112,10,.12), transparent 34%), #f6f1e8;
}
.paper-noise { position: absolute; inset: 0; opacity: .35; pointer-events: none; background-image: var(--paper-noise-url); mix-blend-mode: multiply; }
.models-toolbar, .models-layout { position: relative; z-index: 1; }
.models-toolbar { min-height: 58px; display: flex; align-items: center; gap: 18px; margin-bottom: 16px; padding: 8px 14px; border: 1px solid rgba(150,112,10,.18); border-radius: 8px; background: rgba(255,253,248,.88); box-shadow: var(--shadow-paper); }
.toolbar-title-wrap { display: flex; flex: 1; flex-direction: column; align-items: center; gap: 3px; }
.toolbar-title { font: 500 20px var(--font-display); letter-spacing: 6px; color: #8c6a1b; }
.toolbar-subtitle { font: italic 10px Georgia, serif; letter-spacing: 3px; color: rgba(140,106,27,.62); }
button { font: inherit; }
.text-button, .action-button, .primary-button, .download-button, .template-option { border: 0; cursor: pointer; }
.text-button:focus-visible, .action-button:focus-visible, .primary-button:focus-visible, .download-button:focus-visible, .template-option:focus-visible { outline: 2px solid #a13732; outline-offset: 2px; }
.text-button { padding: 8px 10px; color: #8c6a1b; background: transparent; font-family: var(--font-display); letter-spacing: 2px; }
.models-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; min-height: calc(100vh - 114px); }
.viewer-shell { position: relative; min-height: 560px; overflow: hidden; border: 1px solid rgba(150,112,10,.28); border-radius: 10px; background: #eee8dc; box-shadow: var(--shadow-paper-deep); }
.viewer-shell:fullscreen { width: 100vw; height: 100vh; border: 0; border-radius: 0; }
.viewer-container { position: absolute; inset: 0; }
.viewer-container :deep(canvas) { display: block; width: 100%; height: 100%; }
.viewer-state { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 30px; text-align: center; color: #6e5545; background: rgba(246,241,232,.88); }
.loading-mark { width: 44px; height: 44px; border: 2px solid rgba(150,112,10,.22); border-top-color: #96700a; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state-title { font: 500 18px var(--font-display); letter-spacing: 4px; }
.state-detail { max-width: 420px; font-size: 13px; line-height: 1.7; color: #8c8078; }
.primary-button { padding: 10px 24px; border-radius: 4px; color: #fffdf8; background: #96700a; letter-spacing: 3px; }
.viewer-hint { position: absolute; left: 50%; bottom: 18px; z-index: 1; transform: translateX(-50%); padding: 8px 14px; border-radius: 3px; color: #f9eab9; background: rgba(44,36,32,.75); font-size: 12px; letter-spacing: 2px; white-space: nowrap; pointer-events: none; }
.interaction-message { position: absolute; top: 62px; right: 14px; z-index: 3; max-width: 280px; padding: 8px 12px; border-radius: 4px; color: #fffdf8; background: rgba(161,55,50,.92); font-size: 12px; line-height: 1.5; }
.viewer-actions { position: absolute; top: 14px; right: 14px; z-index: 3; display: flex; gap: 8px; }
.action-button { padding: 8px 12px; border: 1px solid rgba(150,112,10,.3); border-radius: 4px; color: #795b13; background: rgba(255,253,248,.9); font-size: 12px; }
.action-button.active { color: #fffdf8; background: #96700a; }
.action-button:disabled { cursor: not-allowed; opacity: .45; }
.model-panel { display: flex; flex-direction: column; padding: 28px 24px; border: 1px solid rgba(150,112,10,.18); border-radius: 10px; background: rgba(255,253,248,.92); box-shadow: var(--shadow-paper); }
.panel-heading { display: flex; flex-direction: column; gap: 10px; padding-bottom: 20px; border-bottom: 1px solid rgba(150,112,10,.18); }
.panel-kicker { font: italic 11px Georgia, serif; letter-spacing: 2px; color: #a13732; }
.panel-title { font: 500 28px var(--font-display); letter-spacing: 5px; }
.panel-desc { font-size: 13px; line-height: 1.8; color: #8c8078; }
.template-list { display: flex; gap: 8px; margin-top: 16px; }
.template-option { padding: 8px 10px; border: 1px solid rgba(150,112,10,.25); border-radius: 3px; color: #795b13; background: transparent; }
.template-option.active { color: #fff; background: #96700a; }
.model-specs { margin: 22px 0; }
.spec-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed rgba(150,112,10,.18); font-size: 13px; }
.spec-row dt { color: #8c8078; }
.spec-row dd { margin: 0; color: #57431a; font-family: Georgia, serif; }
.source-notice { display: flex; align-items: flex-start; gap: 10px; padding: 13px; border-radius: 5px; color: #755e2a; background: rgba(150,112,10,.08); font-size: 12px; line-height: 1.7; }
.notice-seal { flex: 0 0 auto; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #a13732; color: #a13732; border-radius: 2px; font-family: var(--font-display); }
.download-button { margin-top: auto; padding: 13px 18px; border-radius: 5px; color: #fffdf8; background: linear-gradient(180deg, #a47a0a, #836006); font-family: var(--font-display); letter-spacing: 3px; box-shadow: 0 7px 16px rgba(91,64,4,.18); }
.download-button:disabled { cursor: wait; opacity: .65; }
.print-note, .download-message { margin-top: 11px; font-size: 11px; line-height: 1.65; color: #8c8078; }
.download-message { color: #a13732; }
@media (max-width: 860px) {
  .models-page { padding: 10px; overflow: auto; }
  .models-toolbar { gap: 4px; padding: 7px 4px; }
  .toolbar-title { font-size: 16px; letter-spacing: 3px; }
  .toolbar-subtitle { display: none; }
  .text-button { padding: 8px 6px; font-size: 12px; letter-spacing: 1px; }
  .models-layout { grid-template-columns: 1fr; min-height: auto; }
  .viewer-shell { min-height: 58vh; }
  .model-panel { min-height: auto; padding: 22px 18px; }
  .download-button { margin-top: 18px; }
  .viewer-actions { top: 10px; right: 10px; }
  .action-button { padding: 7px 9px; }
}
</style>
