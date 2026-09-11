import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const registryPath = resolve(root, 'utils/stele/storage-registry.ts');
const violations = [];

if (!existsSync(registryPath)) {
  violations.push('缺少 utils/stele/storage-registry.ts');
}

const ignored = new Set(['node_modules', 'unpackage', '.git', 'tools']);
const registrySource = readFileSync(registryPath, 'utf8');
const registryNames = new Set([...registrySource.matchAll(/^\s*(\w+):\s*Object\.freeze\(/gm)].map(match => match[1]));
const usedNames = new Set();

function inspectAccesses(path, source) {
  const aliases = new Map();
  for (const match of source.matchAll(/\bconst\s+([A-Z][A-Z0-9_]*)\s*=\s*STELE_STORAGE_KEYS\.(\w+)/g)) aliases.set(match[1], match[2]);
  for (const match of source.matchAll(/\bSTELE_STORAGE_KEYS\.(\w+)/g)) usedNames.add(match[1]);
  for (const match of source.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*([^,\n)]+)/g)) {
    const argument = match[1].trim();
    if (/^STELE_STORAGE_KEYS\.\w+$/.test(argument) || aliases.has(argument)) continue;
    violations.push(`${path} 使用未受 registry 约束的动态 key：${argument}`);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignored.has(entry)) continue;
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!['.js', '.vue', '.ts'].includes(extname(full))) continue;
    const source = readFileSync(full, 'utf8');
    const rawKey = /localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*['"`]/g;
    if (rawKey.test(source)) {
      violations.push(`${relative(root, full)} 仍以字面量访问存储 key`);
    }
    inspectAccesses(relative(root, full).replaceAll('\\', '/'), source);
  }
}

walk(root);

for (const name of registryNames) if (!usedNames.has(name)) violations.push(`registry key 未被源码引用：${name}`);
for (const name of usedNames) if (!registryNames.has(name)) violations.push(`源码引用未知 registry 成员：${name}`);

if (violations.length) {
  for (const item of violations) console.error(`FAIL C06 ${item}`);
  process.exitCode = 1;
} else {
  console.log('PASS C06 碑文端存储 key 全部由 registry 提供');
}
