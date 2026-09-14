import { performance } from 'node:perf_hooks';
import { checkSteleQuality } from '../utils/stele/quality-check.ts';
import { createStelePerformanceFixtures } from './fixtures/direct-capabilities-fixtures.mjs';

const fixtures = createStelePerformanceFixtures();
if (fixtures.form.names.length !== 9 || !fixtures.form.names.every(row => row.length === 9) || !fixtures.form.names.flat(2).every(value => value.length === 64)) throw new Error('碑文端压力夹具必须为 9×9 名单、每字段 64 字');

function measure(name, operation) {
  for (let index = 0; index < 2; index++) operation();
  const values = [];
  for (let index = 0; index < 20; index++) {
    const startedAt = performance.now();
    operation();
    values.push(Number((performance.now() - startedAt).toFixed(6)));
  }
  const max = Math.max(...values);
  if (max >= 200) throw new Error(`${name} 最大耗时 ${max}ms，不满足 <200ms`);
  return { name, warmups: 2, samples: values, max };
}

const results = [
  measure('checkSteleQuality', () => checkSteleQuality(fixtures.form)),
];

console.log(JSON.stringify({ node: process.version, seed: 20260829, results }, null, 2));
