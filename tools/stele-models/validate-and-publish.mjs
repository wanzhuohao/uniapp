import { createHash } from 'node:crypto'
import {
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PARAMETER_VERSION } from './generate-template.mjs'
import { validateBytes as validateGltfBytes, version as gltfValidatorVersion } from 'gltf-validator'

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const DEFAULT_REPO_ROOT = resolve(MODULE_DIR, '..', '..')
const DEFAULT_WORK_ROOT = resolve(DEFAULT_REPO_ROOT, '..', '..', '3d-models', 'stele')
const POLICY_PATH = join(MODULE_DIR, 'model-policy-v1.json')
const REPORT_SCHEMA_PATH = join(MODULE_DIR, 'publish-report-v1.schema.json')
const ERRORS_PATH = join(MODULE_DIR, 'publish-errors-v1.json')
let policyParseFailed = false
let POLICY
try {
  POLICY = JSON.parse(readFileSync(POLICY_PATH, 'utf8'))
} catch {
  policyParseFailed = true
  POLICY = {
    fileNamePattern: 'a^',
    policyVersion: 'invalid-policy',
    publishing: { releaseDirectoryPattern: 'a^' },
    checks: [],
  }
}
let REPORT_SCHEMA = null
const ERROR_MESSAGES = Object.freeze({
  INVALID_ARGUMENT: '命令参数无效',
  INPUT_SET_INVALID: '输入批次不完整',
  FILE_NAME_INVALID: '发布文件名不合法',
  GLB_CONTAINER_INVALID: 'GLB 容器校验失败',
  GLB_JSON_INVALID: 'GLB JSON 白名单校验失败',
  GLB_BINARY_INVALID: 'GLB 二进制布局校验失败',
  STL_CONTAINER_INVALID: 'STL 容器校验失败',
  MESH_TOPOLOGY_INVALID: '网格拓扑校验失败',
  GEOMETRY_MISMATCH: 'GLB 与 STL 几何不一致',
  STAGING_COPY_FAILED: '暂存复制失败，旧发布集合未变',
  STAGING_VERIFY_FAILED: '暂存回读失败，旧发布集合未变',
  REPORT_WRITE_FAILED: '发布报告写入失败，旧发布集合未变',
  TARGET_SWITCH_FAILED: '版本目录发布失败，旧发布集合未变',
  TRANSACTION_RECOVERY_FAILED: '发布事务无法安全恢复，请人工检查',
  BUILD_GUARD_FAILED: '发现未提交发布事务，禁止构建',
})
const EXPECTED_POLICY_SHA256 = '954bb2c749216ef276b83fa42b3ce78667183c1680e5a285d0a5a74f8d637abd'
const EXPECTED_SCHEMA_SHA256 = '273d19fafaf770b814039f01386a8e6d81af399cd8324f61b787f9622c5b9669'
const EXPECTED_ERRORS_SHA256 = 'eceda53698da824987f06d1e7f291b758cd37346bc9a2e71414265dd9d722c70'
const EMPTY_SHA256 = createHash('sha256').update(Buffer.alloc(0)).digest('hex')
const ZERO_SHA256 = '0'.repeat(64)
// 冻结入口规则不能依赖尚未完成契约校验的磁盘内容，否则格式正确但结构损坏的
// policy 会在模块初始化阶段抛错，发布器便无法输出约定的失败报告。
const FILE_PATTERN = /^stele-template-([a-z0-9]+(?:-[a-z0-9]+)*)\.(glb|stl)$/
const RELEASE_PATTERN = /^classic-v1-[a-f0-9]{12}$/
const SHA_PATTERN = /^[a-f0-9]{64}$/

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function jcs(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('JCS 不允许非有限数值')
    return JSON.stringify(Object.is(value, -0) ? 0 : value)
  }
  if (Array.isArray(value)) return `[${value.map(jcs).join(',')}]`
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map(key => `${JSON.stringify(key)}:${jcs(value[key])}`).join(',')}}`
  }
  throw new TypeError('JCS 不支持该值类型')
}

function assert(condition, code, detail = '') {
  if (!condition) {
    const error = new Error(detail || ERROR_MESSAGES[code] || code)
    error.code = code
    throw error
  }
}

function exactKeys(value, expected, code) {
  assert(value && typeof value === 'object' && !Array.isArray(value), code)
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  assert(actual.length === wanted.length && actual.every((key, index) => key === wanted[index]), code)
}

function sameJson(left, right) {
  return jcs(left) === jcs(right)
}

function schemaTypeMatches(type, value) {
  if (type === 'null') return value === null
  if (type === 'array') return Array.isArray(value)
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value)
  if (type === 'integer') return Number.isInteger(value)
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value)
  return typeof value === type
}

function resolveSchemaReference(reference) {
  assert(reference.startsWith('#/$defs/'), 'BUILD_GUARD_FAILED', '报告 schema 包含不支持的引用')
  const definition = REPORT_SCHEMA.$defs[reference.slice('#/$defs/'.length)]
  assert(definition, 'BUILD_GUARD_FAILED', '报告 schema 引用不存在')
  return definition
}

function schemaMatches(schema, value) {
  if (schema.$ref && !schemaMatches(resolveSchemaReference(schema.$ref), value)) return false
  if (schema.allOf && !schema.allOf.every(item => schemaMatches(item, value))) return false
  if (schema.oneOf && schema.oneOf.filter(item => schemaMatches(item, value)).length !== 1) return false
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    if (!types.some(type => schemaTypeMatches(type, value))) return false
  }
  if ('const' in schema && !sameJson(value, schema.const)) return false
  if (schema.enum && !schema.enum.some(item => sameJson(value, item))) return false
  if (typeof value === 'string') {
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) return false
    if (schema.format === 'date-time' && Number.isNaN(Date.parse(value))) return false
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) return false
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) return false
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) return false
    if (schema.maxItems !== undefined && value.length > schema.maxItems) return false
    if (schema.items && !value.every(item => schemaMatches(schema.items, item))) return false
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (schema.required && !schema.required.every(key => Object.hasOwn(value, key))) return false
    if (schema.properties) {
      for (const [key, childSchema] of Object.entries(schema.properties)) {
        if (Object.hasOwn(value, key) && !schemaMatches(childSchema, value[key])) return false
      }
      if (schema.additionalProperties === false && Object.keys(value).some(key => !Object.hasOwn(schema.properties, key))) return false
    }
  }
  return true
}

function validateReportSchema(report, code = 'STAGING_VERIFY_FAILED') {
  assert(REPORT_SCHEMA && schemaMatches(REPORT_SCHEMA, report), code, '发布报告不符合冻结 JSON Schema')
}

function safeChild(root, ...parts) {
  const target = resolve(root, ...parts)
  const prefix = `${resolve(root)}${sep}`
  assert(target.startsWith(prefix), 'INVALID_ARGUMENT', '目标路径越出受控目录')
  return target
}

function removeControlled(root, target) {
  const checked = safeChild(root, relative(root, target))
  rmSync(checked, { recursive: true, force: true })
}

function atomicWriteJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  const temporary = `${path}.tmp`
  const descriptor = openSync(temporary, 'w')
  try {
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
  renameSync(temporary, path)
}

function runFileOperation(code, operation) {
  try {
    return operation()
  } catch (error) {
    if (Object.hasOwn(ERROR_MESSAGES, error?.code)) throw error
    const classified = new Error(ERROR_MESSAGES[code])
    classified.code = code
    throw classified
  }
}

function failureResult(exitCode, code, context = {}) {
  const safeCode = Object.hasOwn(ERROR_MESSAGES, code) ? code : 'INVALID_ARGUMENT'
  const targetBeforeSha256 = SHA_PATTERN.test(context.targetBeforeSha256 || '') ? context.targetBeforeSha256 : null
  const targetAfterSha256 = SHA_PATTERN.test(context.targetAfterSha256 || '') ? context.targetAfterSha256 : targetBeforeSha256
  const fileName = typeof context.fileName === 'string' && FILE_PATTERN.test(context.fileName) ? context.fileName : null
  const report = {
    schemaVersion: 1,
    reportSchema: 'stele-publish-report-v1',
    policyVersion: 'stele-model-policy-v1',
    policySha256: EXPECTED_POLICY_SHA256,
    parameterVersion: PARAMETER_VERSION,
    releaseId: RELEASE_PATTERN.test(context.releaseId || '') ? context.releaseId : 'classic-v1-000000000000',
    createdAt: new Date().toISOString(),
    toolVersions: {
      node: process.version,
      generator: 'stele-generator-v1',
      validator: 'stele-validator-v1',
      gltfValidator: gltfValidatorVersion(),
    },
    summary: {
      fileCount: 0,
      failureCount: 1,
      targetBeforeSha256,
      targetAfterSha256,
      assetSetSha256: EMPTY_SHA256,
    },
    templates: [],
    failures: [{ fileName, code: safeCode, message: ERROR_MESSAGES[safeCode] }],
  }
  if (!context.skipSchemaValidation) validateReportSchema(report, 'BUILD_GUARD_FAILED')
  return { exitCode, error: report.failures[0], report }
}

function failureCode(error, fallback) {
  return Object.hasOwn(ERROR_MESSAGES, error?.code) ? error.code : fallback
}

function validateContractFiles() {
  assert(!policyParseFailed, 'BUILD_GUARD_FAILED', '策略文件无法解析')
  const policySha256 = sha256(Buffer.from(jcs(POLICY), 'utf8'))
  assert(policySha256 === EXPECTED_POLICY_SHA256, 'BUILD_GUARD_FAILED', 'policySha256 不匹配')
  assert(POLICY.fileNamePattern === FILE_PATTERN.source, 'BUILD_GUARD_FAILED', '文件名规则与冻结实现不一致')
  assert(POLICY.publishing?.releaseDirectoryPattern === RELEASE_PATTERN.source, 'BUILD_GUARD_FAILED', '发布目录规则与冻结实现不一致')
  const schemaBytes = readFileSync(REPORT_SCHEMA_PATH)
  assert(sha256(schemaBytes) === EXPECTED_SCHEMA_SHA256, 'BUILD_GUARD_FAILED', '报告 schema 哈希不匹配')
  REPORT_SCHEMA = JSON.parse(schemaBytes.toString('utf8'))
  const errorBytes = readFileSync(ERRORS_PATH)
  assert(sha256(errorBytes) === EXPECTED_ERRORS_SHA256, 'BUILD_GUARD_FAILED', '错误目录哈希不匹配')
  assert(sameJson(JSON.parse(errorBytes.toString('utf8')), ERROR_MESSAGES), 'BUILD_GUARD_FAILED', '错误目录内容不匹配')
  assert(Object.keys(ERROR_MESSAGES).length === 15, 'BUILD_GUARD_FAILED', '错误目录必须恰含 15 项')
  assert(POLICY.checks.length === 26 && new Set(POLICY.checks).size === 26, 'BUILD_GUARD_FAILED', 'checks 必须恰含 26 个唯一键')
  return policySha256
}

function normalLength([a, b, c]) {
  const ab = b.map((value, index) => value - a[index])
  const ac = c.map((value, index) => value - a[index])
  return Math.hypot(
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  )
}

function pointKey(point) {
  return point.map(value => Math.round(value * 1000)).join(',')
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function segmentTrianglePoint(start, end, triangle) {
  const epsilon = 1e-8
  const direction = subtract(end, start)
  const edge1 = subtract(triangle[1], triangle[0])
  const edge2 = subtract(triangle[2], triangle[0])
  const p = cross(direction, edge2)
  const determinant = dot(edge1, p)
  if (Math.abs(determinant) <= epsilon) return null
  const inverse = 1 / determinant
  const translated = subtract(start, triangle[0])
  const u = dot(translated, p) * inverse
  if (u < -epsilon || u > 1 + epsilon) return null
  const q = cross(translated, edge1)
  const v = dot(direction, q) * inverse
  if (v < -epsilon || u + v > 1 + epsilon) return null
  const t = dot(edge2, q) * inverse
  if (t < -epsilon || t > 1 + epsilon) return null
  return start.map((value, index) => value + direction[index] * t)
}

function projectedPoint(point, droppedAxis) {
  return point.filter((_value, index) => index !== droppedAxis)
}

function orient2d(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

function properSegmentIntersection2d(a, b, c, d) {
  const epsilon = 1e-8
  const abC = orient2d(a, b, c)
  const abD = orient2d(a, b, d)
  const cdA = orient2d(c, d, a)
  const cdB = orient2d(c, d, b)
  return abC * abD < -epsilon && cdA * cdB < -epsilon
}

function pointStrictlyInsideTriangle2d(point, triangle) {
  const epsilon = 1e-8
  const signs = triangle.map((current, index) => orient2d(current, triangle[(index + 1) % 3], point))
  return signs.every(value => value > epsilon) || signs.every(value => value < -epsilon)
}

function triangleCentroid2d(triangle) {
  return [
    triangle.reduce((sum, point) => sum + point[0], 0) / 3,
    triangle.reduce((sum, point) => sum + point[1], 0) / 3,
  ]
}

function coplanarTrianglesOverlap(left, right, normal) {
  const droppedAxis = normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs)))
  const a = left.map(point => projectedPoint(point, droppedAxis))
  const b = right.map(point => projectedPoint(point, droppedAxis))
  for (let leftEdge = 0; leftEdge < 3; leftEdge += 1) {
    for (let rightEdge = 0; rightEdge < 3; rightEdge += 1) {
      if (properSegmentIntersection2d(a[leftEdge], a[(leftEdge + 1) % 3], b[rightEdge], b[(rightEdge + 1) % 3])) return true
    }
  }
  return a.some(point => pointStrictlyInsideTriangle2d(point, b))
    || b.some(point => pointStrictlyInsideTriangle2d(point, a))
    || pointStrictlyInsideTriangle2d(triangleCentroid2d(a), b)
    || pointStrictlyInsideTriangle2d(triangleCentroid2d(b), a)
}

function trianglesIntersectBeyondSharedBoundary(left, right) {
  const epsilon = 1e-8
  const leftKeys = new Set(left.map(pointKey))
  const sharedKeys = new Set(right.map(pointKey).filter(key => leftKeys.has(key)))
  const leftNormal = cross(subtract(left[1], left[0]), subtract(left[2], left[0]))
  const rightDistances = right.map(point => dot(leftNormal, subtract(point, left[0])))
  if (rightDistances.every(distance => Math.abs(distance) <= epsilon)) {
    if (sharedKeys.size === 2) {
      const droppedAxis = leftNormal.map(Math.abs).indexOf(Math.max(...leftNormal.map(Math.abs)))
      const shared = left.filter(point => sharedKeys.has(pointKey(point))).map(point => projectedPoint(point, droppedAxis))
      const leftThird = projectedPoint(left.find(point => !sharedKeys.has(pointKey(point))), droppedAxis)
      const rightThird = projectedPoint(right.find(point => !sharedKeys.has(pointKey(point))), droppedAxis)
      return orient2d(shared[0], shared[1], leftThird) * orient2d(shared[0], shared[1], rightThird) > epsilon
    }
    return coplanarTrianglesOverlap(left, right, leftNormal)
  }
  if (sharedKeys.size >= 2) return false
  const hitIsNew = (point) => point && !sharedKeys.has(pointKey(point))
  for (let index = 0; index < 3; index += 1) {
    if (hitIsNew(segmentTrianglePoint(left[index], left[(index + 1) % 3], right))) return true
    if (hitIsNew(segmentTrianglePoint(right[index], right[(index + 1) % 3], left))) return true
  }
  return false
}

function canonicalGeometryText(triangles) {
  return triangles
    .map(triangle => triangle.map(pointKey).sort().join('|'))
    .sort()
    .join('\n')
}

function geometrySha256(triangles) {
  return sha256(Buffer.from(canonicalGeometryText(triangles), 'utf8'))
}

function boundsMm(triangles) {
  const points = triangles.flat()
  const extents = [0, 1, 2].map(axis => {
    const values = points.map(point => point[axis])
    return (Math.round(Math.max(...values) * 1000) - Math.round(Math.min(...values) * 1000)) / 1000
  })
  return { x: extents[0], y: extents[1], z: extents[2] }
}

function parseGlb(buffer) {
  assert(Buffer.isBuffer(buffer) && buffer.length >= 28, 'GLB_CONTAINER_INVALID')
  assert(buffer.readUInt32LE(0) === POLICY.glb.magic, 'GLB_CONTAINER_INVALID')
  assert(buffer.readUInt32LE(4) === POLICY.glb.version, 'GLB_CONTAINER_INVALID')
  assert(buffer.readUInt32LE(8) === buffer.length, 'GLB_CONTAINER_INVALID')
  let offset = 12
  const chunks = []
  while (offset < buffer.length) {
    assert(offset + 8 <= buffer.length, 'GLB_CONTAINER_INVALID')
    const length = buffer.readUInt32LE(offset)
    const type = buffer.readUInt32LE(offset + 4)
    const end = offset + 8 + length
    assert(length % 4 === 0 && end <= buffer.length, 'GLB_CONTAINER_INVALID')
    chunks.push({ type, bytes: buffer.subarray(offset + 8, end) })
    offset = end
  }
  assert(offset === buffer.length && chunks.length === 2, 'GLB_CONTAINER_INVALID')
  assert(chunks[0].type === 0x4e4f534a && chunks[1].type === 0x004e4942, 'GLB_CONTAINER_INVALID')
  let gltf
  try {
    const jsonText = chunks[0].bytes.toString('utf8')
    const jsonWithoutPadding = jsonText.trimEnd()
    assert([...jsonText.slice(jsonWithoutPadding.length)].every(character => character === ' '), 'GLB_CONTAINER_INVALID')
    gltf = JSON.parse(jsonWithoutPadding)
  } catch {
    assert(false, 'GLB_JSON_INVALID')
  }

  exactKeys(gltf, POLICY.glb.json.topLevelKeys, 'GLB_JSON_INVALID')
  exactKeys(gltf.asset, ['version'], 'GLB_JSON_INVALID')
  assert(gltf.asset.version === '2.0' && gltf.scene === 0, 'GLB_JSON_INVALID')
  for (const [key, length] of Object.entries(POLICY.glb.json.arrayLengths)) {
    assert(Array.isArray(gltf[key]) && gltf[key].length === length, 'GLB_JSON_INVALID')
  }
  exactKeys(gltf.scenes[0], ['nodes'], 'GLB_JSON_INVALID')
  assert(sameJson(gltf.scenes[0].nodes, [0]), 'GLB_JSON_INVALID')
  exactKeys(gltf.nodes[0], ['mesh'], 'GLB_JSON_INVALID')
  assert(gltf.nodes[0].mesh === 0, 'GLB_JSON_INVALID')
  exactKeys(gltf.meshes[0], ['primitives'], 'GLB_JSON_INVALID')
  assert(Array.isArray(gltf.meshes[0].primitives) && gltf.meshes[0].primitives.length === 1, 'GLB_JSON_INVALID')
  const primitive = gltf.meshes[0].primitives[0]
  exactKeys(primitive, ['attributes', 'material', 'mode'], 'GLB_JSON_INVALID')
  exactKeys(primitive.attributes, ['NORMAL', 'POSITION'], 'GLB_JSON_INVALID')
  assert(primitive.attributes.POSITION === 0 && primitive.attributes.NORMAL === 1 && primitive.material === 0 && primitive.mode === 4, 'GLB_JSON_INVALID')
  exactKeys(gltf.materials[0], ['pbrMetallicRoughness'], 'GLB_JSON_INVALID')
  exactKeys(gltf.materials[0].pbrMetallicRoughness, ['baseColorFactor', 'metallicFactor', 'roughnessFactor'], 'GLB_JSON_INVALID')
  const material = gltf.materials[0].pbrMetallicRoughness
  assert(Array.isArray(material.baseColorFactor) && material.baseColorFactor.length === 4 && material.baseColorFactor.every(Number.isFinite), 'GLB_JSON_INVALID')
  assert(Number.isFinite(material.metallicFactor) && Number.isFinite(material.roughnessFactor), 'GLB_JSON_INVALID')
  exactKeys(gltf.buffers[0], ['byteLength'], 'GLB_JSON_INVALID')
  assert(gltf.buffers[0].byteLength === chunks[1].bytes.length, 'GLB_BINARY_INVALID')

  const expectedOffsets = []
  for (let index = 0; index < gltf.bufferViews.length; index += 1) {
    const view = gltf.bufferViews[index]
    exactKeys(view, ['buffer', 'byteLength', 'byteOffset', 'target'], 'GLB_JSON_INVALID')
    assert(view.buffer === 0 && view.target === 34962 && Number.isInteger(view.byteOffset) && Number.isInteger(view.byteLength), 'GLB_BINARY_INVALID')
    assert(view.byteOffset >= 0 && view.byteLength > 0 && view.byteOffset + view.byteLength <= chunks[1].bytes.length, 'GLB_BINARY_INVALID')
    expectedOffsets.push([view.byteOffset, view.byteOffset + view.byteLength])
  }
  expectedOffsets.sort((a, b) => a[0] - b[0])
  assert(expectedOffsets[0][0] === 0 && expectedOffsets[0][1] === expectedOffsets[1][0] && expectedOffsets[1][1] === chunks[1].bytes.length, 'GLB_BINARY_INVALID')

  const positionAccessor = gltf.accessors[0]
  const normalAccessor = gltf.accessors[1]
  exactKeys(positionAccessor, ['bufferView', 'componentType', 'count', 'max', 'min', 'type'], 'GLB_JSON_INVALID')
  exactKeys(normalAccessor, ['bufferView', 'componentType', 'count', 'type'], 'GLB_JSON_INVALID')
  for (const [index, accessor] of gltf.accessors.entries()) {
    assert(accessor.bufferView === index && accessor.componentType === 5126 && accessor.type === 'VEC3', 'GLB_JSON_INVALID')
    assert(Number.isInteger(accessor.count) && accessor.count > 0 && accessor.count % 3 === 0, 'GLB_BINARY_INVALID')
    assert(gltf.bufferViews[index].byteLength === accessor.count * 12, 'GLB_BINARY_INVALID')
  }
  assert(positionAccessor.count === normalAccessor.count && positionAccessor.count / 3 <= POLICY.geometry.maxTriangles, 'GLB_BINARY_INVALID')
  assert(Array.isArray(positionAccessor.min) && positionAccessor.min.length === 3 && positionAccessor.min.every(Number.isFinite), 'GLB_JSON_INVALID')
  assert(Array.isArray(positionAccessor.max) && positionAccessor.max.length === 3 && positionAccessor.max.every(Number.isFinite), 'GLB_JSON_INVALID')

  const readVectors = (accessor) => {
    const view = gltf.bufferViews[accessor.bufferView]
    const vectors = []
    for (let index = 0; index < accessor.count; index += 1) {
      const vector = [0, 1, 2].map(axis => chunks[1].bytes.readFloatLE(view.byteOffset + index * 12 + axis * 4))
      assert(vector.every(Number.isFinite), 'GLB_BINARY_INVALID')
      vectors.push(vector)
    }
    return vectors
  }
  const positions = readVectors(positionAccessor)
  readVectors(normalAccessor)
  const physical = positions.map(([x, y, z]) => [x * 1000, -z * 1000, y * 1000])
  const triangles = []
  for (let index = 0; index < physical.length; index += 3) triangles.push(physical.slice(index, index + 3))
  assert(triangles.every(triangle => normalLength(triangle) > 1e-9), 'GLB_BINARY_INVALID')
  const computedMin = [0, 1, 2].map(axis => Math.min(...positions.map(point => point[axis])))
  const computedMax = [0, 1, 2].map(axis => Math.max(...positions.map(point => point[axis])))
  const sameFloat = (left, right) => Math.abs(left - right) <= 1e-7
  assert(computedMin.every((value, index) => sameFloat(value, positionAccessor.min[index])), 'GLB_BINARY_INVALID')
  assert(computedMax.every((value, index) => sameFloat(value, positionAccessor.max[index])), 'GLB_BINARY_INVALID')
  return { triangles, triangleCount: triangles.length, boundsMm: boundsMm(triangles), geometrySha256: geometrySha256(triangles) }
}

export function countTopology(triangles) {
  const duplicateKeys = new Set()
  let duplicateTriangleCount = 0
  const edges = new Map()
  const adjacency = triangles.map(() => new Set())
  triangles.forEach((triangle, triangleIndex) => {
    const keys = triangle.map(pointKey)
    const triangleKey = [...keys].sort().join('|')
    if (duplicateKeys.has(triangleKey)) duplicateTriangleCount += 1
    duplicateKeys.add(triangleKey)
    for (let index = 0; index < 3; index += 1) {
      const from = keys[index]
      const to = keys[(index + 1) % 3]
      const undirected = from < to ? `${from}|${to}` : `${to}|${from}`
      const direction = from < to ? 1 : -1
      const entries = edges.get(undirected) || []
      entries.push({ triangleIndex, direction })
      edges.set(undirected, entries)
    }
  })
  let boundaryEdgeCount = 0
  let nonManifoldEdgeCount = 0
  let orientationConflictCount = 0
  for (const entries of edges.values()) {
    if (entries.length === 1) boundaryEdgeCount += 1
    if (entries.length > 2) nonManifoldEdgeCount += 1
    if (entries.length === 2) {
      adjacency[entries[0].triangleIndex].add(entries[1].triangleIndex)
      adjacency[entries[1].triangleIndex].add(entries[0].triangleIndex)
      if (entries[0].direction === entries[1].direction) orientationConflictCount += 1
    }
  }
  let connectedComponents = 0
  const visited = new Set()
  for (let start = 0; start < triangles.length; start += 1) {
    if (visited.has(start)) continue
    connectedComponents += 1
    const stack = [start]
    visited.add(start)
    while (stack.length) {
      const current = stack.pop()
      for (const neighbor of adjacency[current]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          stack.push(neighbor)
        }
      }
    }
  }
  let selfIntersectionPairCount = 0
  for (let left = 0; left < triangles.length; left += 1) {
    for (let right = left + 1; right < triangles.length; right += 1) {
      if (trianglesIntersectBeyondSharedBoundary(triangles[left], triangles[right])) selfIntersectionPairCount += 1
    }
  }
  return {
    boundaryEdgeCount,
    nonManifoldEdgeCount,
    orientationConflictCount,
    duplicateTriangleCount,
    extraConnectedShellCount: Math.max(0, connectedComponents - 1),
    selfIntersectionPairCount,
  }
}

function parseStl(buffer, templateId) {
  assert(Buffer.isBuffer(buffer) && buffer.length >= 84, 'STL_CONTAINER_INVALID')
  const triangleCount = buffer.readUInt32LE(80)
  assert(triangleCount > 0 && triangleCount <= POLICY.geometry.maxTriangles, 'STL_CONTAINER_INVALID')
  assert(buffer.length === 84 + triangleCount * 50, 'STL_CONTAINER_INVALID')
  const header = buffer.subarray(0, 80)
  const zeroHeader = header.every(byte => byte === 0)
  const expectedHeader = Buffer.alloc(80)
  expectedHeader.write(templateId, 0, 'ascii')
  assert(zeroHeader || header.equals(expectedHeader), 'STL_CONTAINER_INVALID')
  const triangles = []
  let nonZeroAttributeByteCount = 0
  let nonFiniteCoordinateCount = 0
  let degenerateTriangleCount = 0
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    let offset = 84 + triangleIndex * 50
    const normal = [0, 1, 2].map(axis => buffer.readFloatLE(offset + axis * 4))
    offset += 12
    const triangle = []
    for (let vertexIndex = 0; vertexIndex < 3; vertexIndex += 1) {
      const point = [0, 1, 2].map(axis => buffer.readFloatLE(offset + axis * 4))
      offset += 12
      if (!point.every(Number.isFinite)) nonFiniteCoordinateCount += 1
      triangle.push(point)
    }
    if (!normal.every(Number.isFinite)) nonFiniteCoordinateCount += 1
    if (buffer.readUInt16LE(offset) !== 0) nonZeroAttributeByteCount += 1
    const faceCross = cross(subtract(triangle[1], triangle[0]), subtract(triangle[2], triangle[0]))
    const faceLength = Math.hypot(...faceCross)
    const storedNormalLength = Math.hypot(...normal)
    if (faceLength <= 1e-9) degenerateTriangleCount += 1
    else {
      assert(storedNormalLength > 1e-9, 'STL_CONTAINER_INVALID')
      const alignment = dot(faceCross, normal) / (faceLength * storedNormalLength)
      assert(alignment >= 0.999, 'STL_CONTAINER_INVALID')
    }
    triangles.push(triangle)
  }
  const topology = countTopology(triangles)
  return {
    triangles,
    triangleCount,
    boundsMm: boundsMm(triangles),
    geometrySha256: geometrySha256(triangles),
    checks: { ...topology, nonZeroAttributeByteCount, nonFiniteCoordinateCount, degenerateTriangleCount },
  }
}

function zeroChecks() {
  return Object.fromEntries(POLICY.checks.map(key => [key, 0]))
}

function validatePair(glbPath, stlPath, policySha256) {
  const glbName = basename(glbPath)
  const stlName = basename(stlPath)
  const glbMatch = FILE_PATTERN.exec(glbName)
  const stlMatch = FILE_PATTERN.exec(stlName)
  assert(glbMatch && stlMatch && glbMatch[1] === stlMatch[1], 'FILE_NAME_INVALID')
  const templateId = glbName.slice(0, -4)
  assert(stlName === `${templateId}.stl`, 'FILE_NAME_INVALID')
  const glb = readFileSync(glbPath)
  const stl = readFileSync(stlPath)
  const glbData = parseGlb(glb)
  const stlData = parseStl(stl, templateId)
  const checks = zeroChecks()
  for (const [key, value] of Object.entries(stlData.checks)) checks[key] = value
  checks.pairCountMismatchCount = glbData.triangleCount === stlData.triangleCount ? 0 : 1
  checks.geometryMismatchCount = glbData.geometrySha256 === stlData.geometrySha256 ? 0 : 1
  checks.boundsMismatchCount = sameJson(glbData.boundsMm, stlData.boundsMm) ? 0 : 1
  const invalidTopology = [
    'boundaryEdgeCount', 'degenerateTriangleCount', 'duplicateTriangleCount', 'extraConnectedShellCount',
    'nonFiniteCoordinateCount', 'nonManifoldEdgeCount', 'nonZeroAttributeByteCount',
    'orientationConflictCount', 'selfIntersectionPairCount',
  ].some(key => checks[key] !== 0)
  assert(!invalidTopology, 'MESH_TOPOLOGY_INVALID', JSON.stringify(checks))
  assert(checks.pairCountMismatchCount === 0 && checks.geometryMismatchCount === 0 && checks.boundsMismatchCount === 0, 'GEOMETRY_MISMATCH')
  assert(Object.values(checks).every(value => value === 0), 'GEOMETRY_MISMATCH')
  return {
    templateId,
    parameterVersion: PARAMETER_VERSION,
    geometrySha256: glbData.geometrySha256,
    boundsMm: { ...glbData.boundsMm, unit: 'millimeter' },
    triangleCount: glbData.triangleCount,
    checks,
    files: [
      { name: glbName, format: 'glb', bytes: glb.length, sha256: sha256(glb) },
      { name: stlName, format: 'stl', bytes: stl.length, sha256: sha256(stl) },
    ],
    policySha256,
  }
}

export function requireOfficialValidatorVersion(result) {
  const actualVersion = result?.validatorVersion
  assert(typeof actualVersion === 'string' && actualVersion.trim().length > 0, 'GLB_CONTAINER_INVALID', 'glTF Validator 未返回可核验的版本号')
  assert(actualVersion === gltfValidatorVersion(), 'GLB_CONTAINER_INVALID', 'glTF Validator 返回版本与安装包版本不一致')
  return actualVersion
}

async function validateWithOfficialGltfValidator(glbPath, expectedVersion = null) {
  const result = await validateGltfBytes(new Uint8Array(readFileSync(glbPath)), {
    uri: basename(glbPath),
    format: 'glb',
    writeTimestamp: false,
    maxIssues: 0,
  })
  assert(result?.issues?.numErrors === 0 && result?.issues?.numWarnings === 0, 'GLB_CONTAINER_INVALID')
  assert(result?.info?.version === '2.0' && result?.info?.hasTextures === false, 'GLB_CONTAINER_INVALID')
  const actualVersion = requireOfficialValidatorVersion(result)
  if (expectedVersion !== null) assert(expectedVersion === actualVersion, 'STAGING_VERIFY_FAILED', '发布报告中的 glTF Validator 版本不真实')
  return actualVersion
}

function validateReport(report) {
  validateReportSchema(report)
  exactKeys(report, ['schemaVersion', 'reportSchema', 'policyVersion', 'policySha256', 'parameterVersion', 'releaseId', 'createdAt', 'toolVersions', 'summary', 'templates', 'failures'], 'STAGING_VERIFY_FAILED')
  assert(report.schemaVersion === 1 && report.reportSchema === 'stele-publish-report-v1', 'STAGING_VERIFY_FAILED')
  assert(report.policyVersion === POLICY.policyVersion && report.policySha256 === EXPECTED_POLICY_SHA256, 'STAGING_VERIFY_FAILED')
  assert(report.parameterVersion === PARAMETER_VERSION && RELEASE_PATTERN.test(report.releaseId), 'STAGING_VERIFY_FAILED')
  assert(!Number.isNaN(Date.parse(report.createdAt)), 'STAGING_VERIFY_FAILED')
  exactKeys(report.toolVersions, ['node', 'generator', 'validator', 'gltfValidator'], 'STAGING_VERIFY_FAILED')
  assert(typeof report.toolVersions.node === 'string' && report.toolVersions.generator === 'stele-generator-v1' && report.toolVersions.validator === 'stele-validator-v1', 'STAGING_VERIFY_FAILED')
  assert(report.toolVersions.gltfValidator === gltfValidatorVersion(), 'STAGING_VERIFY_FAILED')
  exactKeys(report.summary, ['fileCount', 'failureCount', 'targetBeforeSha256', 'targetAfterSha256', 'assetSetSha256'], 'STAGING_VERIFY_FAILED')
  assert(report.summary.fileCount === 2 && report.summary.failureCount === 0, 'STAGING_VERIFY_FAILED')
  assert(['targetBeforeSha256', 'targetAfterSha256', 'assetSetSha256'].every(key => SHA_PATTERN.test(report.summary[key])), 'STAGING_VERIFY_FAILED')
  assert(Array.isArray(report.templates) && report.templates.length === 1 && Array.isArray(report.failures) && report.failures.length === 0, 'STAGING_VERIFY_FAILED')
  const template = report.templates[0]
  exactKeys(template, ['id', 'parameterVersion', 'geometrySha256', 'boundsMm', 'files', 'checks'], 'STAGING_VERIFY_FAILED')
  assert(/^stele-template-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(template.id) && template.parameterVersion === PARAMETER_VERSION && SHA_PATTERN.test(template.geometrySha256), 'STAGING_VERIFY_FAILED')
  exactKeys(template.boundsMm, ['x', 'y', 'z', 'unit'], 'STAGING_VERIFY_FAILED')
  assert(template.boundsMm.unit === 'millimeter' && ['x', 'y', 'z'].every(key => Number.isFinite(template.boundsMm[key]) && template.boundsMm[key] > 0), 'STAGING_VERIFY_FAILED')
  assert(Array.isArray(template.files) && template.files.length === 2, 'STAGING_VERIFY_FAILED')
  const formats = new Set()
  for (const file of template.files) {
    exactKeys(file, ['name', 'format', 'bytes', 'sha256'], 'STAGING_VERIFY_FAILED')
    assert(FILE_PATTERN.test(file.name) && ['glb', 'stl'].includes(file.format) && file.name.endsWith(`.${file.format}`), 'STAGING_VERIFY_FAILED')
    assert(Number.isInteger(file.bytes) && file.bytes > 0 && SHA_PATTERN.test(file.sha256), 'STAGING_VERIFY_FAILED')
    formats.add(file.format)
  }
  assert(formats.size === 2, 'STAGING_VERIFY_FAILED')
  exactKeys(template.checks, POLICY.checks, 'STAGING_VERIFY_FAILED')
  assert(Object.values(template.checks).every(value => Number.isInteger(value) && value === 0), 'STAGING_VERIFY_FAILED')
  return report
}

function assetSetSha256(files) {
  const lines = [...files].sort((a, b) => a.name.localeCompare(b.name, 'en')).map(file => `${file.name}\t${file.sha256}\n`).join('')
  return sha256(Buffer.from(lines, 'utf8'))
}

function releaseIdFor(template, policySha256) {
  const glb = template.files.find(file => file.format === 'glb')
  const stl = template.files.find(file => file.format === 'stl')
  const releaseSha256 = sha256(Buffer.from(`${template.parameterVersion}\n${policySha256}\n${glb.sha256}\n${stl.sha256}\n`, 'utf8'))
  return `classic-v1-${releaseSha256.slice(0, 12)}`
}

export function computeReportProjectionSha256(report) {
  const projection = structuredClone(report)
  assert(projection?.summary && typeof projection.summary === 'object', 'STAGING_VERIFY_FAILED')
  delete projection.summary.targetBeforeSha256
  delete projection.summary.targetAfterSha256
  return sha256(Buffer.from(jcs(projection), 'utf8'))
}

function releaseSetHash(entries) {
  const lines = [...entries]
    .sort((left, right) => Buffer.from(left.releaseId, 'ascii').compare(Buffer.from(right.releaseId, 'ascii')))
    .map(entry => `${entry.releaseId}\t${entry.reportProjectionSha256}\n`)
    .join('')
  return sha256(Buffer.from(lines, 'utf8'))
}

function releaseRoots(repoRoot) {
  return {
    releasesRoot: join(repoRoot, 'static', 'models', 'stele', 'releases'),
    transactionRoot: join(repoRoot, '.stele-publish'),
  }
}

function validateReleaseDirectory(releaseDir, expectedReleaseId = basename(releaseDir)) {
  assert(RELEASE_PATTERN.test(expectedReleaseId), 'STAGING_VERIFY_FAILED')
  const names = readdirSync(releaseDir).sort()
  const modelNames = names.filter(name => FILE_PATTERN.test(name))
  assert(names.length === 3 && names.includes('publish-report.json') && modelNames.length === 2, 'STAGING_VERIFY_FAILED')
  const glbName = modelNames.find(name => name.endsWith('.glb'))
  const stlName = modelNames.find(name => name.endsWith('.stl'))
  assert(glbName && stlName, 'STAGING_VERIFY_FAILED')
  const report = validateReport(JSON.parse(readFileSync(join(releaseDir, 'publish-report.json'), 'utf8')))
  assert(report.releaseId === expectedReleaseId, 'STAGING_VERIFY_FAILED')
  const template = validatePair(join(releaseDir, glbName), join(releaseDir, stlName), EXPECTED_POLICY_SHA256)
  const reported = report.templates[0]
  assert(reported.id === template.templateId && reported.parameterVersion === template.parameterVersion, 'STAGING_VERIFY_FAILED')
  assert(reported.geometrySha256 === template.geometrySha256 && sameJson(reported.boundsMm, template.boundsMm), 'STAGING_VERIFY_FAILED')
  assert(sameJson(reported.files, template.files) && sameJson(reported.checks, template.checks), 'STAGING_VERIFY_FAILED')
  assert(report.summary.assetSetSha256 === assetSetSha256(template.files), 'STAGING_VERIFY_FAILED')
  assert(releaseIdFor(template, EXPECTED_POLICY_SHA256) === expectedReleaseId, 'STAGING_VERIFY_FAILED')
  return { report, template, reportProjectionSha256: computeReportProjectionSha256(report) }
}

function readReleaseEntries(repoRoot) {
  const { releasesRoot } = releaseRoots(repoRoot)
  if (!existsSync(releasesRoot)) return []
  const entries = readdirSync(releasesRoot, { withFileTypes: true })
  for (const entry of entries) assert(entry.isDirectory() && RELEASE_PATTERN.test(entry.name), 'STAGING_VERIFY_FAILED')
  return entries.map(entry => {
    const validated = validateReleaseDirectory(join(releasesRoot, entry.name), entry.name)
    return { releaseId: entry.name, reportProjectionSha256: validated.reportProjectionSha256 }
  })
}

export async function computeReleaseSetSha256(repoRoot = DEFAULT_REPO_ROOT) {
  validateContractFiles()
  return releaseSetHash(readReleaseEntries(resolve(repoRoot)))
}

function readInputPair(exportsDir, policySha256) {
  assert(existsSync(exportsDir), 'INPUT_SET_INVALID')
  const entries = readdirSync(exportsDir, { withFileTypes: true })
  assert(entries.length === 2 && entries.every(entry => entry.isFile()), 'INPUT_SET_INVALID')
  const names = entries.map(entry => entry.name).sort()
  const glbName = names.find(name => name.endsWith('.glb'))
  const stlName = names.find(name => name.endsWith('.stl'))
  assert(glbName && stlName, 'INPUT_SET_INVALID')
  return validatePair(join(exportsDir, glbName), join(exportsDir, stlName), policySha256)
}

function transactionPaths(repoRoot) {
  const roots = releaseRoots(repoRoot)
  return {
    ...roots,
    active: join(roots.transactionRoot, 'active'),
    owner: join(roots.transactionRoot, 'active', 'owner.json'),
    journal: join(roots.transactionRoot, 'active', 'journal.json'),
    stageRoot: join(roots.transactionRoot, 'active', 'stage'),
    receipts: join(roots.transactionRoot, 'receipts'),
  }
}

function readOwner(path) {
  const owner = JSON.parse(readFileSync(path, 'utf8'))
  exactKeys(owner, ['schemaVersion', 'pid', 'transactionId', 'createdAt'], 'TRANSACTION_RECOVERY_FAILED')
  assert(owner.schemaVersion === 1 && Number.isInteger(owner.pid) && owner.pid > 0, 'TRANSACTION_RECOVERY_FAILED')
  assert(/^[a-z0-9-]+$/.test(owner.transactionId) && !Number.isNaN(Date.parse(owner.createdAt)), 'TRANSACTION_RECOVERY_FAILED')
  return owner
}

export function processMayBeAlive(pid, probe = process.kill.bind(process)) {
  try {
    probe(pid, 0)
    return true
  } catch (error) {
    return error?.code !== 'ESRCH'
  }
}

function readJournal(path) {
  const journal = JSON.parse(readFileSync(path, 'utf8'))
  exactKeys(journal, ['schemaVersion', 'transactionId', 'releaseId', 'state', 'targetExistedBefore', 'targetBeforeSha256', 'targetAfterSha256', 'stageReportProjectionSha256'], 'TRANSACTION_RECOVERY_FAILED')
  assert(journal.schemaVersion === 1 && /^[a-z0-9-]+$/.test(journal.transactionId), 'TRANSACTION_RECOVERY_FAILED')
  assert(RELEASE_PATTERN.test(journal.releaseId) && ['PREPARING', 'STAGED', 'PUBLISHED'].includes(journal.state), 'TRANSACTION_RECOVERY_FAILED')
  assert(journal.targetExistedBefore === false, 'TRANSACTION_RECOVERY_FAILED')
  assert([journal.targetBeforeSha256, journal.targetAfterSha256, journal.stageReportProjectionSha256].every(SHA_PATTERN.test.bind(SHA_PATTERN)), 'TRANSACTION_RECOVERY_FAILED')
  return journal
}

async function recoverActiveTransaction(repoRoot, recoveryTransactionId = '') {
  const paths = transactionPaths(repoRoot)
  if (!existsSync(paths.active)) return { recovered: false }
  assert(existsSync(paths.owner), 'TRANSACTION_RECOVERY_FAILED')
  const owner = readOwner(paths.owner)
  const explicitlyRecoveringCurrentOwner = owner.pid === process.pid
    && owner.transactionId === recoveryTransactionId
  assert(!processMayBeAlive(owner.pid) || explicitlyRecoveringCurrentOwner, 'TRANSACTION_RECOVERY_FAILED', '检测到仍在运行或无法确认已退出的发布事务')
  assert(existsSync(paths.journal), 'TRANSACTION_RECOVERY_FAILED')
  const journal = readJournal(paths.journal)
  assert(journal.transactionId === owner.transactionId, 'TRANSACTION_RECOVERY_FAILED')
  const stageRelease = join(paths.stageRoot, journal.releaseId)
  const publicRelease = join(paths.releasesRoot, journal.releaseId)
  const stageExists = existsSync(stageRelease)
  const targetExists = existsSync(publicRelease)

  if (journal.state === 'PREPARING') {
    assert(!targetExists, 'TRANSACTION_RECOVERY_FAILED')
    removeControlled(paths.transactionRoot, paths.active)
    assert(await computeReleaseSetSha256(repoRoot) === journal.targetBeforeSha256, 'TRANSACTION_RECOVERY_FAILED')
    return { recovered: true, action: 'rolled-back-preparing' }
  }
  if (journal.state === 'STAGED' && stageExists && !targetExists) {
    removeControlled(paths.transactionRoot, paths.active)
    assert(await computeReleaseSetSha256(repoRoot) === journal.targetBeforeSha256, 'TRANSACTION_RECOVERY_FAILED')
    return { recovered: true, action: 'rolled-back-staged' }
  }
  if (journal.state === 'STAGED' && !stageExists && targetExists) {
    const target = validateReleaseDirectory(publicRelease, journal.releaseId)
    await validateWithOfficialGltfValidator(join(publicRelease, target.template.files.find(file => file.format === 'glb').name), target.report.toolVersions.gltfValidator)
    assert(target.reportProjectionSha256 === journal.stageReportProjectionSha256, 'TRANSACTION_RECOVERY_FAILED')
    assert(await computeReleaseSetSha256(repoRoot) === journal.targetAfterSha256, 'TRANSACTION_RECOVERY_FAILED')
    removeControlled(paths.releasesRoot, publicRelease)
    assert(await computeReleaseSetSha256(repoRoot) === journal.targetBeforeSha256, 'TRANSACTION_RECOVERY_FAILED')
    removeControlled(paths.transactionRoot, paths.active)
    return { recovered: true, action: 'rolled-back-renamed' }
  }
  if (journal.state === 'PUBLISHED' && !stageExists && targetExists) {
    const target = validateReleaseDirectory(publicRelease, journal.releaseId)
    await validateWithOfficialGltfValidator(join(publicRelease, target.template.files.find(file => file.format === 'glb').name), target.report.toolVersions.gltfValidator)
    assert(target.reportProjectionSha256 === journal.stageReportProjectionSha256, 'TRANSACTION_RECOVERY_FAILED')
    assert(await computeReleaseSetSha256(repoRoot) === journal.targetAfterSha256, 'TRANSACTION_RECOVERY_FAILED')
    mkdirSync(paths.receipts, { recursive: true })
    renameSync(paths.active, safeChild(paths.receipts, `${journal.releaseId}-${journal.transactionId}`))
    return { recovered: true, action: 'completed-published' }
  }
  assert(false, 'TRANSACTION_RECOVERY_FAILED')
}

function reportFor(template, releaseId, targetBeforeSha256, targetAfterSha256, createdAt) {
  const report = {
    schemaVersion: 1,
    reportSchema: 'stele-publish-report-v1',
    policyVersion: POLICY.policyVersion,
    policySha256: EXPECTED_POLICY_SHA256,
    parameterVersion: template.parameterVersion,
    releaseId,
    createdAt,
    toolVersions: {
      node: process.version,
      generator: 'stele-generator-v1',
      validator: 'stele-validator-v1',
      gltfValidator: gltfValidatorVersion(),
    },
    summary: {
      fileCount: 2,
      failureCount: 0,
      targetBeforeSha256,
      targetAfterSha256,
      assetSetSha256: assetSetSha256(template.files),
    },
    templates: [{
      id: template.templateId,
      parameterVersion: template.parameterVersion,
      geometrySha256: template.geometrySha256,
      boundsMm: template.boundsMm,
      files: template.files,
      checks: template.checks,
    }],
    failures: [],
  }
  validateReport(report)
  return report
}

function simulatedCrash(faultAt, point) {
  if (faultAt === point) throw new Error(`SIMULATED_CRASH:${point}`)
}

function simulatedFailure(failureAt, point, code) {
  if (failureAt !== point) return
  const error = new Error(`SIMULATED_FAILURE:${point}`)
  error.code = code
  throw error
}

function normalizeOptions(options = {}) {
  const repoRoot = resolve(options.repoRoot || DEFAULT_REPO_ROOT)
  return {
    repoRoot,
    exportsDir: resolve(options.exportsDir || join(DEFAULT_WORK_ROOT, 'exports')),
    sourcePhotosDir: resolve(options.sourcePhotosDir || join(DEFAULT_WORK_ROOT, 'source-photos')),
    now: options.now || (() => new Date()),
    transactionId: options.transactionId || `txn-${process.pid}-${Date.now().toString(36)}`,
    recoveryTransactionId: options.recoveryTransactionId || '',
    faultAt: options.faultAt || '',
    failureAt: options.failureAt || '',
    afterOwnerAcquired: typeof options.afterOwnerAcquired === 'function' ? options.afterOwnerAcquired : null,
    beforeReportWrite: typeof options.beforeReportWrite === 'function' ? options.beforeReportWrite : null,
  }
}

export async function publishRelease(options = {}) {
  const settings = normalizeOptions(options)
  let policySha256
  try {
    policySha256 = validateContractFiles()
  } catch {
    return failureResult(4, 'BUILD_GUARD_FAILED', { skipSchemaValidation: true })
  }
  let observedTargetSha256 = null
  try {
    observedTargetSha256 = await computeReleaseSetSha256(settings.repoRoot)
  } catch {
    return failureResult(4, 'TRANSACTION_RECOVERY_FAILED')
  }
  let targetBeforeSha256 = observedTargetSha256
  try {
    await recoverActiveTransaction(settings.repoRoot, settings.recoveryTransactionId)
    targetBeforeSha256 = await computeReleaseSetSha256(settings.repoRoot)
  } catch {
    return failureResult(4, 'TRANSACTION_RECOVERY_FAILED', {
      targetBeforeSha256: observedTargetSha256,
      targetAfterSha256: observedTargetSha256,
    })
  }

  let template
  try {
    template = readInputPair(settings.exportsDir, policySha256)
    await validateWithOfficialGltfValidator(join(settings.exportsDir, template.files.find(file => file.format === 'glb').name))
  } catch (error) {
    return failureResult(2, failureCode(error, 'INPUT_SET_INVALID'), { targetBeforeSha256 })
  }
  const releaseId = releaseIdFor(template, policySha256)
  const paths = transactionPaths(settings.repoRoot)
  const publicRelease = join(paths.releasesRoot, releaseId)
  if (existsSync(publicRelease)) {
    try {
      const existing = validateReleaseDirectory(publicRelease, releaseId)
      await validateWithOfficialGltfValidator(join(publicRelease, existing.template.files.find(file => file.format === 'glb').name), existing.report.toolVersions.gltfValidator)
      assert(existing.template.geometrySha256 === template.geometrySha256, 'TRANSACTION_RECOVERY_FAILED')
      assert(sameJson(existing.template.boundsMm, template.boundsMm), 'TRANSACTION_RECOVERY_FAILED')
      assert(sameJson(existing.template.files, template.files), 'TRANSACTION_RECOVERY_FAILED')
      return { exitCode: 0, releaseId, idempotent: true, template: existing.template }
    } catch {
      return failureResult(4, 'TRANSACTION_RECOVERY_FAILED', { targetBeforeSha256, releaseId })
    }
  }

  let activeCreated = false
  try {
    mkdirSync(paths.releasesRoot, { recursive: true })
    mkdirSync(paths.transactionRoot, { recursive: true })
    mkdirSync(paths.active)
    activeCreated = true
    atomicWriteJson(paths.owner, {
      schemaVersion: 1,
      pid: process.pid,
      transactionId: settings.transactionId,
      createdAt: settings.now().toISOString(),
    })
    if (settings.afterOwnerAcquired) await settings.afterOwnerAcquired()
    assert(await computeReleaseSetSha256(settings.repoRoot) === targetBeforeSha256, 'TRANSACTION_RECOVERY_FAILED')
  } catch {
    if (activeCreated && existsSync(paths.active)) removeControlled(paths.transactionRoot, paths.active)
    return failureResult(4, 'TRANSACTION_RECOVERY_FAILED', { targetBeforeSha256, releaseId })
  }
  const journal = {
    schemaVersion: 1,
    transactionId: settings.transactionId,
    releaseId,
    state: 'PREPARING',
    targetExistedBefore: false,
    targetBeforeSha256,
    targetAfterSha256: ZERO_SHA256,
    stageReportProjectionSha256: ZERO_SHA256,
  }

  try {
    atomicWriteJson(paths.journal, journal)
    const stageRelease = safeChild(paths.stageRoot, releaseId)
    mkdirSync(stageRelease, { recursive: true })
    for (const [index, file] of template.files.entries()) {
      runFileOperation('STAGING_COPY_FAILED', () => {
        copyFileSync(join(settings.exportsDir, file.name), join(stageRelease, file.name))
      })
      if (index === 0) {
        simulatedCrash(settings.faultAt, 'after-first-copy')
        simulatedFailure(settings.failureAt, 'after-first-copy', 'STAGING_COPY_FAILED')
      }
    }
    const copiedTemplate = validatePair(
      join(stageRelease, template.files.find(file => file.format === 'glb').name),
      join(stageRelease, template.files.find(file => file.format === 'stl').name),
      policySha256,
    )
    await validateWithOfficialGltfValidator(join(stageRelease, copiedTemplate.files.find(file => file.format === 'glb').name))
    assert(sameJson(copiedTemplate.files, template.files), 'STAGING_VERIFY_FAILED')

    const placeholder = reportFor(copiedTemplate, releaseId, targetBeforeSha256, ZERO_SHA256, settings.now().toISOString())
    const stageReportProjectionSha256 = computeReportProjectionSha256(placeholder)
    const existingEntries = readReleaseEntries(settings.repoRoot)
    const targetAfterSha256 = releaseSetHash([...existingEntries, { releaseId, reportProjectionSha256: stageReportProjectionSha256 }])
    const report = reportFor(copiedTemplate, releaseId, targetBeforeSha256, targetAfterSha256, placeholder.createdAt)
    assert(computeReportProjectionSha256(report) === stageReportProjectionSha256, 'REPORT_WRITE_FAILED')
    const reportPath = join(stageRelease, 'publish-report.json')
    if (settings.beforeReportWrite) await settings.beforeReportWrite({ reportPath, releaseId })
    runFileOperation('REPORT_WRITE_FAILED', () => atomicWriteJson(reportPath, report))
    validateReleaseDirectory(stageRelease, releaseId)
    simulatedCrash(settings.faultAt, 'after-report')

    journal.state = 'STAGED'
    journal.targetAfterSha256 = targetAfterSha256
    journal.stageReportProjectionSha256 = stageReportProjectionSha256
    atomicWriteJson(paths.journal, journal)
    simulatedCrash(settings.faultAt, 'after-staged')
    simulatedFailure(settings.failureAt, 'before-rename', 'TARGET_SWITCH_FAILED')

    renameSync(stageRelease, publicRelease)
    simulatedCrash(settings.faultAt, 'after-rename')
    simulatedFailure(settings.failureAt, 'after-rename', 'TARGET_SWITCH_FAILED')
    const published = validateReleaseDirectory(publicRelease, releaseId)
    await validateWithOfficialGltfValidator(join(publicRelease, published.template.files.find(file => file.format === 'glb').name), published.report.toolVersions.gltfValidator)
    assert(published.reportProjectionSha256 === stageReportProjectionSha256, 'TARGET_SWITCH_FAILED')
    assert(await computeReleaseSetSha256(settings.repoRoot) === targetAfterSha256, 'TARGET_SWITCH_FAILED')

    journal.state = 'PUBLISHED'
    atomicWriteJson(paths.journal, journal)
    simulatedCrash(settings.faultAt, 'after-published')
    mkdirSync(paths.receipts, { recursive: true })
    renameSync(paths.active, safeChild(paths.receipts, `${releaseId}-${settings.transactionId}`))
    return { exitCode: 0, releaseId, idempotent: false, template: published.template }
  } catch (error) {
    if (String(error.message).startsWith('SIMULATED_CRASH:')) throw error
    if (journal.state === 'PREPARING') {
      try {
        removeControlled(paths.transactionRoot, paths.active)
        assert(await computeReleaseSetSha256(settings.repoRoot) === targetBeforeSha256, 'TRANSACTION_RECOVERY_FAILED')
      } catch {
        return failureResult(4, 'TRANSACTION_RECOVERY_FAILED', { targetBeforeSha256, releaseId })
      }
      return failureResult(3, failureCode(error, 'STAGING_VERIFY_FAILED'), { targetBeforeSha256, releaseId })
    }
    if (journal.state === 'STAGED') {
      try {
        await recoverActiveTransaction(settings.repoRoot, settings.transactionId)
        assert(await computeReleaseSetSha256(settings.repoRoot) === targetBeforeSha256, 'TRANSACTION_RECOVERY_FAILED')
        return failureResult(3, failureCode(error, 'TARGET_SWITCH_FAILED'), { targetBeforeSha256, releaseId })
      } catch {
        return failureResult(4, 'TRANSACTION_RECOVERY_FAILED', { targetBeforeSha256, releaseId })
      }
    }
    return failureResult(4, failureCode(error, 'TRANSACTION_RECOVERY_FAILED'), { targetBeforeSha256, releaseId })
  }
}

function configFileFromUrl(repoRoot, url) {
  assert(typeof url === 'string' && url.startsWith('/static/models/stele/releases/'), 'BUILD_GUARD_FAILED')
  assert(!url.includes('..') && !url.includes('?') && !url.includes('#'), 'BUILD_GUARD_FAILED')
  return safeChild(repoRoot, ...url.slice(1).split('/'))
}

export async function buildGuard(options = {}) {
  const settings = normalizeOptions(options)
  let contractValidated = false
  let observedTargetSha256 = null
  try {
    validateContractFiles()
    contractValidated = true
    observedTargetSha256 = await computeReleaseSetSha256(settings.repoRoot)
    const paths = transactionPaths(settings.repoRoot)
    assert(!existsSync(paths.active), 'BUILD_GUARD_FAILED')
    if (existsSync(settings.sourcePhotosDir)) assert(readdirSync(settings.sourcePhotosDir).length === 0, 'BUILD_GUARD_FAILED')
    const allowedBuildFiles = new Map()
    const { releasesRoot } = releaseRoots(settings.repoRoot)
    if (existsSync(releasesRoot)) {
      for (const entry of readdirSync(releasesRoot, { withFileTypes: true })) {
        const releaseDir = join(releasesRoot, entry.name)
        for (const fileName of readdirSync(releaseDir)) {
          const sourcePath = join(releaseDir, fileName)
          allowedBuildFiles.set(`static/models/stele/releases/${entry.name}/${fileName}`, sha256(readFileSync(sourcePath)))
        }
      }
    }
    const configPath = join(settings.repoRoot, 'utils', 'stele', 'model-templates.json')
    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    assert(Array.isArray(config) && config.length > 0, 'BUILD_GUARD_FAILED')
    for (const item of config) {
      exactKeys(item, ['id', 'name', 'description', 'sourceKind', 'sourceNotice', 'parameterVersion', 'releaseId', 'glbUrl', 'stlUrl', 'boundsMm', 'triangleCount', 'geometrySha256', 'sha256'], 'BUILD_GUARD_FAILED')
      assert(item.sourceKind === 'parametric-generic' && item.sourceNotice === '参数化通用设计，非真实石碑或照片复刻', 'BUILD_GUARD_FAILED')
      assert(RELEASE_PATTERN.test(item.releaseId) && item.glbUrl.includes(`/${item.releaseId}/`) && item.stlUrl.includes(`/${item.releaseId}/`), 'BUILD_GUARD_FAILED')
      const glbPath = configFileFromUrl(settings.repoRoot, item.glbUrl)
      const stlPath = configFileFromUrl(settings.repoRoot, item.stlUrl)
      assert(existsSync(glbPath) && existsSync(stlPath), 'BUILD_GUARD_FAILED')
      const releaseDir = dirname(glbPath)
      assert(dirname(stlPath) === releaseDir, 'BUILD_GUARD_FAILED')
      const validated = validateReleaseDirectory(releaseDir, item.releaseId)
      await validateWithOfficialGltfValidator(glbPath, validated.report.toolVersions.gltfValidator)
      const template = validated.template
      assert(item.id === template.templateId && item.parameterVersion === template.parameterVersion, 'BUILD_GUARD_FAILED')
      assert(item.geometrySha256 === template.geometrySha256 && sameJson({ ...item.boundsMm, unit: 'millimeter' }, template.boundsMm), 'BUILD_GUARD_FAILED')
      assert(item.triangleCount === template.triangleCount, 'BUILD_GUARD_FAILED')
      exactKeys(item.sha256, ['glb', 'stl'], 'BUILD_GUARD_FAILED')
      assert(item.sha256.glb === template.files.find(file => file.format === 'glb').sha256, 'BUILD_GUARD_FAILED')
      assert(item.sha256.stl === template.files.find(file => file.format === 'stl').sha256, 'BUILD_GUARD_FAILED')
    }
    if (options.buildOutputDir && existsSync(options.buildOutputDir)) {
      const outputRoot = resolve(options.buildOutputDir)
      const pending = [outputRoot]
      while (pending.length) {
        const current = pending.pop()
        for (const entry of readdirSync(current, { withFileTypes: true })) {
          const path = join(current, entry.name)
          const relativePath = relative(outputRoot, path).split(sep).join('/')
          assert(!relativePath.split('/').includes('.stele-publish'), 'BUILD_GUARD_FAILED')
          if (entry.isDirectory()) {
            pending.push(path)
            continue
          }
          assert(!/\.(?:jpe?g|heic|webp|tiff?)$/i.test(entry.name), 'BUILD_GUARD_FAILED')
          if (/\.(?:glb|stl)$/i.test(entry.name) || entry.name === 'publish-report.json') {
            const marker = 'static/models/stele/releases/'
            const markerIndex = relativePath.indexOf(marker)
            assert(markerIndex >= 0, 'BUILD_GUARD_FAILED')
            const assetPath = relativePath.slice(markerIndex)
            assert(allowedBuildFiles.has(assetPath), 'BUILD_GUARD_FAILED')
            assert(sha256(readFileSync(path)) === allowedBuildFiles.get(assetPath), 'BUILD_GUARD_FAILED')
          }
        }
      }
    }
    return { exitCode: 0 }
  } catch {
    return failureResult(4, 'BUILD_GUARD_FAILED', {
      targetBeforeSha256: observedTargetSha256,
      targetAfterSha256: observedTargetSha256,
      skipSchemaValidation: !contractValidated,
    })
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  if (args.length > 1 || (args[0] && args[0] !== '--build-guard')) {
    process.stdout.write(`${JSON.stringify(failureResult(64, 'INVALID_ARGUMENT', { skipSchemaValidation: true }))}\n`)
    process.exitCode = 64
    return
  }
  const result = args[0] === '--build-guard' ? await buildGuard() : await publishRelease()
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exitCode = result.exitCode
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url
if (isMain) await runCli()

export { EMPTY_SHA256 }
