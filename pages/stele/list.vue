<template>
  <div class="manage-page">
    <header class="page-header">
      <h1 class="page-title">碑文记录</h1>
      <div class="brush-line page-brush" />
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索客户名称或逝者姓名"
          clearable
          @keyup.enter="onSearch"
          @clear="onSearch"
          class="search-input"
        >
          <template #append>
            <el-button @click="onSearch" type="primary">搜索</el-button>
          </template>
        </el-input>
        <div class="toolbar-btns">
          <el-button type="primary" @click="onAdd">新增</el-button>
          <el-button @click="goToHelp">帮助</el-button>
        </div>
      </div>
    </header>

    <!-- loading -->
    <div v-if="loading" class="loading-state">
      <div class="ink-loader">
        <span class="ink-char">墨</span>
        <span class="ink-ring"></span>
      </div>
      <span class="loading-text">展卷中</span>
    </div>

    <!-- 桌面：表格 -->
    <div v-else class="table-wrap">
      <div v-if="list.length === 0" class="empty-state">
        <svg class="empty-illust" viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg">
          <rect x="14" y="8" width="52" height="94" rx="4" ry="4" fill="none" stroke="#96700A" stroke-width="1.5" opacity="0.4"/>
          <rect x="20" y="14" width="40" height="82" rx="2" ry="2" fill="none" stroke="#96700A" stroke-width="0.8" opacity="0.3"/>
          <line x1="40" y1="22" x2="40" y2="88" stroke="#96700A" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.3"/>
          <text x="40" y="60" text-anchor="middle" font-size="14" fill="#96700A" font-family="serif" opacity="0.45">未立</text>
        </svg>
        <div class="empty-title">尚无碑文</div>
        <p class="empty-text">点击右上「新增」创建第一条记录</p>
      </div>
      <el-table v-else :data="list" style="width: 100%" @row-click="onEdit">
        <el-table-column prop="user" label="客户" />
        <el-table-column label="类型" width="100">
          <template #default="scope">
            <span :class="['type-tag', 'type-tag-' + (scope.row.info?.selected || '0')]">
              {{ scope.row.info?.selected === '1' ? '单亲-父' : scope.row.info?.selected === '2' ? '单亲-母' : '双亲碑' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="父亲姓名">
          <template #default="scope">
            {{ scope.row.info?.father?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="母亲姓名">
          <template #default="scope">
            {{ scope.row.info?.mother?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="时间">
          <template #default="scope">
            {{ formatTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <div class="op-btns" @click.stop>
              <el-button size="small" type="primary" @click="onEdit(scope.row)">编辑</el-button>
              <el-dropdown trigger="click" @command="(cmd: string) => { if (cmd === 'copy') onCopy(scope.row); else if (cmd === 'delete') onDelete(scope.row); }">
                <el-button size="small">更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="copy">复制</el-dropdown-item>
                    <el-dropdown-item command="delete" divided style="color: var(--color-danger);">移除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 手机：卡片列表 -->
    <div v-if="!loading" class="card-list">
      <div v-if="list.length === 0" class="empty-state empty-state-mobile">
        <svg class="empty-illust" viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg">
          <rect x="14" y="8" width="52" height="94" rx="4" ry="4" fill="none" stroke="#96700A" stroke-width="1.5" opacity="0.4"/>
          <rect x="20" y="14" width="40" height="82" rx="2" ry="2" fill="none" stroke="#96700A" stroke-width="0.8" opacity="0.3"/>
          <line x1="40" y1="22" x2="40" y2="88" stroke="#96700A" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.3"/>
          <text x="40" y="60" text-anchor="middle" font-size="14" fill="#96700A" font-family="serif" opacity="0.45">未立</text>
        </svg>
        <div class="empty-title">尚无碑文</div>
        <p class="empty-text">点击「新增」创建</p>
      </div>
      <template v-else>
        <div
          v-for="row in list"
          :key="row._id"
          class="card-swipe-wrapper"
        >
          <div
            class="card-item"
            :style="{ transform: `translateX(${getSwipeOffset(row._id)}px)` }"
            @touchstart="onTouchStart($event, row._id)"
            @touchmove="onTouchMove($event, row._id)"
            @touchend="onTouchEnd(row._id)"
            @mousedown="onMouseDown($event, row._id)"
            @click="onCardClick(row)"
          >
            <div class="card-seal">
              <span class="card-seal-ch">{{ row.info?.selected === '1' ? '父' : row.info?.selected === '2' ? '母' : '双' }}</span>
            </div>
            <div class="card-main">
              <div class="card-header-row">
                <span class="card-user">{{ row.user || '-' }}</span>
                <span :class="['type-tag', 'type-tag-' + (row.info?.selected || '0')]">
                  {{ row.info?.selected === '1' ? '单亲-父' : row.info?.selected === '2' ? '单亲-母' : '双亲碑' }}
                </span>
              </div>
              <div class="card-names">
                <div class="card-name-row">
                  <span class="card-name-label">考</span>
                  <span class="card-name-val">{{ row.info?.father?.name || '—' }}</span>
                </div>
                <div class="card-name-divider" />
                <div class="card-name-row">
                  <span class="card-name-label">妣</span>
                  <span class="card-name-val">{{ row.info?.mother?.name || '—' }}</span>
                </div>
              </div>
              <div class="card-footer-row">
                <span class="card-time">{{ formatTime(row.time) }}</span>
                <span class="card-swipe-hint">← 滑</span>
              </div>
            </div>
          </div>
          <div class="card-swipe-actions">
            <button class="swipe-btn swipe-btn-copy" @click="onCopy(row)">复制</button>
            <button class="swipe-btn swipe-btn-delete" @click="onDelete(row)">移除</button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="total > pageSize" class="pagination-container">
      <el-pagination
        v-model:current-page="pageNo"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchList"
      />
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { OrderItem } from '../../types/order';
import { toast } from '../../utils/common/toast.js';

const keyword = ref('');
const pageNo = ref(1);
const pageSize = ref(10);
const total = ref(0);
const list = ref<OrderItem[]>([]);
const loading = ref(false);

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await uniCloud.callFunction({
      name: 'order-query',
      data: {
        pageNo: pageNo.value,
        pageSize: pageSize.value,
        keyword: keyword.value
      }
    });
    const result = res?.result;
    if (!result || result.code !== 0) {
      toast.error(result?.msg || '获取列表失败');
      list.value = [];
      total.value = 0;
      return;
    }
    list.value = result.data || [];
    total.value = result.total || 0;
  } catch (e) {
    toast.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

/** 搜索：先回到第一页再查 */
const onSearch = () => {
  pageNo.value = 1;
  fetchList();
};

const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;

const onAdd = () => {
  uni.navigateTo({
    url: isMobile() ? '/pages/stele/index?from=list' : '/pages/stele/detail'
  });
};

const onEdit = (row: OrderItem) => {
  const url = isMobile()
    ? '/pages/stele/index?id=' + row._id
    : '/pages/stele/detail?id=' + row._id;
  uni.navigateTo({ url });
};

const goToHelp = () => {
  uni.navigateTo({ url: '/pages/stele/help' });
};

// --- 移动端左滑 ---
const swipeState = ref<Record<string, number>>({});
let touchStartX = 0;
let touchStartOffset = 0;
let activeSwipeId = '';
const SWIPE_THRESHOLD = 60;
const SWIPE_OPEN = -140;

const getSwipeOffset = (id: string) => swipeState.value[id] || 0;

const onTouchStart = (e: TouchEvent, id: string) => {
  if (activeSwipeId && activeSwipeId !== id) {
    swipeState.value[activeSwipeId] = 0;
  }
  touchStartX = e.touches[0].clientX;
  touchStartOffset = swipeState.value[id] || 0;
  activeSwipeId = id;
};

const onTouchMove = (e: TouchEvent, id: string) => {
  const dx = e.touches[0].clientX - touchStartX;
  const newOffset = Math.min(0, Math.max(SWIPE_OPEN, touchStartOffset + dx));
  swipeState.value[id] = newOffset;
};

const onTouchEnd = (id: string) => {
  const offset = swipeState.value[id] || 0;
  swipeState.value[id] = offset < -SWIPE_THRESHOLD ? SWIPE_OPEN : 0;
};

// --- 鼠标拖拽（电脑窄屏） ---
let isDragging = false;
let currentMouseMove: ((ev: MouseEvent) => void) | null = null;
let currentMouseUp: (() => void) | null = null;

const cleanupMouseListeners = () => {
  if (currentMouseMove) document.removeEventListener('mousemove', currentMouseMove);
  if (currentMouseUp) document.removeEventListener('mouseup', currentMouseUp);
  currentMouseMove = null;
  currentMouseUp = null;
};

const onMouseDown = (e: MouseEvent, id: string) => {
  cleanupMouseListeners();
  if (activeSwipeId && activeSwipeId !== id) {
    swipeState.value[activeSwipeId] = 0;
  }
  touchStartX = e.clientX;
  touchStartOffset = swipeState.value[id] || 0;
  activeSwipeId = id;
  isDragging = false;

  currentMouseMove = (ev: MouseEvent) => {
    const dx = ev.clientX - touchStartX;
    if (Math.abs(dx) > 5) isDragging = true;
    const newOffset = Math.min(0, Math.max(SWIPE_OPEN, touchStartOffset + dx));
    swipeState.value[id] = newOffset;
  };
  currentMouseUp = () => {
    const offset = swipeState.value[id] || 0;
    swipeState.value[id] = offset < -SWIPE_THRESHOLD ? SWIPE_OPEN : 0;
    cleanupMouseListeners();
  };
  document.addEventListener('mousemove', currentMouseMove);
  document.addEventListener('mouseup', currentMouseUp);
};

const onCardClick = (row: OrderItem) => {
  if (isDragging) { isDragging = false; return; }
  const offset = swipeState.value[row._id] || 0;
  if (offset < -10) {
    swipeState.value[row._id] = 0;
    return;
  }
  onEdit(row);
};

const onCopy = (row: OrderItem) => {
  const url = isMobile()
    ? '/pages/stele/index?copyFrom=' + row._id
    : '/pages/stele/detail?copyFrom=' + row._id;
  uni.navigateTo({ url });
};

const onDelete = (row: OrderItem) => {
  const fname = row.info?.father?.name || '';
  const mname = row.info?.mother?.name || '';
  const names = [fname, mname].filter(Boolean).join('/') || '该项';
  uni.showModal({
    title: '提示',
    content: `确定要移除【${names}】的碑文记录吗？`,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        const delRes = await uniCloud.callFunction({ name: 'order-delete', data: { id: row._id } });
        const delResult = delRes?.result;
        if (!delResult || delResult.code !== 0) {
          toast.error(delResult?.msg || '移除失败');
          return;
        }
        toast.success('已移除');
        if (list.value.length <= 1 && pageNo.value > 1) pageNo.value--;
        fetchList();
      } catch (e) {
        toast.error('移除失败');
      }
    }
  });
};

/** 时间展示 */
const formatTime = (val: string | number | undefined) => {
  if (val === undefined || val === null || val === '') return '-';
  const d = typeof val === 'number' ? new Date(val) : new Date(val as string);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

onMounted(fetchList);
onBeforeUnmount(cleanupMouseListeners);
</script>

<style scoped>
.manage-page {
  position: relative;
  padding: 32px 24px;
  padding-left: env(safe-area-inset-left, 24px);
  padding-right: env(safe-area-inset-right, 24px);
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(ellipse at top left, #F3ECE0 0%, transparent 55%),
    radial-gradient(ellipse at bottom right, #EFE8DC 0%, transparent 60%),
    #F6F1E8;
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
/* 宣纸噪点层，与首页一致 */
.manage-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.588  0 0 0 0 0.439  0 0 0 0 0.039  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
.page-header {
  position: relative;
  background: #FFFDF8;
  border-radius: 8px;
  padding: 22px 28px;
  margin-bottom: 24px;
  box-shadow:
    0 1px 0 rgba(150, 112, 10, 0.12) inset,
    0 6px 20px rgba(44, 36, 32, 0.06),
    0 2px 6px rgba(150, 112, 10, 0.05);
  border: none;
  animation: reveal 0.7s ease 0.05s both;
}
/* 书脊双线装饰（与首页卡片一致） */
.page-header::before {
  content: "";
  position: absolute;
  left: 10px;
  top: 18px;
  bottom: 18px;
  width: 9px;
  background-image:
    linear-gradient(to bottom, #96700A, #96700A),
    linear-gradient(to bottom, #96700A, #96700A);
  background-repeat: no-repeat;
  background-size: 3px 100%, 1px 100%;
  background-position: 0 0, 8px 0;
}
.page-title {
  margin: 0 0 16px 24px;
  font-size: 26px;
  font-weight: 500;
  color: var(--color-primary);
  letter-spacing: 4px;
  font-family: var(--font-display);
  position: relative;
}
.page-title::after {
  content: "Stele · Records";
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
  color: #96700A;
  opacity: 0.55;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: normal;
}
.page-brush {
  height: 12px;
  margin: 4px 0 12px 24px;
  max-width: 280px;
  animation: brushDraw 1s ease 0.3s both;
}
@keyframes brushDraw {
  from { clip-path: inset(0 100% 0 0); opacity: 0; }
  50%  { opacity: 1; }
  to   { clip-path: inset(0 0 0 0); opacity: 1; }
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-left: 24px;
}
.search-input { width: 240px; }
.search-input :deep(.el-input__wrapper) {
  background: #FAF5EC;
  box-shadow: 0 0 0 1px rgba(150, 112, 10, 0.25) inset;
  border-radius: 6px;
}
.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px var(--color-primary) inset;
}
.toolbar-btns { display: flex; gap: 8px; }
.toolbar-btns :deep(.el-button) {
  font-family: var(--font-display);
  letter-spacing: 2px;
  border-radius: 6px;
}
.type-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 2px;
  font-family: var(--font-display);
  border: 1px solid;
}
.type-tag-0 { background: rgba(150, 112, 10, 0.08); color: var(--color-primary); border-color: rgba(150, 112, 10, 0.35); }
.type-tag-1 { background: rgba(161, 55, 50, 0.08); color: #A13732; border-color: rgba(161, 55, 50, 0.35); }
.type-tag-2 { background: rgba(212, 160, 23, 0.1); color: #9C7518; border-color: rgba(212, 160, 23, 0.4); }
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  color: var(--ink-gold);
  font-size: 14px;
}
.ink-loader {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ink-ring {
  position: absolute;
  inset: 0;
  border: 2px solid var(--gold-a25);
  border-top-color: var(--ink-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.ink-char {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--ink-gold);
  animation: inkPulse 1.6s ease-in-out infinite;
}
.loading-text {
  font-family: var(--font-display);
  letter-spacing: 4px;
  color: var(--ink-gold);
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes inkPulse {
  0%, 100% { opacity: 0.6; transform: scale(0.95); }
  50%      { opacity: 1;   transform: scale(1.05); }
}
@keyframes reveal {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.empty-state {
  background: var(--paper-white);
  border-radius: 8px;
  padding: 56px 24px 48px;
  text-align: center;
  border: 1px dashed var(--gold-a35);
  box-shadow: var(--shadow-paper);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.empty-illust {
  width: 68px;
  height: auto;
  opacity: 0.85;
}
.empty-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--ink-gold);
  letter-spacing: 6px;
  font-weight: 500;
}
.empty-text {
  margin: 0;
  font-size: 13px;
  color: var(--ink-mist);
  opacity: 0.85;
  letter-spacing: 2px;
  font-family: var(--font-display);
}
.empty-state-mobile { padding: 40px 20px; }
.table-wrap {
  display: block; flex: 0 0 auto; min-height: 0;
  animation: reveal 0.7s ease 0.2s both;
}
.card-list { display: none; flex: 0 0 auto; min-height: 0; }
.manage-page :deep(.el-table) {
  background-color: #FFFDF8;
  border-radius: 8px;
  box-shadow:
    0 1px 0 rgba(150, 112, 10, 0.12) inset,
    0 6px 20px rgba(44, 36, 32, 0.06);
  border: none;
  overflow: hidden;
}
.manage-page :deep(.el-table th) {
  background: #F6EFE0 !important;
  color: var(--color-primary) !important;
  font-weight: 500;
  letter-spacing: 2px;
  font-family: var(--font-display);
  border-bottom: 1px solid rgba(150, 112, 10, 0.3) !important;
  font-size: 15px;
}
.manage-page :deep(.el-table td) {
  border-bottom: 1px solid rgba(150, 112, 10, 0.12);
  background-color: transparent !important;
}
.manage-page :deep(.el-table tr) { background-color: transparent !important; }
.op-btns { display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; }
.manage-page :deep(.el-table__row:hover td) {
  background-color: #FAF3E4 !important;
}
/* hover 行最左 td 出现朱砂竖线（像批阅朱批） */
.manage-page :deep(.el-table__row) td:first-child {
  position: relative;
  transition: box-shadow 0.2s;
}
.manage-page :deep(.el-table__row:hover) td:first-child {
  box-shadow: inset 3px 0 0 #A13732 !important;
}
.manage-page :deep(.el-button--primary) {
  background: linear-gradient(180deg, #B8860B 0%, #96700A 100%);
  border-color: #96700A; color: #fff;
  font-family: var(--font-display);
  letter-spacing: 2px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(150, 112, 10, 0.3);
}
.manage-page :deep(.el-button--primary:hover) {
  background: linear-gradient(180deg, #C9960E 0%, #A47B0C 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(150, 112, 10, 0.35);
}
.pagination-container {
  margin-top: 16px; padding: 12px 0; flex-shrink: 0;
  display: flex; justify-content: flex-end;
}
.pagination-container :deep(.el-pagination) { font-weight: 500; font-size: 15px; }
.pagination-container :deep(.el-pager li.is-active) {
  background: linear-gradient(180deg, var(--color-primary-hover) 0%, var(--color-primary) 100%) !important;
  border-color: var(--color-primary) !important; color: #fff !important;
}

@media (max-width: 768px) {
  .manage-page { padding: 12px; }
  .page-header { padding: 16px; margin-bottom: 16px; }
  .page-title { font-size: 18px; margin-bottom: 12px; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-input { width: 100%; }
  .toolbar-btns { justify-content: stretch; }
  .toolbar-btns .el-button { flex: 1; min-width: 0; }
  .table-wrap { display: none; }
  .card-list { display: block; }
  .card-swipe-wrapper {
    position: relative; overflow: hidden; border-radius: 8px;
    margin-bottom: 14px;
    box-shadow:
      0 1px 0 rgba(150, 112, 10, 0.12) inset,
      0 4px 16px rgba(44, 36, 32, 0.06),
      0 1px 4px rgba(150, 112, 10, 0.05);
    border: none;
  }
  .card-item {
    position: relative; z-index: 1;
    background: #FFFDF8;
    padding: 16px 18px 14px 76px;
    transition: transform 0.2s ease;
    min-height: 108px;
    box-sizing: border-box;
  }
  /* 左侧类型印章：朱砂红方印 */
  .card-seal {
    position: absolute;
    left: 14px;
    top: 18px;
    width: 48px;
    height: 48px;
    border: 2px solid #A13732;
    background: #FDF8EC;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 0 rgba(150, 112, 10, 0.1);
    transform: rotate(-3deg);
    transition: transform 0.2s;
  }
  .card-swipe-wrapper:active .card-seal {
    animation: cardSealJitter 0.35s ease;
  }
  @keyframes cardSealJitter {
    0%   { transform: rotate(-3deg) scale(1); }
    30%  { transform: rotate(3deg) scale(1.1); }
    60%  { transform: rotate(-6deg) scale(1.05); }
    100% { transform: rotate(-3deg) scale(1); }
  }
  .card-seal-ch {
    font-family: var(--font-display);
    font-size: 26px;
    color: #A13732;
    letter-spacing: 0;
    line-height: 1;
  }
  /* 左侧书脊竖条 */
  .card-item::before {
    content: "";
    position: absolute;
    left: 70px;
    top: 14px;
    bottom: 14px;
    width: 1px;
    background: repeating-linear-gradient(
      to bottom,
      rgba(150, 112, 10, 0.3) 0,
      rgba(150, 112, 10, 0.3) 2px,
      transparent 2px,
      transparent 5px
    );
  }
  .card-swipe-actions {
    position: absolute; right: 0; top: 0; bottom: 0;
    display: flex; align-items: stretch;
  }
  .swipe-btn {
    width: 70px; border: none; color: #fff;
    font-size: 14px; font-weight: 500; cursor: pointer;
    font-family: var(--font-display);
    letter-spacing: 3px;
  }
  .swipe-btn-copy { background: #96700A; }
  .swipe-btn-delete { background: #A13732; }
  .card-main { display: flex; flex-direction: column; gap: 8px; }
  .card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .card-user {
    font-weight: 500;
    color: var(--color-primary);
    font-size: 16px;
    font-family: var(--font-display);
    letter-spacing: 2px;
  }
  .card-names {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 0;
  }
  .card-name-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }
  .card-name-label {
    font-size: 13px;
    color: rgba(150, 112, 10, 0.7);
    font-family: var(--font-display);
    flex-shrink: 0;
  }
  .card-name-val {
    font-size: 16px;
    color: #2C2420;
    font-family: var(--font-display);
    letter-spacing: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card-name-divider {
    width: 1px;
    height: 16px;
    background: rgba(150, 112, 10, 0.25);
  }
  .card-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 6px;
    border-top: 1px dashed rgba(150, 112, 10, 0.2);
  }
  .card-time {
    font-size: 12px;
    color: rgba(150, 112, 10, 0.75);
    font-family: Georgia, serif;
    letter-spacing: 1px;
  }
  .card-swipe-hint {
    font-size: 11px;
    color: rgba(150, 112, 10, 0.4);
    letter-spacing: 2px;
    font-family: var(--font-display);
  }
  .pagination-container { justify-content: center; margin-top: 12px; }
}
</style>
