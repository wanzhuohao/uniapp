export type ExportFailureCode = 'DOWNLOAD_UNAVAILABLE' | 'IMAGE_CAPTURE_FAILED';

const EXPORT_FAILURE_MESSAGES: Readonly<Record<ExportFailureCode, string>> = Object.freeze({
  DOWNLOAD_UNAVAILABLE: '浏览器下载能力不可用，请允许下载或更换最新版 Chrome 后重试',
  IMAGE_CAPTURE_FAILED: '图片生成失败，请缩短内容后重试',
});

export function getExportFailureMessage(code: ExportFailureCode): string {
  return EXPORT_FAILURE_MESSAGES[code];
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
