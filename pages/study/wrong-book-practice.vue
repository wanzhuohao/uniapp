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
        <text class="empty-text">太棒了！没有未掌握的错题！</text>
        <view class="start-btn" @click="goBack">返回错题本</view>
      </view>
      <template v-else>
        <text class="filter-title">选择要重练的类型</text>
        <view class="type-cards">
          <view
            v-if="counts.pinyin > 0"
            class="type-card type-pinyin"
            @click="enterMode('pinyin')"
          >
            <text class="type-icon">🔤</text>
            <text class="type-name">拼音</text>
            <text class="type-count">{{ counts.pinyin }} 题待掌握</text>
          </view>
          <view
            v-if="counts.hanzi > 0"
            class="type-card type-hanzi"
            @click="enterMode('hanzi')"
          >
            <text class="type-icon">🈶</text>
            <text class="type-name">汉字</text>
            <text class="type-count">{{ counts.hanzi }} 题待掌握</text>
          </view>
          <view
            v-if="counts.math > 0"
            class="type-card type-math"
            @click="enterMode('math')"
          >
            <text class="type-icon">🔢</text>
            <text class="type-name">口算</text>
            <text class="type-count">{{ counts.math }} 题待掌握</text>
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
    <view v-if="mode === 'hanzi' && !finishedMode && currentHanziQ" class="quiz-area">
      <!-- 笔顺自测 -->
      <template v-if="currentHanziQ.qType === 'stroke'">
        <view class="type-badge stroke-badge">笔顺</view>
        <text class="hint-text">看着汉字想一想笔顺，然后看答案自测</text>
        <view class="char-outline-wrap">
          <view class="char-fallback" v-show="!outlineReady">{{ currentHanziQ.char }}</view>
          <view :id="outlineId" class="char-outline-target" v-show="outlineReady"></view>
        </view>
        <view class="speak-btn" @click="speakChar">🔊</view>
        <view v-if="!showAnswer" class="show-answer-btn" @click="revealAnswer">查看笔顺动画</view>
        <view v-if="showAnswer" class="answer-area">
          <text class="answer-hint">观察正确笔顺：</text>
          <view class="answer-btn" @click="replayAnim">▶ 重播动画</view>
        </view>
        <view v-if="showAnswer" class="self-judge">
          <view class="judge-btn wrong" @click="judgeSelf(false)">❌ 我不会</view>
          <view class="judge-btn correct" @click="judgeSelf(true)">✅ 我会了</view>
        </view>
      </template>

      <!-- 选择题型（部首/结构/笔画数）-->
      <template v-else>
        <view class="char-display">{{ currentHanziQ.char }}</view>
        <view class="speak-btn" @click="speakChar">🔊</view>
        <view class="type-badge" :class="currentHanziQ.qType + '-badge'">
          {{ qTypeLabel(currentHanziQ.qType) }}
        </view>
        <text class="hint-text">{{ currentHanziQ.hint }}</text>
        <view class="options-grid">
          <view
            v-for="(opt, i) in currentHanziQ.options"
            :key="i"
            :class="['option-btn',
              choiceState === 'correct' && opt.isCorrect && 'correct',
              choiceState === 'wrong' && selectedOpt === i && 'wrong',
              choiceState === 'wrong' && opt.isCorrect && 'correct']"
            @click="pickHanziOption(i)"
          >{{ opt.label }}</view>
        </view>
      </template>
    </view>

    <!-- 口算重练（一屏批量）-->
    <view v-if="mode === 'math' && !finishedMode" class="math-mode">
      <text class="math-tip">{{ mathSubmitted ? '已批改，查看结果后点完成' : '把所有错题再做一遍' }}</text>
      <scroll-view scroll-y class="question-list">
        <view
          v-for="(q, i) in mathQuestions"
          :key="i"
          class="q-row"
          :class="{ done: q.userAnswer !== '', checked: q.checked }"
        >
          <text class="q-index">{{ i + 1 }}.</text>
          <text class="q-expr">{{ q.expression }} =</text>
          <input
            class="q-input"
            type="number"
            :value="q.userAnswer"
            :disabled="mathSubmitted"
            placeholder="?"
            @input="onMathInput(i, $event)"
          />
          <text
            v-if="q.checked"
            class="q-result"
            :class="String(q.userAnswer) === String(q.answer) ? 'right' : 'wrong'"
          >{{ String(q.userAnswer) === String(q.answer) ? '✓' : '✗ ' + q.answer }}</text>
        </view>
      </scroll-view>
      <view class="submit-bar">
        <view v-if="!mathSubmitted" class="submit-btn" @click="submitMath">交卷</view>
        <view v-else class="submit-btn" @click="finishMode">完成</view>
      </view>
    </view>

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
import { ref, computed, nextTick, onMounted } from 'vue'
import HanziWriter from 'hanzi-writer'
import StarBar from '../../components/study/StarBar.vue'
import QuestionCard from '../../components/study/QuestionCard.vue'
import { useGameStore } from '../../store/game.js'
import { useAuth } from '../../composables/common/useAuth.js'
import { getUnmasteredList, recordCorrect, recordWrongAgain } from '../../utils/study/wrongBook.js'
import { getQuestions } from '../../utils/common/cloudDb.js'
import { shuffle, sampleWithout } from '../../utils/study/questionHelper.js'
import { speak } from '../../utils/common/speech.js'

const store = useGameStore()
const { getUsername } = useAuth()

const ALL_STRUCTURES = ['上下', '左右', '独体', '半包围', '全包围']

const loading = ref(true)
const mode = ref('') // '' | 'pinyin' | 'hanzi' | 'math'
const finishedMode = ref(false)

// 所有未掌握错题（按 type 分组）
const allWrong = ref({ pinyin: [], hanzi: [], math: [] })
// 云端补全的题目数据：questionId -> data
const questionDataMap = ref({})
// 单元 -> [items]，用于干扰项池
const unitPoolMap = ref({})

const counts = computed(() => ({
  pinyin: allWrong.value.pinyin.length,
  hanzi: allWrong.value.hanzi.length,
  math: allWrong.value.math.length,
}))
const totalUnmastered = computed(() =>
  counts.value.pinyin + counts.value.hanzi + counts.value.math
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
const choiceState = ref('')
const selectedOpt = ref(-1)
const showAnswer = ref(false)
const outlineId = ref('hz-' + Date.now())
const outlineReady = ref(false)
let writerInstance = null

// 口算队列
const mathQuestions = ref([])
const mathSubmitted = ref(false)

const totalCount = computed(() => {
  if (mode.value === 'pinyin') return pinyinQueue.value.length
  if (mode.value === 'hanzi') return hanziQueue.value.length
  if (mode.value === 'math') return mathQuestions.value.length
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
    const list = await getUnmasteredList(username)
    const groups = { pinyin: [], hanzi: [], math: [] }
    for (const w of list) {
      if (w.type === 'pinyin') groups.pinyin.push(w)
      else if (w.type === 'hanzi' || w.type === 'stroke') groups.hanzi.push(w)
      else if (w.type === 'math') groups.math.push(w)
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
  } else if (type === 'math') {
    prepareMathMode()
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
      q.hint = '想一想笔顺'
    }
    queue.push(q)
  }
  hanziQueue.value = queue
  resetHanziState()
  if (queue.length === 0) {
    finishMode()
  } else if (queue[0].qType === 'stroke') {
    nextTick(() => initOutline())
  }
}

function prepareMathMode() {
  const list = allWrong.value.math.map(w => {
    const m = (w.char || '').match(/^(.+?)\s*=\s*(.+)$/)
    return {
      expression: m ? m[1].trim() : (w.char || ''),
      answer: m ? m[2].trim() : '',
      userAnswer: '',
      checked: false,
      _wrong: w,
    }
  })
  mathQuestions.value = list
  mathSubmitted.value = false
  if (list.length === 0) finishMode()
}

// === 拼音答题 ===
async function handlePinyinAnswer({ correct }) {
  const q = currentPinyinQ.value
  if (!q) return
  const w = q._wrong
  if (correct) {
    correctCount.value++
    const r = await recordCorrect(w._id, w.correctCount || 0)
    if (r.mastered) masteredThisRound.value++
  } else {
    await recordWrongAgain(w._id, w.wrongCount || 0)
  }
  if (currentIndex.value < pinyinQueue.value.length - 1) {
    currentIndex.value++
  } else {
    finishMode()
  }
}

// === 汉字答题 ===
function pickHanziOption(i) {
  if (choiceState.value) return
  selectedOpt.value = i
  const q = currentHanziQ.value
  if (!q) return
  const isCorrect = q.options[i].isCorrect
  choiceState.value = isCorrect ? 'correct' : 'wrong'
  setTimeout(() => recordHanziResult(isCorrect), isCorrect ? 800 : 1500)
}

async function recordHanziResult(isCorrect) {
  const q = currentHanziQ.value
  if (!q) return
  const w = q._wrong
  if (isCorrect) {
    correctCount.value++
    const r = await recordCorrect(w._id, w.correctCount || 0)
    if (r.mastered) masteredThisRound.value++
  } else {
    await recordWrongAgain(w._id, w.wrongCount || 0)
  }
  advanceHanzi()
}

function advanceHanzi() {
  if (currentIndex.value < hanziQueue.value.length - 1) {
    currentIndex.value++
    resetHanziState()
    if (currentHanziQ.value?.qType === 'stroke') {
      nextTick(() => initOutline())
    }
  } else {
    finishMode()
  }
}

function resetHanziState() {
  choiceState.value = ''
  selectedOpt.value = -1
  showAnswer.value = false
}

async function initOutline() {
  outlineReady.value = false
  writerInstance = null
  await nextTick()
  const el = document.getElementById(outlineId.value)
  if (!el || !currentHanziQ.value) return
  el.innerHTML = ''
  try {
    writerInstance = HanziWriter.create(outlineId.value, currentHanziQ.value.char, {
      width: 200,
      height: 200,
      padding: 20,
      strokeColor: '#333',
      outlineColor: '#DDD',
      radicalColor: '#168F16',
      strokeAnimationSpeed: 1.5,
      delayBetweenStrokes: 400,
      showCharacter: true,
      showOutline: true,
      onLoadCharDataSuccess: () => { outlineReady.value = true },
      onLoadCharDataError: () => { outlineReady.value = false }
    })
  } catch (e) {
    outlineReady.value = false
  }
}

function revealAnswer() {
  showAnswer.value = true
  if (writerInstance) {
    try { writerInstance.animateCharacter() } catch (e) {}
  }
}

function replayAnim() {
  if (writerInstance) {
    try { writerInstance.animateCharacter() } catch (e) {}
  }
}

async function judgeSelf(isCorrect) {
  await recordHanziResult(isCorrect)
}

function speakChar() {
  if (currentHanziQ.value) speak(currentHanziQ.value.char)
}

function qTypeLabel(t) {
  return ({ radical: '部首', structure: '结构', strokeCount: '笔画数', stroke: '笔顺' })[t] || t
}

// === 口算答题 ===
function onMathInput(i, e) {
  mathQuestions.value[i].userAnswer = e.detail.value
}

async function submitMath() {
  mathSubmitted.value = true
  mathQuestions.value.forEach(q => { q.checked = true })

  const writes = []
  for (const q of mathQuestions.value) {
    const w = q._wrong
    const isRight = String(q.userAnswer) === String(q.answer) && q.userAnswer !== ''
    if (isRight) {
      correctCount.value++
      writes.push(
        recordCorrect(w._id, w.correctCount || 0).then(r => {
          if (r.mastered) masteredThisRound.value++
        })
      )
    } else {
      writes.push(recordWrongAgain(w._id, w.wrongCount || 0))
    }
  }
  try {
    await Promise.all(writes)
  } catch (e) {
    console.error('写入错题状态失败', e)
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
  mathQuestions.value = []
  mathSubmitted.value = false
  await loadAllWrong()
}

function goBack() {
  uni.navigateBack()
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
.type-math { border-left-color: #9C27B0; }
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

/* 汉字答题区（复刻 hanzi.vue 风格）*/
.quiz-area {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.char-display {
  font-size: 120rpx;
  font-weight: bold;
  text-align: center;
  color: #333;
  min-height: 140rpx;
  line-height: 1.3;
}
.speak-btn {
  margin: 12rpx 0;
  font-size: 44rpx;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E3F2FD;
  border-radius: 50%;
}
.speak-btn:active { transform: scale(0.9); }
.type-badge {
  text-align: center;
  font-size: 24rpx;
  font-weight: bold;
  padding: 6rpx 24rpx;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  display: inline-block;
}
.stroke-badge { background: #E3F2FD; color: #1565C0; }
.radical-badge { background: #FFF3E0; color: #E65100; }
.structure-badge { background: #E8F5E9; color: #2E7D32; }
.strokeCount-badge { background: #F3E5F5; color: #7B1FA2; }
.hint-text {
  text-align: center;
  color: #888;
  font-size: 28rpx;
  margin-bottom: 24rpx;
}
.char-outline-wrap {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 16rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
  overflow: hidden;
}
.char-outline-target {
  width: 200px;
  height: 200px;
  line-height: 0;
}
.char-outline-target :deep(svg) { display: block; }
.char-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 150px;
  font-weight: bold;
  color: #DDD;
  line-height: 1;
  font-family: "KaiTi", "楷体", "STKaiti", serif;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  padding: 0 24rpx;
  width: 100%;
}
.option-btn {
  background: #fff;
  border: 3rpx solid #BDBDBD;
  border-radius: 20rpx;
  padding: 32rpx 16rpx;
  text-align: center;
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  transition: all 0.2s;
}
.option-btn:active { transform: scale(0.96); }
.option-btn.correct {
  border-color: #66BB6A;
  background: #E8F5E9;
  color: #2E7D32;
  box-shadow: 0 0 0 4rpx rgba(102,187,106,0.3);
}
.option-btn.wrong {
  border-color: #EF5350;
  background: #FFEBEE;
  color: #C62828;
  box-shadow: 0 0 0 4rpx rgba(239,83,80,0.3);
}

.show-answer-btn {
  margin-top: 32rpx;
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #42A5F5, #1E88E5);
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(66,165,245,0.3);
}
.show-answer-btn:active { transform: scale(0.97); }
.answer-area {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.answer-hint {
  font-size: 28rpx;
  color: #666;
}
.answer-btn {
  padding: 16rpx 48rpx;
  background: #E3F2FD;
  color: #1565C0;
  border-radius: 24rpx;
  font-size: 28rpx;
}
.self-judge {
  display: flex;
  gap: 32rpx;
  margin-top: 32rpx;
  justify-content: center;
}
.judge-btn {
  padding: 28rpx 56rpx;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: 3rpx solid;
  box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08);
}
.judge-btn:active { transform: scale(0.95); }
.judge-btn.correct {
  background: #E8F5E9;
  color: #2E7D32;
  border-color: #66BB6A;
}
.judge-btn.wrong {
  background: #FFEBEE;
  color: #C62828;
  border-color: #EF5350;
}

/* 口算批量模式 */
.math-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.math-tip {
  text-align: center;
  font-size: 26rpx;
  color: #888;
  padding: 24rpx 0 8rpx;
}
.question-list {
  flex: 1;
  padding: 16rpx 24rpx 140rpx;
}
.q-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 12rpx;
  background: #fff;
  border-radius: 16rpx;
  border-left: 6rpx solid transparent;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.q-row.done { border-left-color: #9C27B0; }
.q-row.checked { background: #FAFAFA; }
.q-index {
  font-size: 24rpx;
  color: #999;
  width: 56rpx;
  text-align: right;
}
.q-expr {
  font-size: 36rpx;
  font-weight: bold;
  min-width: 200rpx;
}
.q-input {
  width: 120rpx;
  height: 64rpx;
  border: 4rpx solid #E0E0E0;
  border-radius: 12rpx;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
}
.q-result {
  font-size: 28rpx;
  margin-left: 12rpx;
  font-weight: bold;
}
.q-result.right { color: #2E7D32; }
.q-result.wrong { color: #C62828; }

.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 48rpx;
  background: #fff;
  box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06);
  z-index: 10;
}
.submit-btn {
  text-align: center;
  padding: 24rpx;
  background: #9C27B0;
  color: #fff;
  border-radius: var(--radius-btn);
  font-size: 32rpx;
  font-weight: bold;
}
.submit-btn:active { transform: scale(0.97); }

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
