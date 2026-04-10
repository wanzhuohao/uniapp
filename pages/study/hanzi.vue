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

    <!-- 笔顺题型（自测模式）-->
    <view v-if="started && currentQ && currentQ.qType === 'stroke'" class="quiz-area">
      <view class="type-badge stroke-badge">笔顺</view>
      <text class="hint-text">看着汉字想一想笔顺，然后看答案自测</text>

      <!-- HanziWriter 静态展示 -->
      <view class="char-outline-wrap">
        <view class="char-fallback" v-show="!outlineReady">{{ currentQ.char }}</view>
        <view :id="outlineId" class="char-outline-target" v-show="outlineReady"></view>
      </view>
      <view class="speak-btn" @click="speakChar">🔊</view>

      <!-- 查看答案按钮 -->
      <view v-if="!showAnswer" class="show-answer-btn" @click="revealAnswer">查看笔顺动画</view>

      <!-- 答案区 -->
      <view v-if="showAnswer" class="answer-area">
        <text class="answer-hint">观察正确笔顺：</text>
        <view class="answer-btn" @click="replayAnim">▶ 重播动画</view>
      </view>

      <!-- 自判按钮 -->
      <view v-if="showAnswer" class="self-judge">
        <view class="judge-btn wrong" @click="judgeSelf(false)">❌ 我不会</view>
        <view class="judge-btn correct" @click="judgeSelf(true)">✅ 我会了</view>
      </view>
    </view>

    <!-- 选择题型（部首/结构/笔画数）-->
    <view v-if="started && currentQ && ['radical','structure','strokeCount'].includes(currentQ.qType)" class="quiz-area">
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
import pinyinData from '../../static/data/pinyin.json'
import strokesData from '../../static/data/strokes.json'

const store = useGameStore()
const { getUsername } = useAuth()

// 笔画分类颜色（基本笔画用不同颜色区分）
const STROKE_COLORS = {
  '横': '#E65100', '提': '#E65100',
  '竖': '#1565C0', '竖钩': '#1565C0', '竖提': '#1565C0', '竖弯钩': '#1565C0',
  '撇': '#2E7D32', '撇折': '#2E7D32', '撇点': '#2E7D32',
  '捺': '#6A1B9A', '点': '#6A1B9A',
  '横折': '#C62828', '横折钩': '#C62828', '横折弯钩': '#C62828', '横折提': '#C62828',
  '竖折': '#00695C', '竖折折钩': '#00695C',
  '横撇': '#EF6C00', '横斜钩': '#EF6C00',
  '弯钩': '#37474F',
}
function strokeColor(name) {
  return STROKE_COLORS[name] || '#333'
}

const filterType = ref('')
const started = ref(false)
const currentIndex = ref(0)
const correctCount = ref(0)
const roundFinished = ref(false)
const isCloudData = ref(false)

// 出题数据
const questions = ref([])
const totalQuestions = computed(() => questions.value.length)
const currentQ = computed(() => questions.value[currentIndex.value] || null)

// 笔顺题自测状态
const showAnswer = ref(false)
let writerInstance = null

// 选择题状态
const choiceState = ref('')
const selectedOpt = ref(-1)

// HanziWriter
const outlineId = ref('hz-' + Date.now())
const outlineReady = ref(false)

// 所有结构选项
const ALL_STRUCTURES = ['上下', '左右', '独体', '半包围', '全包围']
// 所有部首（从题库中提取常见部首）
const ALL_RADICALS = ref([])

async function initOutline() {
  outlineReady.value = false
  writerInstance = null
  await nextTick()
  const el = document.getElementById(outlineId.value)
  if (!el || !currentQ.value) return
  el.innerHTML = ''
  try {
    writerInstance = HanziWriter.create(outlineId.value, currentQ.value.char, {
      width: 180, height: 180, padding: 8,
      strokeColor: '#333', outlineColor: '#DDD',
      showCharacter: true, showOutline: true,
      onLoadCharDataSuccess: () => {
        outlineReady.value = true
      },
      onLoadCharDataError: () => {
        outlineReady.value = false
      }
    })
  } catch (e) {
    outlineReady.value = false
  }
}

function revealAnswer() {
  showAnswer.value = true
  // 播放一次动画
  if (writerInstance) {
    try {
      writerInstance.animateCharacter()
    } catch (e) {}
  }
}

function replayAnim() {
  if (writerInstance) {
    try {
      writerInstance.animateCharacter()
    } catch (e) {}
  }
}

function judgeSelf(isCorrect) {
  if (isCorrect) {
    correctCount.value++
  } else {
    // 答错记录错题
    const q = currentQ.value
    if (q._id) {
      recordWrong(getUsername(), {
        type: 'hanzi', char: q.char, unit: q.unit, question_id: q._id
      })
    }
  }
  advanceQuestion()
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
    nextTick(() => initOutline())
  }
}

function resetState() {
  showAnswer.value = false
  choiceState.value = ''
  selectedOpt.value = -1
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
    const q = currentQ.value
    if (q._id) {
      recordWrong(getUsername(), { type: 'hanzi', char: q.char, unit: q.unit, question_id: q._id })
    }
    setTimeout(() => advanceQuestion(), 1500)
  }
}

function advanceQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    resetState()
    const q = questions.value[currentIndex.value]
    if (q?.qType === 'stroke') {
      nextTick(() => initOutline())
    }
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
.char-outline-wrap {
  display: flex; justify-content: center; align-items: center;
  margin-bottom: 16rpx; position: relative;
  width: 150px; height: 150px;
  background: #fff; border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.char-outline-target {
  width: 150px; height: 150px;
}
.char-fallback {
  font-size: 120px;
  font-weight: bold;
  color: #DDD;
  line-height: 1;
  font-family: "KaiTi", "楷体", "STKaiti", serif;
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

/* 笔顺题自测 */
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
.answer-btn:active { transform: scale(0.97); }
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
</style>
