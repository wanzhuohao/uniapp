import { ElMessageBox } from 'element-plus';
import { STELE_STORAGE_KEYS } from './storage-registry';

const TOKEN_STORAGE_KEY = STELE_STORAGE_KEYS.adminToken;
let memoryToken = '';

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
  while (true) {
    const adminToken = await requireOrderAdminToken(message);
    let response;
    try {
      response = await uniCloud.callFunction({ name, data: { ...data, adminToken } });
    } catch (error) {
      clearOrderAdminToken();
      throw error;
    }
    if (response?.result?.code === 401) {
      clearOrderAdminToken();
      message = '管理员口令无效，请重新输入';
      // 云函数在读写订单前返回 401，只有用户重新输入后才重试原操作。
      continue;
    }
    if (response?.result?.code === 0) storeToken(adminToken);
    else clearOrderAdminToken();
    return response;
  }
}
