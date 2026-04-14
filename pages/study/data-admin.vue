<template>
  <view class="admin-page">
    <TopBar title="数据维护">
      <template #right>
        <text class="reload-btn" @click="loadData">刷新</text>
      </template>
    </TopBar>

    <!-- 工具栏 -->
    <view class="toolbar">
      <input class="search-input" v-model="search" placeholder="搜索汉字/拼音..." />
      <view class="add-btn" @click="startAdd">+ 新增</view>
    </view>

    <!-- 单元筛选 -->
    <scroll-view scroll-x class="unit-filter" :show-scrollbar="false">
      <view class="unit-filter-inner">
        <view :class="['unit-chip', unitFilter === '' && 'active']" @click="unitFilter = ''">全部</view>
        <view v-for="u in 8" :key="u"
          :class="['unit-chip', unitFilter === '2-' + u && 'active']"
          @click="unitFilter = '2-' + u"
        >第{{ u }}单元</view>
      </view>
    </scroll-view>

    <view class="stats">共 {{ list.length }} · 筛选 {{ filteredList.length }}</view>

    <scroll-view scroll-y class="list">
      <view v-if="loading" class="empty">加载中...</view>
      <view v-else-if="filteredList.length === 0" class="empty">无数据</view>
      <view v-else v-for="item in filteredList" :key="item._id || item.char" class="item" @click="startEdit(item)">
        <text class="item-char">{{ item.char }}</text>
        <view class="item-info">
          <text class="line1">{{ item.pinyin }} · {{ item.radical }}部 · {{ item.structure }} · {{ item.strokeCount }}画</text>
          <text v-if="item.strokes && item.strokes.length" class="line2">笔顺: {{ item.strokes.join(' ') }}</text>
          <text class="line3">{{ item.unit }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 编辑弹窗 -->
    <view v-if="editing" class="modal-mask" @click="closeEdit">
      <view class="modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editMode === 'add' ? '新增汉字' : '编辑汉字' }}</text>
          <text class="modal-close" @click="closeEdit">×</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="field">
            <text class="label">汉字 *</text>
            <input class="input big" v-model="form.char" placeholder="如：花" maxlength="1" />
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

          <view class="field">
            <text class="label">笔顺（逗号分隔）</text>
            <input class="input" v-model="strokesStr" placeholder="如：横,竖,竖,撇,竖,折,横" />
            <text class="hint">基本笔画: 横 竖 撇 捺 点 折 提</text>
          </view>

          <view class="field">
            <text class="label">拼音干扰项（逗号分隔）</text>
            <input class="input" v-model="distractorsStr" placeholder="如：huà,huá,hā" />
          </view>

          <view class="field">
            <text class="label">汉字干扰项（逗号分隔）</text>
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
import TopBar from '../../components/common/TopBar.vue'
import { toast } from '../../utils/common/toast.js'

const db = uniCloud.database()

const loading = ref(false)
const list = ref([])
const unitFilter = ref('')
const search = ref('')

const editing = ref(false)
const editMode = ref('add')
const form = ref({})
const strokesStr = ref('')
const distractorsStr = ref('')
const charDistractorsStr = ref('')

const filteredList = computed(() => {
  let result = list.value
  if (unitFilter.value) {
    result = result.filter(i => i.unit === unitFilter.value)
  }
  const q = search.value.trim()
  if (q) {
    result = result.filter(i => i.char?.includes(q) || i.pinyin?.includes(q))
  }
  return result
})

async function loadData() {
  loading.value = true
  // 清除答题页的题库缓存，确保下次练习拉最新数据
  try {
    const keys = uni.getStorageInfoSync().keys || []
    keys.filter(k => k.startsWith('questions_')).forEach(k => uni.removeStorageSync(k))
  } catch (e) {}
  try {
    const res = await db.collection('questions').limit(500).get()
    const raw = res.result?.data || res.data || []
    // 按 type+unit 写入答题缓存
    const groups = {}
    for (const r of raw) {
      const key = `questions_${r.type}_${r.unit}`
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }
    for (const [key, data] of Object.entries(groups)) {
      uni.setStorageSync(key, { data, cachedAt: Date.now() })
    }
    // 按 char 合并：一个汉字一条记录
    const byChar = {}
    for (const r of raw) {
      const ch = r.char
      if (!byChar[ch]) {
        byChar[ch] = {
          _ids: [],
          char: ch,
          unit: r.unit,
          pinyin: '',
          radical: '',
          structure: '',
          strokeCount: null,
          distractors: [],
          char_distractors: [],
          strokes: []
        }
      }
      const merged = byChar[ch]
      merged._ids.push({ id: r._id, type: r.type })
      merged.unit = merged.unit || r.unit
      if (r.pinyin) merged.pinyin = r.pinyin
      if (r.radical) merged.radical = r.radical
      if (r.structure) merged.structure = r.structure
      if (r.strokeCount) merged.strokeCount = r.strokeCount
      if (r.distractors?.length) merged.distractors = r.distractors
      if (r.char_distractors?.length) merged.char_distractors = r.char_distractors
      if (r.strokes?.length) merged.strokes = r.strokes
    }
    list.value = Object.values(byChar).sort((a, b) => {
      if (a.unit !== b.unit) return (a.unit || '').localeCompare(b.unit || '')
      return (a.char || '').localeCompare(b.char || '')
    })
  } catch (e) {
    toast.error('加载失败: ' + e.message)
  }
  loading.value = false
}

function startAdd() {
  editMode.value = 'add'
  form.value = {
    _ids: [],
    char: '',
    unit: '2-1',
    pinyin: '',
    radical: '',
    structure: '',
    strokeCount: '',
    distractors: [],
    char_distractors: [],
    strokes: []
  }
  strokesStr.value = ''
  distractorsStr.value = ''
  charDistractorsStr.value = ''
  editing.value = true
}

function startEdit(item) {
  editMode.value = 'edit'
  form.value = { ...item }
  strokesStr.value = (item.strokes || []).join(',')
  distractorsStr.value = (item.distractors || []).join(',')
  charDistractorsStr.value = (item.char_distractors || []).join(',')
  editing.value = true
}

function closeEdit() {
  editing.value = false
}

async function handleSave() {
  const f = form.value
  if (!f.char || !f.unit) {
    toast.error('汉字、单元必填')
    return
  }

  // 按 type 构建对应字段，避免字段污染
  const buildByType = (type) => {
    const common = {
      char: f.char,
      unit: f.unit,
      type,
      pinyin: f.pinyin || '',
      radical: f.radical || '',
      structure: f.structure || '',
      strokeCount: f.strokeCount ? Number(f.strokeCount) : null,
    }
    if (type === 'pinyin') {
      return {
        ...common,
        distractors: distractorsStr.value.split(',').map(s => s.trim()).filter(Boolean),
        char_distractors: charDistractorsStr.value.split(',').map(s => s.trim()).filter(Boolean),
      }
    }
    if (type === 'stroke') {
      return {
        ...common,
        strokes: strokesStr.value.split(',').map(s => s.trim()).filter(Boolean),
      }
    }
    return common
  }

  try {
    toast.loading('保存中...')

    if (editMode.value === 'add') {
      await db.collection('questions').add(buildByType('pinyin'))
      const strokes = strokesStr.value.split(',').map(s => s.trim()).filter(Boolean)
      if (strokes.length) {
        await db.collection('questions').add(buildByType('stroke'))
      }
      toast.success('新增成功')
    } else {
      for (const { id, type } of f._ids) {
        await db.collection('questions').doc(id).update(buildByType(type))
      }
      // 原无 stroke 记录但新填了笔顺，补一条
      const hasStrokeRow = f._ids.some(x => x.type === 'stroke')
      const strokes = strokesStr.value.split(',').map(s => s.trim()).filter(Boolean)
      if (!hasStrokeRow && strokes.length > 0) {
        await db.collection('questions').add(buildByType('stroke'))
      }
      toast.success('保存成功')
    }

    // 清除本地缓存让其他页面拉到新数据
    try {
      uni.removeStorageSync('questions_pinyin_' + f.unit)
      uni.removeStorageSync('questions_stroke_' + f.unit)
    } catch (e) {}

    toast.hideLoading()
    editing.value = false
    await loadData()
  } catch (e) {
    toast.hideLoading()
    toast.error('保存失败: ' + e.message)
  }
}

async function handleDelete() {
  const confirmRes = await new Promise(resolve => {
    uni.showModal({
      title: '确认删除',
      content: `确定删除「${form.value.char}」及其所有题目吗？`,
      success: r => resolve(r.confirm)
    })
  })
  if (!confirmRes) return

  try {
    toast.loading('删除中...')
    for (const { id } of form.value._ids) {
      await db.collection('questions').doc(id).remove()
    }
    // 清理本地缓存，避免删除后重练/练习仍读到旧题
    try {
      uni.removeStorageSync('questions_pinyin_' + form.value.unit)
      uni.removeStorageSync('questions_stroke_' + form.value.unit)
    } catch (e) {}
    toast.hideLoading()
    toast.success('已删除')
    editing.value = false
    await loadData()
  } catch (e) {
    toast.hideLoading()
    toast.error('删除失败: ' + e.message)
  }
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
}
.search-input {
  flex: 1;
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

.unit-filter {
  background: #fff;
  border-bottom: 1rpx solid #eee;
  white-space: nowrap;
}
.unit-filter-inner {
  display: inline-flex;
  gap: 12rpx;
  padding: 20rpx 24rpx;
}
.unit-chip {
  flex-shrink: 0;
  padding: 14rpx 28rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  background: #F0F2F5;
  color: #666;
  transition: all 0.15s;
}
.unit-chip:active { transform: scale(0.95); }
.unit-chip.active {
  background: linear-gradient(135deg, #42A5F5, #1E88E5);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(66,165,245,0.3);
}

.stats {
  padding: 12rpx 32rpx;
  font-size: 22rpx;
  color: #888;
}

.list { flex: 1; padding: 0 24rpx 24rpx; }
.empty { text-align: center; padding: 120rpx 32rpx; color: #aaa; }

.item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 12rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04);
}
.item:active { transform: scale(0.98); }
.item-char {
  font-size: 64rpx;
  font-weight: bold;
  color: #333;
  line-height: 1;
  width: 80rpx;
  text-align: center;
  flex-shrink: 0;
}
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}
.line1 { font-size: 26rpx; color: #333; font-weight: 500; }
.line2 { font-size: 22rpx; color: #666; }
.line3 { font-size: 22rpx; color: #42A5F5; }

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
.modal-close { font-size: 48rpx; color: #999; width: 48rpx; height: 48rpx; line-height: 1; text-align: center; }
.modal-body { padding: 24rpx 32rpx; flex: 1; max-height: 60vh; }
.field { margin-bottom: 24rpx; }
.label { display: block; font-size: 26rpx; color: #666; margin-bottom: 10rpx; }
.hint { display: block; font-size: 22rpx; color: #aaa; margin-top: 6rpx; }
.input {
  width: 100%;
  padding: 16rpx 20rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: #fafafa;
}
.input.big { font-size: 48rpx; text-align: center; font-weight: bold; }
.radio-group { display: flex; gap: 12rpx; flex-wrap: wrap; }
.radio {
  padding: 12rpx 24rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #666;
  background: #fff;
}
.radio.active { background: #607D8B; color: #fff; border-color: #607D8B; }
.unit-group { display: flex; gap: 8rpx; flex-wrap: wrap; }
.unit-tag {
  padding: 10rpx 20rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #666;
}
.unit-tag.active { background: #42A5F5; color: #fff; border-color: #42A5F5; }

.modal-footer { display: flex; gap: 16rpx; padding: 24rpx 32rpx; border-top: 1rpx solid #eee; }
.btn {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: #f5f5f5;
  color: #666;
}
.btn.primary { background: #607D8B; color: #fff; font-weight: bold; }
.btn.danger { background: #F44336; color: #fff; }
</style>
