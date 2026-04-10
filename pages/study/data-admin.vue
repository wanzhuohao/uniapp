<template>
  <view class="admin-page">
    <view class="top-bar">
      <view class="back-btn" @click="goBack">←</view>
      <text class="title">数据维护</text>
      <view class="reload-btn" @click="loadData">刷新</view>
    </view>

    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="filter-group">
        <view :class="['type-btn', typeFilter === '' && 'active']" @click="typeFilter = ''">全部</view>
        <view :class="['type-btn', typeFilter === 'pinyin' && 'active']" @click="typeFilter = 'pinyin'">拼音</view>
        <view :class="['type-btn', typeFilter === 'stroke' && 'active']" @click="typeFilter = 'stroke'">笔顺</view>
      </view>
      <input class="search-input" v-model="search" placeholder="搜索汉字/拼音..." />
      <view class="add-btn" @click="startAdd">+ 新增</view>
    </view>

    <!-- 单元筛选 -->
    <view class="unit-filter">
      <view :class="['unit-btn', unitFilter === '' && 'active']" @click="unitFilter = ''">全部单元</view>
      <view v-for="u in 8" :key="u"
        :class="['unit-btn', unitFilter === '2-' + u && 'active']"
        @click="unitFilter = '2-' + u"
      >第{{ u }}</view>
    </view>

    <!-- 统计 -->
    <view class="stats">
      共 {{ list.length }} 条 · 筛选后 {{ filteredList.length }} 条
    </view>

    <!-- 列表 -->
    <scroll-view scroll-y class="list">
      <view v-if="loading" class="empty">加载中...</view>
      <view v-else-if="filteredList.length === 0" class="empty">无数据</view>
      <view v-else v-for="item in filteredList" :key="item._id" class="item" @click="startEdit(item)">
        <view class="item-main">
          <text class="item-char">{{ item.char }}</text>
          <view class="item-badges">
            <text class="badge type">{{ item.type === 'pinyin' ? '拼' : '笔' }}</text>
            <text class="badge unit">{{ item.unit }}</text>
          </view>
        </view>
        <view class="item-info">
          <text v-if="item.pinyin">{{ item.pinyin }}</text>
          <text v-if="item.radical"> · {{ item.radical }}部</text>
          <text v-if="item.structure"> · {{ item.structure }}</text>
          <text v-if="item.strokeCount"> · {{ item.strokeCount }}画</text>
        </view>
      </view>
    </scroll-view>

    <!-- 编辑弹窗 -->
    <view v-if="editing" class="modal-mask" @click="closeEdit">
      <view class="modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editMode === 'add' ? '新增题目' : '编辑题目' }}</text>
          <text class="modal-close" @click="closeEdit">×</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="field">
            <text class="label">类型 *</text>
            <view class="radio-group">
              <view :class="['radio', form.type === 'pinyin' && 'active']" @click="form.type = 'pinyin'">拼音题</view>
              <view :class="['radio', form.type === 'stroke' && 'active']" @click="form.type = 'stroke'">笔顺题</view>
            </view>
          </view>

          <view class="field">
            <text class="label">汉字 *</text>
            <input class="input" v-model="form.char" placeholder="如：花" maxlength="1" />
          </view>

          <view class="field">
            <text class="label">单元 *</text>
            <view class="unit-group">
              <view v-for="u in 8" :key="u"
                :class="['unit-tag', form.unit === '2-' + u && 'active']"
                @click="form.unit = '2-' + u"
              >第{{ u }}单元</view>
            </view>
          </view>

          <view class="field">
            <text class="label">拼音</text>
            <input class="input" v-model="form.pinyin" placeholder="如：huā" />
          </view>

          <view class="field">
            <text class="label">部首</text>
            <input class="input" v-model="form.radical" placeholder="如：艹" />
          </view>

          <view class="field">
            <text class="label">结构</text>
            <view class="radio-group wrap">
              <view v-for="s in ['上下','左右','独体','半包围','全包围','上中下','左中右']" :key="s"
                :class="['radio', form.structure === s && 'active']"
                @click="form.structure = s"
              >{{ s }}</view>
            </view>
          </view>

          <view class="field">
            <text class="label">笔画数</text>
            <input class="input" type="number" v-model="form.strokeCount" placeholder="如：7" />
          </view>

          <view v-if="form.type === 'pinyin'" class="field">
            <text class="label">拼音干扰项 (逗号分隔)</text>
            <input class="input" v-model="distractorsStr" placeholder="如：huà,huá,hā" />
          </view>

          <view v-if="form.type === 'pinyin'" class="field">
            <text class="label">汉字干扰项 (逗号分隔)</text>
            <input class="input" v-model="charDistractorsStr" placeholder="如：化,画,话" />
          </view>
        </scroll-view>

        <view class="modal-footer">
          <view v-if="editMode === 'edit'" class="btn danger" @click="handleDelete">删除</view>
          <view class="btn" @click="closeEdit">取消</view>
          <view class="btn primary" @click="handleSave">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { queryCollection, addDocument, updateDocument } from '../../utils/common/cloudDb.js'

const db = uniCloud.database()

const loading = ref(false)
const list = ref([])
const typeFilter = ref('')
const unitFilter = ref('')
const search = ref('')

const editing = ref(false)
const editMode = ref('add') // add | edit
const form = ref({})
const distractorsStr = ref('')
const charDistractorsStr = ref('')

const filteredList = computed(() => {
  let result = list.value
  if (typeFilter.value) {
    result = result.filter(i => i.type === typeFilter.value)
  }
  if (unitFilter.value) {
    result = result.filter(i => i.unit === unitFilter.value)
  }
  const q = search.value.trim()
  if (q) {
    result = result.filter(i =>
      i.char?.includes(q) || i.pinyin?.includes(q)
    )
  }
  return result
})

async function loadData() {
  loading.value = true
  try {
    // 直接查询所有题目（不走 getQuestions 的 type+unit 筛选）
    const res = await db.collection('questions').limit(500).get()
    list.value = res.result?.data || res.data || []
    // 排序：按 type + unit + char
    list.value.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type)
      if (a.unit !== b.unit) return (a.unit || '').localeCompare(b.unit || '')
      return (a.char || '').localeCompare(b.char || '')
    })
  } catch (e) {
    uni.showToast({ title: '加载失败: ' + e.message, icon: 'none' })
  }
  loading.value = false
}

function startAdd() {
  editMode.value = 'add'
  form.value = {
    _id: null,
    type: 'pinyin',
    char: '',
    unit: '2-1',
    pinyin: '',
    radical: '',
    structure: '',
    strokeCount: '',
    distractors: [],
    char_distractors: []
  }
  distractorsStr.value = ''
  charDistractorsStr.value = ''
  editing.value = true
}

function startEdit(item) {
  editMode.value = 'edit'
  form.value = { ...item }
  distractorsStr.value = (item.distractors || []).join(',')
  charDistractorsStr.value = (item.char_distractors || []).join(',')
  editing.value = true
}

function closeEdit() {
  editing.value = false
}

async function handleSave() {
  const f = form.value
  if (!f.char || !f.type || !f.unit) {
    uni.showToast({ title: '汉字、类型、单元必填', icon: 'none' })
    return
  }

  const data = {
    type: f.type,
    char: f.char,
    unit: f.unit,
    pinyin: f.pinyin || '',
    radical: f.radical || '',
    structure: f.structure || '',
    strokeCount: f.strokeCount ? Number(f.strokeCount) : null,
    distractors: distractorsStr.value.split(',').map(s => s.trim()).filter(Boolean),
    char_distractors: charDistractorsStr.value.split(',').map(s => s.trim()).filter(Boolean),
  }

  try {
    uni.showLoading({ title: '保存中...' })
    if (editMode.value === 'add') {
      await addDocument('questions', data)
      uni.showToast({ title: '新增成功', icon: 'success' })
    } else {
      await updateDocument('questions', f._id, data)
      uni.showToast({ title: '保存成功', icon: 'success' })
    }
    uni.hideLoading()
    editing.value = false
    await loadData()
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败: ' + e.message, icon: 'none' })
  }
}

async function handleDelete() {
  const confirmRes = await new Promise(resolve => {
    uni.showModal({
      title: '确认删除',
      content: `确定删除「${form.value.char}」吗？`,
      success: r => resolve(r.confirm)
    })
  })
  if (!confirmRes) return

  try {
    uni.showLoading({ title: '删除中...' })
    await db.collection('questions').doc(form.value._id).remove()
    uni.hideLoading()
    uni.showToast({ title: '已删除', icon: 'success' })
    editing.value = false
    await loadData()
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '删除失败: ' + e.message, icon: 'none' })
  }
}

function goBack() {
  uni.navigateBack()
}

onShow(() => {
  if (list.value.length === 0) loadData()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F7FA;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.back-btn {
  font-size: 36rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f0f0;
}
.back-btn:active { transform: scale(0.9); }
.title { font-size: 32rpx; font-weight: bold; }
.reload-btn {
  padding: 12rpx 24rpx;
  background: #607D8B;
  color: #fff;
  border-radius: 16rpx;
  font-size: 24rpx;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  gap: 8rpx;
}
.type-btn {
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  background: #f0f0f0;
  color: #666;
}
.type-btn.active {
  background: #607D8B;
  color: #fff;
}
.search-input {
  flex: 1;
  min-width: 200rpx;
  padding: 12rpx 20rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 20rpx;
  font-size: 26rpx;
}
.add-btn {
  padding: 12rpx 28rpx;
  background: #4CAF50;
  color: #fff;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: bold;
}
.add-btn:active { transform: scale(0.95); }

.stats {
  padding: 16rpx 32rpx;
  font-size: 24rpx;
  color: #888;
}

.list {
  flex: 1;
  padding: 0 24rpx 24rpx;
}
.empty {
  text-align: center;
  padding: 120rpx 32rpx;
  color: #aaa;
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  margin-bottom: 12rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04);
}
.item:active { transform: scale(0.98); }
.item-main {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.item-char {
  font-size: 56rpx;
  font-weight: bold;
  color: #333;
  line-height: 1;
}
.item-badges {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.badge {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  color: #fff;
}
.badge.type { background: #FFA726; }
.badge.unit { background: #42A5F5; }
.item-info {
  font-size: 24rpx;
  color: #666;
  text-align: right;
  max-width: 400rpx;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  width: 90%;
  max-width: 680rpx;
  max-height: 85vh;
  background: #fff;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #eee;
}
.modal-title { font-size: 32rpx; font-weight: bold; }
.modal-close {
  font-size: 48rpx;
  color: #999;
  width: 48rpx;
  height: 48rpx;
  line-height: 1;
  text-align: center;
}
.modal-body {
  padding: 24rpx 32rpx;
  flex: 1;
  max-height: 60vh;
}
.field {
  margin-bottom: 24rpx;
}
.label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
}
.input {
  width: 100%;
  padding: 16rpx 20rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: #fafafa;
}
.radio-group {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}
.radio-group.wrap {
  flex-wrap: wrap;
}
.radio {
  padding: 12rpx 24rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #666;
  background: #fff;
}
.radio.active {
  background: #607D8B;
  color: #fff;
  border-color: #607D8B;
}
.unit-group {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}
.unit-tag {
  padding: 10rpx 20rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #666;
}
.unit-tag.active {
  background: #42A5F5;
  color: #fff;
  border-color: #42A5F5;
}
.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #eee;
}
.btn {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: #f5f5f5;
  color: #666;
}
.btn.primary {
  background: #607D8B;
  color: #fff;
  font-weight: bold;
}
.btn.danger {
  background: #F44336;
  color: #fff;
}
</style>
