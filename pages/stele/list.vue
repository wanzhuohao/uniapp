<template>
  <div class="manage-page">
    <header class="page-header">
      <h1 class="page-title">碑文记录</h1>
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
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 桌面：表格 -->
    <div v-else class="table-wrap">
      <div v-if="list.length === 0" class="empty-state">
        <div class="empty-icon">暂无记录</div>
        <p class="empty-text">点击「新增」创建第一条碑文记录</p>
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
        <div class="empty-icon">暂无记录</div>
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
            <div class="card-main">
              <div class="card-row-top">
                <span class="card-user">{{ row.user || '-' }}</span>
                <span class="card-time">{{ formatTime(row.time) }}</span>
              </div>
              <span class="card-info">
                父 {{ row.info?.father?.name || '-' }} · 母 {{ row.info?.mother?.name || '-' }}
              </span>
              <span :class="['type-tag', 'type-tag-' + (row.info?.selected || '0')]">
                {{ row.info?.selected === '1' ? '单亲-父' : row.info?.selected === '2' ? '单亲-母' : '双亲碑' }}
              </span>
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
  padding: 24px;
  padding-left: env(safe-area-inset-left, 24px);
  padding-right: env(safe-area-inset-right, 24px);
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, #EDE8E2 0%, var(--color-bg-blue-light) 100%);
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.page-header {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(184, 134, 11, 0.08);
  border: 1px solid var(--color-border);
}
.page-title {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 0.5px;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.search-input { width: 220px; }
.toolbar-btns { display: flex; gap: 8px; }
.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}
.type-tag-0 { background: rgba(150, 112, 10, 0.12); color: var(--color-primary); }
.type-tag-1 { background: rgba(91, 140, 62, 0.12); color: var(--color-success); }
.type-tag-2 { background: rgba(212, 160, 23, 0.12); color: var(--color-warning); }
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
  color: var(--color-primary-light);
  font-size: 14px;
}
.loading-spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state {
  background: #fff;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  border: 1px dashed var(--color-border);
  box-shadow: 0 2px 12px rgba(184, 134, 11, 0.06);
}
.empty-icon { font-size: 15px; color: var(--color-primary-light); margin-bottom: 12px; font-weight: 500; }
.empty-text { margin: 0; font-size: 14px; color: var(--color-primary); opacity: 0.85; }
.empty-state-mobile { padding: 36px 20px; }
.table-wrap { display: block; flex: 0 0 auto; min-height: 0; }
.card-list { display: none; flex: 0 0 auto; min-height: 0; }
.manage-page :deep(.el-table) {
  background-color: #fff; border-radius: 12px;
  box-shadow: 0 4px 16px rgba(184, 134, 11, 0.1);
  border: 1px solid var(--color-border);
}
.manage-page :deep(.el-table th) {
  background: linear-gradient(180deg, var(--color-bg-blue) 0%, var(--color-bg-blue-light) 100%) !important;
  color: var(--color-primary) !important; font-weight: 600;
  border-bottom: 2px solid var(--color-border);
}
.manage-page :deep(.el-table td) { border-bottom: 1px solid var(--color-border-light); }
.op-btns { display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; }
.manage-page :deep(.el-table__row:hover) { background-color: var(--color-bg-blue) !important; }
.manage-page :deep(.el-button--primary) {
  background: linear-gradient(180deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  border-color: var(--color-primary); color: #fff;
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
    position: relative; overflow: hidden; border-radius: 12px;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(184, 134, 11, 0.12);
    border: 1px solid var(--color-border);
  }
  .card-item {
    position: relative; z-index: 1; background: #fff;
    padding: 14px 16px; transition: transform 0.2s ease;
  }
  .card-swipe-actions {
    position: absolute; right: 0; top: 0; bottom: 0;
    display: flex; align-items: stretch;
  }
  .swipe-btn { width: 70px; border: none; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; }
  .swipe-btn-copy { background: var(--color-primary); }
  .swipe-btn-delete { background: var(--color-danger); }
  .card-main { display: flex; flex-direction: column; gap: 6px; }
  .card-row-top { display: flex; justify-content: space-between; align-items: center; }
  .card-user { font-weight: 600; color: var(--color-primary); font-size: 16px; }
  .card-info { font-size: 14px; color: var(--color-text); }
  .card-time { font-size: 13px; color: #6B5E55; }
  .pagination-container { justify-content: center; margin-top: 12px; }
}
</style>
