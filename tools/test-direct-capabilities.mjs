import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const failures = [];
async function check(name, run) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures.push(`${name}: ${error.message}`); console.error(`FAIL ${name}: ${error.message}`); }
}

const contract = await import('../utils/stele/document-contract.ts');
const delivery = await import('../utils/stele/delivery.ts');
const quality = await import('../utils/stele/quality-check.ts');
const guard = await import('../utils/stele/quality-save-guard.ts');
const diagnostics = await import('../utils/common/diagnostics.ts');

const validDocument = { title:'永垂千古', big:'先考之墓', small:'孝子 张三', birth:'生于一九五〇年', date:'二〇二六年清明立' };
const baseForm = () => ({ selected:'0', father:{name:'父亲',birth:{year:'1950',month:'1',day:'1'},death:{year:'2020',month:'1',day:'1'}}, mother:{name:'母亲',birth:{year:'1952',month:'2',day:'2'},death:{year:'2022',month:'2',day:'2'}}, bigTitle:'永垂千古', dateQingming:true,dateShowLunar:false,libei:['2026','',''],names:[[['子','张三']]],user:'SENSITIVE_USER_SENTINEL',remark:'SENSITIVE_REMARK_SENTINEL' });

await check('C03 五字段非法原始类型全部在投影前阻断', () => {
  for (const field of contract.DOCUMENT_FIELDS) for (const invalid of [null, [], { remark:'SENSITIVE_REMARK_SENTINEL' }, 1, true]) {
    const result = contract.validateRawDocument({ ...validDocument, [field]: invalid });
    assert.equal(result.ok, false, `${field}=${JSON.stringify(invalid)} 不应通过`); assert.equal(result.field, field); assert.match(result.action, /修正|确认/);
  }
});

await check('C03/C10 DTO 精确投影并保留合法正文', () => {
  const raw = { ...validDocument, user:'SENSITIVE_USER_SENTINEL', remark:'SENSITIVE_REMARK_SENTINEL', info:'SENSITIVE_INFO_SENTINEL', token:'SENSITIVE_TOKEN_SENTINEL' };
  const verified = contract.validateRawDocument(raw); assert.equal(verified.ok, true);
  const output = JSON.stringify(verified.document); for (const sentinel of ['SENSITIVE_USER_SENTINEL','SENSITIVE_REMARK_SENTINEL','SENSITIVE_INFO_SENTINEL','SENSITIVE_TOKEN_SENTINEL']) assert.equal(output.includes(sentinel), false);
  const legal = { ...validDocument, title:'联系电话 13800000000，token 为正文' };
  assert.equal(contract.validateRawDocument(legal).document.title, legal.title);
  assert.equal(contract.buildOrderRef('ABC-12_3456'), '123456'); assert.equal(contract.buildOrderRef('A-1'), 'A1'); assert.equal(contract.buildOrderRef('!!!'), 'UNSAVED');
});

await check('C03 下载链接挂载后点击且延迟释放 Blob URL', () => {
  const actions=[]; let releaseUrl;
  const link={style:{},click:()=>actions.push('click'),remove:()=>actions.push('remove')};
  const env={
    Blob,
    URL:{createObjectURL:()=>{actions.push('create');return 'blob:test'},revokeObjectURL:url=>actions.push(`revoke:${url}`)},
    document:{createElement:()=>link,body:{appendChild:node=>{assert.equal(node,link);actions.push('append')}}},
    setTimeout:(callback,delay)=>{releaseUrl=callback;actions.push(`schedule:${delay}`);return 1}
  };
  delivery.downloadBlob(new Blob(['file']), '测试文件.png', env);
  assert.equal(link.href,'blob:test'); assert.equal(link.download,'测试文件.png'); assert.equal(link.style.display,'none');
  assert.deepEqual(actions,['create','append','click','schedule:1000']);
  releaseUrl(); assert.deepEqual(actions,['create','append','click','schedule:1000','remove','revoke:blob:test']);
});

await check('C03 下载能力建立失败不产生 Blob URL，预览用 html2canvas 自渲染', () => {
  const actions=[];
  const env={
    Blob,
    URL:{createObjectURL:()=>{actions.push('create');return 'blob:failed'},revokeObjectURL:url=>actions.push(`revoke:${url}`)},
    document:{createElement:()=>{throw new Error('CREATE_FAILED')},body:{appendChild:()=>{}}},
    setTimeout:()=>{actions.push('schedule');return 1}
  };
  assert.throws(()=>delivery.downloadBlob(new Blob(['file']), '失败.png', env),/DOWNLOAD_UNAVAILABLE/);
  assert.deepEqual(actions,[]);
  const preview=read('components/stele/WordPreview.vue');
  assert.match(preview,/import html2canvas/);
  assert.match(preview,/html2canvas\(el/);
  // 导出走 canvas.toDataURL 下载，复制走剪贴板
  assert.match(preview,/canvas\.toDataURL\(['"]image\/png['"]\)/);
  assert.match(preview,/navigator\.clipboard\.write/);
});

await check('C03 PF01-PF03 下载、截图和压缩失败统一为可判定错误', async () => {
  let clicks=0;
  const completeEnv=()=>({
    Blob,
    URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
    document:{createElement:()=>({style:{},click:()=>clicks++,remove:()=>{}}),body:{appendChild:()=>{}}},
    setTimeout:()=>1
  });
  for (const mutate of [
    env=>{env.Blob=undefined}, env=>{env.URL.createObjectURL=undefined},
    env=>{env.document.createElement=undefined}, env=>{env.document.body=undefined}, env=>{env.setTimeout=undefined},
    env=>{env.document.createElement=()=>({click:()=>clicks++,remove:()=>{}})},
    env=>{env.document.createElement=()=>({style:{},remove:()=>{}})},
    env=>{env.document.createElement=()=>({style:{},click:()=>clicks++})}
  ]) {
    const env=completeEnv();
    mutate(env); assert.throws(()=>delivery.downloadBlob(new Blob(['file']),'失败.png',env),/DOWNLOAD_UNAVAILABLE/);
  }
  assert.equal(clicks,0);
  await assert.rejects(delivery.capturePng({nodeType:1},async()=>{throw new Error('RENDER_FAILED')}),/IMAGE_CAPTURE_FAILED/);
  await assert.rejects(delivery.capturePng({nodeType:1},async()=>({toBlob:callback=>callback(null)})),/IMAGE_CAPTURE_FAILED/);

  assert.equal(delivery.getExportFailureMessage('DOWNLOAD_UNAVAILABLE'),'浏览器下载能力不可用，请允许下载或更换最新版 Chrome 后重试');
  assert.equal(delivery.getExportFailureMessage('IMAGE_CAPTURE_FAILED'),'图片生成失败，请缩短内容后重试');
  const index=read('pages/stele/index.vue');
  assert.match(index,/getExportFailureMessage\(code\)/);
});

await check('C03 清理异常不覆盖下载阶段原始异常', () => {
  const actions=[];
  const env={
    Blob,
    URL:{createObjectURL:()=>{actions.push('create');return 'blob:combined'},revokeObjectURL:()=>{actions.push('revoke');throw new Error('REVOKE_FAILED')}},
    document:{createElement:()=>({style:{},click:()=>{actions.push('click');throw new Error('ORIGINAL_ERROR')},remove:()=>{actions.push('remove');throw new Error('REMOVE_FAILED')}}),body:{appendChild:()=>actions.push('append')}},
    setTimeout:(_callback,delay)=>{actions.push(`schedule:${delay}`);throw new Error('SCHEDULE_FAILED')}
  };
  assert.throws(()=>delivery.downloadBlob(new Blob(['file']),'组合失败.png',env),/ORIGINAL_ERROR/);
  assert.deepEqual(actions,['create','append','click','schedule:1000','remove','revoke']);
});

await check('C04 blocker、warning 与边界规则', () => {
  const missing = baseForm(); missing.father.name=''; assert.ok(quality.checkSteleQuality(missing).blockers.some(item=>item.code==='FATHER_NAME_REQUIRED'));
  const invalid = baseForm(); invalid.father.birth={year:'2020',month:'13',day:'1'}; assert.ok(quality.checkSteleQuality(invalid).warnings.some(item=>item.code==='DATE_INVALID'));
  const reversed = baseForm(); reversed.father.birth={year:'2021',month:'1',day:'1'}; assert.ok(quality.checkSteleQuality(reversed).warnings.some(item=>item.code==='LIFESPAN_REVERSED'));
  const duplicate = baseForm(); duplicate.names=[[[' 子 ','张三'],['子','  张三  ']]]; assert.ok(quality.checkSteleQuality(duplicate).warnings.some(item=>item.code==='NAME_DUPLICATED'));
  assert.equal(quality.checkSteleQuality(baseForm()).blockers.length,0);
});

await check('C04 保存门禁调用次数为 0/0/1', async () => {
  let calls=0; const save=async()=>{calls++;return 'ok'};
  await guard.runQualitySaveGuard({blockers:[{code:'x'}],warnings:[],metrics:{}},async()=>true,save); assert.equal(calls,0);
  await guard.runQualitySaveGuard({blockers:[],warnings:[{code:'x'}],metrics:{}},async()=>false,save); assert.equal(calls,0);
  await guard.runQualitySaveGuard({blockers:[],warnings:[{code:'x'}],metrics:{}},async()=>true,save); assert.equal(calls,1);
});

await check('C05 Element Plus 按需与 JSZip 懒加载', () => {
  const main=read('main.js'); assert.doesNotMatch(main,/app\.use\(ElementPlus\)/); assert.match(main,/ElButton/); assert.doesNotMatch(main,/element-plus\/dist\/index\.css/);
  for (const component of ['button','checkbox','dialog','dropdown','dropdown-item','dropdown-menu','form','form-item','input','option','pagination','radio','radio-button','radio-group','select','splitter','splitter-panel','switch','table','table-column','message','message-box']) assert.ok(main.includes(`element-plus/es/components/${component}/style/css`),`缺少 ${component} 样式`);
  const pkg=JSON.parse(read('package.json')); assert.equal(pkg.dependencies.jszip,'3.10.1');
});

await check('C06 诊断最小化、排序与 query 清除', () => {
  const map=new Map([['stele-draft','SENSITIVE_INFO_SENTINEL'],['stele-3d-preview','{}']]);
  const storage={getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,value)};
  const report=diagnostics.buildDiagnosticReport({appVersion:'1.0.0',storage,clock:()=>new Date('2026-08-29T00:00:00Z'),env:{navigator:{userAgent:'ua',language:'zh-CN',onLine:true},innerWidth:390,innerHeight:844,location:{hash:'#/pages/stele/help?token=SENSITIVE_TOKEN_SENTINEL'}}});
  const pagesReport=diagnostics.buildDiagnosticReport({appVersion:'1.0.0',storage,clock:()=>new Date('2026-08-29T00:00:00Z'),env:{navigator:{userAgent:'ua',language:'zh-CN',onLine:true},innerWidth:390,innerHeight:844,getCurrentPages:()=>[{route:'pages/stele/index?token=SENSITIVE_TOKEN_SENTINEL#part'}],location:{hash:''}}});
  assert.equal(report.route,'/pages/stele/help'); assert.deepEqual(report.storage.map(item=>item.key),[...report.storage.map(item=>item.key)].sort());
  assert.equal(pagesReport.route,'/pages/stele/index'); const output=JSON.stringify([report,pagesReport]); assert.equal(output.includes('SENSITIVE_INFO_SENTINEL'),false); assert.equal(output.includes('SENSITIVE_TOKEN_SENTINEL'),false);
});

await check('C04 新建和编辑页面都接入同一保存门禁', () => {
  for (const page of ['pages/stele/index.vue','pages/stele/detail.vue']) assert.match(read(page),/runQualitySaveGuard/);
});

if (failures.length) { console.error(`\n碑文端能力：${failures.length} 项失败`); process.exitCode=1; }
else console.log('\n碑文端能力 GREEN');
