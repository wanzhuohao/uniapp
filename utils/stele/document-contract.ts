import type { SteleDocument } from '../../types/order';

export const DOCUMENT_FIELDS = Object.freeze(['title', 'big', 'small', 'birth', 'date'] as const);
const FIELD_LABELS: Record<(typeof DOCUMENT_FIELDS)[number], string> = {
  title: '横批', big: '大字', small: '小字', birth: '生卒', date: '立碑日期',
};

export interface DocumentValidationFailure {
  ok: false;
  field: (typeof DOCUMENT_FIELDS)[number];
  code: 'DOCUMENT_FIELD_TYPE_INVALID';
  action: string;
}

export interface DocumentValidationSuccess { ok: true; document: Readonly<SteleDocument> }

export function validateRawDocument(raw: unknown): DocumentValidationSuccess | DocumentValidationFailure {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, field: 'title', code: 'DOCUMENT_FIELD_TYPE_INVALID', action: '请刷新预览并确认横批、大字、小字、生卒和立碑日期均为文本' };
  }
  const source = raw as Record<string, unknown>;
  for (const field of DOCUMENT_FIELDS) {
    if (typeof source[field] !== 'string') {
      return { ok: false, field, code: 'DOCUMENT_FIELD_TYPE_INVALID', action: `请把“${FIELD_LABELS[field]}”修正为文本后重新生成预览` };
    }
  }
  return {
    ok: true,
    document: Object.freeze({ title: source.title, big: source.big, small: source.small, birth: source.birth, date: source.date } as SteleDocument),
  };
}

export function buildOrderRef(orderId: unknown): string {
  if (orderId === undefined || orderId === null) return 'UNSAVED';
  const normalized = String(orderId).replace(/[^A-Za-z0-9]/g, '');
  return normalized ? normalized.slice(-6) : 'UNSAVED';
}
