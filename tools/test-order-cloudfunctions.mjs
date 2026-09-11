import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadMain(relativePath) {
  const modulePath = path.join(root, relativePath)
  delete require.cache[require.resolve(modulePath)]
  return require(modulePath).main
}

function createDbMock({ updated = 1, deleted = 1, throwOn = '' } = {}) {
  const calls = {
    database: 0, get: 0, add: 0, update: 0, remove: 0,
    addedData: null, updatedData: null,
  }
  const failIfRequested = (operation) => {
    if (throwOn === operation) throw new Error('server-test-token')
  }
  const collection = {
    doc() { return { get: async () => { calls.get++; failIfRequested('get'); return { data: { _id: 'order-1' } } } } },
    where() { return collection },
    count: async () => { failIfRequested('count'); return { total: 1 } },
    orderBy() { return collection },
    skip() { return collection },
    limit() { return collection },
    get: async () => { calls.get++; failIfRequested('get'); return { data: [{ _id: 'order-1' }] } },
    add: async (data) => { calls.add++; failIfRequested('add'); calls.addedData = data; return { id: 'order-1' } },
    update: async (data) => { calls.update++; failIfRequested('update'); calls.updatedData = data; return { updated } },
    remove: async () => { calls.remove++; failIfRequested('remove'); return { deleted } },
  }
  globalThis.uniCloud = {
    database() {
      calls.database++
      failIfRequested('database')
      return {
        collection: () => {
          failIfRequested('collection')
          return collection
        },
      }
    },
  }
  return calls
}

const functions = [
  ['query', 'uniCloud-alipay/cloudfunctions/order-query/index.js', {}],
  ['update', 'uniCloud-alipay/cloudfunctions/order-update/index.js', {
    big: '', title: '', small: '', birth: '', date: '', user: 'tester', info: {},
  }],
  ['delete', 'uniCloud-alipay/cloudfunctions/order-delete/index.js', { id: 'order-1' }],
]

const updateFunctionPath = 'uniCloud-alipay/cloudfunctions/order-update/index.js'
const validOrder = {
  big: '', title: '', small: '', birth: '', date: '', user: 'tester', info: {},
}

function infoWithJsonBytes(byteLength) {
  const emptyLength = Buffer.byteLength(JSON.stringify({ value: '' }), 'utf8')
  return { value: 'x'.repeat(byteLength - emptyLength) }
}

let passed = 0

async function test(name, fn) {
  await fn()
  passed++
  console.log(`✓ ${name}`)
}

for (const [name, relativePath, validEvent] of functions) {
  await test(`${name}: 服务端未配置口令时返回 503 且不访问数据库`, async () => {
    delete process.env.ORDER_ADMIN_TOKEN
    const calls = createDbMock()
    const result = await loadMain(relativePath)(validEvent, {})
    assert.equal(result.code, 503)
    assert.equal(calls.database, 0)
  })

  await test(`${name}: 缺失口令时返回 401 且不访问数据库`, async () => {
    process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
    const calls = createDbMock()
    const result = await loadMain(relativePath)(validEvent, {})
    assert.equal(result.code, 401)
    assert.equal(calls.database, 0)
  })

  await test(`${name}: 错误口令时返回 401 且不访问数据库`, async () => {
    process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
    const calls = createDbMock()
    const result = await loadMain(relativePath)({ ...validEvent, adminToken: 'wrong-token' }, {})
    assert.equal(result.code, 401)
    assert.equal(calls.database, 0)
  })

  await test(`${name}: 正确口令保持原调用能力`, async () => {
    process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
    const calls = createDbMock()
    const result = await loadMain(relativePath)({ ...validEvent, adminToken: 'server-test-token' }, {})
    assert.equal(result.code, 0)
    assert.equal(calls.database, 1)
  })
}

await test('update: 非法订单字段返回 400 且不访问数据库', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  const calls = createDbMock()
  const result = await loadMain('uniCloud-alipay/cloudfunctions/order-update/index.js')({
    adminToken: 'server-test-token', big: '', title: '', small: '', birth: '', date: '', user: '', info: {},
  }, {})
  assert.equal(result.code, 400)
  assert.equal(calls.database, 0)
})

await test('update: info 只接受普通对象', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  const calls = createDbMock()
  const result = await loadMain('uniCloud-alipay/cloudfunctions/order-update/index.js')({
    adminToken: 'server-test-token', big: '', title: '', small: '', birth: '', date: '', user: 'tester', info: new Date(),
  }, {})
  assert.equal(result.code, 400)
  assert.equal(calls.database, 0)
})

await test('update: 合法新增不把管理员口令写入数据库', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  const calls = createDbMock()
  const result = await loadMain('uniCloud-alipay/cloudfunctions/order-update/index.js')({
    adminToken: 'server-test-token', big: '', title: '', small: '', birth: '', date: '', user: 'tester', info: {},
  }, {})
  assert.equal(result.code, 0)
  assert.equal(calls.add, 1)
  assert.equal(Object.hasOwn(calls.addedData, 'adminToken'), false)
})

await test('update: 目标不存在时返回 404', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  const calls = createDbMock({ updated: 0 })
  const result = await loadMain('uniCloud-alipay/cloudfunctions/order-update/index.js')({
    adminToken: 'server-test-token', id: 'missing', big: '', title: '', small: '', birth: '', date: '', user: 'tester', info: {},
  }, {})
  assert.equal(result.code, 404)
  assert.equal(calls.update, 1)
})

await test('delete: 目标不存在时返回 404', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  const calls = createDbMock({ deleted: 0 })
  const result = await loadMain('uniCloud-alipay/cloudfunctions/order-delete/index.js')({
    adminToken: 'server-test-token', id: 'missing',
  }, {})
  assert.equal(result.code, 404)
  assert.equal(calls.remove, 1)
})

await test('三函数兼容 HTTP body 中的管理员口令', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  for (const [, relativePath, validEvent] of functions) {
    const calls = createDbMock()
    const result = await loadMain(relativePath)({
      body: JSON.stringify({ ...validEvent, adminToken: 'server-test-token' }),
    }, {})
    assert.equal(result.code, 0)
    assert.equal(calls.database, 1)

    for (const invalidBody of ['{not-json', 'null', '[]', '"text"', '1', null, [], 1]) {
      const invalidCalls = createDbMock()
      const invalidResult = await loadMain(relativePath)({ body: invalidBody }, {})
      assert.equal(invalidResult.code, 400, `${relativePath} 应拒绝非普通对象 body`)
      assert.equal(invalidCalls.database, 0)
    }
  }
})

await test('三函数兼容 HTTP query 中的管理员口令', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  for (const [, relativePath, validEvent] of functions) {
    const calls = createDbMock()
    const result = await loadMain(relativePath)({
      ...validEvent,
      queryStringParameters: { adminToken: 'server-test-token' },
    }, {})
    assert.equal(result.code, 0)
    assert.equal(calls.database, 1)
  }
})

await test('三函数兼容大小写不敏感的管理员口令请求头', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  for (const [, relativePath, validEvent] of functions) {
    const calls = createDbMock()
    const result = await loadMain(relativePath)({
      ...validEvent,
      headers: { 'X-Order-Admin-Token': 'server-test-token' },
    }, {})
    assert.equal(result.code, 0)
    assert.equal(calls.database, 1)
  }
})

await test('显式请求口令优先于 header，冲突时不得绕过鉴权', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  const header = { 'x-order-admin-token': 'server-test-token' }
  const cases = [
    [functions[0][1], { adminToken: 'wrong-token', headers: header }],
    [functions[1][1], { body: JSON.stringify({ ...validOrder, adminToken: 'wrong-token' }), headers: header }],
    [functions[2][1], {
      body: JSON.stringify({ id: 'order-1', adminToken: 'server-test-token' }),
      queryStringParameters: { adminToken: 'wrong-token' },
      headers: header,
    }],
  ]
  for (const [relativePath, event] of cases) {
    const calls = createDbMock()
    const result = await loadMain(relativePath)(event, {})
    assert.equal(result.code, 401)
    assert.equal(calls.database, 0)
  }
  for (const adminToken of ['', null, 0]) {
    const falseyCases = [
      [functions[0][1], { adminToken, headers: header }],
      [functions[1][1], { body: JSON.stringify({ ...validOrder, adminToken }), headers: header }],
      [functions[2][1], { id: 'order-1', adminToken, headers: header }],
    ]
    for (const [relativePath, event] of falseyCases) {
      const calls = createDbMock()
      const result = await loadMain(relativePath)(event, {})
      assert.equal(result.code, 401, `${relativePath} 不得用 header 覆盖显式空口令`)
      assert.equal(calls.database, 0)
    }
  }
})

await test('数据库异常统一返回 -1 且不回传底层异常或口令', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  const cases = []
  for (const throwOn of ['database', 'collection', 'count']) {
    cases.push([functions[0][1], { adminToken: 'server-test-token' }, throwOn])
  }
  for (const throwOn of ['database', 'collection', 'add']) {
    cases.push([functions[1][1], { ...validOrder, adminToken: 'server-test-token' }, throwOn])
  }
  for (const throwOn of ['database', 'collection', 'remove']) {
    cases.push([functions[2][1], { id: 'order-1', adminToken: 'server-test-token' }, throwOn])
  }
  for (const [relativePath, event, throwOn] of cases) {
    const calls = createDbMock({ throwOn })
    const result = await loadMain(relativePath)(event, {})
    const responseText = JSON.stringify(result)
    assert.equal(result.code, -1)
    assert.equal(responseText.includes('server-test-token'), false)
    assert.equal(responseText.includes('detail'), false)
  }
})

await test('update: 新增和更新逐字段拒绝错误类型与 max+1', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  const invalidFields = [
    ['user', 1], ['user', ' '.repeat(3)], ['user', 'x'.repeat(101)],
    ['title', 1], ['title', 'x'.repeat(201)],
    ['big', 1], ['big', 'x'.repeat(20001)],
    ['small', 1], ['small', 'x'.repeat(20001)],
    ['birth', 1], ['birth', 'x'.repeat(20001)],
    ['date', 1], ['date', 'x'.repeat(20001)],
    ['remark', 1], ['remark', 'x'.repeat(2001)],
  ]
  for (const id of ['', 'order-1']) {
    for (const [field, value] of invalidFields) {
      const calls = createDbMock()
      const result = await loadMain(updateFunctionPath)({
        ...validOrder, id, [field]: value, adminToken: 'server-test-token',
      }, {})
      assert.equal(result.code, 400, `${id ? '更新' : '新增'} ${field} 应被拒绝`)
      assert.equal(calls.database, 0)
    }
  }
  for (const id of [123, 'x'.repeat(129)]) {
    const calls = createDbMock()
    const result = await loadMain(updateFunctionPath)({
      ...validOrder, id, adminToken: 'server-test-token',
    }, {})
    assert.equal(result.code, 400)
    assert.equal(calls.database, 0)
  }
})

await test('update: max 边界在新增和更新均成功且只写白名单', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  for (const id of ['', 'x'.repeat(128)]) {
    const calls = createDbMock()
    const result = await loadMain(updateFunctionPath)({
      id,
      user: 'x'.repeat(100),
      title: 'x'.repeat(200),
      big: 'x'.repeat(20000),
      small: 'x'.repeat(20000),
      birth: 'x'.repeat(20000),
      date: 'x'.repeat(20000),
      remark: 'x'.repeat(2000),
      info: infoWithJsonBytes(100 * 1024),
      adminToken: 'server-test-token',
      unexpectedField: 'must-not-persist',
    }, {})
    assert.equal(result.code, 0)
    const data = id ? calls.updatedData : calls.addedData
    const expectedKeys = id
      ? ['big', 'birth', 'date', 'info', 'remark', 'small', 'title', 'updateTime', 'user']
      : ['big', 'birth', 'date', 'info', 'remark', 'small', 'time', 'title', 'user']
    assert.deepEqual(Object.keys(data).sort(), expectedKeys)
  }
})

await test('update: info 在新增和更新均校验对象类型、序列化和 100KB 边界', async () => {
  process.env.ORDER_ADMIN_TOKEN = 'server-test-token'
  const circular = {}
  circular.self = circular
  const invalidValues = [null, [], new Date(), circular, infoWithJsonBytes(100 * 1024 + 1)]
  const nullPrototypeInfo = Object.assign(Object.create(null), { value: 'ok' })
  const validValues = [nullPrototypeInfo, infoWithJsonBytes(100 * 1024)]
  for (const id of ['', 'order-1']) {
    for (const info of invalidValues) {
      const calls = createDbMock()
      const result = await loadMain(updateFunctionPath)({
        ...validOrder, id, info, adminToken: 'server-test-token',
      }, {})
      assert.equal(result.code, 400)
      assert.equal(calls.database, 0)
    }
    for (const info of validValues) {
      const calls = createDbMock()
      const result = await loadMain(updateFunctionPath)({
        ...validOrder, id, info, adminToken: 'server-test-token',
      }, {})
      assert.equal(result.code, 0)
      assert.equal(id ? calls.update : calls.add, 1)
    }
  }
})

delete process.env.ORDER_ADMIN_TOKEN
delete globalThis.uniCloud
console.log(`\n=== ${passed} passed, 0 failed ===`)
