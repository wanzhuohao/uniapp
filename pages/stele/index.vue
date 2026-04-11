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
          <span class="step-icon">{{ currentStep > i + 1 ? '✓' : i + 1 }}</span>
          <span class="step-title">{{ label }}</span>
        </div>
      </div>
    </div>

    <div class="step-content">
      <!-- 草稿提示（非阻断横幅）-->
      <div v-if="draftNoticeVisible" class="draft-notice">
        <span class="draft-notice-text">检测到上次未保存的草稿</span>
        <div class="draft-notice-btns">
          <el-button size="small" type="primary" @click="applyDraftNotice">载入草稿</el-button>
          <el-button size="small" @click="dismissDraftNotice">关闭</el-button>
        </div>
      </div>

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
            <el-radio-group v-model="form.dateQingming" class="full-width">
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
      <div v-show="currentStep === 2" class="step-panel">
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
              <button type="button" class="toolbar-btn" @click="onExportImage" :disabled="exporting">
                {{ exporting ? '导出中...' : '保存图片' }}
              </button>
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
        <el-button v-if="currentStep === 3" type="primary" @click="onSubmit" :loading="submitting">提交</el-button>
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
import { ref, watch, computed, onMounted } from 'vue';
import draggable from 'vuedraggable';
import { appellationOptions, parseFlexibleDate, arrToDisplay, toStorageDate } from '../../utils/stele/stele-utils';
import { getUrlParam, useOrderForm } from '../../composables/stele/useOrderForm';
import WordPreview from '../../components/stele/WordPreview.vue';
import type { PreviewData } from '../../types/order';

const {
  form, currentYear,
  fatherBirth, fatherDeath, motherBirth, motherDeath,
  libeiDate, qingmingYear, lastCustomLibei,
  addCol, removeCol, addGroup, removeGroup,
  syncDatesToForm, validateWarnings, buildPreview, fetchAndFill, buildSavePayload, doSave,
  saveDraft, loadDraft, clearDraft,
} = useOrderForm();

const stepLabels = ['基本信息', '名单', '预览'];
const editId = ref(getUrlParam('id'));
const fromList = ref(!!getUrlParam('id') || !!getUrlParam('copyFrom') || !!getUrlParam('from'));
const currentStep = ref(1);
const submitting = ref(false);
const savedBig = ref('');
const showPhoneDialog = ref(false);
const phoneInput = ref('');
const previewTheme = ref<'dark' | 'light'>('dark');
const previewRef = ref<InstanceType<typeof WordPreview> | null>(null);
const exporting = ref(false);


async function onExportImage() {
  if (!previewRef.value) return;
  exporting.value = true;
  const fatherName = form.father?.name || '';
  const motherName = form.mother?.name || '';
  const filename = (fatherName || motherName) ? `${fatherName}${motherName}_碑文.png` : '碑文预览.png';
  const ok = await previewRef.value.exportImage(filename);
  if (!ok) uni.showToast({ title: '导出失败', icon: 'none' });
  exporting.value = false;
}

// 预览数据：响应式计算
const previewData = computed<PreviewData>(() => buildPreview());

function copyPreviewField(field: keyof PreviewData) {
  const text = previewData.value[field] || '';
  if (!text) { uni.showToast({ title: '该区域暂无内容', icon: 'none' }); return; }
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败', icon: 'none' })
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
  localStorage.setItem('stele-3d-preview', JSON.stringify(buildPreview()));
  uni.navigateTo({ url: '/pages/stele/preview' });
}

watch(currentStep, (step) => {
  if (step === 3) syncDatesToForm();
  saveDraft();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 清明节/自定义切换
watch(() => form.dateQingming, (val) => {
  if (val) {
    const hasInForm = form.libei[1] || form.libei[2];
    if (hasInForm) {
      lastCustomLibei.value = [form.libei[0] || '', form.libei[1] || '', form.libei[2] || ''];
      qingmingYear.value = form.libei[0] || String(currentYear);
    } else {
      const parsed = toStorageDate(parseFlexibleDate(libeiDate.value || ''));
      if (parsed[0] || parsed[1] || parsed[2]) lastCustomLibei.value = parsed;
      qingmingYear.value = parsed[0] || form.libei[0] || String(currentYear);
    }
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

// 草稿提示（非阻断）
const draftNoticeVisible = ref(false);

function applyDraftNotice() {
  if (loadDraft()) {
    uni.showToast({ title: '已恢复草稿', icon: 'none', duration: 2000 });
  } else {
    clearDraft();
    uni.showToast({ title: '草稿已损坏，已清除', icon: 'none', duration: 2000 });
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
    await fetchAndFill(copyFrom);
    form.user = '';
    currentStep.value = 1;
    uni.showToast({ title: '已复制，请修改后保存', icon: 'none', duration: 2000 });
  } else if (editId.value) {
    const saved = await fetchAndFill(editId.value);
    if (typeof saved === 'object' && saved.big) savedBig.value = saved.big;
    currentStep.value = 3;
  } else {
    // 新建模式：显示顶部横幅，不阻断用户
    if (localStorage.getItem('stele-draft')) {
      draftNoticeVisible.value = true;
    }
  }
});

// 保存逻辑
function onSubmit() {
  if (submitting.value) return;
  syncDatesToForm();
  const warnings = validateWarnings();
  if (warnings.length) {
    uni.showModal({ title: '排版提醒', content: warnings.join('\n'), showCancel: false });
  }
  if (!form.user && !editId.value) {
    const d = new Date();
    phoneInput.value = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    showPhoneDialog.value = true;
    return;
  }
  const payload = buildSavePayload(editId.value || undefined);
  if (savedBig.value) payload.big = savedBig.value;
  submitting.value = true;
  doSave(payload).then((newId) => {
    clearDraft();
    if (newId) editId.value = newId;
    uni.showToast({ title: '提交成功', icon: 'success' });
  }).catch(() => {
    uni.showToast({ title: '保存失败', icon: 'none' });
  }).finally(() => { submitting.value = false; });
}

function confirmPhoneAndSubmit() {
  const phone = (phoneInput.value || '').trim();
  if (!phone) { uni.showToast({ title: '请输入客户标识', icon: 'none' }); return; }
  form.user = phone;
  showPhoneDialog.value = false;
  const payload = buildSavePayload(editId.value || undefined);
  if (savedBig.value) payload.big = savedBig.value;
  submitting.value = true;
  doSave(payload).then((newId) => {
    clearDraft();
    if (newId) editId.value = newId;
    uni.showToast({ title: '提交成功', icon: 'success' });
  }).catch(() => {
    uni.showToast({ title: '保存失败', icon: 'none' });
  }).finally(() => { submitting.value = false; });
}
</script>

<style scoped>
.order-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #EDE8E2 0%, var(--color-bg-blue-light) 100%);
  padding: 16px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
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
}
.top-bar-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-primary);
}
.steps-header {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(184, 134, 11, 0.1);
  border: 1px solid var(--color-border);
}
.steps-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.step-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 6px 4px;
  border-radius: 8px;
  transition: background 0.2s;
}
.step-item:hover {
  background: var(--color-bg-blue);
}
.step-icon {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 50%;
  font-size: 14px;
  background: var(--color-border-light);
  color: var(--color-primary-light);
}
.step-item.done .step-icon {
  background: linear-gradient(180deg, var(--color-success-hover) 0%, var(--color-success) 100%);
  color: #fff;
}
.step-item.active .step-icon {
  background: linear-gradient(180deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  color: #fff;
}
.step-title {
  font-size: 14px;
  color: var(--color-primary-light);
}
.step-item.active .step-title {
  color: var(--color-primary);
  font-weight: 600;
}
.step-item.done .step-title {
  color: var(--color-success);
  font-weight: 500;
}
.step-content {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  min-height: 520px;
  box-shadow: 0 4px 12px rgba(184, 134, 11, 0.1);
  border: 1px solid var(--color-border);
}
.step-panel {
  width: 100%;
}
.draft-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  background: var(--color-bg-blue-light);
  border-left: 4px solid var(--color-warning);
  border-radius: 6px;
  font-size: 14px;
  color: var(--color-text);
}
.draft-notice-text { flex: 1; }
.draft-notice-btns { display: flex; gap: 8px; flex-shrink: 0; }
.full-width {
  width: 100%;
}
.mt-8 {
  margin-top: 8px;
}
/* 名单区：蓝绿主题 */
.names-group {
  background: linear-gradient(180deg, var(--color-bg-blue) 0%, var(--color-bg-blue-light) 100%);
  border: 2px solid var(--color-primary-light);
  border-radius: 8px;
  margin-bottom: 16px;
  padding: 12px 14px;
}
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--color-primary);
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
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}
.drag-handle {
  cursor: grab;
  color: var(--color-primary-light);
  font-size: 20px;
  user-select: none;
  flex-shrink: 0;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}
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
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  display: flex;
  justify-content: center;
  gap: 12px;
  background: #fff;
  border-top: 1px solid var(--color-border-light);
  box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
  z-index: 10;
}
.footer-actions :deep(.el-button--primary) {
  background: linear-gradient(180deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  border-color: var(--color-primary);
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
  color: var(--color-primary-light);
  padding: 48px 16px;
}
.preview-toolbar-bar {
  width: 100%;
  margin-bottom: 16px;
  padding: 12px 10px;
  background: linear-gradient(180deg, var(--color-bg-blue-light) 0%, var(--color-bg-blue) 100%);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.preview-bar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.preview-bar-label {
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 600;
  flex-shrink: 0;
}
.preview-bar-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-btn {
  padding: 8px 14px;
  font-size: 14px;
  color: var(--color-primary);
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.toolbar-btn:active {
  background: var(--color-bg-blue);
  border-color: var(--color-primary);
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
