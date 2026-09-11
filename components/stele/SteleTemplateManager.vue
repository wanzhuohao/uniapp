<template>
  <div class="template-manager">
    <div class="template-head"><span>本地模板（{{ templates.length }}/30）</span><el-button size="small" type="primary" @click="createFromCurrent">保存当前为模板</el-button></div>
    <div v-if="templates.length" class="template-list">
      <div v-for="item in templates" :key="item.id" class="template-item">
        <span class="template-name">{{ item.name }}</span>
        <div class="template-actions"><el-button size="small" @click="applySelected(item)">应用</el-button><el-button size="small" @click="renameSelected(item)">改名</el-button><el-button size="small" type="danger" @click="removeSelected(item)">删除</el-button></div>
      </div>
    </div>
    <div v-else class="template-empty">暂无模板。模板只保留碑文白名单字段，不包含客户标识和备注。</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { OrderForm, SteleTemplate, SteleTemplateData } from '../../types/order';
import { addTemplate, applyTemplate, deleteTemplate, loadTemplates, renameTemplate, saveTemplates } from '../../utils/stele/templates';
import { recordDiagnosticError } from '../../utils/common/diagnostics';

const props = defineProps<{ form: OrderForm }>();
const emit = defineEmits<{ apply: [data: SteleTemplateData] }>();
const templates = ref<SteleTemplate[]>([]);
onMounted(() => { templates.value = loadTemplates(localStorage, () => recordDiagnosticError('STORAGE_READ_FAILED', 'template')); });

function persist(next: SteleTemplate[]) { templates.value = saveTemplates(next); }
function isDialogCancel(error: unknown) { return error === 'cancel' || error === 'close'; }
function showStorageFailure(error: any) {
  recordDiagnosticError(error?.message === 'TEMPLATE_LIMIT_REACHED' ? 'STORAGE_WRITE_FAILED' : 'UNKNOWN_CONTROLLED_ERROR', 'template');
  ElMessage.error(error?.message === 'TEMPLATE_LIMIT_REACHED' ? '最多保存 30 个模板，请先删除旧模板' : '模板写入失败，请检查本地存储空间后重试');
}
async function createFromCurrent() {
  try {
    const { value } = await ElMessageBox.prompt('模板不会保存客户标识和备注', '保存本地模板', { inputPlaceholder: '模板名称（1～40 字）', inputValidator: value => !!value?.normalize('NFKC').trim() || '请输入模板名称' });
    persist(addTemplate(templates.value, value, props.form)); ElMessage.success('模板已保存到本机');
  } catch (error: any) {
    if (isDialogCancel(error)) return;
    showStorageFailure(error);
  }
}
async function applySelected(item: SteleTemplate) {
  try { await ElMessageBox.confirm(`应用“${item.name}”会覆盖当前碑文白名单字段，客户标识和备注不受影响。`, '确认应用模板', { confirmButtonText:'仍要应用', cancelButtonText:'取消' }); emit('apply', applyTemplate(item)); ElMessage.success('模板已应用'); } catch {}
}
async function renameSelected(item: SteleTemplate) {
  try { const { value } = await ElMessageBox.prompt('请输入新名称', '重命名模板', { inputValue:item.name }); persist(renameTemplate(templates.value,item.id,value)); ElMessage.success('模板已重命名'); } catch (error) { if (!isDialogCancel(error)) showStorageFailure(error); }
}
async function removeSelected(item: SteleTemplate) {
  try { await ElMessageBox.confirm(`确定删除“${item.name}”？此操作只删除本机模板。`, '删除模板', { type:'warning' }); persist(deleteTemplate(templates.value,item.id)); ElMessage.success('模板已删除'); } catch (error) { if (!isDialogCancel(error)) showStorageFailure(error); }
}
</script>

<style scoped>
.template-manager{margin:16px 0;padding:14px;background:var(--paper-light);border:1px solid var(--gold-a25);border-radius:6px}.template-head,.template-item{display:flex;align-items:center;justify-content:space-between;gap:12px}.template-head{font-family:var(--font-display);color:var(--ink-gold)}.template-list{margin-top:12px}.template-item{padding:10px 0;border-top:1px solid var(--gold-a15)}.template-name{flex:1}.template-actions{display:flex;gap:6px;flex-wrap:wrap}.template-empty{padding:14px 0 2px;color:var(--ink-soft);font-size:13px;line-height:1.6}
</style>
