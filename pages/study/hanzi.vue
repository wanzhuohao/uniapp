<template>
  <view class="hanzi-page">
    <StarBar :current="currentIndex + 1" :total="totalQuestions" :stars="store.totalStars" />

    <!-- 题型筛选 -->
    <view v-if="!started" class="filter-area">
      <!-- 单元选择 -->
      <text class="filter-title">选择单元</text>
      <view class="unit-tags">
        <view v-for="u in 8" :key="u"
          :class="['unit-tag', store.currentUnit === '2-' + u && 'active']"
          @click="store.setUnit('2-' + u)"
        >第{{ u }}单元</view>
      </view>

      <!-- 题型选择 -->
      <text class="filter-title" style="margin-top: 32rpx;">选择题型</text>
      <view class="filter-tags">
        <view :class="['filter-tag', filterType === '' && 'active']" @click="filterType = ''">全部混合</view>
        <view :class="['filter-tag', filterType === 'stroke' && 'active']" @click="filterType = 'stroke'">笔顺</view>
        <view :class="['filter-tag', filterType === 'radical' && 'active']" @click="filterType = 'radical'">部首</view>
        <view :class="['filter-tag', filterType === 'structure' && 'active']" @click="filterType = 'structure'">结构</view>
        <view :class="['filter-tag', filterType === 'strokeCount' && 'active']" @click="filterType = 'strokeCount'">笔画数</view>
      </view>
      <view class="start-btn" @click="startRound">开始练习</view>
    </view>

    <!-- 空状态 -->
    <view v-if="started && totalQuestions === 0" class="empty-hint">
      <text>本单元暂无汉字题目</text>
      <view class="back-btn" @click="goBack">返回</view>
    </view>

    <!-- 汉字题（笔顺自测 / 部首/结构/笔画数 选择题）-->
    <HanziQuestion
      v-if="started && currentQ"
      :question="currentQ"
      @answer="handleAnswer"
    />

  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useGameStore } from '../../store/game.js'
import { sampleWithout, shuffle } from '../../utils/study/questionHelper.js'
import { getQuestions } from '../../utils/common/cloudDb.js'
import { recordWrong } from '../../utils/study/wrongBook.js'
import { recordPractice } from '../../utils/study/practiceLog.js'
import { useAuth } from '../../composables/common/useAuth.js'
import StarBar from '../../components/study/StarBar.vue'
import HanziQuestion from '../../components/study/HanziQuestion.vue'
import pinyinData from '../../static/data/pinyin.json'
import strokesData from '../../static/data/strokes.json'

const store = useGameStore()
const { getUsername } = useAuth()

const filterType = ref('')
const started = ref(false)
const currentIndex = ref(0)
const correctCount = ref(0)
const recordedWrongIds = new Set()
const roundFinished = ref(false)
const isCloudData = ref(false)

// 出题数据
const questions = ref([])
const totalQuestions = computed(() => questions.value.length)
const currentQ = computed(() => questions.value[currentIndex.value] || null)

// 所有结构选项
const ALL_STRUCTURES = ['上下', '左右', '独体', '半包围', '全包围']
// 所有部首（从题库中提取常见部首）
const ALL_RADICALS = ref([])

function handleAnswer({ isCorrect }) {
  if (isCorrect) {
    correctCount.value++
  } else {
    const q = currentQ.value
    if (q?._id && !recordedWrongIds.has(q._id)) {
      recordedWrongIds.add(q._id)
      recordWrong(getUsername(), {
        type: 'hanzi',
        char: q.char,
        unit: q.unit,
        question_id: q._id,
        qType: q.qType
      })
    }
  }
  advanceQuestion()
}

// 按课文顺序为每个字生成一道题
function buildRound(charData, strokeData) {
  const unit = store.currentUnit
  const chars = charData.filter(d => d.unit === unit && d.radical && d.structure)
  const strokes = strokeData.filter(d => d.unit === unit)

  // 收集所有部首（用于干扰项）
  ALL_RADICALS.value = [...new Set(charData.map(d => d.radical).filter(Boolean))]

  const types = filterType.value ? [filterType.value] : ['stroke', 'radical', 'structure', 'strokeCount']

  // 合并 strokes 和 chars，按课文顺序（数据文件原始顺序）去重
  const seen = new Set()
  const allChars = []
  for (const s of strokes) {
    if (!seen.has(s.char)) { seen.add(s.char); allChars.push(s) }
  }
  for (const c of chars) {
    if (!seen.has(c.char)) { seen.add(c.char); allChars.push(c) }
  }

  const pool = []
  for (const c of allChars) {
    // 单一题型：每个字出该题型；混合：随机分配一种
    const qType = types.length === 1 ? types[0] : types[Math.floor(Math.random() * types.length)]
    const q = buildQuestion(c, qType)
    if (q) pool.push(q)
  }
  return pool
}

function buildQuestion(c, qType) {
  if (qType === 'stroke') {
    return { qType: 'stroke', char: c.char, unit: c.unit, _id: c._id }
  }
  if (qType === 'radical' && c.radical) {
    const correct = c.radical
    const distractors = sampleWithout(ALL_RADICALS.value.filter(r => r !== correct), 3)
    const options = shuffle([
      { label: correct, isCorrect: true },
      ...distractors.map(d => ({ label: d, isCorrect: false }))
    ])
    return { qType: 'radical', char: c.char, options, unit: c.unit, _id: c._id, hint: '这个字的部首是？' }
  }
  if (qType === 'structure' && c.structure) {
    const correct = c.structure
    const distractors = ALL_STRUCTURES.filter(s => s !== correct).slice(0, 3)
    const options = shuffle([
      { label: correct, isCorrect: true },
      ...distractors.map(d => ({ label: d, isCorrect: false }))
    ])
    return { qType: 'structure', char: c.char, options, unit: c.unit, _id: c._id, hint: '这个字是什么结构？' }
  }
  if (qType === 'strokeCount' && c.strokeCount) {
    const correct = c.strokeCount
    const distractors = [correct - 1, correct + 1, correct + 2].filter(n => n > 0 && n !== correct)
    const options = shuffle([
      { label: correct + ' 画', isCorrect: true },
      ...distractors.slice(0, 3).map(d => ({ label: d + ' 画', isCorrect: false }))
    ])
    return { qType: 'strokeCount', char: c.char, options, unit: c.unit, _id: c._id, hint: '这个字有几画？' }
  }
  // 该字缺少对应题型数据，降级为笔顺题
  return { qType: 'stroke', char: c.char, unit: c.unit, _id: c._id }
}

async function startRound() {
  // 优先从云端拉取，带 _id 以便记录错题
  let pinyinSource = pinyinData
  let strokeSource = strokesData
  try {
    const cloudPinyin = await getQuestions('pinyin', store.currentUnit)
    if (Array.isArray(cloudPinyin) && cloudPinyin.length > 0) {
      pinyinSource = cloudPinyin
      isCloudData.value = true
    }
    const cloudStroke = await getQuestions('stroke', store.currentUnit)
    if (Array.isArray(cloudStroke) && cloudStroke.length > 0) {
      strokeSource = cloudStroke
      isCloudData.value = true
    }
  } catch (e) {
    console.error('云端题库拉取失败，降级本地', e)
  }
  questions.value = buildRound(pinyinSource, strokeSource)
  currentIndex.value = 0
  correctCount.value = 0
  recordedWrongIds.clear()
  started.value = true
}

function advanceQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
  } else {
    // 轮次结束
    const earned = correctCount.value + (correctCount.value === totalQuestions.value ? 3 : 0)
    const oldTotal = store.totalStars
    store.addStars(earned)
    roundFinished.value = true
    recordPractice(getUsername(), { type: 'hanzi', totalCount: totalQuestions.value, correctCount: correctCount.value })
    uni.navigateTo({
      url: `/pages/study/result?module=hanzi&correct=${correctCount.value}&total=${totalQuestions.value}&earned=${earned}&oldTotal=${oldTotal}`
    })
  }
}

function goBack() {
  uni.navigateBack()
}

onShow(() => {
  if (roundFinished.value) {
    started.value = false
    roundFinished.value = false
  }
})
</script>

<style scoped>
.hanzi-page { min-height: 100vh; }

/* 筛选区 */
.filter-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
}
.unit-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: center;
  margin-bottom: 16rpx;
}
.unit-tag {
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  background: #fff;
  color: #666;
  border: 3rpx solid #E0E0E0;
}
.unit-tag:active { transform: scale(0.95); }
.unit-tag.active {
  background: #42A5F5;
  color: #fff;
  border-color: #42A5F5;
  font-weight: bold;
}
.filter-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 32rpx;
}
.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  justify-content: center;
  margin-bottom: 48rpx;
}
.filter-tag {
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  background: #fff;
  color: #666;
  border: 3rpx solid #BDBDBD;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
}
.filter-tag:active { transform: scale(0.95); }
.filter-tag.active {
  background: #42A5F5;
  color: #fff;
  border-color: #42A5F5;
  font-weight: bold;
}
.start-btn {
  padding: 24rpx 100rpx;
  background: linear-gradient(135deg, #42A5F5, #1E88E5);
  color: #fff;
  border-radius: 40rpx;
  font-size: 34rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(66,165,245,0.3);
}
.start-btn:active { transform: scale(0.97); }

.empty-hint {
  display: flex; flex-direction: column; align-items: center;
  padding: 120rpx 48rpx; color: #888; font-size: 32rpx;
}
.back-btn {
  margin-top: 32rpx; padding: 20rpx 48rpx;
  background: #42A5F5; color: #fff; border-radius: 20rpx; font-size: 28rpx;
}

</style>
