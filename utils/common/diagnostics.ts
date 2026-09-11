import { STELE_DIAGNOSTIC_STORAGE_KEYS, STELE_STORAGE_KEYS } from '../stele/storage-registry.ts';

export const DIAGNOSTIC_CODES = Object.freeze(['STORAGE_READ_FAILED','STORAGE_WRITE_FAILED','BACKUP_INVALID','BACKUP_RESTORE_FAILED','PAPER_SOURCE_MISSING','FILE_GENERATION_FAILED','DOWNLOAD_UNAVAILABLE','IMAGE_CAPTURE_FAILED','ZIP_GENERATION_FAILED','QUALITY_BLOCKED','UNKNOWN_CONTROLLED_ERROR'] as const);
export const DIAGNOSTIC_MODULES = Object.freeze(['app','storage','backup','paper','export','template','quality','diagnostic'] as const);
export type DiagnosticCode = typeof DIAGNOSTIC_CODES[number];
export type DiagnosticModule = typeof DIAGNOSTIC_MODULES[number];
const codeSet = new Set<string>(DIAGNOSTIC_CODES), moduleSet = new Set<string>(DIAGNOSTIC_MODULES), encoder = new TextEncoder();

function iso(value: unknown): string { const date = value instanceof Date ? value : new Date(String(value)); return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString(); }
function text(value: unknown, max: number): string { return typeof value === 'string' ? value.slice(0, max) : ''; }
function cleanRoute(value: unknown): string { const path = typeof value === 'string' ? value.replace(/^#\/?/, '').split(/[?#]/)[0] : ''; return `/${path.replace(/^\/+/, '')}`.slice(0, 256); }
function route(env: any): string {
  try { const pages = env.getCurrentPages?.(); const current = pages?.at?.(-1)?.route; if (typeof current === 'string' && current) return cleanRoute(current); } catch {}
  const hash = typeof env.location?.hash === 'string' ? env.location.hash : '';
  return cleanRoute(hash);
}
function normalizeErrors(input: unknown): Array<{at:string;code:DiagnosticCode;module:DiagnosticModule}> {
  return (Array.isArray(input) ? input : []).filter(item => item && codeSet.has(item.code) && moduleSet.has(item.module)).map(item => ({ at: iso(item.at), code: item.code as DiagnosticCode, module: item.module as DiagnosticModule })).sort((a,b) => b.at.localeCompare(a.at)).slice(0,20);
}

export function recordDiagnosticError(code: DiagnosticCode, module: DiagnosticModule = 'app', at: Date = new Date(), storage: Storage = localStorage): boolean {
  if (!codeSet.has(code) || !moduleSet.has(module)) return false;
  try {
    const raw = storage.getItem(STELE_STORAGE_KEYS.diagnosticErrors);
    const current = raw ? JSON.parse(raw) : [];
    storage.setItem(STELE_STORAGE_KEYS.diagnosticErrors, JSON.stringify(normalizeErrors([{ at: at.toISOString(), code, module }, ...(Array.isArray(current) ? current : [])])));
    return true;
  } catch { return false; }
}

export function buildDiagnosticReport({ appVersion, storage = localStorage, clock = () => new Date(), env = globalThis as any }: {appVersion:string;storage?:Storage;clock?:()=>Date;env?:any}) {
  const readErrors: any[] = [];
  const storageRows = STELE_DIAGNOSTIC_STORAGE_KEYS.map(key => {
    try { const value = storage.getItem(key); return { key, serializedBytes: value === null ? 0 : Math.min(encoder.encode(value).byteLength, Number.MAX_SAFE_INTEGER) }; }
    catch { readErrors.push({ at: clock().toISOString(), code: 'STORAGE_READ_FAILED', module: 'storage' }); return { key, serializedBytes: 0 }; }
  });
  let stored: unknown = [];
  try { const raw = storage.getItem(STELE_STORAGE_KEYS.diagnosticErrors); stored = raw ? JSON.parse(raw) : []; } catch {}
  return {
    schemaVersion: 1,
    app: 'stele' as const,
    appVersion: text(appVersion, 64),
    generatedAt: clock().toISOString(),
    route: route(env),
    environment: {
      userAgent: text(env.navigator?.userAgent, 512), language: text(env.navigator?.language, 35),
      viewport: { width: Math.min(Math.max(Math.trunc(Number(env.innerWidth)||0),0),10000), height: Math.min(Math.max(Math.trunc(Number(env.innerHeight)||0),0),10000) },
      online: typeof env.navigator?.onLine === 'boolean' ? env.navigator.onLine : false,
    },
    errors: normalizeErrors([...(Array.isArray(stored) ? stored : []), ...readErrors]), storage: storageRows,
  };
}

export function downloadDiagnosticReport(report: ReturnType<typeof buildDiagnosticReport>, env: any = globalThis): void {
  if (!env.Blob || !env.URL?.createObjectURL || !env.document?.createElement) throw new Error('DOWNLOAD_UNAVAILABLE');
  const blob = new env.Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = env.URL.createObjectURL(blob);
  try { const link = env.document.createElement('a'); link.href=url; link.download=`stele-diagnostic-${report.generatedAt.slice(0,10)}.json`; link.click(); }
  finally { env.URL.revokeObjectURL(url); }
}
