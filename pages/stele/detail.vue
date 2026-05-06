<template>
  <div :class="['detail-page', `layout-${splitterLayout}`]">
    <header class="detail-top-bar">
      <el-button text @click="onBack" class="back-btn">← 返回列表</el-button>
      <el-radio-group v-model="splitterLayout" size="small" class="layout-toggle">
        <el-radio-button value="horizontal">左右</el-radio-button>
        <el-radio-button value="vertical">上下</el-radio-button>
      </el-radio-group>
      <h2 class="detail-page-title">{{ idRef ? '编辑碑文' : '新增碑文' }}<span v-if="justSaved" class="saved-badge">已保存</span></h2>
    </header>
    <el-splitter :layout="splitterLayout" class="detail-splitter">
      <el-splitter-panel :size="'50%'" min="25%">
        <div class="edit-section">
          <h3 class="section-title">编辑区</h3>
          <div v-if="draftNoticeVisible" class="draft-notice">
            <span class="draft-notice-text">检测到上次未保存的草稿</span>
            <div class="draft-notice-btns">
              <el-button size="small" type="primary" @click="applyDraft">载入草稿</el-button>
              <el-button size="small" @click="dismissDraftNotice">关闭</el-button>
            </div>
          </div>
          <el-form :model="form" label-width="90px" size="default">
            <!-- 1. 父母信息 -->
            <el-form-item label="类型">
              <el-radio-group v-model="form.selected">
                <el-radio value="0">双人</el-radio>
                <el-radio value="1">父</el-radio>
                <el-radio value="2">母</el-radio>
              </el-radio-group>
            </el-form-item>
            <template v-if="form.selected === '0' || form.selected === '1'">
              <el-form-item label="父亲姓名">
                <el-input v-model="form.father.name" placeholder="请输入父亲姓名" />
              </el-form-item>
              <el-form-item label="父亲出生">
                <el-input v-model="fatherBirth" placeholder="如 1991-1-1 或 腊月廿三" style="width: 100%" />
              </el-form-item>
              <el-form-item label="父亲去世">
                <el-input v-model="fatherDeath" placeholder="如 1991-1-1 或 腊月廿三" style="width: 100%" />
              </el-form-item>
            </template>
            <template v-if="form.selected === '0' || form.selected === '2'">
              <el-form-item label="母亲姓名">
                <el-input v-model="form.mother.name" placeholder="请输入母亲姓名" />
              </el-form-item>
              <el-form-item label="母亲出生">
                <el-input v-model="motherBirth" placeholder="如 1991-1-1 或 腊月廿三" style="width: 100%" />
              </el-form-item>
              <el-form-item label="母亲去世">
                <el-input v-model="motherDeath" placeholder="如 1991-1-1 或 腊月廿三" style="width: 100%" />
              </el-form-item>
            </template>
            <!-- 2. 立碑日期 -->
            <el-form-item label="立碑日期">
              <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
                <el-radio-group v-model="form.dateQingming">
                  <el-radio :value="true">清明节</el-radio>
                  <el-radio :value="false">自定义</el-radio>
                </el-radio-group>
                <el-input v-if="form.dateQingming" v-model="qingmingYear" placeholder="年份，默认今年" style="width: 120px;" />
                <template v-if="!form.dateQingming">
                  <el-input v-model="libeiDate" placeholder="如 1991-1-1 或 腊月廿三" style="width: 180px;" />
                  <el-checkbox v-model="form.dateShowLunar">农历</el-checkbox>
                </template>
              </div>
            </el-form-item>
            <!-- 3. 横批 -->
            <el-form-item label="横批">
              <el-input v-model="form.bigTitle" placeholder="碑顶大字，如 永垂千古" />
            </el-form-item>
            <!-- 4. 名单 -->
            <el-form-item label="名单">
              <div class="names-list">
              <div v-for="(row, rowIdx) in form.names" :key="rowIdx" class="names-group">
                <div class="group-header">
                  <span>第{{ rowIdx + 1 }}排</span>
                  <div style="display: flex; align-items: center; gap: 8px; margin-left: 8px;">
                    <el-button size="small" type="danger" tabindex="-1" @click="removeGroup(rowIdx)" v-if="form.names.length > 1">移除</el-button>
                    <el-button size="small" type="primary" tabindex="-1" @click="() => addGroup(rowIdx)">新增</el-button>
                  </div>
                </div>
                <draggable
                  :list="form.names[rowIdx]"
                  group="names"
                  :item-key="(_, idx) => rowIdx + '-' + idx"
                  handle=".drag-handle"
                  :animation="200"
                >
                  <template #item="{ element: item, index: colIdx }">
                    <div class="names-row">
                      <span class="drag-handle" title="拖动排序">☰</span>
                      <div class="names-row-fields">
                          <el-select
                            v-model="form.names[rowIdx][colIdx][0]"
                            filterable
                            allow-create
                            default-first-option
                            placeholder="称呼"
                            tabindex="-1"
                            class="names-select"
                          >
                            <el-option v-for="option in appellationOptions" :key="option" :label="option" :value="option" />
                          </el-select>
                          <el-input v-model="form.names[rowIdx][colIdx][1]" placeholder="姓名" class="names-input"
                            @focus="scrollIntoViewOnFocus" />
                        </div>
                        <div class="names-row-btns">
                          <el-button size="small" type="danger" tabindex="-1" @click="removeCol(rowIdx, colIdx)">-</el-button>
                          <el-button size="small" type="primary" tabindex="-1" @click="() => addCol(rowIdx, colIdx)">+</el-button>
                        </div>
                    </div>
                  </template>
                </draggable>
              </div>
              </div>
            </el-form-item>
            <!-- 5. 备注 -->
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填：地址、碑型、价格等" />
            </el-form-item>
          </el-form>
        </div>
      </el-splitter-panel>
      <el-splitter-panel min="25%">
        <div class="preview-section">
          <div class="preview-toolbar">
            <h3 class="section-title">预览区</h3>
            <div class="preview-toolbar-btns">
              <el-button @click="onPreview">刷新预览</el-button>
              <el-button @click="goTo3D">3D预览</el-button>
              <el-button @click="onCopyImage" :loading="exporting">复制图片</el-button>
              <el-button type="primary" @click="onSave" :loading="saving">提交</el-button>
            </div>
          </div>

          <div class="preview-secondary-bar">
            <span class="preview-copy-label">配色:</span>
            <el-radio-group v-model="previewTheme">
              <el-radio-button value="dark">黑金</el-radio-button>
              <el-radio-button value="light">黑白</el-radio-button>
            </el-radio-group>
            <div class="preview-copy-btns">
              <span class="preview-copy-label">复制:</span>
              <el-button @click="copyField('title')">横批</el-button>
              <el-button @click="copyField('big')">大字</el-button>
              <el-button @click="copyField('small')">小字</el-button>
              <el-button @click="copyField('date')">立碑日期</el-button>
              <el-button @click="copyField('birth')">生卒</el-button>
            </div>
          </div>
          <div class="preview-resizable" :style="{
            width: previewWidth + 'px',
            height: previewHeight + 'px',
            '--beibei-title-size': (36 * previewScale) + 'px',
            '--beibei-big-size': (36 * previewScale) + 'px',
            '--beibei-small-size': (12 * previewScale) + 'px',
          }">
            <WordPreview v-if="previewData" ref="previewRef" :data="previewData" :theme="previewTheme" />
            <div class="resize-handle" @mousedown="onResizeStart">⟋</div>
          </div>

        </div>
      </el-splitter-panel>
    </el-splitter>

    <!-- 手机号输入弹窗 -->
    <el-dialog
      v-model="phoneDialogVisible"
      title="请输入客户信息"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-form :model="phoneForm" label-width="80px">
        <el-form-item label="客户标识" required>
          <el-input v-model="phoneForm.phone" placeholder="手机号、姓名或其他标识" maxlength="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="phoneDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePhoneConfirm">确认</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import draggable from 'vuedraggable';
import { appellationOptions, parseFlexibleDate, arrToDisplay, toStorageDate } from '../../utils/stele/stele-utils';
import { getUrlParam, useOrderForm } from '../../composables/stele/useOrderForm';
import WordPreview from '../../components/stele/WordPreview.vue';
import type { PreviewData, SavePayload } from '../../types/order';

const {
  form, currentYear,
  fatherBirth, fatherDeath, motherBirth, motherDeath,
  libeiDate, qingmingYear, lastCustomLibei,
  addCol, removeCol, addGroup, removeGroup,
  syncDatesToForm, validateWarnings, buildPreview, fetchAndFill, buildSavePayload, doSave,
  saveDraft, loadDraft, clearDraft,
} = useOrderForm();

const saving = ref(false);
const idRef = ref('');
const justSaved = ref(false);
const previewTheme = ref<'dark' | 'light'>('dark');
const splitterLayout = ref<'horizontal' | 'vertical'>(
  typeof window !== 'undefined' && window.innerWidth >= window.innerHeight ? 'horizontal' : 'vertical'
);
const previewRef = ref<InstanceType<typeof WordPreview> | null>(null);
const exporting = ref(false);

// 预览区拖拽调整大小
const BASE_W = 400;
const BASE_H = 800;
const previewWidth = ref(BASE_W);
const previewHeight = ref(BASE_H);
const previewScale = computed(() => {
  const sw = previewWidth.value / BASE_W;
  const sh = previewHeight.value / BASE_H;
  return Math.min(sw, sh);
});

let resizeMouseMove: ((e: MouseEvent) => void) | null = null;
let resizeMouseUp: (() => void) | null = null;

function cleanupResize() {
  if (resizeMouseMove) document.removeEventListener('mousemove', resizeMouseMove);
  if (resizeMouseUp) document.removeEventListener('mouseup', resizeMouseUp);
  resizeMouseMove = null;
  resizeMouseUp = null;
}

function onResizeStart(e: MouseEvent) {
  e.preventDefault();
  cleanupResize();
  const startX = e.clientX;
  const startY = e.clientY;
  const startW = previewWidth.value;
  const startH = previewHeight.value;

  resizeMouseMove = (ev: MouseEvent) => {
    previewWidth.value = Math.max(200, startW + ev.clientX - startX);
    previewHeight.value = Math.max(300, startH + ev.clientY - startY);
  };
  resizeMouseUp = () => {
    cleanupResize();
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
  document.body.style.cursor = 'nwse-resize';
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', resizeMouseMove);
  document.addEventListener('mouseup', resizeMouseUp);
}

onBeforeUnmount(cleanupResize);

async function onCopyImage() {
  if (!previewRef.value) { ElMessage.warning('没有预览内容'); return; }
  exporting.value = true;
  const ok = await previewRef.value.copyImage();
  if (ok) ElMessage.success('已复制到剪切板');
  else ElMessage.error('复制失败，请重试');
  exporting.value = false;
}

// 预览数据
const previewData = ref<PreviewData>({ title: '', big: '', small: '', date: '', birth: '' });

function scrollIntoViewOnFocus(e: FocusEvent) {
  const target = e.target as HTMLElement;
  if (target) {
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
}

function refreshPreview() {
  syncDatesToForm();
  previewData.value = buildPreview();
}

// 草稿提示（非阻断，展示在编辑区顶部）
const draftNoticeVisible = ref(false);

async function applyDraft() {
  const ok = loadDraft();
  if (ok) {
    await nextTick();
    refreshPreview();
    ElMessage.success('已恢复草稿');
  } else {
    clearDraft();
    ElMessage.warning('草稿已损坏，已清除');
  }
  draftNoticeVisible.value = false;
}

function dismissDraftNotice() {
  draftNoticeVisible.value = false;
}

// 数据回显
onMounted(async () => {
  const copyFrom = getUrlParam('copyFrom');
  if (copyFrom) {
    const saved = await fetchAndFill(copyFrom);
    if (typeof saved === 'object') previewData.value = saved;
    else refreshPreview();
    form.user = '';
    ElMessage.success('已复制，请修改后保存为新记录');
  } else {
    idRef.value = getUrlParam('id');
    if (idRef.value) {
      const saved = await fetchAndFill(idRef.value);
      if (typeof saved === 'object') previewData.value = saved;
      else refreshPreview();
    } else {
      // 新建模式：不弹 modal 阻断，只在编辑区顶部显示提示
      if (localStorage.getItem('stele-draft')) {
        draftNoticeVisible.value = true;
      }
    }
  }
});

// 手机号弹窗
const phoneDialogVisible = ref(false);
const phoneForm = reactive({ phone: '' });
let pendingPayload: SavePayload | null = null;

const onPreview = () => {
  refreshPreview();
  saveDraft();
};

const copyField = (field: keyof PreviewData) => {
  const text = previewData.value[field] || '';
  if (!text) { ElMessage.info('该区域暂无内容'); return; }
  uni.setClipboardData({
    data: text,
    success: () => ElMessage.success('已复制'),
    fail: () => ElMessage.error('复制失败')
  });
};

const onSave = async () => {
  if (saving.value) return;
  try {
    refreshPreview();
    const warnings = validateWarnings();
    if (warnings.length) {
      ElMessage.warning(warnings.join('；'));
    }
    const payload = buildSavePayload(idRef.value || undefined);
    if (!form.user) {
      const d = new Date();
      phoneForm.phone = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      phoneDialogVisible.value = true;
      pendingPayload = payload;
      return;
    }
    saving.value = true;
    const newId = await doSave(payload);
    clearDraft();
    ElMessage.success('保存成功');
    if (newId) idRef.value = newId;
    justSaved.value = true;
    setTimeout(() => { justSaved.value = false; }, 3000);
  } catch (e) {
    saveDraft();
    ElMessage.error('保存失败，已自动保存草稿');
  } finally {
    saving.value = false;
  }
};

const handlePhoneConfirm = async () => {
  if (saving.value) return;
  if (!phoneForm.phone) { ElMessage.warning('请输入客户标识'); return; }
  try {
    phoneDialogVisible.value = false;
    if (pendingPayload) {
      pendingPayload.user = phoneForm.phone;
      saving.value = true;
      const newId = await doSave(pendingPayload);
      clearDraft();
      ElMessage.success('保存成功');
      if (newId) idRef.value = newId;
      justSaved.value = true;
      setTimeout(() => { justSaved.value = false; }, 3000);
      form.user = phoneForm.phone;
      pendingPayload = null;
    }
    phoneForm.phone = '';
  } catch (e) {
    saveDraft();
    ElMessage.error('保存失败，已自动保存草稿');
  } finally {
    saving.value = false;
  }
};

const onBack = () => {
  saveDraft();
  uni.redirectTo({ url: '/pages/stele/list' });
};

const goTo3D = () => {
  syncDatesToForm();
  localStorage.setItem('stele-3d-preview', JSON.stringify(buildPreview()));
  uni.navigateTo({ url: '/pages/stele/preview' });
};

// 清明节/自定义切换
watch(() => form.dateQingming, (val) => {
  if (val) {
    if (form.libei[1] || form.libei[2]) {
      lastCustomLibei.value = [form.libei[0] || '', form.libei[1] || '', form.libei[2] || ''];
    }
    qingmingYear.value = form.libei[0] || String(currentYear);
    form.dateShowLunar = false;
  } else {
    if (lastCustomLibei.value[0] || lastCustomLibei.value[1] || lastCustomLibei.value[2]) {
      form.libei[0] = lastCustomLibei.value[0] || form.libei[0] || String(currentYear);
      form.libei[1] = lastCustomLibei.value[1];
      form.libei[2] = lastCustomLibei.value[2];
      libeiDate.value = arrToDisplay(form.libei);
    } else {
      libeiDate.value = arrToDisplay(form.libei);
    }
    form.dateShowLunar = true;
  }
});
</script>

<style scoped>
/* 碑文预览：本页变量（PC 大屏），横批与大字同字号 */
.beibei-word-preview {
  --beibei-title-size: 36px;
  --beibei-big-size: 36px;
  --beibei-small-size: 12px;
}
.detail-page {
  position: relative;
  padding: 12px 20px 16px;
  background:
    radial-gradient(ellipse at top left, #F3ECE0 0%, transparent 55%),
    radial-gradient(ellipse at bottom right, #EFE8DC 0%, transparent 60%),
    #F6F1E8;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}
.detail-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.588  0 0 0 0 0.439  0 0 0 0 0.039  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  z-index: 0;
}
.detail-top-bar,
.detail-splitter {
  position: relative;
  z-index: 1;
}
.detail-top-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
  padding: 0;
  min-height: 32px;
}
.detail-top-bar .back-btn {
  color: var(--color-primary);
  font-size: 13px;
  padding: 2px 0;
  font-family: var(--font-display);
  letter-spacing: 2px;
  height: 28px;
  line-height: 28px;
}
.detail-top-bar .back-btn:hover { color: var(--color-primary-hover); }
.detail-page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--color-primary);
  font-family: var(--font-display);
  letter-spacing: 4px;
  line-height: 1;
}
.saved-badge {
  margin-left: 10px; font-size: 11px; font-weight: 500; color: #A13732;
  background: transparent;
  border: 1px solid #A13732;
  padding: 2px 8px;
  border-radius: 2px;
  font-family: var(--font-display);
  letter-spacing: 3px;
  vertical-align: middle;
}
.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--color-primary);
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(150, 112, 10, 0.3);
  font-family: var(--font-display);
  letter-spacing: 4px;
  position: relative;
}
.section-title::before {
  content: "";
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 72px;
  height: 10px;
  background-image: var(--brush-line-url);
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
.preview-toolbar {
  display: flex; flex-wrap: wrap; align-items: center;
  justify-content: space-between; gap: 12px; margin-bottom: 16px;
}
.preview-toolbar-btns { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.edit-section, .preview-section {
  background: #FFFDF8;
  padding: 24px;
  min-height: 400px;
  border-radius: 8px;
  box-shadow:
    0 1px 0 rgba(150, 112, 10, 0.12) inset,
    0 6px 20px rgba(44, 36, 32, 0.06),
    0 2px 6px rgba(150, 112, 10, 0.04);
  border: none;
}
.names-row {
  background: var(--color-bg-blue); border: 1px solid var(--color-border);
  border-radius: 8px; margin-bottom: 10px; padding: 10px 8px;
  display: flex; align-items: center; gap: 8px;
}
.names-row-fields { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.names-row-fields .names-select { flex: 0 0 40%; min-width: 0; }
.names-row-fields .names-input { flex: 1; min-width: 0; }
.names-row-btns { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
.drag-handle {
  cursor: grab; color: var(--color-primary-light); font-size: 16px;
  user-select: none; flex-shrink: 0; padding: 0 4px;
}
.drag-handle:active { cursor: grabbing; }
.names-list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}
.names-group {
  background: linear-gradient(180deg, #FAF5EC 0%, #FFFDF8 100%);
  border: 1px solid rgba(150, 112, 10, 0.3);
  border-radius: 6px;
  padding: 14px 12px 10px 12px;
  position: relative;
}
.names-group::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 12px;
  bottom: 12px;
  width: 3px;
  background: #96700A;
  border-radius: 2px;
}
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 500;
  color: var(--color-primary);
  font-family: var(--font-display);
  letter-spacing: 3px;
  font-size: 15px;
}
.draft-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px 12px 48px;
  margin-bottom: 12px;
  background: var(--paper-light);
  border: 1px solid var(--gold-a25);
  border-left: 3px solid var(--ink-vermilion);
  border-radius: 4px;
  font-size: 14px;
  color: var(--ink-soft);
  font-family: var(--font-display);
  letter-spacing: 2px;
  position: relative;
}
.draft-notice::before {
  content: "稿";
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border: 1.5px solid var(--ink-vermilion);
  color: var(--ink-vermilion);
  font-family: var(--font-display);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  background: var(--paper-white);
}
.draft-notice-text { flex: 1; }
.draft-notice-btns { display: flex; gap: 8px; flex-shrink: 0; }

.detail-splitter { flex: 1; overflow: hidden; height: calc(100vh - 70px); }
/* 上下结构：去掉高度限制和独立滚动，整页自然滚动 */
.detail-page.layout-vertical {
  height: auto;
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}
.detail-page.layout-vertical .detail-splitter {
  flex: none;
  height: auto !important;
  overflow: visible !important;
}
.detail-page.layout-vertical .detail-splitter :deep(.el-splitter-panel) {
  flex: 0 0 auto !important;
  width: 100% !important;
  height: auto !important;
}
.detail-page.layout-vertical .detail-splitter :deep(.el-splitter-panel > div) {
  height: auto !important;
  overflow: visible !important;
  padding: 0 12px;
}
.detail-page.layout-vertical .detail-splitter :deep(.el-splitter-bar) {
  display: none !important;
}
/* 两个 panel 内部可滚动 + 左右间距 */
.detail-splitter :deep(.el-splitter-panel > div) {
  height: 100%;
  overflow-y: auto;
  padding: 0 12px;
}
/* 让 splitter 拖拽条可见（默认是透明的） */
.detail-splitter :deep(.el-splitter-bar__dragger) {
  background: var(--gold-a25);
  transition: background 0.2s;
}
.detail-splitter :deep(.el-splitter-bar__dragger:hover) {
  background: var(--ink-gold);
  box-shadow: 0 0 8px var(--gold-a35);
}
.edit-section { height: 100%; }
.preview-section {
  padding: 24px;
  background: linear-gradient(180deg, #FFFDF8 0%, #FAF5EC 100%);
  border-radius: 8px;
  box-shadow:
    0 1px 0 rgba(150, 112, 10, 0.12) inset,
    0 6px 20px rgba(44, 36, 32, 0.06);
  border: none;
}
.preview-secondary-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  margin-bottom: 12px; padding: 12px 14px;
  background: var(--paper-white);
  border: 1px solid var(--gold-a25);
  border-radius: 4px;
  box-shadow: var(--shadow-paper);
}
.preview-copy-label {
  font-size: 13px;
  color: var(--ink-gold);
  font-weight: 500;
  font-family: var(--font-display);
  letter-spacing: 3px;
  padding-right: 6px;
  border-right: 1px solid var(--gold-a25);
}
.preview-copy-btns { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.preview-resizable { position: relative; overflow: hidden; border-radius: 10px; max-width: 100%; }
.preview-resizable :deep(.beibei-word-preview) { --beibei-preview-height: 100%; height: 100%; }
.preview-resizable :deep(.word-area) { min-height: 100% !important; height: 100%; overflow: hidden !important; }
.preview-resizable :deep(.word-col-small) { overflow: hidden !important; }
.resize-handle {
  position: absolute; right: 0; bottom: 0; width: 28px; height: 28px;
  cursor: nwse-resize; z-index: 5; display: flex; align-items: center;
  justify-content: center; font-size: 16px; color: rgba(212, 165, 40, 0.6);
  user-select: none; line-height: 1;
}
:deep(.el-button) {
  font-family: var(--font-display);
  letter-spacing: 2px;
  border-radius: 6px;
}
:deep(.el-button--primary) {
  background: linear-gradient(180deg, #B8860B 0%, #96700A 100%);
  border-color: #96700A; color: #fff;
  box-shadow: 0 2px 6px rgba(150, 112, 10, 0.25);
}
:deep(.el-button--primary:hover) {
  background: linear-gradient(180deg, #C9960E 0%, #A47B0C 100%);
  border-color: #96700A;
  transform: translateY(-1px);
}
:deep(.el-button--danger) {
  background: linear-gradient(180deg, var(--color-danger-hover) 0%, var(--color-danger) 100%);
  border-color: var(--color-danger); color: #fff;
}
:deep(.el-form-item__label) { color: var(--color-primary); font-weight: 500; }
:deep(.el-input__wrapper) { border: 1px solid var(--color-border); }
:deep(.el-input__inner:focus),
:deep(.el-input__wrapper:focus-within) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(184, 134, 11, 0.15);
}
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: var(--color-primary); border-color: var(--color-primary);
}
:deep(.el-dialog__header) {
  background: linear-gradient(180deg, var(--color-bg-blue) 0%, var(--color-bg-blue-light) 100%);
  border-bottom: 2px solid var(--color-border); padding: 16px 20px;
}
:deep(.el-dialog__title) { color: var(--color-primary); font-weight: 600; }
:deep(.el-dialog__body) { padding: 20px; }
:deep(.el-dialog__footer) { border-top: 1px solid var(--color-border-light); padding: 16px 20px; }
</style>
