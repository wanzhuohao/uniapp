<template>
  <view class="wbp-page">
    <!-- 顶部栏：模式中显示 StarBar，未选模式时简易栏 -->
    <StarBar
      v-if="mode && !finishedMode"
      :current="currentIndex + 1"
      :total="totalCount"
      :stars="store.totalStars"
    />
    <view v-else class="top-bar">
      <view class="back-btn" @click="goBack">←</view>
      <text class="page-title">错题重练</text>
      <text class="placeholder"></text>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <!-- 类型选择 -->
    <view v-if="!loading && !mode" class="filter-area">
      <view v-if="totalUnmastered === 0" class="empty-state">
        <text class="empty-icon">🎉</text>
        <text v-if="!practiceAll" class="empty-text">今天没有待复习的错题</text>
        <text v-else class="empty-text">太棒了！没有错题！</text>
        <view v-if="!practiceAll" class="start-btn" @click="switchToAll">练全部错题</view>
        <view class="start-btn" style="margin-top: 16rpx; background: #888" @click="goBack">返回错题本</view>
      </view>
      <template v-else>
        <text class="filter-title">选择要重练的类型</text>
        <view v-if="!practiceAll" class="practice-mode-hint" @click="switchToAll">
          <text>📚 今日待复习</text>
          <text class="switch-link">切换到练全部 »</text>
        </view>
        <view v-else class="practice-mode-hint" @click="switchToDue">
          <text>📖 练全部错题</text>
          <text class="switch-link">切换到今日待复习 »</text>
        </view>
        <view class="type-cards">
          <view
            v-if="counts.pinyin > 0"
            class="type-card type-pinyin"
            @click="enterMode('pinyin')"
          >
            <text class="type-icon">🔤</text>
            <text class="type-name">拼音</text>
            <text class="type-count">{{ practiceAll ? '全部' : '今日' }} {{ counts.pinyin }} 题</text>
          </view>
          <view
            v-if="counts.hanzi > 0"
            class="type-card type-hanzi"
            @click="enterMode('hanzi')"
          >
            <text class="type-icon">🈶</text>
            <text class="type-name">汉字</text>
            <text class="type-count">{{ practiceAll ? '全部' : '今日' }} {{ counts.hanzi }} 题</text>
          </view>
        </view>
      </template>
    </view>

    <!-- 拼音重练 -->
    <view v-if="mode === 'pinyin' && !finishedMode && currentPinyinQ" class="quiz-wrap">
      <QuestionCard
        :key="'p-' + currentIndex"
        :question="currentPinyinQ.question"
        :questionType="currentPinyinQ.questionType"
        :options="currentPinyinQ.options"
        @answer="handlePinyinAnswer"
      />
    </view>

    <!-- 汉字重练 -->
    <HanziQuestion
      v-if="mode === 'hanzi' && !finishedMode && currentHanziQ"
      :question="currentHanziQ"
      @answer="handleHanziAnswer"
    />
    <!-- 完成态 -->
    <view v-if="finishedMode" class="finished-area">
      <text class="finished-icon">🏆</text>
      <text class="finished-text">本轮完成！</text>
      <text class="finished-stat">答对 {{ correctCount }} / {{ totalCount }}</text>
      <text v-if="masteredThisRound > 0" class="finished-mastered">本轮掌握 {{ masteredThisRound }} 题</text>
      <view class="result-actions">
        <view class="action-btn primary" @click="exitMode">返回选择</view>
        <view class="action-btn" @click="goBack">返回错题本</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StarBar from '../../components/study/StarBar.vue'
import QuestionCard from '../../components/study/QuestionCard.vue'
import HanziQuestion from '../../components/study/HanziQuestion.vue'
import { useGameStore } from '../../store/game.js'
import { useAuth } from '../../composables/common/useAuth.js'
import { getDueList, getAllWrongList, recordCorrect, recordWrongAgain } from '../../utils/study/wrongBook.js'
import { getQuestions } from '../../utils/common/cloudDb.js'
import { shuffle, sampleWithout } from '../../utils/study/questionHelper.js'

const store = useGameStore()
const { getUsername } = useAuth()

const ALL_STRUCTURES = ['上下', '左右', '独体', '半包围', '全包围']

const loading = ref(true)
const practiceAll = ref(false)  // true = 练全部, false = 只练待复习（默认）
const mode = ref('') // '' | 'pinyin' | 'hanzi'
const finishedMode = ref(false)

// 所有未掌握错题（按 type 分组）
const allWrong = ref({ pinyin: [], hanzi: [] })
// 云端补全的题目数据：questionId -> data
const questionDataMap = ref({})
// 单元 -> [items]，用于干扰项池
const unitPoolMap = ref({})

const counts = computed(() => ({
  pinyin: allWrong.value.pinyin.length,
  hanzi: allWrong.value.hanzi.length,
}))
const totalUnmastered = computed(() =>
  counts.value.pinyin + counts.value.hanzi
)

// 当前模式题列表
const currentIndex = ref(0)
const correctCount = ref(0)
const masteredThisRound = ref(0)

// 拼音队列
const pinyinQueue = ref([])
const currentPinyinQ = computed(() => pinyinQueue.value[currentIndex.value] || null)

// 汉字队列
const hanziQueue = ref([])
const currentHanziQ = computed(() => hanziQueue.value[currentIndex.value] || null)

const totalCount = computed(() => {
  if (mode.value === 'pinyin') return pinyinQueue.value.length
  if (mode.value === 'hanzi') return hanziQueue.value.length
  return 0
})

async function loadAllWrong() {
  loading.value = true
  const username = getUsername()
  if (!username) {
    loading.value = false
    return
  }
  try {
    const list = practiceAll.value
      ? await getAllWrongList(username)
      : await getDueList(username)
    const groups = { pinyin: [], hanzi: [] }
    for (const w of list) {
      if (w.type === 'pinyin') groups.pinyin.push(w)
      else if (w.type === 'hanzi' || w.type === 'stroke') groups.hanzi.push(w)
    }
    allWrong.value = groups
  } catch (e) {
    console.error('加载错题失败:', e)
  }
  loading.value = false
}

async function loadUnitData(units) {
  for (const unit of units) {
    if (unitPoolMap.value[unit]) continue
    try {
      const data = await getQuestions('pinyin', unit)
      if (data) {
        unitPoolMap.value[unit] = data
        for (const q of data) {
          questionDataMap.value[q._id] = q
        }
      }
    } catch (e) {
      console.error('拉取单元数据失败:', unit, e)
    }
  }
}

async function enterMode(type) {
  mode.value = type
  finishedMode.value = false
  currentIndex.value = 0
  correctCount.value = 0
  masteredThisRound.value = 0
  loading.value = true

  if (type === 'pinyin') {
    await preparePinyinMode()
  } else if (type === 'hanzi') {
    await prepareHanziMode()
  }
  loading.value = false
}

async function preparePinyinMode() {
  const records = allWrong.value.pinyin
  const units = [...new Set(records.map(r => r.unit).filter(Boolean))]
  await loadUnitData(units)

  const queue = []
  for (const w of records) {
    const item = questionDataMap.value[w.question_id]
    if (!item) continue
    const isTypeA = Math.random() > 0.5
    if (isTypeA) {
      const distractors = Array.isArray(item.distractors) ? item.distractors.slice(0, 3) : []
      while (distractors.length < 3) {
        const pool = unitPoolMap.value[item.unit] || []
        const cand = pool.filter(p => p.pinyin && p.pinyin !== item.pinyin && !distractors.includes(p.pinyin))
        if (cand.length === 0) break
        distractors.push(cand[Math.floor(Math.random() * cand.length)].pinyin)
      }
      const options = shuffle([
        { label: item.pinyin, value: item.pinyin, isCorrect: true },
        ...distractors.map(d => ({ label: d, value: d, isCorrect: false }))
      ])
      queue.push({ question: item.char, questionType: 'char', options, _wrong: w })
    } else {
      const distractors = Array.isArray(item.char_distractors) ? item.char_distractors.slice(0, 3) : []
      while (distractors.length < 3) {
        const pool = unitPoolMap.value[item.unit] || []
        const cand = pool.filter(p => p.char && p.char !== item.char && !distractors.includes(p.char))
        if (cand.length === 0) break
        distractors.push(cand[Math.floor(Math.random() * cand.length)].char)
      }
      const options = shuffle([
        { label: item.char, value: item.char, isCorrect: true },
        ...distractors.map(d => ({ label: d, value: d, isCorrect: false }))
      ])
      queue.push({ question: item.pinyin, questionType: 'pinyin', options, _wrong: w })
    }
  }
  pinyinQueue.value = queue
  if (queue.length === 0) finishMode()
}

async function prepareHanziMode() {
  const records = allWrong.value.hanzi
  const units = [...new Set(records.map(r => r.unit).filter(Boolean))]
  await loadUnitData(units)

  const allRadicals = [...new Set(
    Object.values(questionDataMap.value).map(d => d.radical).filter(Boolean)
  )]

  const queue = []
  for (const w of records) {
    const item = questionDataMap.value[w.question_id]
    if (!item) continue

    let qType = w.qType
    if (!qType || !['stroke', 'radical', 'structure', 'strokeCount'].includes(qType)) {
      const cands = []
      if (item.radical) cands.push('radical')
      if (item.structure) cands.push('structure')
      if (item.strokeCount) cands.push('strokeCount')
      if (cands.length === 0) cands.push('stroke')
      qType = cands[Math.floor(Math.random() * cands.length)]
    }

    const q = { qType, char: item.char, unit: item.unit, _wrong: w }
    if (qType === 'radical' && item.radical) {
      const distractors = sampleWithout(allRadicals.filter(r => r !== item.radical), 3)
      q.options = shuffle([
        { label: item.radical, isCorrect: true },
        ...distractors.map(d => ({ label: d, isCorrect: false }))
      ])
      q.hint = '这个字的部首是？'
    } else if (qType === 'structure' && item.structure) {
      const distractors = ALL_STRUCTURES.filter(s => s !== item.structure).slice(0, 3)
      q.options = shuffle([
        { label: item.structure, isCorrect: true },
        ...distractors.map(d => ({ label: d, isCorrect: false }))
      ])
      q.hint = '这个字是什么结构？'
    } else if (qType === 'strokeCount' && item.strokeCount) {
      const correct = item.strokeCount
      const distractors = [correct - 1, correct + 1, correct + 2].filter(n => n > 0 && n !== correct)
      q.options = shuffle([
        { label: correct + ' 画', isCorrect: true },
        ...distractors.slice(0, 3).map(d => ({ label: d + ' 画', isCorrect: false }))
      ])
      q.hint = '这个字有几画？'
    } else {
      q.qType = 'stroke'
      q.hint = '看着汉字想一想笔顺，然后看答案自测'
    }
    queue.push(q)
  }
  hanziQueue.value = queue
  if (queue.length === 0) {
    finishMode()
  }
}

// === 拼音答题 ===
async function handlePinyinAnswer({ correct }) {
  const q = currentPinyinQ.value
  if (!q) return
  const w = q._wrong
  if (correct) {
    correctCount.value++
    const r = await recordCorrect(w._id, w.box, w.correctCount || 0)
    if (r.mastered) masteredThisRound.value++
  } else {
    await recordWrongAgain(w._id, w.box, w.wrongCount || 0)
  }
  if (currentIndex.value < pinyinQueue.value.length - 1) {
    currentIndex.value++
  } else {
    finishMode()
  }
}

// === 汉字答题 ===
async function handleHanziAnswer({ isCorrect }) {
  const q = currentHanziQ.value
  if (!q) return
  const w = q._wrong
  if (isCorrect) {
    correctCount.value++
    const r = await recordCorrect(w._id, w.box, w.correctCount || 0)
    if (r.mastered) masteredThisRound.value++
  } else {
    await recordWrongAgain(w._id, w.box, w.wrongCount || 0)
  }
  advanceHanzi()
}

function advanceHanzi() {
  if (currentIndex.value < hanziQueue.value.length - 1) {
    currentIndex.value++
    // 组件 watch question.char 自动重置内部状态，无需手动 reset / initOutline
  } else {
    finishMode()
  }
}

function finishMode() {
  finishedMode.value = true
}

async function exitMode() {
  mode.value = ''
  finishedMode.value = false
  currentIndex.value = 0
  correctCount.value = 0
  masteredThisRound.value = 0
  pinyinQueue.value = []
  hanziQueue.value = []
  await loadAllWrong()
}

function goBack() {
  uni.navigateBack()
}

async function switchToAll() {
  practiceAll.value = true
  await loadAllWrong()
}
async function switchToDue() {
  practiceAll.value = false
  await loadAllWrong()
}

onMounted(() => {
  loadAllWrong()
})
</script>

<style scoped>
.wbp-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部栏（未进入模式时）*/
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #fff;
  border-radius: 0 0 var(--radius-card) var(--radius-card);
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
.page-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.placeholder { width: 56rpx; }

.loading {
  text-align: center;
  padding: 120rpx 0;
  color: #888;
  font-size: 28rpx;
}

/* 类型选择 */
.filter-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
}
.filter-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 32rpx;
  color: #333;
}
.practice-mode-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #F0F4FF;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  color: #666;
  width: 100%;
  max-width: 600rpx;
}
.switch-link {
  color: #667eea;
  font-weight: bold;
}
.switch-link:active { opacity: 0.6; }
.type-cards {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 100%;
  max-width: 600rpx;
}
.type-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 36rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
  border-left: 8rpx solid;
}
.type-card:active { transform: scale(0.98); opacity: 0.9; }
.type-pinyin { border-left-color: #FFA726; }
.type-hanzi { border-left-color: #42A5F5; }

.type-icon {
  font-size: 56rpx;
  flex-shrink: 0;
}
.type-name {
  flex: 1;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
.type-count {
  font-size: 26rpx;
  color: #888;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 32rpx;
}
.empty-icon { font-size: 100rpx; margin-bottom: 24rpx; }
.empty-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 32rpx;
}
.start-btn {
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #FFA726, #F57C00);
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
}
.start-btn:active { transform: scale(0.97); }

/* 拼音答题区 */
.quiz-wrap { padding: 16rpx 0; }

/* 完成态 */
.finished-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx;
}
.finished-icon { font-size: 120rpx; margin-bottom: 32rpx; }
.finished-text {
  font-size: 44rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}
.finished-stat {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 12rpx;
}
.finished-mastered {
  font-size: 28rpx;
  color: #66BB6A;
  font-weight: bold;
  margin-bottom: 16rpx;
}
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
  max-width: 500rpx;
  margin-top: 48rpx;
}
.action-btn {
  text-align: center;
  padding: 24rpx;
  border-radius: var(--radius-btn);
  font-size: 32rpx;
  font-weight: bold;
  background: #fff;
  border: 4rpx solid #E0E0E0;
}
.action-btn:active { transform: scale(0.97); }
.action-btn.primary {
  background: linear-gradient(135deg, #FFA726, #F57C00);
  color: #fff;
  border-color: #FFA726;
}
</style>
