import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compileScript, compileStyle, compileTemplate, parse } from '@vue/compiler-sfc'

const pages = JSON.parse(readFileSync(new URL('../pages.json', import.meta.url), 'utf8'))
const home = readFileSync(new URL('../pages/index/index.vue', import.meta.url), 'utf8')
const page = readFileSync(new URL('../pages/stele/models.vue', import.meta.url), 'utf8')
const preview = readFileSync(new URL('../pages/stele/preview.vue', import.meta.url), 'utf8')
const templates = JSON.parse(readFileSync(new URL('../utils/stele/model-templates.json', import.meta.url), 'utf8'))
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const packageLock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))

let passed = 0
let failed = 0
function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`✓ ${name}`)
  } catch (error) {
    failed += 1
    console.error(`✗ ${name}: ${error.message}`)
  }
}

test('独立范本路由和首页入口已注册', () => {
  assert.ok(pages.pages.some(item => item.path === 'pages/stele/models' && item.style.navigationStyle === 'custom'))
  assert.match(home, /goTo\('\/pages\/stele\/models'\)/)
  assert.match(home, /3D 碑型范本/)
})

test('范本配置只使用同一不可变 release 的 GLB/STL', () => {
  assert.equal(templates.length, 1)
  const template = templates[0]
  assert.equal(template.sourceKind, 'parametric-generic')
  assert.equal(template.sourceNotice, '参数化通用设计，非真实石碑或照片复刻')
  assert.match(template.releaseId, /^classic-v1-[a-f0-9]{12}$/)
  assert.ok(template.glbUrl.includes(`/${template.releaseId}/`))
  assert.ok(template.stlUrl.includes(`/${template.releaseId}/`))
  assert.deepEqual(template.boundsMm, { x: 140, y: 26, z: 160 })
  assert.equal(template.triangleCount, 132)
})

test('页面通过受控 session 加载 GLB 并处理过期结果', () => {
  assert.match(page, /createModelLoadSession/)
  assert.match(page, /loadSession\.load\(selectedTemplate\.value\.glbUrl\)/)
  assert.match(page, /result\.status === 'stale' \|\| result\.status === 'unmounted'/)
  assert.match(page, /loadSession\.unmount\(\)/)
})

test('页面释放模型、渲染器、控制器、动画和监听器', () => {
  assert.match(page, /disposeObject\(currentModel\)/)
  assert.match(page, /cancelAnimationFrame\(animationId\)/)
  assert.match(page, /controlsEventRoot = renderer\.domElement\.getRootNode\(\)/)
  assert.match(page, /eventRoot\.removeEventListener\('keydown', activeControls\._interceptControlDown, true\)/)
  assert.match(page, /eventRoot\.removeEventListener\('keyup', activeControls\._interceptControlUp, true\)/)
  assert.match(page, /controls\?\.dispose\(\)/)
  assert.match(page, /renderer\.dispose\(\)/)
  assert.match(page, /removeEventListener\('resize'/)
  assert.match(page, /removeEventListener\('fullscreenchange'/)
  assert.match(page, /removeEventListener\('webglcontextlost'/)
})

test('页面按需单帧渲染并在后台暂停', () => {
  assert.match(page, /function requestRender\(\)/)
  assert.match(page, /!pageActive/)
  assert.match(page, /document\.visibilityState === 'hidden'/)
  assert.match(page, /const controlsChanged = controls\.update\(\)/)
  assert.match(page, /if \(autoRotate\.value \|\| controlsChanged\) requestRender\(\)/)
  assert.match(page, /controls\.addEventListener\('change', controlsChangeHandler\)/)
  assert.match(page, /controls\?\.removeEventListener\('change', controlsChangeHandler\)/)
  assert.match(page, /document\.addEventListener\('visibilitychange', visibilityHandler\)/)
  assert.match(page, /document\.removeEventListener\('visibilitychange', visibilityHandler\)/)
  assert.match(page, /function suspendRenderer\(\)/)
  assert.match(page, /function removeControlsRootListeners\(activeControls/)
  assert.match(page, /const eventRoots = new Set<EventTarget>\(\)/)
  assert.match(page, /const currentRoot = activeControls\.domElement\?\.getRootNode\?\.\(\)/)
  assert.match(page, /for \(const eventRoot of eventRoots\)/)
  assert.match(page, /function suspendRenderer\(\)[\s\S]*removeControlsRootListeners\(\)[\s\S]*controls\.disconnect\(\)/)
  assert.match(page, /controls\.disconnect\(\)/)
  assert.match(page, /function resumeRenderer\(\)/)
  assert.match(page, /controls\.connect\(renderer\.domElement\)/)
  assert.match(page, /onHide\(suspendRenderer\)/)
  assert.match(page, /onShow\(resumeRenderer\)/)
  assert.match(page, /function toggleAutoRotate\(\)/)
})

test('OrbitControls 私有清理兼容性由精确 Three.js 版本保护', () => {
  assert.equal(packageJson.dependencies.three, '0.183.2')
  assert.equal(packageLock.packages[''].dependencies.three, '0.183.2')
  assert.equal(packageLock.packages['node_modules/three'].version, '0.183.2')
})

test('动态状态和切换按钮具备可访问语义', () => {
  assert.match(page, /class="viewer-state" aria-live="polite"/)
  assert.match(page, /class="interaction-message" aria-live="polite"/)
  assert.match(page, /class="download-message" aria-live="polite"/)
  assert.match(page, /:aria-pressed="autoRotate"/)
  assert.match(page, /:aria-pressed="index === selectedIndex"/)
})

test('UniApp H5 自定义按钮支持键盘聚焦和激活', () => {
  const buttonTags = [...page.matchAll(/<button\b[\s\S]*?>/g)].map(match => match[0])
  assert.equal(buttonTags.length, 8)
  for (const tag of buttonTags) {
    assert.match(tag, /role="button"/)
    assert.match(tag, /(?::)?tabindex=/)
    assert.match(tag, /@keydown\.enter\.prevent=/)
    assert.match(tag, /@keydown\.space\.prevent=/)
  }
})

test('页面提供重置、全屏、失败重试和 STL 下载', () => {
  assert.match(page, /resetView/)
  assert.match(page, /requestFullscreen/)
  assert.match(page, /interactionMessage/)
  assert.match(page, /当前浏览器不支持全屏查看/)
  assert.match(page, /无法进入全屏，请检查浏览器权限/)
  assert.match(page, /retryLoad/)
  assert.match(page, /createModelDownloadSession/)
  assert.match(page, /downloadSession\.download\(selectedTemplate\.value\)/)
  assert.match(page, /downloadSession\.cancel\(\)/)
  assert.match(page, /downloadSession\.unmount\(\)/)
  assert.match(page, /downloadBlob\(new Blob/)
  assert.match(page, /crypto\.subtle\.digest\('SHA-256'/)
  assert.match(page, /template\.sha256\.glb/)
  assert.match(page, /Bambu Studio/)
  assert.match(page, /本页面不直连打印机/)
})

test('范本页不读订单或个性化 3D 数据', () => {
  assert.doesNotMatch(page, /STELE_STORAGE_KEYS|preview3d|order-api|localStorage/)
  assert.match(preview, /STELE_STORAGE_KEYS\.preview3d/)
})

test('范本页 SFC 的脚本、模板和样式均可编译', () => {
  const { descriptor, errors } = parse(page, { filename: 'pages/stele/models.vue' })
  assert.deepEqual(errors, [])
  compileScript(descriptor, { id: 'stele-models-page' })
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: 'pages/stele/models.vue',
    id: 'stele-models-page',
    compilerOptions: { isCustomElement: tag => ['view', 'text', 'button'].includes(tag) },
  })
  assert.deepEqual(template.errors, [])
  for (const style of descriptor.styles) {
    assert.deepEqual(compileStyle({ source: style.content, filename: 'pages/stele/models.vue', id: 'stele-models-page', scoped: style.scoped }).errors, [])
  }
})

console.log(`\n=== ${passed} passed, ${failed} failed ===`)
if (failed) process.exitCode = 1
