import { ElMessageBox } from 'element-plus';
import { STELE_STORAGE_KEYS } from './storage-registry';

const TOKEN_STORAGE_KEY = STELE_STORAGE_KEYS.adminToken;
let memoryToken = '';

/** 口令连续错误的最大尝试次数，超过后停止重试并抛出 AUTH_TOO_MANY_RETRIES */
const MAX_AUTH_RETRIES = 5;

/** 订单 API 错误码，供调用方区分 401/503/网络失败/空列表四种状态 */
export const ORDER_API_ERROR = Object.freeze({
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_CANCELLED: 'AUTH_CANCELLED',
  AUTH_TOO_MANY_RETRIES: 'AUTH_TOO_MANY_RETRIES',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  BUSINESS_ERROR: 'BUSINESS_ERROR',
} as const);

export type OrderApiError = {
  code: typeof ORDER_API_ERROR[keyof typeof ORDER_API_ERROR];
  message: string;
  raw?: unknown;
};

function readStoredToken(): string {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch (_) {}
  return memoryToken;
}

function storeToken(token: string): void {
  memoryToken = token;
  try { localStorage.setItem(TOKEN_STORAGE_KEY, token); } catch (_) {}
}

export function clearOrderAdminToken(): void {
  memoryToken = '';
  try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch (_) {}
}

/** 检查当前是否已缓存口令（内存或 localStorage），供列表页判断是否需要先验证 */
export function hasOrderAdminToken(): boolean {
  return !!readStoredToken();
}

async function requireOrderAdminToken(message = '请输入订单管理员口令'): Promise<string> {
  const stored = readStoredToken();
  if (stored) return stored;
  const { value } = await ElMessageBox.prompt(message, '订单访问验证', {
    inputType: 'password',
    inputPlaceholder: '管理员口令',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    closeOnClickModal: false,
    inputValidator: (input) => {
      const token = String(input || '').trim();
      if (!token) return '请输入管理员口令';
      if (token.length > 256) return '管理员口令长度不能超过 256 个字符';
      return true;
    },
  });
  return String(value || '').trim();
}

export function isOrderAdminPromptCancelled(error: unknown): boolean {
  return error === 'cancel' || error === 'close';
}

export async function callOrderFunction(name: string, data: Record<string, unknown> = {}) {
  let message = '请输入订单管理员口令';
  let retryCount = 0;
  while (true) {
    const adminToken = await requireOrderAdminToken(message);

    let response;
    try {
      response = await uniCloud.callFunction({ name, data: { ...data, adminToken } });
    } catch (error) {
      clearOrderAdminToken();
      throw error;
    }

    if (response?.result?.code === 503) {
      clearOrderAdminToken();
      return response;
    }

    if (response?.result?.code === 401) {
      clearOrderAdminToken();
      retryCount++;
      if (retryCount >= MAX_AUTH_RETRIES) {
        throw {
          code: ORDER_API_ERROR.AUTH_TOO_MANY_RETRIES,
          message: `口令连续错误 ${retryCount} 次，已停止重试，请确认口令后重试`,
          raw: response,
        } as OrderApiError;
      }
      message = '管理员口令无效，请重新输入';
      continue;
    }

    if (response?.result?.code === 0) storeToken(adminToken);
    else clearOrderAdminToken();
    return response;
  }
}

/** 判断 callOrderFunction 抛出的错误是否为指定错误码 */
export function isOrderApiError(err: unknown, code: string): boolean {
  return typeof err === 'object' && err !== null && (err as OrderApiError).code === code;
}
