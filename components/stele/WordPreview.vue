<template>
  <div class="beibei-word-preview">
    <div ref="wordAreaRef" :class="['word-area', { 'theme-light': theme === 'light' }]">
      <div class="word-top">
        <div class="word-title">{{ data.title }}</div>
      </div>
      <div class="word-bottom">
        <div class="word-col-date">
          <div class="word-date">{{ data.date }}</div>
        </div>
        <div class="word-col-small">
          <div class="word-small">{{ (data.small || '').replace(/  /g, '\u3000') }}</div>
        </div>
        <div class="word-col-big">
          <div class="word-big">
            <div
              v-for="(line, idx) in bigLines"
              :key="idx"
              class="word-big-line"
            >
              <span
                v-for="(ch, i) in line"
                :key="i"
                :class="['word-big-char', { 'word-big-half': ch === ' ' }]"
              >{{ (ch === ' ' || ch === '\u3000') ? '' : ch }}</span>
            </div>
          </div>
        </div>
        <div class="word-col-birth">
          <div class="word-birth">{{ data.birth }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import html2canvas from 'html2canvas';
import type { PreviewData } from '../../types/order';

const props = withDefaults(defineProps<{
  data: PreviewData;
  theme?: 'dark' | 'light';
}>(), {
  theme: 'dark'
});

const wordAreaRef = ref<HTMLElement | null>(null);

const bigLines = computed(() =>
  (props.data.big || '').split('\n').filter(Boolean)
);

/** 题款日期：农历 + 公历组合，失败回退公历 */
const signatureDate = computed(() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}·${m}·${d}`;
});

/** 导出预览为 PNG 图片，filename 为下载文件名 */
async function exportImage(filename: string): Promise<boolean> {
  const el = wordAreaRef.value;
  if (!el) return false;
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: props.theme === 'dark' ? '#1a1a18' : '#ffffff',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  } catch {
    return false;
  }
}

/** 复制预览图片到剪切板 */
async function copyImage(): Promise<boolean> {
  const el = wordAreaRef.value;
  if (!el) return false;
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: props.theme === 'dark' ? '#1a1a18' : '#ffffff',
      scale: 2,
    });
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

defineExpose({ exportImage, copyImage });
</script>

<style>
@import '../../utils/stele/word-preview.css';
</style>
