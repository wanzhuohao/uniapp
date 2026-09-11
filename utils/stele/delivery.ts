import type { DeliveryDto } from '../../types/order';

export const DELIVERY_FILES = Object.freeze(['刻字数据.json', '刻字内容.txt', '碑文预览.png'] as const);
export type ExportFailureCode = 'DOWNLOAD_UNAVAILABLE' | 'IMAGE_CAPTURE_FAILED' | 'ZIP_GENERATION_FAILED';

const EXPORT_FAILURE_MESSAGES: Readonly<Record<ExportFailureCode, string>> = Object.freeze({
  DOWNLOAD_UNAVAILABLE: '浏览器下载能力不可用，请允许下载或更换最新版 Chrome 后重试',
  IMAGE_CAPTURE_FAILED: '图片生成失败，请缩短内容后重试',
  ZIP_GENERATION_FAILED: '压缩包生成失败，请重试',
});

export function getExportFailureMessage(code: ExportFailureCode): string {
  return EXPORT_FAILURE_MESSAGES[code];
}

export function buildDeliveryJson(dto: DeliveryDto): string {
  return JSON.stringify(dto, null, 2);
}

export function buildDeliveryText(dto: DeliveryDto): string {
  const document = dto.document;
  return `横批：${document.title}\n大字：${document.big}\n小字：${document.small}\n生卒：${document.birth}\n立碑日期：${document.date}\n`;
}

export async function capturePng(node: HTMLElement | null, render: (node: HTMLElement) => Promise<Pick<HTMLCanvasElement, 'toBlob'>>): Promise<Blob> {
  if (!node) throw new Error('IMAGE_CAPTURE_FAILED');
  try {
    const canvas = await render(node);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('IMAGE_CAPTURE_FAILED')), 'image/png'));
  } catch {
    throw new Error('IMAGE_CAPTURE_FAILED');
  }
}

export async function buildDeliveryZip(dto: DeliveryDto, pngBlob: Blob, loadZip: () => Promise<any> = () => import('jszip')): Promise<Blob> {
  if (!(pngBlob instanceof Blob) || pngBlob.type !== 'image/png') throw new Error('IMAGE_CAPTURE_FAILED');
  try {
    const { default: JSZip } = await loadZip();
    const zip = new JSZip();
    zip.file(DELIVERY_FILES[0], buildDeliveryJson(dto));
    zip.file(DELIVERY_FILES[1], buildDeliveryText(dto));
    zip.file(DELIVERY_FILES[2], await pngBlob.arrayBuffer());
    const names = Object.keys(zip.files);
    if (names.length !== DELIVERY_FILES.length || DELIVERY_FILES.some(name => !names.includes(name))) throw new Error('ZIP_GENERATION_FAILED');
    return await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
  } catch {
    throw new Error('ZIP_GENERATION_FAILED');
  }
}

export function downloadBlob(blob: Blob, filename: string, env: typeof globalThis = globalThis): void {
  if (typeof env.Blob !== 'function' || !env.URL?.createObjectURL || !env.document?.createElement || !env.document.body?.appendChild || typeof env.setTimeout !== 'function') throw new Error('DOWNLOAD_UNAVAILABLE');
  let link: HTMLAnchorElement;
  try {
    link = env.document.createElement('a');
  } catch {
    throw new Error('DOWNLOAD_UNAVAILABLE');
  }
  if (!link?.style || typeof link.click !== 'function' || typeof link.remove !== 'function') throw new Error('DOWNLOAD_UNAVAILABLE');
  let url: string;
  try {
    url = env.URL.createObjectURL(blob);
  } catch {
    throw new Error('DOWNLOAD_UNAVAILABLE');
  }
  try {
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    env.document.body.appendChild(link);
    link.click();
  } finally {
    try {
      env.setTimeout(() => {
        try { link.remove(); } catch { /* 清理失败不能掩盖下载阶段的原始异常。 */ }
        try { env.URL.revokeObjectURL(url); } catch { /* 浏览器会在页面释放时回收。 */ }
      }, 1000);
    } catch {
      try { link.remove(); } catch { /* 浏览器会在页面释放时回收。 */ }
      try { env.URL.revokeObjectURL(url); } catch { /* 浏览器会在页面释放时回收。 */ }
    }
  }
}
