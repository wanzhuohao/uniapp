import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as saveGuard from '../utils/stele/quality-save-guard.ts'

const [mobileSource, detailSource] = await Promise.all([
  readFile(new URL('../pages/stele/index.vue', import.meta.url), 'utf8'),
  readFile(new URL('../pages/stele/detail.vue', import.meta.url), 'utf8'),
])

function extractFunction(source, name, declaration) {
  const start = source.indexOf(`${declaration} ${name}`)
  if (start < 0) throw new Error(`找不到函数 ${name}`)
  const bodyStart = source.indexOf('{', start)
  let depth = 0
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  throw new Error(`函数 ${name} 大括号不完整`)
}

function compileFunction(source, name, declaration, dependencies) {
  const functionSource = extractFunction(source, name, declaration)
  return new Function(
    ...Object.keys(dependencies),
    `${functionSource}; return ${name};`,
  )(...Object.values(dependencies))
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}

function createHarness(kind, getSaveFailureMessage = saveGuard.getSaveFailureMessage) {
  const mobile = kind === 'mobile'
  const source = mobile ? mobileSource : detailSource
  const lock = { value: false }
  const loadState = { value: 'ready' }
  const form = { user: 'test-user', marker: 'keep' }
  const id = { value: '' }
  const phoneInput = { value: '' }
  const phoneForm = { phone: '' }
  const dialog = { value: false }
  const saveFeedback = { state: 'idle', message: '' }
  const drafts = []
  const messages = []
  let clearDraftCalls = 0
  let saveCalls = 0
  let requestSaveCalls = 0
  let qualityCalls = 0
  let warningCalls = 0
  let payloadCalls = 0
  let syncCalls = 0
  let previewCalls = 0
  let saveBehavior = async () => 'saved-id'
  let qualityResult = { blockers: [], warnings: [] }
  let warningDecision = true

  const doSave = async payload => {
    saveCalls++
    return saveBehavior(payload)
  }
  const saveDraft = () => drafts.push(structuredClone(form))
  const clearDraft = () => { clearDraftCalls++ }
  const notify = (level, message) => messages.push({ level, message })
  const checkSteleQuality = () => {
    qualityCalls++
    return qualityResult
  }
  const confirmWarnings = async () => {
    warningCalls++
    return warningDecision
  }
  const dependencies = {
    submitting: lock,
    saving: lock,
    syncDatesToForm() { syncCalls++ },
    refreshPreview() { previewCalls++ },
    saveFeedback,
    checkSteleQuality,
    runQualitySaveGuard: saveGuard.runQualitySaveGuard,
    confirmWarnings,
    form,
    editId: id,
    idRef: id,
    phoneInput,
    phoneForm,
    showPhoneDialog: dialog,
    phoneDialogVisible: dialog,
    buildSavePayload: currentId => {
      payloadCalls++
      return { id: currentId, marker: form.marker }
    },
    doSave,
    clearDraft,
    saveDraft,
    toast: {
      success: message => notify('success', message),
      error: message => notify('error', message),
    },
    ElMessage: {
      success: message => notify('success', message),
      error: message => notify('error', message),
      warning: message => notify('warning', message),
    },
    ElMessageBox: { alert: async () => {} },
    recordDiagnosticError() {},
    uni: { showModal() {} },
    nextTick: async () => {},
    hasUnsavedChanges: { value: true },
    justSaved: { value: false },
    setTimeout: () => 1,
    getSaveFailureMessage,
  }

  const performName = mobile ? 'performSubmit' : 'performSave'
  const perform = compileFunction(source, performName, mobile ? 'async function' : 'const', dependencies)
  const requestSaveFromPage = compileFunction(source, 'requestSave', 'async function', {
    loadState,
    submitting: lock,
    saving: lock,
    saveFeedback,
    toast: dependencies.toast,
    ElMessage: dependencies.ElMessage,
    performSubmit: perform,
    performSave: perform,
  })
  const requestSave = async sourceValue => {
    requestSaveCalls++
    return requestSaveFromPage(sourceValue)
  }
  const confirmName = mobile ? 'confirmPhoneAndSubmit' : 'handlePhoneConfirm'
  const confirm = compileFunction(source, confirmName, mobile ? 'async function' : 'const', {
    ...dependencies,
    requestSave,
  })

  return {
    kind,
    form,
    id,
    lock,
    loadState,
    dialog,
    phoneInput,
    phoneForm,
    saveFeedback,
    drafts,
    messages,
    perform,
    requestSave,
    confirm,
    setSaveBehavior(value) { saveBehavior = value },
    setLoadState(value) { loadState.value = value },
    setQuality(value) { qualityResult = value },
    setWarningDecision(value) { warningDecision = value },
    get saveCalls() { return saveCalls },
    get requestSaveCalls() { return requestSaveCalls },
    get qualityCalls() { return qualityCalls },
    get warningCalls() { return warningCalls },
    get payloadCalls() { return payloadCalls },
    get syncCalls() { return syncCalls },
    get previewCalls() { return previewCalls },
    get clearDraftCalls() { return clearDraftCalls },
  }
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

await test('保存错误分类能区分平台超时与普通失败', () => {
  assert.equal(typeof saveGuard.getSaveFailureMessage, 'function')
  assert.equal(saveGuard.getSaveFailureMessage(new Error('network failed')), '保存失败，草稿已保留。请检查网络后重试。')
  assert.equal(saveGuard.getSaveFailureMessage(Object.assign(new Error('request timeout'), { code: 'TIMEOUT' })), '保存超时，草稿已保留。请重试。')
  assert.equal(saveGuard.getSaveFailureMessage({ name: 'TimeoutError' }), '保存超时，草稿已保留。请重试。')
  assert.equal(saveGuard.getSaveFailureMessage({ errCode: 'SYSTEM_ERROR', errMsg: 'uniCloud.callFunction:fail request:fail timeout' }), '保存超时，草稿已保留。请重试。')
  assert.equal(saveGuard.getSaveFailureMessage({ code: 'SYSTEM_ERROR', errCode: 'TIMEOUT', errMsg: 'request failed' }), '保存超时，草稿已保留。请重试。')
  assert.equal(saveGuard.getSaveFailureMessage({ code: '', errCode: 'SYSTEM_ERROR', errMsg: 'request:fail timeout' }), '保存超时，草稿已保留。请重试。')
  assert.equal(saveGuard.getSaveFailureMessage({ code: 'VALIDATION_FAILED', message: 'timeout 字段格式错误' }), '保存失败，草稿已保留。请检查网络后重试。')
  assert.equal(saveGuard.getSaveFailureMessage({ code: 4001, errCode: 'SYSTEM_ERROR', errMsg: 'request:fail timeout' }), '保存失败，草稿已保留。请检查网络后重试。')
  assert.equal(saveGuard.getSaveFailureMessage('请求参数 timeout 字段格式错误'), '保存失败，草稿已保留。请检查网络后重试。')
  assert.equal(saveGuard.getSaveFailureMessage(new Error('request validation failed: timeout 字段格式错误')), '保存失败，草稿已保留。请检查网络后重试。')
  assert.equal(saveGuard.getSaveFailureMessage({ code: 'SYSTEM_ERROR', errMsg: 'request validation failed: timeout 字段格式错误' }), '保存失败，草稿已保留。请检查网络后重试。')
  assert.equal(saveGuard.getSaveFailureMessage({ errMsg: 'uniCloud.callFunction:fail request:fail timeout' }), '保存失败，草稿已保留。请检查网络后重试。')
})

await test('两页失败路径只消费统一分类结果且不泄露原始错误', async () => {
  for (const kind of ['mobile', 'detail']) {
    const sentinel = `固定分类文案-${kind}`
    const rawError = new Error(`raw-private-error-${kind}`)
    let classifierCalls = 0
    let classifiedError
    const harness = createHarness(kind, error => {
      classifierCalls++
      classifiedError = error
      return sentinel
    })
    harness.setSaveBehavior(async () => { throw rawError })
    await harness.perform()
    assert.equal(classifierCalls, 1, kind)
    assert.equal(classifiedError, rawError, kind)
    assert.deepEqual(harness.saveFeedback, { state: 'error', message: sentinel }, kind)
    assert.deepEqual(harness.messages, [{ level: 'error', message: sentinel }], kind)
    assert.equal(JSON.stringify(harness.messages).includes(rawError.message), false, kind)
  }
})

await test('订单尚未加载或加载失败时不执行保存', async () => {
  for (const kind of ['mobile', 'detail']) {
    for (const loadState of ['loading', 'error']) {
      const harness = createHarness(kind)
      harness.setLoadState(loadState)
      await harness.requestSave()
      assert.equal(harness.qualityCalls, 0)
      assert.equal(harness.payloadCalls, 0)
      assert.equal(harness.saveCalls, 0)
      assert.match(harness.saveFeedback.message, /尚未加载/)
    }
  }
})

await test('两页真实保存主体在质检阻断或警告取消后不构建载荷、不写单', async () => {
  for (const kind of ['mobile', 'detail']) {
    const blocked = createHarness(kind)
    blocked.setQuality({ blockers: [{ code: 'REQUIRED', message: '缺必填项' }], warnings: [{ code: 'WARN', message: '提醒' }] })
    await blocked.requestSave()
    assert.equal(blocked.qualityCalls, 1, `${kind}/blocker`)
    assert.equal(blocked.warningCalls, 0, `${kind}/blocker`)
    assert.equal(blocked.payloadCalls, 0, `${kind}/blocker`)
    assert.equal(blocked.saveCalls, 0, `${kind}/blocker`)

    const cancelled = createHarness(kind)
    cancelled.setQuality({ blockers: [], warnings: [{ code: 'WARN', message: '提醒' }] })
    cancelled.setWarningDecision(false)
    await cancelled.requestSave()
    assert.equal(cancelled.qualityCalls, 1, `${kind}/warning`)
    assert.equal(cancelled.warningCalls, 1, `${kind}/warning`)
    assert.equal(cancelled.payloadCalls, 0, `${kind}/warning`)
    assert.equal(cancelled.saveCalls, 0, `${kind}/warning`)
  }
})

await test('新建与详情在已有订单 ID 时缺客户标识仍只重新进入一次保存', async () => {
  for (const kind of ['mobile', 'detail']) {
    const harness = createHarness(kind)
    harness.id.value = 'existing-id'
    harness.form.user = ''
    await harness.perform()
    assert.equal(harness.saveCalls, 0, kind)
    assert.equal(harness.dialog.value, true, kind)
    assert.equal(harness.lock.value, false, kind)

    const pending = deferred()
    harness.setSaveBehavior(() => pending.promise)
    if (kind === 'mobile') harness.phoneInput.value = 'test-user'
    else harness.phoneForm.phone = 'test-user'
    const first = harness.confirm()
    const duplicate = harness.confirm()
    await Promise.resolve()
    assert.equal(harness.form.user, 'test-user', kind)
    assert.equal(harness.requestSaveCalls, 1, kind)
    assert.equal(harness.saveCalls, 1, kind)
    assert.equal(harness.lock.value, true, kind)
    pending.resolve('created-id')
    await Promise.all([first, duplicate])
    assert.equal(harness.lock.value, false, kind)
    assert.equal(harness.clearDraftCalls, 1, kind)
    assert.equal(harness.id.value, 'created-id', kind)
    assert.deepEqual(harness.saveFeedback, { state: 'success', message: '碑文已经保存成功。' }, kind)
  }
})

await test('保存 reject 后保留表单草稿并允许一次独立重试', async () => {
  for (const kind of ['mobile', 'detail']) {
    const harness = createHarness(kind)
    const before = structuredClone(harness.form)
    harness.setSaveBehavior(async () => { throw new Error('network failed') })
    await harness.perform()
    assert.equal(harness.saveCalls, 1, kind)
    assert.equal(harness.lock.value, false, kind)
    assert.deepEqual(harness.form, before, kind)
    assert.deepEqual(harness.drafts, [before], kind)
    assert.deepEqual(harness.saveFeedback, { state: 'error', message: '保存失败，草稿已保留。请检查网络后重试。' }, kind)

    const pending = deferred()
    harness.setSaveBehavior(() => pending.promise)
    const retry = harness.perform()
    const duplicate = harness.perform()
    await Promise.resolve()
    assert.equal(harness.saveCalls, 2, kind)
    assert.equal(harness.lock.value, true, kind)
    pending.resolve('retry-id')
    await Promise.all([retry, duplicate])
    assert.equal(harness.saveCalls, 2, kind)
    assert.equal(harness.lock.value, false, kind)
    assert.equal(harness.clearDraftCalls, 1, kind)
    assert.deepEqual(harness.saveFeedback, { state: 'success', message: '碑文已经保存成功。' }, kind)
  }
})

await test('平台超时期间防重复，收敛后保留数据并允许一次重试', async () => {
  for (const kind of ['mobile', 'detail']) {
    const harness = createHarness(kind)
    const before = structuredClone(harness.form)
    const timedOut = deferred()
    harness.setSaveBehavior(() => timedOut.promise)
    const attempt = harness.perform()
    const duplicate = harness.perform()
    await Promise.resolve()
    assert.equal(harness.saveCalls, 1, kind)
    assert.equal(harness.lock.value, true, kind)
    timedOut.reject(Object.assign(new Error('request timeout'), { code: 'TIMEOUT' }))
    await Promise.all([attempt, duplicate])
    assert.equal(harness.lock.value, false, kind)
    assert.deepEqual(harness.form, before, kind)
    assert.deepEqual(harness.drafts, [before], kind)
    assert.deepEqual(harness.saveFeedback, { state: 'error', message: '保存超时，草稿已保留。请重试。' }, kind)

    const retryPending = deferred()
    harness.setSaveBehavior(() => retryPending.promise)
    const retry = harness.perform()
    const retryDuplicate = harness.perform()
    await Promise.resolve()
    assert.equal(harness.saveCalls, 2, kind)
    retryPending.resolve('timeout-retry-id')
    await Promise.all([retry, retryDuplicate])
    assert.equal(harness.saveCalls, 2, kind)
    assert.equal(harness.lock.value, false, kind)
    assert.equal(harness.clearDraftCalls, 1, kind)
    assert.deepEqual(harness.saveFeedback, { state: 'success', message: '碑文已经保存成功。' }, kind)
  }
})

console.log(`\n=== ${passed} passed, ${failed} failed ===`)
if (failed) process.exitCode = 1
