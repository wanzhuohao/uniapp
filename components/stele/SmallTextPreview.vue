<template>
  <div class="small-preview-space" :class="{ collapsed, 'no-space': !reserveSpace }" :style="viewportStyle">
    <Teleport to="body">
      <aside v-if="pageVisible" class="small-preview-window" :class="{ collapsed }" :style="viewportStyle" aria-label="小字实时预览">
        <header class="small-preview-heading">
          <strong>小字实时预览</strong>
          <div class="small-preview-actions">
            <el-button v-if="!collapsed" aria-label="缩小预览字号" :disabled="fontSize <= 12" @click="fontSize -= 2">A−</el-button>
            <el-button v-if="!collapsed" aria-label="放大预览字号" :disabled="fontSize >= 32" @click="fontSize += 2">A+</el-button>
            <el-button :aria-expanded="!collapsed" @click="collapsed = !collapsed">{{ collapsed ? '展开' : '收起' }}</el-button>
          </div>
        </header>
        <div v-show="!collapsed" class="small-preview-body" :style="{ '--beibei-small-size': fontSize + 'px' }">
          <WordPreview v-if="small.trim()" :data="previewData" mode="small" />
          <p v-else class="small-preview-empty">填写名单后，这里会实时显示排版</p>
        </div>
      </aside>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { onHide, onShow } from '@dcloudio/uni-app';
import WordPreview from './WordPreview.vue';

const props = withDefaults(defineProps<{ small: string; reserveSpace?: boolean }>(), { reserveSpace: true });
const collapsed = ref(false);
const fontSize = ref(20);
const pageVisible = ref(true);
const viewportTop = ref(0);
const viewportHeight = ref(0);
const previewData = computed(() => ({ title: '', big: '', small: props.small, date: '', birth: '' }));
const viewportStyle = computed(() => ({
  '--small-preview-top': `${viewportTop.value + 8}px`,
  '--small-preview-height': `${Math.min(180, Math.max(80, viewportHeight.value * 0.22))}px`,
}));

function updateViewport() {
  viewportTop.value = window.visualViewport?.offsetTop || 0;
  viewportHeight.value = window.visualViewport?.height || window.innerHeight;
}

onMounted(() => {
  updateViewport();
  window.addEventListener('resize', updateViewport);
  window.visualViewport?.addEventListener('resize', updateViewport);
  window.visualViewport?.addEventListener('scroll', updateViewport);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport);
  window.visualViewport?.removeEventListener('resize', updateViewport);
  window.visualViewport?.removeEventListener('scroll', updateViewport);
});
onHide(() => { pageVisible.value = false; });
onShow(() => { pageVisible.value = true; });
</script>

<style scoped>
.small-preview-space { flex-shrink: 0; }
.small-preview-window {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 90;
  width: 360px;
  box-sizing: border-box;
  border: 1px solid var(--gold-a35, #baa46e);
  border-radius: 10px;
  background: var(--paper-white, #fffdf8);
  color: var(--ink-main, #302820);
  box-shadow: 0 6px 24px rgba(44, 36, 32, 0.2);
}
.small-preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  min-height: 40px;
  box-sizing: border-box;
  font-size: 16px;
}
.small-preview-actions { display: flex; gap: 4px; }
.small-preview-actions :deep(.el-button) {
  min-width: 40px;
  min-height: 32px;
  padding: 4px 6px;
  margin: 0;
  height: auto;
  border: 1px solid var(--gold-a25, #d4c398);
  border-radius: 5px;
  background: var(--paper-light, #f8f2e6);
  color: var(--ink-main, #302820);
  font: inherit;
  cursor: pointer;
}
.small-preview-actions :deep(.el-button:disabled) { opacity: 0.4; cursor: default; }
.small-preview-actions :deep(.el-button:focus-visible) { outline: 2px solid #1f5f78; }
.small-preview-body { height: 260px; padding: 0 8px 8px; }
.small-preview-body :deep(.beibei-word-preview) { height: 100%; }
.small-preview-body :deep(.word-area.small-only) {
  height: 100%;
  min-height: 0;
  padding: 12px;
  overflow: auto;
}
.small-preview-body :deep(.word-small-only) { flex-shrink: 0; max-height: 100%; }
.small-preview-empty { margin: 0; padding: 32px 12px; color: var(--ink-soft, #72624d); font-size: 15px; }
.small-preview-window.collapsed { width: 200px; }
@media (max-width: 900px) {
  .small-preview-space { height: calc(var(--small-preview-height) + 56px); }
  .small-preview-space.collapsed { height: 48px; }
  .small-preview-window {
    top: max(var(--small-preview-top), env(safe-area-inset-top, 0px));
    bottom: auto;
    right: 12px;
    width: calc(100% - 24px);
  }
  .small-preview-body { height: var(--small-preview-height); }
}
.small-preview-space.no-space { height: 0; }
</style>
