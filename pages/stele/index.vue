<template>
  <div class="order-page">
    <header class="top-bar">
      <el-button v-if="fromList" text @click="onBackToList" class="top-bar-back">← 返回列表</el-button>
      <span class="top-bar-title">碑文下单</span>
    </header>
    <div class="steps-header">
      <div class="steps-bar">
        <div
          v-for="(label, i) in stepLabels"
          :key="i"
          class="step-item"
          :class="{ active: currentStep === i + 1, done: currentStep > i + 1 }"
          @click="goStep(i + 1)"
        >
          <span class="step-icon">{{ currentStep > i + 1 ? '✓' : ['壹', '貳', '叄'][i] }}</span>
          <span class="step-title">{{ label }}</span>
        </div>
      </div>
    </div>

    <div :class="['step-content', { 'editing-names': currentStep === 2 }]">
      <!-- 草稿提示（非阻断横幅）-->
      <div v-if="draftNoticeVisible" class="draft-notice">
        <span class="draft-notice-text">检测到上次未保存的草稿</span>
        <div class="draft-notice-btns">
          <el-button size="small" type="primary" @click="applyDraftNotice">载入草稿</el-button>
          <el-button size="small" @click="dismissDraftNotice">关闭</el-button>
        </div>
      </div>
      <SteleTemplateManager :form="form" @apply="onApplyTemplate" />

      <!-- 步骤1：父母信息 + 横批与立碑日期（合并） -->
      <div v-show="currentStep === 1" class="step-panel">
        <el-form label-position="top" size="large">
          <el-form-item label="类型">
            <el-radio-group v-model="form.selected" class="full-width">
              <el-radio value="0">双人</el-radio>
              <el-radio value="1">仅父</el-radio>
              <el-radio value="2">仅母</el-radio>
            </el-radio-group>
          </el-form-item>
          <template v-if="form.selected === '0' || form.selected === '1'">
            <el-form-item label="父亲姓名">
              <el-input v-model="form.father.name" placeholder="请输入父亲姓名" />
            </el-form-item>
            <el-form-item label="父亲出生">
              <el-input v-model="fatherBirth" placeholder="如 1991-1-1 或 腊月廿三" />
            </el-form-item>
            <el-form-item label="父亲去世">
              <el-input v-model="fatherDeath" placeholder="如 1991-1-1 或 腊月廿三" />
            </el-form-item>
          </template>
          <template v-if="form.selected === '0' || form.selected === '2'">
            <el-form-item label="母亲姓名">
              <el-input v-model="form.mother.name" placeholder="请输入母亲姓名" />
            </el-form-item>
            <el-form-item label="母亲出生">
              <el-input v-model="motherBirth" placeholder="如 1991-1-1 或 腊月廿三" />
            </el-form-item>
            <el-form-item label="母亲去世">
              <el-input v-model="motherDeath" placeholder="如 1991-1-1 或 腊月廿三" />
            </el-form-item>
          </template>
          <el-form-item label="立碑日期">
            <el-radio-group :model-value="form.dateQingming" class="full-width" @change="value => setNormalErectDateMode(Boolean(value))">
              <el-radio :value="true">清明节</el-radio>
              <el-radio :value="false">自定义</el-radio>
            </el-radio-group>
            <el-input v-if="form.dateQingming" v-model="qingmingYear" placeholder="年份" class="mt-8" />
            <template v-else>
              <el-input v-model="libeiDate" placeholder="如 1991-1-1 或 腊月廿三" class="mt-8" />
              <el-checkbox v-model="form.dateShowLunar" class="mt-8">农历</el-checkbox>
            </template>
          </el-form-item>
          <el-form-item label="横批">
            <el-input v-model="form.bigTitle" placeholder="碑顶大字，如 永垂千古" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填：地址、碑型、价格等" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：名单 -->
      <div v-show="currentStep === 2" class="step-panel names-editing-panel">
        <SmallTextPreview v-if="currentStep === 2" :small="previewData.small" :reserve-space="false" />
        <div class="names-organize-toolbar">
          <div class="names-organize-actions">
            <el-button type="primary" @click="onOrganizeNames">自动规整</el-button>
            <el-button :disabled="!canUndoNamesOrganize" @click="onUndoNamesOrganize">撤销整理</el-button>
          </div>
          <p>可在同一排随意录入，按辈分分排、夫妻按同类录入顺序匹配，空白姓名也占位；再拖动调整。自定义称谓保留在末排。</p>
        </div>
        <el-form label-position="top" size="large">
          <div v-for="(row, rowIdx) in form.names" :key="rowIdx" class="names-group">
            <div class="group-header">
              <span>第{{ rowIdx + 1 }}排</span>
              <div class="group-header-btns">
                <el-button size="small" type="danger" tabindex="-1" @click="removeGroup(rowIdx)" v-if="form.names.length > 1">移除</el-button>
                <el-button size="small" type="primary" tabindex="-1" @click="addGroup(rowIdx)">新增</el-button>
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
                  <span class="drag-handle" title="长按拖动">☰</span>
                  <div class="names-row-fields">
                    <el-select
                      v-model="form.names[rowIdx][colIdx][0]"
                      placeholder="称呼"
                      tabindex="-1"
                      filterable
                      allow-create
                      default-first-option
                      class="names-select"
                    >
                      <el-option v-for="opt in appellationOptions" :key="opt" :label="opt" :value="opt" />
                    </el-select>
                    <el-input v-model="form.names[rowIdx][colIdx][1]" placeholder="姓名" class="names-input"
                      @focus="scrollIntoViewOnFocus" />
                  </div>
                  <div class="names-row-btns">
                    <el-button size="small" type="danger" tabindex="-1" @click="removeCol(rowIdx, colIdx)">-</el-button>
                    <el-button size="small" type="primary" tabindex="-1" @click="addCol(rowIdx, colIdx)">+</el-button>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </el-form>
      </div>

      <!-- 步骤3：预览（2D 碑文） -->
      <div v-show="currentStep === 3" class="step-panel step-panel-preview">
        <div class="preview-toolbar-bar">
          <div class="preview-bar-row">
            <span class="preview-bar-label">配色:</span>
            <el-radio-group v-model="previewTheme">
              <el-radio-button value="dark">黑金</el-radio-button>
              <el-radio-button value="light">黑白</el-radio-button>
            </el-radio-group>
          </div>
          <div class="preview-bar-row">
            <span class="preview-bar-label">复制:</span>
            <div class="preview-bar-btns">
              <button type="button" class="toolbar-btn" @click="copyPreviewField('title')">横批</button>
              <button type="button" class="toolbar-btn" @click="copyPreviewField('big')">大字</button>
              <button type="button" class="toolbar-btn" @click="copyPreviewField('small')">小字</button>
              <button type="button" class="toolbar-btn" @click="copyPreviewField('date')">立碑日期</button>
              <button type="button" class="toolbar-btn" @click="copyPreviewField('birth')">生卒</button>
            </div>
          </div>
          <div class="preview-bar-row">
            <span class="preview-bar-label">操作:</span>
            <div class="preview-bar-btns">
              <button type="button" class="toolbar-btn" @click="goTo3D">3D预览</button>
            </div>
          </div>
        </div>
        <WordPreview v-if="previewData.title || previewData.big" ref="previewRef" :data="previewData" :theme="previewTheme"
          />
        <div v-else class="preview-empty">请先填写前几步内容</div>
      </div>
      <div class="footer-actions">
        <el-button v-if="currentStep > 1" @click="currentStep--">上一步</el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="onNext">下一步</el-button>
        <el-button v-if="currentStep === 3" type="primary" @click="requestSave()" :loading="submitting">提交</el-button>
      </div>
    </div>

    <el-dialog v-model="showPhoneDialog" title="请输入客户信息" width="90%" :close-on-click-modal="false">
      <el-input v-model="phoneInput" placeholder="手机号、姓名或其他标识" maxlength="20" />
      <template #footer>
        <el-button @click="showPhoneDialog = false; phoneInput = ''">取消</el-button>
        <el-button type="primary" @click="confirmPhoneAndSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { ElMessageBox } from 'element-plus';
import draggable from 'vuedraggable';
import { appellationOptions } from '../../utils/stele/stele-utils';
import { getUrlParam, useOrderForm } from '../../composables/stele/useOrderForm';
import WordPreview from '../../components/stele/WordPreview.vue';
import SteleTemplateManager from '../../components/stele/SteleTemplateManager.vue';
import SmallTextPreview from '../../components/stele/SmallTextPreview.vue';
import type { PageLoadState, SaveFeedback, PreviewData, SteleTemplateData } from '../../types/order';
import { toast } from '../../utils/common/toast.js';
import { STELE_STORAGE_KEYS } from '../../utils/stele/storage-registry';
import { checkSteleQuality } from '../../utils/stele/quality-check';
import { getSaveFailureMessage, runQualitySaveGuard } from '../../utils/stele/quality-save-guard';
import { recordDiagnosticError } from '../../utils/common/diagnostics';

const {
  form, currentYear,
  fatherBirth, fatherDeath, motherBirth, motherDeath,
  libeiDate, qingmingYear, lastCustomLibei,
  addCol, removeCol, addGroup, removeGroup,
  organizeNames, undoNamesOrganize, canUndoNamesOrganize,
  syncDatesToForm, buildPreview, fetchOrderSnapshot, commitOrderSnapshot, buildSavePayload, doSave,
  saveDraft, loadDraft, clearDraft,
  applyTemplateData, setNormalErectDateMode,
} = useOrderForm();

const stepLabels = ['基本信息', '名单', '预览'];
const editId = ref(getUrlParam('id'));
const fromList = ref(!!getUrlParam('id') || !!getUrlParam('copyFrom') || !!getUrlParam('from'));
const currentStep = ref(1);
const submitting = ref(false);
const showPhoneDialog = ref(false);
const phoneInput = ref('');
const previewTheme = ref<'dark' | 'light'>('dark');
const previewRef = ref<InstanceType<typeof WordPreview> | null>(null);
const loadState = ref<PageLoadState>('loading');
const saveFeedback = reactive<SaveFeedback>({ state: 'idle', message: '' });
let loadEpoch = 0;

onBeforeUnmount(() => { loadEpoch++; });


// 预览数据：响应式计算
const previewData = computed<PreviewData>(() => buildPreview());

function onOrganizeNames() {
  if (!organizeNames()) { toast.info('当前名单已按顺序规整'); return; }
  saveDraft();
  toast.success('已规整，可拖动调整配对和顺序');
}

function onUndoNamesOrganize() {
  if (!undoNamesOrganize()) return;
  saveDraft();
  toast.info('已恢复整理前的顺序');
}

function copyPreviewField(field: keyof PreviewData) {
  const text = previewData.value[field] || '';
  if (!text) { toast.info('该区域暂无内容'); return; }
  uni.setClipboardData({
    data: text,
    success: () => toast.success('已复制'),
    fail: () => toast.error('复制失败')
  });
}

function scrollIntoViewOnFocus(e: FocusEvent) {
  const target = e.target as HTMLElement;
  if (target) {
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
}

function onBackToList() {
  uni.redirectTo({ url: '/pages/stele/list' });
}


function onNext() {
  if (currentStep.value === 2) syncDatesToForm();
  currentStep.value++;
}
function goStep(step: number) { currentStep.value = step; }


function goTo3D() {
  syncDatesToForm();
  localStorage.setItem(STELE_STORAGE_KEYS.preview3d, JSON.stringify(buildPreview()));
  uni.navigateTo({ url: '/pages/stele/preview' });
}

watch(currentStep, (step) => {
  if (step === 3) syncDatesToForm();
  saveDraft();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 草稿提示（非阻断）
const draftNoticeVisible = ref(false);

function applyDraftNotice() {
  if (loadDraft()) {
    toast.info('已恢复草稿', 2000);
  } else {
    clearDraft();
    toast.error('草稿已损坏，已清除', 2000);
  }
  draftNoticeVisible.value = false;
}

function dismissDraftNotice() {
  draftNoticeVisible.value = false;
}

// 数据回显
onMounted(async () => {
  const epoch = ++loadEpoch;
  const copyFrom = getUrlParam('copyFrom');
  if (copyFrom) {
    const snapshot = await fetchOrderSnapshot(copyFrom);
    if (epoch !== loadEpoch) return;
    if (!snapshot) { loadState.value = 'error'; return; }
    commitOrderSnapshot(snapshot);
    form.user = '';
    loadState.value = 'ready';
    currentStep.value = 1;
    toast.info('已复制，请修改后保存', 2000);
  } else if (editId.value) {
    const snapshot = await fetchOrderSnapshot(editId.value);
    if (epoch !== loadEpoch) return;
    if (!snapshot) { loadState.value = 'error'; return; }
    commitOrderSnapshot(snapshot);
    loadState.value = 'ready';
    currentStep.value = 3;
  } else {
    loadState.value = 'ready';
    // 新建模式：显示顶部横幅，不阻断用户
    if (localStorage.getItem(STELE_STORAGE_KEYS.draft)) {
      draftNoticeVisible.value = true;
    }
  }
});

function confirmWarnings(warnings: ReturnType<typeof checkSteleQuality>['warnings']): Promise<boolean> {
  return ElMessageBox.confirm(warnings.map(item => `• ${item.message}`).join('\n'), '发现质检提醒', {
    confirmButtonText: '仍要保存', cancelButtonText: '返回修改', type: 'warning',
  }).then(() => true).catch(() => false);
}

function onApplyTemplate(data: SteleTemplateData) {
  applyTemplateData(data);
  saveDraft();
}

// 保存逻辑
async function requestSave() {
  if (loadState.value !== 'ready') {
    const message = '订单内容尚未加载完成，不能保存。';
    saveFeedback.state = 'error'; saveFeedback.message = message; toast.error(message); return;
  }
  if (submitting.value) return;
  await performSubmit();
}

async function performSubmit() {
  if (submitting.value) return;
  syncDatesToForm();
  submitting.value = true;
  saveFeedback.state = 'idle'; saveFeedback.message = '';
  try {
    const quality = checkSteleQuality(form);
    const outcome = await runQualitySaveGuard(quality, confirmWarnings, async () => {
      if (!form.user) {
        const d = new Date();
        phoneInput.value = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        showPhoneDialog.value = true;
        return undefined;
      }
      const payload = buildSavePayload(editId.value || undefined);
      const newId = await doSave(payload);
      clearDraft();
      if (newId) editId.value = newId;
      toast.success('提交成功');
      saveFeedback.state = 'success'; saveFeedback.message = '碑文已经保存成功。';
      return newId;
    });
    if (outcome.status === 'QUALITY_BLOCKED') {
      recordDiagnosticError('QUALITY_BLOCKED', 'quality');
      uni.showModal({ title: '请先修正必填项', content: quality.blockers.map(item => `• ${item.message}`).join('\n'), showCancel: false });
    }
  } catch (error) {
    saveDraft();
    const message = getSaveFailureMessage(error);
    saveFeedback.state = 'error'; saveFeedback.message = message;
    toast.error(message);
  } finally { submitting.value = false; }
}

async function confirmPhoneAndSubmit() {
  if (submitting.value) return;
  const phone = (phoneInput.value || '').trim();
  if (!phone) { toast.error('请输入客户标识'); return; }
  form.user = phone;
  showPhoneDialog.value = false;
  phoneInput.value = '';
  await requestSave();
}
</script>

<style scoped>
.order-page {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at top left, #F3ECE0 0%, transparent 55%),
    radial-gradient(ellipse at bottom right, #EFE8DC 0%, transparent 60%),
    #F6F1E8;
  padding: 16px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}
.order-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.588  0 0 0 0 0.439  0 0 0 0 0.039  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
.top-bar,
.steps-header,
.step-content {
  position: relative;
  z-index: 1;
}
.top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 0;
}
.top-bar-back {
  color: var(--color-primary) !important;
  font-size: 15px;
  padding: 4px 0;
  font-family: var(--font-display);
}
.top-bar-title {
  font-size: 19px;
  font-weight: 500;
  color: var(--color-primary);
  font-family: var(--font-display);
  letter-spacing: 4px;
}
.steps-header {
  background: #FFFDF8;
  padding: 20px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow:
    0 1px 0 rgba(150, 112, 10, 0.12) inset,
    0 6px 20px rgba(44, 36, 32, 0.05);
  border: none;
}
.steps-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4px;
  position: relative;
}
/* 步骤之间的连接线 */
.steps-bar::before {
  content: "";
  position: absolute;
  top: 22px;
  left: 16%;
  right: 16%;
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    rgba(150, 112, 10, 0.3) 0,
    rgba(150, 112, 10, 0.3) 3px,
    transparent 3px,
    transparent 7px
  );
  z-index: 0;
}
.step-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: transform 0.2s;
  position: relative;
  z-index: 1;
  background: transparent !important;
}
.step-item:hover { transform: translateY(-1px); }

/* 印章造型：方形边框 + 朱砂色 */
.step-icon {
  width: 44px;
  height: 44px;
  line-height: 40px;
  text-align: center;
  border: 2px solid rgba(150, 112, 10, 0.4);
  background: #FDF8EC;
  color: rgba(150, 112, 10, 0.55);
  border-radius: 4px;
  font-size: 20px;
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: 0;
  box-sizing: border-box;
  transition: all 0.3s ease;
}
.step-item.done .step-icon {
  background: #F3E7D0;
  border-color: #96700A;
  color: #96700A;
  font-size: 22px;
}
.step-item.active .step-icon {
  background: #A13732;
  border-color: #A13732;
  color: #FDF8EC;
  box-shadow:
    0 0 0 3px #FFFDF8,
    0 0 0 4px #A13732,
    0 4px 12px rgba(161, 55, 50, 0.3);
  transform: rotate(-3deg);
}
/* 步骤印章 hover 轻抖：像要重新盖一次 */
.step-item:hover .step-icon {
  animation: stepSealJitter 0.4s ease;
}
@keyframes stepSealJitter {
  0%   { transform: rotate(0) scale(1); }
  25%  { transform: rotate(3deg) scale(1.08); }
  50%  { transform: rotate(-4deg) scale(1.04); }
  75%  { transform: rotate(2deg) scale(1.02); }
  100% { transform: rotate(0) scale(1); }
}
.step-item.active:hover .step-icon {
  animation: stepSealJitterActive 0.4s ease;
}
@keyframes stepSealJitterActive {
  0%   { transform: rotate(-3deg) scale(1); }
  25%  { transform: rotate(2deg) scale(1.08); }
  50%  { transform: rotate(-8deg) scale(1.04); }
  75%  { transform: rotate(-1deg) scale(1.02); }
  100% { transform: rotate(-3deg) scale(1); }
}
.step-title {
  font-size: 14px;
  color: rgba(150, 112, 10, 0.7);
  font-family: var(--font-display);
  letter-spacing: 3px;
}
.step-item.active .step-title {
  color: #A13732;
  font-weight: 500;
}
.step-item.done .step-title {
  color: var(--color-primary);
  font-weight: 500;
}
.step-content {
  background: #FFFDF8;
  border-radius: 8px;
  padding: 24px;
  min-height: 520px;
  box-shadow:
    0 1px 0 rgba(150, 112, 10, 0.12) inset,
    0 6px 20px rgba(44, 36, 32, 0.05);
  border: none;
}
.step-panel {
  width: 100%;
}
.names-editing-panel {
  box-sizing: border-box;
  padding-right: 392px;
}
.names-organize-toolbar { margin-bottom: 16px; }
.names-organize-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.names-organize-actions :deep(.el-button) { margin-left: 0; }
.names-organize-toolbar p { margin: 8px 0 0; color: var(--ink-soft); font-size: 13px; line-height: 1.6; }
@media (max-width: 900px) {
  .names-editing-panel { padding-right: 0; }
}
@media (max-width: 520px) {
  .step-content.editing-names { padding: 12px; }
  .names-editing-panel .names-group { padding: 10px 8px; }
  .names-editing-panel .names-row { gap: 4px; padding: 8px 4px; }
  .names-editing-panel .drag-handle { min-width: 24px; }
  .names-editing-panel .names-row-fields { gap: 4px; }
  .names-editing-panel .names-row-fields .names-select { flex-basis: 38%; min-width: 64px; }
  .names-editing-panel .names-select :deep(.el-select__wrapper) { padding: 8px 4px; gap: 4px; }
  .names-editing-panel .names-input :deep(.el-input__wrapper) { padding: 1px 8px; }
  .names-editing-panel .names-row-btns { gap: 4px; }
  .names-editing-panel .names-row-btns :deep(.el-button) { margin-left: 0; padding: 8px; }
}
.draft-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px 12px 48px;
  margin-bottom: 16px;
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
.full-width {
  width: 100%;
}
.mt-8 {
  margin-top: 8px;
}
/* 名单区：宣纸格式 */
.names-group {
  background: linear-gradient(180deg, var(--paper-light) 0%, var(--paper-white) 100%);
  border: 1px solid var(--gold-a25);
  border-radius: 4px;
  margin-bottom: 16px;
  padding: 14px 14px 10px;
  position: relative;
}
.names-group::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 14px;
  bottom: 14px;
  width: 3px;
  background: var(--ink-gold);
  border-radius: 2px;
}
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 500;
  color: var(--ink-gold);
  font-family: var(--font-display);
  letter-spacing: 4px;
  font-size: 15px;
}
.group-header-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}
.names-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 10px 8px;
  background: var(--paper-white);
  border: 1px solid var(--gold-a15);
  border-radius: 4px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.names-row:hover {
  border-color: var(--gold-a35);
  box-shadow: 0 2px 6px var(--gold-a10);
}
.drag-handle {
  cursor: grab;
  color: var(--ink-gold);
  font-size: 18px;
  user-select: none;
  flex-shrink: 0;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  opacity: 0.5;
  transition: opacity 0.2s;
}
.names-row:hover .drag-handle { opacity: 1; }
.drag-handle:active {
  cursor: grabbing;
}
.names-row:last-child {
  margin-bottom: 0;
}
.names-row-fields {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.names-row-fields .names-select {
  flex: 0 0 40%;
  min-width: 0;
}
.names-row-fields .names-input {
  flex: 1;
  min-width: 0;
}
.names-row-btns {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 14px 20px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  display: flex;
  justify-content: center;
  gap: 14px;
  background:
    linear-gradient(180deg, rgba(253, 248, 236, 0.95) 0%, rgba(253, 248, 236, 1) 100%);
  backdrop-filter: blur(6px);
  border-top: 1px solid rgba(150, 112, 10, 0.25);
  box-shadow: 0 -4px 16px rgba(44, 36, 32, 0.06);
  z-index: 10;
}
.footer-actions::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 40px;
  right: 40px;
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    rgba(150, 112, 10, 0.35) 0,
    rgba(150, 112, 10, 0.35) 3px,
    transparent 3px,
    transparent 7px
  );
}
.footer-actions :deep(.el-button) {
  font-family: var(--font-display);
  letter-spacing: 4px;
  border-radius: 4px;
  padding: 10px 28px;
  font-size: 15px;
  min-width: 120px;
}
.footer-actions :deep(.el-button--primary) {
  background: linear-gradient(180deg, #B8860B 0%, #96700A 100%);
  border-color: #96700A;
  box-shadow: 0 2px 6px rgba(150, 112, 10, 0.3);
}
.footer-actions :deep(.el-button--primary:hover) {
  background: linear-gradient(180deg, #C9960E 0%, #A47B0C 100%);
  transform: translateY(-1px);
}
.step-panel-preview {
  padding: 12px 0 8px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.step-panel-preview .preview-toolbar-bar {
  width: 92%;
  box-sizing: border-box;
}
/* 预览区做成竖长矩形：加高，尽量贴近下方按钮 */
.step-panel-preview .beibei-word-preview {
  width: 92%;
  max-width: 96vw;
  flex: 1;
  min-height: 78vh;
}
.preview-empty {
  text-align: center;
  color: var(--ink-gold);
  padding: 48px 16px;
  font-family: var(--font-display);
  letter-spacing: 4px;
  opacity: 0.7;
}
.preview-toolbar-bar {
  width: 100%;
  margin-bottom: 16px;
  padding: 14px 14px;
  background: var(--paper-white);
  border: 1px solid var(--gold-a25);
  border-radius: 4px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-paper);
}
.preview-bar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.preview-bar-label {
  font-size: 13px;
  color: var(--ink-gold);
  font-weight: 500;
  flex-shrink: 0;
  font-family: var(--font-display);
  letter-spacing: 3px;
  padding-right: 4px;
  border-right: 1px solid var(--gold-a25);
  margin-right: 4px;
}
.preview-bar-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--ink-gold);
  background: var(--paper-light);
  border: 1px solid var(--gold-a25);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-display);
  letter-spacing: 2px;
}
.toolbar-btn:hover {
  background: var(--ink-gold);
  color: var(--paper-white);
  border-color: var(--ink-gold);
  transform: translateY(-1px);
}
.toolbar-btn:active {
  transform: translateY(0);
}
.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
/* 碑文预览：手机端竖长矩形 */
.beibei-word-preview {
  --beibei-preview-height: 78vh;
  --beibei-title-size: 36px;
  --beibei-big-size: 36px;
  --beibei-small-size: 12px;
}
.beibei-word-preview :deep(.word-area) {
  min-height: 68vh;
}
</style>
