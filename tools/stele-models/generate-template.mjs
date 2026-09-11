import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ShapeUtils, Vector2 } from 'three'

export const TEMPLATE_ID = 'stele-template-classic-v1'
export const PARAMETER_VERSION = 'stele-parametric-classic-v1'

const PROFILE = Object.freeze([
  [-70, 0], [70, 0], [70, 18], [56, 18], [56, 108], [54, 120],
  [48, 132], [38, 143], [24, 152], [0, 160], [-24, 152], [-38, 143],
  [-48, 132], [-54, 120], [-56, 108], [-56, 18], [-70, 18],
])
const RINGS = Object.freeze([
  { y: -13, scale: 0.96 },
  { y: -10, scale: 1 },
  { y: 10, scale: 1 },
  { y: 13, scale: 0.96 },
])

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function ringPoint(ring, index) {
  const [x, z] = PROFILE[index]
  return [x * ring.scale, ring.y, 80 + (z - 80) * ring.scale]
}

function createTriangles() {
  const triangles = []
  const capFaces = ShapeUtils.triangulateShape(PROFILE.map(([x, z]) => new Vector2(x, z)), [])
  for (const [a, b, c] of capFaces) {
    triangles.push([ringPoint(RINGS[0], a), ringPoint(RINGS[0], b), ringPoint(RINGS[0], c)])
    triangles.push([ringPoint(RINGS.at(-1), c), ringPoint(RINGS.at(-1), b), ringPoint(RINGS.at(-1), a)])
  }
  for (let ringIndex = 0; ringIndex < RINGS.length - 1; ringIndex += 1) {
    for (let pointIndex = 0; pointIndex < PROFILE.length; pointIndex += 1) {
      const next = (pointIndex + 1) % PROFILE.length
      const backA = ringPoint(RINGS[ringIndex], pointIndex)
      const backB = ringPoint(RINGS[ringIndex], next)
      const frontA = ringPoint(RINGS[ringIndex + 1], pointIndex)
      const frontB = ringPoint(RINGS[ringIndex + 1], next)
      triangles.push([backA, frontA, frontB], [backA, frontB, backB])
    }
  }
  return triangles
}

function normalOf([a, b, c]) {
  const ab = b.map((value, index) => value - a[index])
  const ac = c.map((value, index) => value - a[index])
  const cross = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ]
  const length = Math.hypot(...cross)
  if (!Number.isFinite(length) || length <= 1e-9) throw new Error('参数化网格包含退化三角面')
  return cross.map(value => value / length)
}

export function canonicalGeometryText(triangles) {
  return triangles
    .map(triangle => triangle
      .map(point => point.map(value => Math.round(value * 1000)).join(','))
      .sort()
      .join('|'))
    .sort()
    .join('\n')
}

function createBinaryStl(triangles) {
  const stl = Buffer.alloc(84 + triangles.length * 50)
  stl.writeUInt32LE(triangles.length, 80)
  triangles.forEach((triangle, triangleIndex) => {
    let offset = 84 + triangleIndex * 50
    for (const value of normalOf(triangle)) {
      stl.writeFloatLE(value, offset)
      offset += 4
    }
    for (const point of triangle) {
      for (const value of point) {
        stl.writeFloatLE(value, offset)
        offset += 4
      }
    }
    stl.writeUInt16LE(0, offset)
  })
  return stl
}

function createGlb(triangles) {
  const toGltfPoint = ([x, y, z]) => [x / 1000, z / 1000, -y / 1000]
  const gltfTriangles = triangles.map(triangle => triangle.map(toGltfPoint))
  const positions = new Float32Array(triangles.length * 9)
  const normals = new Float32Array(triangles.length * 9)
  let cursor = 0
  for (const triangle of gltfTriangles) {
    const normal = normalOf(triangle)
    for (const point of triangle) {
      positions.set(point, cursor)
      normals.set(normal, cursor)
      cursor += 3
    }
  }
  const positionBytes = Buffer.from(positions.buffer)
  const normalBytes = Buffer.from(normals.buffer)
  const binary = Buffer.concat([positionBytes, normalBytes])
  const points = gltfTriangles.flat()
  const min = [0, 1, 2].map(axis => Math.min(...points.map(point => point[axis])))
  const max = [0, 1, 2].map(axis => Math.max(...points.map(point => point[axis])))
  const gltf = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0, mode: 4 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.38, 0.36, 0.33, 1], metallicFactor: 0, roughnessFactor: 0.88 } }],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBytes.length, target: 34962 },
      { buffer: 0, byteOffset: positionBytes.length, byteLength: normalBytes.length, target: 34962 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5126, count: normals.length / 3, type: 'VEC3' },
    ],
  }
  let jsonBytes = Buffer.from(JSON.stringify(gltf), 'utf8')
  jsonBytes = Buffer.concat([jsonBytes, Buffer.alloc((4 - jsonBytes.length % 4) % 4, 0x20)])
  const glb = Buffer.alloc(12 + 8 + jsonBytes.length + 8 + binary.length)
  glb.writeUInt32LE(0x46546c67, 0)
  glb.writeUInt32LE(2, 4)
  glb.writeUInt32LE(glb.length, 8)
  glb.writeUInt32LE(jsonBytes.length, 12)
  glb.writeUInt32LE(0x4e4f534a, 16)
  jsonBytes.copy(glb, 20)
  const binHeader = 20 + jsonBytes.length
  glb.writeUInt32LE(binary.length, binHeader)
  glb.writeUInt32LE(0x004e4942, binHeader + 4)
  binary.copy(glb, binHeader + 8)
  return glb
}

export function createTemplateArtifacts() {
  const triangles = createTriangles()
  const glb = createGlb(triangles)
  const stl = createBinaryStl(triangles)
  const geometrySha256 = sha256(Buffer.from(canonicalGeometryText(triangles), 'utf8'))
  return {
    glb,
    stl,
    triangles,
    metrics: {
      schemaVersion: 1,
      templateId: TEMPLATE_ID,
      parameterVersion: PARAMETER_VERSION,
      sourceKind: 'parametric-generic',
      sourcePhotosRead: false,
      triangleCount: triangles.length,
      textureCount: 0,
      boundsMm: { x: 140, y: 26, z: 160 },
      geometrySha256,
      glb: { bytes: glb.length, sha256: sha256(glb) },
      stl: { bytes: stl.length, sha256: sha256(stl) },
    },
  }
}

export function writeTemplateArtifacts(outputDir) {
  const target = resolve(outputDir)
  mkdirSync(target, { recursive: true })
  const artifacts = createTemplateArtifacts()
  writeFileSync(resolve(target, `${TEMPLATE_ID}.glb`), artifacts.glb)
  writeFileSync(resolve(target, `${TEMPLATE_ID}.stl`), artifacts.stl)
  return artifacts.metrics
}

const isMain = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isMain) {
  const defaultOutput = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '3d-models', 'stele', 'exports')
  if (process.argv.length > 2) {
    process.stderr.write('生成命令不接受输出目录参数；仅允许写入固定 exports 目录。\n')
    process.exitCode = 64
  } else {
    process.stdout.write(`${JSON.stringify(writeTemplateArtifacts(defaultOutput), null, 2)}\n`)
  }
}
