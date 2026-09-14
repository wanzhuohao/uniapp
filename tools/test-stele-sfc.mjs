import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { parse, compileScript, compileTemplate, compileStyle } from '@vue/compiler-sfc'

const files = [
  'components/stele/SmallTextPreview.vue',
  'components/stele/WordPreview.vue',
  'components/stele/SteleTemplateManager.vue',
  'pages/stele/index.vue',
  'pages/stele/detail.vue',
]

const root = resolve(import.meta.dirname, '..')
let passed = 0
for (const file of files) {
  const filename = resolve(root, file)
  const source = await readFile(filename, 'utf8')
  const { descriptor, errors } = parse(source, { filename })
  assert.deepEqual(errors, [], `${file} parse failed`)
  const id = `stele-${basename(file).replace(/\W/g, '')}`
  const script = compileScript(descriptor, { id })
  assert.ok(script.content.length > 0, `${file} script is empty`)
  if (descriptor.template) {
    const template = compileTemplate({
      id, filename, source: descriptor.template.content,
      compilerOptions: { bindingMetadata: script.bindings },
    })
    assert.deepEqual(template.errors, [], `${file} template failed`)
  }
  for (const style of descriptor.styles) {
    const result = compileStyle({ id, filename, source: style.content, scoped: style.scoped })
    assert.deepEqual(result.errors, [], `${file} style failed`)
  }
  passed++
  console.log(`✓ ${file} SFC 静态编译通过`)
}

console.log(`\n=== ${passed} passed, 0 failed ===`)
