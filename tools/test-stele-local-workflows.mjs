import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { registerHooks } from 'node:module'
import { computed, ref } from 'vue'
import {
  addTemplate, applyTemplate, deleteTemplate, loadTemplates, saveTemplates,
} from '../utils/stele/templates.ts'
import { STELE_STORAGE_KEYS } from '../utils/stele/storage-registry.ts'

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context)
      }
      throw error
    }
  },
})

const { useOrderForm, organizeNameRows } = await import('../composables/stele/useOrderForm.ts')
const [indexSource, detailSource] = await Promise.all([
  readFile(new URL('../pages/stele/index.vue', import.meta.url), 'utf8'),
  readFile(new URL('../pages/stele/detail.vue', import.meta.url), 'utf8'),
])

function deferred() {
  let resolve
  let reject
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}

function compileMountedCallback(source, dependencies) {
  const marker = 'onMounted(async () => {'
  const start = source.indexOf(marker)
  if (start < 0) throw new Error('找不到详情页 onMounted 加载回调')
  const bodyStart = source.indexOf('{', start)
  let depth = 0
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === '{') depth++
    if (source[index] === '}') {
      depth--
      if (depth === 0) {
        const body = source.slice(bodyStart + 1, index)
        return new Function(
          ...Object.keys(dependencies),
          `return async () => {${body}};`,
        )(...Object.values(dependencies))
      }
    }
  }
  throw new Error('详情页 onMounted 加载回调大括号不完整')
}

function createSnapshot(label) {
  return {
    form: {
      selected: '0',
      father: {
        name: `父-${label}`,
        birth: { year: '1940', month: '01', day: '02' },
        death: { year: '2020', month: '03', day: '04' },
      },
      mother: {
        name: `母-${label}`,
        birth: { year: '1942', month: '05', day: '06' },
        death: { year: '2021', month: '07', day: '08' },
      },
      bigTitle: `横批-${label}`,
      dateQingming: false,
      dateShowLunar: false,
      libei: ['2026', '09', '07'],
      names: [[['长子', `子-${label}`], ['长媳', `媳-${label}`]]],
      user: `客户-${label}`,
      remark: `备注-${label}`,
    },
    preview: {
      title: `预览-${label}`,
      big: `大字-${label}`,
      small: `小字-${label}`,
      date: '二〇二六年九月七日',
      birth: `生卒-${label}`,
    },
  }
}

function createStorage() {
  const values = new Map()
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, value) },
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

let passed = 0
let failed = 0
async function test(name, fn) {
  try {
    await fn()
    passed++
    console.log(`✓ ${name}`)
  } catch (error) {
    failed++
    console.error(`✗ ${name}: ${error.message}`)
  }
}

await test('详情页只回填最后一次加载快照，过期响应不覆盖表单', async () => {
  const order = useOrderForm()
  const loadState = ref('loading')
  const idRef = ref('')
  const previewData = ref({ title: '', big: '', small: '', date: '', birth: '' })
  const requests = new Map()
  let currentId = 'old-id'
  let commits = 0
  const load = compileMountedCallback(detailSource, {
    loadEpoch: 0,
    getUrlParam(key) { return key === 'id' ? currentId : '' },
    fetchOrderSnapshot(id) {
      const pending = deferred()
      requests.set(id, pending)
      return pending.promise
    },
    loadState,
    commitOrderSnapshot(snapshot) { commits++; order.commitOrderSnapshot(snapshot) },
    previewData,
    refreshPreview() { previewData.value = order.buildPreview() },
    form: order.form,
    ElMessage: { success() {} },
    idRef,
    localStorage: { getItem() { return null } },
    STELE_STORAGE_KEYS,
    draftNoticeVisible: ref(false),
    nextTick: async () => {},
    hasUnsavedChanges: ref(true),
    trackingChanges: false,
  })
  const oldLoad = load()
  currentId = 'new-id'
  const newLoad = load()
  requests.get('new-id').resolve(createSnapshot('new'))
  await newLoad
  requests.get('old-id').resolve(createSnapshot('old'))
  await oldLoad
  assert.equal(commits, 1)
  assert.equal(idRef.value, 'new-id')
  assert.equal(loadState.value, 'ready')
  assert.equal(order.form.father.name, '父-new')
  assert.equal(previewData.value.title, '预览-new')
})

await test('模板保存和直接应用仍保留客户标识、备注及完整日期', () => {
  const storage = createStorage()
  const source = useOrderForm()
  source.commitOrderSnapshot(createSnapshot('template'))
  const before = clone(source.form)
  const templates = addTemplate([], '模板', source.form, {
    idFactory: () => 'template-id',
    clock: () => new Date('2026-09-08T00:00:00.000Z'),
  })
  saveTemplates(templates, storage)
  const stored = storage.getItem(STELE_STORAGE_KEYS.templates)
  assert.equal(stored.includes('客户-template'), false)
  assert.equal(stored.includes('备注-template'), false)

  const loaded = loadTemplates(storage)
  const target = useOrderForm()
  target.form.user = '保留客户'
  target.form.remark = '保留备注'
  target.applyTemplateData(applyTemplate(loaded[0]))
  assert.equal(target.form.father.name, '父-template')
  assert.equal(target.fatherBirth.value, '1940-1-2')
  assert.equal(target.libeiDate.value, '2026-9-7')
  assert.equal(target.form.user, '保留客户')
  assert.equal(target.form.remark, '保留备注')
  assert.deepEqual(clone(source.form), before)
  saveTemplates(deleteTemplate(loaded, 'template-id'), storage)
  assert.equal(loadTemplates(storage).length, 0)
})

await test('切换清明和自定义日期不会丢失原输入，也不依赖 watcher 时序', () => {
  const order = useOrderForm()
  order.setNormalErectDateMode(false)
  order.libeiDate.value = '2026-9-8'
  order.setNormalErectDateMode(true)
  order.setNormalErectDateMode(false)
  assert.equal(order.libeiDate.value, '2026-9-8')
  order.syncDatesToForm()
  assert.deepEqual(clone(order.form.libei), ['2026', '09', '08'])
  order.fatherBirth.value = '1940'
  assert.deepEqual(order.buildSavePayload().info.father.birth, { year: '1940', month: '', day: '' })
})

await test('小字预览随姓名、增删和顺序实时变化，预览不修改表单', () => {
  const order = useOrderForm()
  const preview = computed(() => order.buildPreview().small)
  order.form.names = [[['子', '甲'], ['子', '乙']]]
  const initial = preview.value
  order.form.names[0][1][1] = '丙'
  assert.equal(preview.value.includes('丙'), true)
  assert.notEqual(preview.value, initial)
  order.addCol(0, 0)
  order.form.names[0][1][1] = '丁'
  assert.equal(preview.value.includes('丁'), true)
  const beforeMove = preview.value
  order.form.names[0].reverse()
  assert.notEqual(preview.value, beforeMove)
  order.removeCol(0, 1)
  assert.equal(preview.value.includes('丁'), false)
  const before = clone(order.form)
  assert.equal(order.buildSavePayload().small, preview.value)
  assert.deepEqual(clone(order.form.names), before.names)
})

await test('夫妻对应排保持分排，整理后同排、撤销后预览与保存恢复原分排', () => {
  const order = useOrderForm()
  order.form.names = [[['子', '甲'], ['女', '乙']], [['媳', '丙'], ['婿', '丁']]]
  const before = clone(order.form)
  const preview = computed(() => order.buildPreview().small)
  const originalPreview = preview.value
  assert.equal(originalPreview, '女子\n乙甲\n婿媳\n丁丙')
  assert.deepEqual(clone(order.form), before)
  assert.equal(order.organizeNames(), true)
  assert.equal(preview.value, '婿女媳子\n丁乙丙甲')
  assert.equal(order.undoNamesOrganize(), true)
  assert.deepEqual(clone(order.form.names), before.names)
  assert.equal(preview.value, originalPreview)
  assert.equal(order.buildSavePayload().small, originalPreview)
  assert.deepEqual(clone(order.buildSavePayload().info.names), before.names)
  order.form.names = [[['子', '甲']], [['孙', '乙']]]
  assert.equal(order.buildPreview().small.split('\n').length, 4)
})

await test('五排夫妻名单整理成三排再撤销，浮窗和保存恢复五排且保留空白姓名', () => {
  const order = useOrderForm()
  const titles = [
    ['子', '子', '子', '女', '女', '女'],
    ['媳', '媳', '媳', '婿', '婿', '婿'],
    ['孙子', '孙子', '孙子', '孙女'],
    ['孙媳', '孙媳', '孙媳', '孙婿'],
    ['重孙子', '重孙子', '重孙女', '重孙女'],
  ]
  order.form.names = titles.map(row => row.map((title, index) => [title, title === '孙婿' ? '' : `测${index}`]))
  const before = clone(order.form.names)
  const preview = computed(() => order.buildPreview().small)
  const beforePreview = preview.value
  assert.equal(order.organizeNames(), true)
  assert.deepEqual(order.form.names.map(row => row.length), [12, 8, 4])
  assert.notEqual(preview.value, beforePreview)
  assert.equal(order.buildSavePayload().small, preview.value)
  assert.equal(order.undoNamesOrganize(), true)
  assert.deepEqual(clone(order.form.names), before)
  assert.equal(preview.value, beforePreview)
  assert.equal(order.buildSavePayload().small, beforePreview)
  assert.deepEqual(clone(order.buildSavePayload().info.names), before)
})

await test('单排乱序名单按现有辈分归组，同类夫妻按录入顺序配对', () => {
  const input = [[
    ['孙媳', '孙媳甲'], ['媳', '媳甲'], ['子', '子甲'], ['女', '女甲'],
    ['玄孙女', '玄甲'], ['子', '子乙'], ['孙子', '孙甲'], ['婿', '婿甲'],
    ['外孙女', '外甲'], ['媳', '媳乙'], ['重孙子', '曾甲'], ['曾孙媳', '曾媳甲'],
    ['曾外孙女', '曾外甲'], ['外重孙子', '外曾甲'],
  ]]
  const before = clone(input)
  const result = organizeNameRows(input)
  assert.deepEqual(result, [
    [['子', '子甲'], ['媳', '媳甲'], ['子', '子乙'], ['媳', '媳乙'], ['女', '女甲'], ['婿', '婿甲']],
    [['孙子', '孙甲'], ['孙媳', '孙媳甲']],
    [['外孙女', '外甲']],
    [['重孙子', '曾甲'], ['曾孙媳', '曾媳甲']],
    [['外重孙子', '外曾甲']],
    [['曾外孙女', '曾外甲']],
    [['玄孙女', '玄甲']],
  ])
  assert.deepEqual(input, before)
  assert.deepEqual(organizeNameRows(result), result)
  result[0][0][1] = '仅修改结果'
  assert.deepEqual(input, before)
})

await test('人数不齐、空项、重名和自定义称谓全部保留，不推测或增删人员', () => {
  const input = [
    [['长子', '甲'], ['媳', '乙'], ['子', '甲'], ['', '未填称谓']],
    [['媳', '丙'], ['孙女', ''], ['子', '甲'], ['媳', '丁'], ['', '']],
  ]
  const result = organizeNameRows(input)
  assert.deepEqual(result, [
    [['子', '甲'], ['媳', '乙'], ['子', '甲'], ['媳', '丙'], ['媳', '丁']],
    [['孙女', '']],
    [['长子', '甲'], ['', '未填称谓'], ['', '']],
  ])
  assert.deepEqual(result.flat().map(JSON.stringify).sort(), input.flat().map(JSON.stringify).sort())
  assert.deepEqual(organizeNameRows([]), [])
  assert.deepEqual(organizeNameRows([[['子', '']]]), [[['子', '']]])
})

await test('空白姓名按原顺序占据夫妻配对位置，不让后面人员前移', () => {
  const input = [[
    ['媳', ''], ['媳', '妻乙'], ['子', '夫甲'], ['子', '夫乙'],
    ['女', ''], ['婿', '婿甲'], ['女', '女乙'], ['婿', '婿乙'],
  ]]
  const result = organizeNameRows(input)
  assert.deepEqual(result, [[
    ['子', '夫甲'], ['媳', ''], ['子', '夫乙'], ['媳', '妻乙'],
    ['女', ''], ['婿', '婿甲'], ['女', '女乙'], ['婿', '婿乙'],
  ]])
  assert.equal(result.flat().length, input.flat().length)
  assert.deepEqual(organizeNameRows(result), result)
})

await test('规整与撤销同步预览和保存，重复规整不覆盖撤销快照', () => {
  const order = useOrderForm()
  order.form.names = [[['孙子', '孙甲'], ['媳', '媳甲'], ['子', '子甲']]]
  const before = clone(order.form.names)
  const preview = computed(() => order.buildPreview().small)
  const beforePreview = preview.value
  assert.equal(order.organizeNames(), true)
  assert.equal(order.canUndoNamesOrganize.value, true)
  assert.equal(order.organizeNames(), false)
  assert.notEqual(preview.value, beforePreview)
  assert.equal(order.buildSavePayload().small, preview.value)
  assert.deepEqual(clone(order.buildSavePayload().info.names), [
    [['子', '子甲'], ['媳', '媳甲']], [['孙子', '孙甲']],
  ])
  assert.equal(order.undoNamesOrganize(), true)
  assert.deepEqual(clone(order.form.names), before)
  assert.equal(preview.value, beforePreview)
  assert.equal(order.canUndoNamesOrganize.value, false)
})

await test('人工排序或编辑后禁止旧快照撤销，不自动重新规整', () => {
  const order = useOrderForm()
  order.form.names = [[['媳', '乙'], ['子', '甲'], ['女', '丙']]]
  order.organizeNames()
  order.form.names[0].reverse()
  const manuallySorted = clone(order.form.names)
  assert.equal(order.canUndoNamesOrganize.value, false)
  assert.equal(order.undoNamesOrganize(), false)
  assert.deepEqual(clone(order.buildSavePayload().info.names), manuallySorted)
  order.organizeNames()
  order.form.names[0][0][1] = '修改姓名'
  assert.equal(order.undoNamesOrganize(), false)
  assert.equal(order.form.names[0][0][1], '修改姓名')
  const beforeDrag = indexSource.slice(indexSource.indexOf('<draggable'), indexSource.indexOf('</draggable>'))
  assert.match(beforeDrag, /group="names"/)
  assert.match(beforeDrag, /handle="\.drag-handle"/)
  assert.match(indexSource, /@click="onOrganizeNames"/)
  assert.match(detailSource, /@click="onOrganizeNames"/)
  assert.match(detailSource, /@click="onUndoNamesOrganize"/)
  assert.doesNotMatch(detailSource, /SmallTextPreview|liveSmallText/)
})

console.log(`\n=== ${passed} passed, ${failed} failed ===`)
if (failed) process.exitCode = 1
