import type { OrderForm, SteleTemplate, SteleTemplateData } from '../../types/order';
import { STELE_STORAGE_KEYS } from './storage-registry.ts';

export const MAX_STELE_TEMPLATES = 30;
export interface TemplateStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }

function deepClone<T>(value: T): T {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function text(value: unknown): string { return typeof value === 'string' ? value : ''; }
function date(raw: any) { return { year: text(raw?.year), month: text(raw?.month), day: text(raw?.day) }; }
function parent(raw: any) { return { name: text(raw?.name), birth: date(raw?.birth), death: date(raw?.death) }; }
function names(raw: unknown): string[][][] {
  if (!Array.isArray(raw)) return [[['', '']]];
  return raw.map(row => Array.isArray(row) ? row.map(item => Array.isArray(item) ? [text(item[0]), text(item[1])] : ['', '']) : [['', '']]);
}

export function projectTemplateData(form: Partial<OrderForm>): SteleTemplateData {
  return deepClone({ selected: ['0', '1', '2'].includes(text(form.selected)) ? text(form.selected) : '0', father: parent(form.father), mother: parent(form.mother), bigTitle: text(form.bigTitle), dateQingming: form.dateQingming === true, dateShowLunar: form.dateShowLunar === true, libei: Array.isArray(form.libei) ? [text(form.libei[0]), text(form.libei[1]), text(form.libei[2])] : ['', '', ''], names: names(form.names) });
}

function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function validIso(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { return new Date(value).toISOString() === value; } catch { return false; }
}

function hasExactKeys(value: any, keys: string[]): boolean { return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key)); }
function strictDate(value: any): boolean { return hasExactKeys(value, ['year','month','day']) && ['year','month','day'].every(key => typeof value[key] === 'string'); }
function strictParent(value: any): boolean { return hasExactKeys(value, ['name','birth','death']) && typeof value.name === 'string' && strictDate(value.birth) && strictDate(value.death); }
function strictData(value: any): boolean {
  return hasExactKeys(value, ['selected','father','mother','bigTitle','dateQingming','dateShowLunar','libei','names']) && ['0','1','2'].includes(value.selected) && strictParent(value.father) && strictParent(value.mother) &&
    typeof value.bigTitle === 'string' && typeof value.dateQingming === 'boolean' && typeof value.dateShowLunar === 'boolean' &&
    Array.isArray(value.libei) && value.libei.length === 3 && value.libei.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(value.names) && value.names.every((row: unknown) => Array.isArray(row) && row.every((item: unknown) => Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && typeof item[1] === 'string'));
}

export function sanitizeAndCloneTemplates(input: unknown): SteleTemplate[] {
  const raw = Array.isArray(input) ? input : [];
  if (raw.length > MAX_STELE_TEMPLATES) throw new Error('TEMPLATE_LIMIT_REACHED');
  return raw.map((item: any) => {
    const name = normalizeName(item?.name);
    if (!hasExactKeys(item, ['id','name','createdAt','updatedAt','data']) || typeof item.id !== 'string' || !item.id || !name || name.length > 40 || !validIso(item.createdAt) || !validIso(item.updatedAt) || !strictData(item.data)) throw new Error('TEMPLATE_INVALID');
    return { id: item.id, name, createdAt: item.createdAt, updatedAt: item.updatedAt, data: projectTemplateData(item.data) };
  });
}

export function loadTemplates(storage: TemplateStorage = localStorage, onError?: () => void): SteleTemplate[] {
  try {
    const raw = storage.getItem(STELE_STORAGE_KEYS.templates);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!hasExactKeys(parsed, ['schemaVersion','templates']) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.templates)) throw new Error('TEMPLATE_INVALID');
    return sanitizeAndCloneTemplates(parsed.templates);
  } catch { onError?.(); return []; }
}

export function saveTemplates(templates: SteleTemplate[], storage: TemplateStorage = localStorage): SteleTemplate[] {
  const safe = sanitizeAndCloneTemplates(templates);
  storage.setItem(STELE_STORAGE_KEYS.templates, JSON.stringify({ schemaVersion: 1, templates: safe }));
  return deepClone(safe);
}

export function addTemplate(templates: SteleTemplate[], name: string, form: OrderForm, options: { idFactory?: () => string; clock?: () => Date } = {}): SteleTemplate[] {
  if (templates.length >= MAX_STELE_TEMPLATES) throw new Error('TEMPLATE_LIMIT_REACHED');
  const safeName = normalizeName(name);
  if (!safeName || safeName.length > 40) throw new Error('TEMPLATE_NAME_INVALID');
  const now = (options.clock || (() => new Date()))().toISOString();
  const id = (options.idFactory || (() => crypto.randomUUID()))();
  return sanitizeAndCloneTemplates([...templates, { id, name: safeName, createdAt: now, updatedAt: now, data: projectTemplateData(form) }]);
}

export function renameTemplate(templates: SteleTemplate[], id: string, name: string, clock: () => Date = () => new Date()): SteleTemplate[] {
  const safeName = normalizeName(name); if (!safeName || safeName.length > 40) throw new Error('TEMPLATE_NAME_INVALID');
  return sanitizeAndCloneTemplates(templates.map(item => item.id === id ? { ...item, name: safeName, updatedAt: clock().toISOString() } : item));
}
export function deleteTemplate(templates: SteleTemplate[], id: string): SteleTemplate[] { return sanitizeAndCloneTemplates(templates.filter(item => item.id !== id)); }
export function applyTemplate(template: SteleTemplate): SteleTemplateData { return deepClone(sanitizeAndCloneTemplates([template])[0].data); }
