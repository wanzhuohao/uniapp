import type { QualityResult } from '../../types/order';

const SAVE_FAILURE_MESSAGE = '保存失败，草稿已保留。请检查网络后重试。';
const SAVE_TIMEOUT_MESSAGE = '保存超时，草稿已保留。请重试。';

export function getSaveFailureMessage(error: unknown): string {
  const record = typeof error === 'object' && error !== null
    ? error as Record<string, unknown>
    : {};
  const codes = [record.code, record.errCode, record.name]
    .filter(value => typeof value === 'string')
    .map(value => (value as string).trim())
    .filter(Boolean);
  const hasNonStringBusinessCode = [record.code, record.errCode]
    .some(value => value !== undefined && value !== null && typeof value !== 'string');
  const explicitTimeoutCode = /^(?:e?timedout|timeout(?:_?error)?|request_timeout|network_timeout|deadline_exceeded)$/i;
  const transportWrapperCode = /^(?:error|system_error|network_error|request_error|unknown)$/i;
  const hasExplicitTimeoutCode = codes.some(code => explicitTimeoutCode.test(code));
  const hasTransportWrapperCode = codes.some(code => transportWrapperCode.test(code));
  const hasBusinessCode = hasNonStringBusinessCode
    || codes.some(code => !explicitTimeoutCode.test(code) && !transportWrapperCode.test(code));
  const transportMessage = typeof record.errMsg === 'string' ? record.errMsg.trim() : '';
  const transportTimeoutMessage = /^(?:unicloud\.callfunction:fail\s+)?(?:request|network|socket|connect):fail\s+(?:timeout|timed\s*out|etimedout|deadline[_\s-]*exceeded|请求超时)$/i;
  const isTimeout = hasExplicitTimeoutCode
    || (!hasBusinessCode && hasTransportWrapperCode && transportTimeoutMessage.test(transportMessage));
  return isTimeout
    ? SAVE_TIMEOUT_MESSAGE
    : SAVE_FAILURE_MESSAGE;
}

export async function runQualitySaveGuard<T>(result: QualityResult, confirmWarnings: (warnings: QualityResult['warnings']) => Promise<boolean>, save: () => Promise<T>): Promise<{ status: string; value?: T }> {
  if (result.blockers.length) return { status: 'QUALITY_BLOCKED' };
  if (result.warnings.length && !await confirmWarnings(result.warnings)) return { status: 'QUALITY_CANCELLED' };
  let called = false;
  const saveOnce = async () => {
    if (called) throw new Error('SAVE_ALREADY_CALLED');
    called = true;
    return save();
  };
  return { status: 'SAVED', value: await saveOnce() };
}
