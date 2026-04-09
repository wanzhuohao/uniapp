<template>
  <view class="pinyin-page">
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
        <view :class="['filter-tag', filterType === 'char2pinyin' && 'active']" @click="filterType = 'char2pinyin'">看汉字选拼音</view>
        <view :class="['filter-tag', filterType === 'pinyin2char' && 'active']" @click="filterType = 'pinyin2char'">看拼音选汉字</view>
      </view>
      <view class="start-btn" @click="startRound">开始练习</view>
    </view>

    <!-- 空状态 -->
    <view v-if="started && totalQuestions === 0" class="empty-hint">
      <text>本单元暂无拼音题目</text>
      <view class="back-btn" @click="goBack">返回</view>
    </view>

    <!-- 答题 -->
    <QuestionCard
      v-if="started && currentQuestion"
      :key="roundKey + '-' + currentIndex"
      :question="currentQuestion.question"
      :questionType="currentQuestion.questionType"
      :options="currentQuestion.options"
      :index="currentIndex + 1"
      :total="totalQuestions"
      @answer="handleAnswer"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useGameStore } from '../../store/game.js'
import { sampleWithout, shuffle } from '../../utils/study/questionHelper.js'
import StarBar from '../../components/study/StarBar.vue'
import QuestionCard from '../../components/study/QuestionCard.vue'
import pinyinData from '../../static/data/pinyin.json'
import { getQuestions } from '../../utils/common/cloudDb.js'
import { recordWrong } from '../../utils/study/wrongBook.js'
import { recordPractice } from '../../utils/study/practiceLog.js'
import { useAuth } from '../../composables/common/useAuth.js'

const store = useGameStore()
const { getUsername } = useAuth()
const filterType = ref('')
const started = ref(false)
const currentIndex = ref(0)
const correctCount = ref(0)
const roundKey = ref(0)
const roundFinished = ref(false)
const isCloudData = ref(false)

function buildRound(dataSource) {
  const source = dataSource || pinyinData.filter(d => d.unit === store.currentUnit)
  const sampled = sampleWithout(source, 10)

  return sampled.map((item, i) => {
    // 根据筛选决定题型
    let isTypeA
    if (filterType.value === 'char2pinyin') {
      isTypeA = true
    } else if (filterType.value === 'pinyin2char') {
      isTypeA = false
    } else {
      // 混合：前一半 A，后一半 B
      isTypeA = i < Math.ceil(sampled.length / 2)
    }

    if (isTypeA) {
      const options = shuffle([
        { label: item.pinyin, value: item.pinyin, isCorrect: true },
        ...item.distractors.map(d => ({ label: d, value: d, isCorrect: false })),
      ])
      return { question: item.char, questionType: 'char', options, _source: item }
    } else {
      const options = shuffle([
        { label: item.char, value: item.char, isCorrect: true },
        ...item.char_distractors.map(d => ({ label: d, value: d, isCorrect: false })),
      ])
      return { question: item.pinyin, questionType: 'pinyin', options, _source: item }
    }
  })
}

const questions = ref([])
const totalQuestions = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentIndex.value] || null)

async function startRound() {
  let cloudList = null
  try {
    cloudList = await getQuestions('pinyin', store.currentUnit)
  } catch (e) {
    cloudList = null
  }
  if (Array.isArray(cloudList) && cloudList.length > 0) {
    isCloudData.value = true
    questions.value = shuffle(buildRound(cloudList))
  } else {
    isCloudData.value = false
    questions.value = shuffle(buildRound(null))
  }
  currentIndex.value = 0
  correctCount.value = 0
  started.value = true
}

function goBack() {
  uni.navigateBack()
}

function handleAnswer({ correct }) {
  if (correct) {
    correctCount.value++
  } else {
    const item = currentQuestion.value?._source
    if (isCloudData.value && item?._id) {
      recordWrong(getUsername(), {
        type: 'pinyin', char: item.char, unit: item.unit, question_id: item._id
      })
    }
  }

  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
  } else {
    const earned = correctCount.value + (correctCount.value === totalQuestions.value ? 3 : 0)
    const oldTotal = store.totalStars
    store.addStars(earned)
    roundFinished.value = true
    recordPractice(getUsername(), {
      type: 'pinyin', totalCount: totalQuestions.value, correctCount: correctCount.value
    })
    uni.navigateTo({
      url: `/pages/study/result?module=pinyin&correct=${correctCount.value}&total=${totalQuestions.value}&earned=${earned}&oldTotal=${oldTotal}`
    })
  }
}

onShow(() => {
  if (roundFinished.value) {
    started.value = false
    roundFinished.value = false
    roundKey.value++
  }
})
</script>

<style scoped>
.pinyin-page { min-height: 100vh; }

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
  background: #FFA726;
  color: #fff;
  border-color: #FFA726;
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
  background: #FFA726;
  color: #fff;
  border-color: #FFA726;
  font-weight: bold;
}
.start-btn {
  padding: 24rpx 100rpx;
  background: linear-gradient(135deg, #FFA726, #F57C00);
  color: #fff;
  border-radius: 40rpx;
  font-size: 34rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(255,167,38,0.3);
}
.start-btn:active { transform: scale(0.97); }

.empty-hint {
  display: flex; flex-direction: column; align-items: center;
  padding: 120rpx 48rpx; color: #888; font-size: 32rpx;
}
.back-btn {
  margin-top: 32rpx; padding: 20rpx 48rpx;
  background: #FFA726; color: #fff; border-radius: 20rpx; font-size: 28rpx;
}
</style>
