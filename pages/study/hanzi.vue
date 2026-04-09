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

    <!-- 笔顺题型 -->
    <view v-if="started && currentQ && currentQ.qType === 'stroke' && !showAnim" class="quiz-area">
      <view class="char-outline-wrap">
        <view :id="outlineId" class="char-outline-target"></view>
      </view>
      <view class="speak-btn" @click="speakChar">🔊</view>
      <view class="type-badge stroke-badge">笔顺</view>
      <text class="hint-text">按正确笔顺依次点击笔画</text>

      <view class="selected-area">
        <view v-for="(s, i) in selectedStrokes" :key="i" class="selected-item">
          <text class="selected-num">{{ i + 1 }}</text>
          <text class="selected-name">{{ s }}</text>
        </view>
        <view v-if="selectedStrokes.length === 0" class="selected-placeholder">
          <text>点击下方笔画按钮</text>
        </view>
      </view>

      <view v-if="feedback" class="feedback" :class="feedbackType">{{ feedback }}</view>

      <view class="stroke-pool">
        <view v-for="(s, i) in shuffledStrokes" :key="'p-'+i"
          :class="['stroke-btn', usedIndexes.includes(i) && 'used', wrongBtn === i && 'wrong']"
          @click="pickStroke(i)">{{ s }}</view>
      </view>
      <view class="action-row">
        <view class="clear-btn" @click="clearStroke">清空重选</view>
      </view>
    </view>

    <!-- 选择题型（部首/结构/笔画数）-->
    <view v-if="started && currentQ && ['radical','structure','strokeCount'].includes(currentQ.qType) && !showAnim" class="quiz-area">
      <view class="char-display">{{ currentQ.char }}</view>
      <view class="speak-btn" @click="speakChar">🔊</view>
      <view class="type-badge" :class="currentQ.qType + '-badge'">
        {{ { radical: '部首', structure: '结构', strokeCount: '笔画数' }[currentQ.qType] }}
      </view>
      <text class="hint-text">{{ currentQ.hint }}</text>

      <view class="options-grid">
        <view v-for="(opt, i) in currentQ.options" :key="i"
          :class="['option-btn', choiceState === 'correct' && opt.isCorrect && 'correct',
                    choiceState === 'wrong' && selectedOpt === i && 'wrong',
                    choiceState === 'wrong' && opt.isCorrect && 'correct']"
          @click="pickOption(i)">{{ opt.label }}</view>
      </view>
    </view>

    <!-- 笔顺动画 -->
    <StrokeAnim v-if="showAnim && currentQ" :char="currentQ.char" :autoPlay="true" @complete="onAnimComplete" />
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import HanziWriter from 'hanzi-writer'
import { useGameStore } from '../../store/game.js'
import { sampleWithout, shuffle } from '../../utils/study/questionHelper.js'
import { speak } from '../../utils/common/speech.js'
import { getQuestions } from '../../utils/common/cloudDb.js'
import { recordWrong } from '../../utils/study/wrongBook.js'
import { recordPractice } from '../../utils/study/practiceLog.js'
import { useAuth } from '../../composables/common/useAuth.js'
import StarBar from '../../components/study/StarBar.vue'
import StrokeAnim from '../../components/study/StrokeAnim.vue'
import pinyinData from '../../static/data/pinyin.json'
import strokesData from '../../static/data/strokes.json'

const store = useGameStore()
const { getUsername } = useAuth()

const filterType = ref('')
const started = ref(false)
const currentIndex = ref(0)
const correctCount = ref(0)
const roundFinished = ref(false)
const showAnim = ref(false)
const isCloudData = ref(false)

// 出题数据
const questions = ref([])
const totalQuestions = computed(() => questions.value.length)
const currentQ = computed(() => questions.value[currentIndex.value] || null)

// 笔顺题状态
const selectedStrokes = ref([])
const usedIndexes = ref([])
const shuffledStrokes = ref([])
const feedback = ref('')
const feedbackType = ref('')
const wrongBtn = ref(-1)

// 选择题状态
const choiceState = ref('')
const selectedOpt = ref(-1)

// HanziWriter
const outlineId = ref('hz-' + Date.now())

// 所有结构选项
const ALL_STRUCTURES = ['上下', '左右', '独体', '半包围', '全包围']
// 所有部首（从题库中提取常见部首）
const ALL_RADICALS = ref([])

async function initOutline() {
  await nextTick()
  const el = document.getElementById(outlineId.value)
  if (!el || !currentQ.value) return
  el.innerHTML = ''
  try {
    HanziWriter.create(outlineId.value, currentQ.value.char, {
      width: 150, height: 150, padding: 8,
      strokeColor: '#DDD', outlineColor: '#DDD',
      showCharacter: true, showOutline: false,
    })
  } catch (e) {
    el.innerHTML = `<span style="font-size:80px;font-weight:bold;color:#ccc">${currentQ.value.char}</span>`
  }
}

// 生成一轮题目
function buildRound(charData, strokeData) {
  const unit = store.currentUnit
  const chars = charData.filter(d => d.unit === unit && d.radical && d.structure)
  const strokes = strokeData.filter(d => d.unit === unit)

  // 收集所有部首（用于干扰项）
  ALL_RADICALS.value = [...new Set(charData.map(d => d.radical).filter(Boolean))]

  const pool = []
  const types = filterType.value ? [filterType.value] : ['stroke', 'radical', 'structure', 'strokeCount']

  // 笔顺题
  if (types.includes('stroke')) {
    for (const s of sampleWithout(strokes, 4)) {
      pool.push({ qType: 'stroke', char: s.char, strokes: s.strokes, unit: s.unit, _id: s._id, hint: '按正确笔顺依次点击' })
    }
  }

  // 部首题
  if (types.includes('radical')) {
    for (const c of sampleWithout(chars, 3)) {
      const correct = c.radical
      const distractors = sampleWithout(ALL_RADICALS.value.filter(r => r !== correct), 3)
      const options = shuffle([
        { label: correct, isCorrect: true },
        ...distractors.map(d => ({ label: d, isCorrect: false }))
      ])
      pool.push({ qType: 'radical', char: c.char, options, unit: c.unit, _id: c._id, hint: '这个字的部首是？' })
    }
  }

  // 结构题
  if (types.includes('structure')) {
    for (const c of sampleWithout(chars, 3)) {
      const correct = c.structure
      const distractors = ALL_STRUCTURES.filter(s => s !== correct).slice(0, 3)
      const options = shuffle([
        { label: correct, isCorrect: true },
        ...distractors.map(d => ({ label: d, isCorrect: false }))
      ])
      pool.push({ qType: 'structure', char: c.char, options, unit: c.unit, _id: c._id, hint: '这个字是什么结构？' })
    }
  }

  // 笔画数题
  if (types.includes('strokeCount')) {
    for (const c of sampleWithout(chars.filter(d => d.strokeCount), 3)) {
      const correct = c.strokeCount
      const distractors = [correct - 1, correct + 1, correct + 2].filter(n => n > 0 && n !== correct)
      const options = shuffle([
        { label: correct + ' 画', isCorrect: true },
        ...distractors.slice(0, 3).map(d => ({ label: d + ' 画', isCorrect: false }))
      ])
      pool.push({ qType: 'strokeCount', char: c.char, options, unit: c.unit, _id: c._id, hint: '这个字有几画？' })
    }
  }

  return shuffle(pool).slice(0, 10)
}

function startRound() {
  questions.value = buildRound(pinyinData, strokesData)
  currentIndex.value = 0
  correctCount.value = 0
  started.value = true
  resetState()
  if (currentQ.value?.qType === 'stroke') {
    shuffledStrokes.value = shuffle([...currentQ.value.strokes])
    nextTick(() => initOutline())
  }
}

function resetState() {
  selectedStrokes.value = []
  usedIndexes.value = []
  feedback.value = ''
  feedbackType.value = ''
  wrongBtn.value = -1
  choiceState.value = ''
  selectedOpt.value = -1
}

// === 笔顺题交互 ===
function pickStroke(poolIndex) {
  if (usedIndexes.value.includes(poolIndex)) return
  const strokeName = shuffledStrokes.value[poolIndex]
  const nextIdx = selectedStrokes.value.length
  const expected = currentQ.value.strokes[nextIdx]

  if (strokeName !== expected) {
    wrongBtn.value = poolIndex
    feedback.value = `第 ${nextIdx + 1} 笔应该是「${expected}」`
    feedbackType.value = 'wrong'
    setTimeout(() => { wrongBtn.value = -1 }, 600)
    return
  }

  selectedStrokes.value.push(strokeName)
  usedIndexes.value.push(poolIndex)
  feedback.value = ''

  if (selectedStrokes.value.length === currentQ.value.strokes.length) {
    correctCount.value++
    feedback.value = '正确！'
    feedbackType.value = 'correct'
    setTimeout(() => { showAnim.value = true }, 500)
  }
}

function clearStroke() {
  selectedStrokes.value = []
  usedIndexes.value = []
  feedback.value = ''
  feedbackType.value = ''
  wrongBtn.value = -1
}

// === 选择题交互 ===
function pickOption(i) {
  if (choiceState.value) return
  selectedOpt.value = i
  const isCorrect = currentQ.value.options[i].isCorrect

  if (isCorrect) {
    choiceState.value = 'correct'
    correctCount.value++
    setTimeout(() => advanceQuestion(), 800)
  } else {
    choiceState.value = 'wrong'
    // 记录错题
    const q = currentQ.value
    if (q._id) {
      recordWrong(getUsername(), { type: 'stroke', char: q.char, unit: q.unit, question_id: q._id })
    }
    setTimeout(() => advanceQuestion(), 1500)
  }
}

function onAnimComplete() {
  showAnim.value = false
  advanceQuestion()
}

function advanceQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    resetState()
    const q = questions.value[currentIndex.value]
    if (q?.qType === 'stroke') {
      shuffledStrokes.value = shuffle([...q.strokes])
      nextTick(() => initOutline())
    }
  } else {
    // 轮次结束
    const earned = correctCount.value + (correctCount.value === totalQuestions.value ? 3 : 0)
    const oldTotal = store.totalStars
    store.addStars(earned)
    roundFinished.value = true
    recordPractice(getUsername(), { type: 'stroke', totalCount: totalQuestions.value, correctCount: correctCount.value })
    uni.navigateTo({
      url: `/pages/study/result?module=hanzi&correct=${correctCount.value}&total=${totalQuestions.value}&earned=${earned}&oldTotal=${oldTotal}`
    })
  }
}

function speakChar() {
  if (currentQ.value) speak(currentQ.value.char)
}

function goBack() {
  uni.navigateBack()
}

onShow(() => {
  if (roundFinished.value) {
    started.value = false
    roundFinished.value = false
    resetState()
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

/* 题型标签 */
.type-badge {
  text-align: center; font-size: 24rpx; font-weight: bold;
  padding: 6rpx 24rpx; border-radius: 20rpx; margin-bottom: 16rpx;
  display: inline-block; align-self: center;
}
.stroke-badge { background: #E3F2FD; color: #1565C0; }
.radical-badge { background: #FFF3E0; color: #E65100; }
.structure-badge { background: #E8F5E9; color: #2E7D32; }
.strokeCount-badge { background: #F3E5F5; color: #7B1FA2; }

.quiz-area {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.char-display {
  font-size: 120rpx; font-weight: bold; text-align: center;
  color: #333; min-height: 140rpx; line-height: 1.3;
}
.speak-btn {
  margin: 12rpx 0; font-size: 44rpx; width: 72rpx; height: 72rpx;
  display: flex; align-items: center; justify-content: center;
  background: #E3F2FD; border-radius: 50%;
}
.speak-btn:active { transform: scale(0.9); }
.hint-text {
  text-align: center; color: #888; font-size: 28rpx; margin-bottom: 24rpx;
}
.char-outline-wrap { display: flex; justify-content: center; margin-bottom: 16rpx; }
.char-outline-target {
  width: 150px; height: 150px; background: #fff;
  border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}

/* 选择题选项 */
.options-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 24rpx; padding: 0 24rpx; width: 100%;
}
.option-btn {
  background: #fff; border: 3rpx solid #BDBDBD; border-radius: 20rpx;
  padding: 32rpx 16rpx; text-align: center; font-size: 36rpx;
  font-weight: 500; color: #333;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06); transition: all 0.2s;
}
.option-btn:active { transform: scale(0.96); }
.option-btn.correct { border-color: #66BB6A; background: #E8F5E9; color: #2E7D32; box-shadow: 0 0 0 4rpx rgba(102,187,106,0.3); }
.option-btn.wrong { border-color: #EF5350; background: #FFEBEE; color: #C62828; box-shadow: 0 0 0 4rpx rgba(239,83,80,0.3); }

/* 笔顺题 */
.selected-area {
  display: flex; flex-wrap: wrap; gap: 12rpx; justify-content: center;
  min-height: 80rpx; padding: 20rpx; background: #fff;
  border-radius: 16rpx; border: 3rpx dashed #BDBDBD; margin-bottom: 24rpx; width: 100%;
}
.selected-item { display: flex; align-items: center; gap: 6rpx; background: #E3F2FD; padding: 8rpx 20rpx; border-radius: 12rpx; }
.selected-num { width: 32rpx; height: 32rpx; border-radius: 50%; background: #42A5F5; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20rpx; }
.selected-name { font-size: 28rpx; color: #333; font-weight: 500; }
.selected-placeholder { color: #ccc; font-size: 26rpx; }

.feedback { text-align: center; font-size: 28rpx; font-weight: bold; padding: 12rpx; margin-bottom: 16rpx; border-radius: 12rpx; width: 100%; }
.feedback.correct { color: #2E7D32; background: #E8F5E9; }
.feedback.wrong { color: #C62828; background: #FFEBEE; }

.stroke-pool { display: flex; flex-wrap: wrap; gap: 16rpx; justify-content: center; margin-bottom: 32rpx; }
.stroke-btn {
  padding: 20rpx 36rpx; background: #fff; border: 3rpx solid #BDBDBD;
  border-radius: 16rpx; font-size: 32rpx; font-weight: 500; color: #333;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06); transition: all 0.2s;
}
.stroke-btn:active { transform: scale(0.95); }
.stroke-btn.used { background: #E0E0E0; color: #aaa; border-color: #E0E0E0; box-shadow: none; }
.stroke-btn.wrong { background: #FFEBEE; border-color: #EF5350; color: #C62828; animation: shake 0.3s; }
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8rpx)} 75%{transform:translateX(8rpx)} }

.action-row { display: flex; gap: 24rpx; justify-content: center; }
.clear-btn { padding: 20rpx 48rpx; background: #fff; border: 3rpx solid #BDBDBD; border-radius: 20rpx; font-size: 28rpx; color: #666; }
.clear-btn:active { transform: scale(0.95); }
</style>
