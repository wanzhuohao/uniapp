<template>
  <div class="export-center">
    <el-button @click="openDelivery">交付包</el-button>
    <el-button @click="openConfirmation">客户确认长图</el-button>

    <el-dialog v-model="deliveryVisible" title="确认交付内容" width="min(92vw, 720px)" :close-on-click-modal="false">
      <template v-if="deliveryDto">
        <p class="privacy-note">仅包含以下五个客户可见字段；客户标识、备注、表单详情和管理员口令不会进入文件。</p>
        <div class="field-list"><div v-for="field in fields" :key="field.key"><b>{{ field.label }}</b><span>{{ deliveryDto.document[field.key] }}</span></div></div>
        <p class="file-list">ZIP 文件：刻字数据.json、刻字内容.txt、碑文预览.png</p>
        <div ref="deliveryDom" class="delivery-capture"><h2>{{ deliveryDto.document.title }}</h2><div class="capture-grid"><pre>{{ deliveryDto.document.date }}</pre><pre>{{ deliveryDto.document.small }}</pre><pre class="big">{{ deliveryDto.document.big }}</pre><pre>{{ deliveryDto.document.birth }}</pre></div></div>
      </template>
      <template #footer><el-button @click="deliveryVisible=false">取消</el-button><el-button type="primary" :loading="busy" @click="confirmDelivery">确认并导出 ZIP</el-button></template>
    </el-dialog>

    <el-dialog v-model="confirmationVisible" title="预览客户确认长图" width="min(92vw, 680px)" :close-on-click-modal="false">
      <div v-if="confirmationDto" ref="confirmationDom" class="confirmation-capture">
        <h1>客户确认单</h1><p>订单引用：{{ confirmationDto.orderRef }}　版本：{{ confirmationDto.confirmationVersion }}</p><p>生成时间：{{ confirmationDto.generatedAt }}</p>
        <div v-for="field in fields" :key="field.key" class="confirm-field"><b>{{ field.label }}</b><pre>{{ confirmationDto.document[field.key] }}</pre></div>
      </div>
      <template #footer><el-button @click="confirmationVisible=false">取消</el-button><el-button type="primary" :loading="busy" @click="confirmImage">确认并保存 PNG</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import html2canvas from 'html2canvas';
import type { ConfirmationDto, DeliveryDto } from '../../types/order';
import { buildConfirmationDto, buildDeliveryDto, validateRawDocument } from '../../utils/stele/document-contract';
import { buildDeliveryZip, capturePng, downloadBlob, getExportFailureMessage } from '../../utils/stele/delivery';
import { recordDiagnosticError } from '../../utils/common/diagnostics';

const props = defineProps<{ document: unknown; orderId?: unknown }>();
const deliveryVisible=ref(false),confirmationVisible=ref(false),busy=ref(false),deliveryDto=ref<Readonly<DeliveryDto>|null>(null),confirmationDto=ref<Readonly<ConfirmationDto>|null>(null),deliveryDom=ref<HTMLElement|null>(null),confirmationDom=ref<HTMLElement|null>(null);
const fields=[{key:'title',label:'横批'},{key:'big',label:'大字'},{key:'small',label:'小字'},{key:'birth',label:'生卒'},{key:'date',label:'立碑日期'}] as const;
function verifiedDocument(){const result=validateRawDocument(props.document);if(!result.ok){ElMessage.error(`${result.field} 字段类型无效；${result.action}`);throw new Error('FILE_GENERATION_FAILED')}return result.document}
function openDelivery(){try{deliveryDto.value=buildDeliveryDto(verifiedDocument());deliveryVisible.value=true}catch{recordDiagnosticError('FILE_GENERATION_FAILED','export')}}
function openConfirmation(){try{confirmationDto.value=buildConfirmationDto(verifiedDocument(),props.orderId);confirmationVisible.value=true}catch{recordDiagnosticError('FILE_GENERATION_FAILED','export')}}
function capture(node:HTMLElement|null){return capturePng(node,target=>html2canvas(target,{backgroundColor:'#fff',scale:2,useCORS:false}))}
async function confirmDelivery(){if(!deliveryDto.value)return;busy.value=true;try{await nextTick();const png=await capture(deliveryDom.value);const zip=await buildDeliveryZip(deliveryDto.value as DeliveryDto,png);downloadBlob(zip,`碑文交付包-${deliveryDto.value.generatedAt.slice(0,10)}.zip`);deliveryVisible.value=false;ElMessage.success('交付包已生成')}catch(error:any){const code=error?.message==='IMAGE_CAPTURE_FAILED'?'IMAGE_CAPTURE_FAILED':error?.message==='DOWNLOAD_UNAVAILABLE'?'DOWNLOAD_UNAVAILABLE':'ZIP_GENERATION_FAILED';recordDiagnosticError(code,'export');ElMessage.error(getExportFailureMessage(code))}finally{busy.value=false}}
async function confirmImage(){if(!confirmationDto.value)return;busy.value=true;try{await nextTick();const png=await capture(confirmationDom.value);downloadBlob(png,`客户确认单-${confirmationDto.value.orderRef}.png`);confirmationVisible.value=false;ElMessage.success('确认长图已生成')}catch(error:any){const code=error?.message==='DOWNLOAD_UNAVAILABLE'?'DOWNLOAD_UNAVAILABLE':'IMAGE_CAPTURE_FAILED';recordDiagnosticError(code,'export');ElMessage.error(getExportFailureMessage(code))}finally{busy.value=false}}
</script>

<style scoped>
.export-center{display:flex;gap:8px;flex-wrap:wrap}.privacy-note,.file-list{color:#6b6257;line-height:1.7}.field-list>div{display:grid;grid-template-columns:80px 1fr;gap:12px;padding:8px;border-bottom:1px solid #eee}.field-list span{white-space:pre-wrap;word-break:break-all}.delivery-capture{position:fixed;left:-10000px;top:0;width:520px;min-height:900px;padding:40px;background:#1a1a18;color:#d4a528;text-align:center}.delivery-capture h2{font-size:34px}.capture-grid{display:grid;grid-template-columns:60px 1fr 160px 60px;gap:20px;min-height:740px;align-items:center}.capture-grid pre{white-space:pre-wrap;word-break:break-all;font-family:serif}.capture-grid .big{font-size:32px}.confirmation-capture{padding:36px;background:#fffdf7;color:#2c2420;border:1px solid #d8c79f}.confirmation-capture h1{text-align:center;letter-spacing:8px}.confirm-field{margin-top:22px;border-top:1px solid #d8c79f;padding-top:14px}.confirm-field pre{white-space:pre-wrap;word-break:break-all;font-family:serif;line-height:1.8}
</style>
