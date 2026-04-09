<template>
  <view class="pinyin-page">
    <StarBar :current="currentIndex + 1" :total="totalQuestions" :stars="store.totalStars" />

    <view v-if="totalQuestions === 0" class="empty-hint">
      <text>本单元暂无拼音题目</text>
      <view class="back-btn" @click="goBack">返回主页</view>
    </view>

    <QuestionCard
      v-if="currentQuestion"
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
import { ref, computed } from 'vue'
import { onShow, onMounted } from '@dcloudio/uni-app'
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
const currentIndex = ref(0)
const correctCount = ref(0)
const roundKey = ref(0)
const roundFinished = ref(false)
const isCloudData = ref(false)

function buildRound(dataSource) {
  const source = dataSource || pinyinData.filter(d => d.unit === store.currentUnit)
  const sampled = sampleWithout(source, 10) // 最多 10 题，不足则有多少出多少
  return sampled.map((item, i) => {
    const halfPoint = Math.ceil(sampled.length / 2)
    const isTypeA = i < halfPoint
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

function goBack() {
  uni.navigateBack()
}

function handleAnswer({ correct }) {
  if (correct) {
    correctCount.value++
  } else {
    // 答错：如果是云端数据且有 _id，异步记录错题
    const item = currentQuestion.value?._source
    if (isCloudData.value && item?._id) {
      recordWrong(getUsername(), {
        type: 'pinyin',
        char: item.char,
        unit: item.unit,
        question_id: item._id
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
    // 异步记录练习日志，不阻塞跳转
    recordPractice(getUsername(), {
      type: 'pinyin',
      totalCount: totalQuestions.value,
      correctCount: correctCount.value
    })
    uni.navigateTo({
      url: `/pages/study/result?module=pinyin&correct=${correctCount.value}&total=${totalQuestions.value}&earned=${earned}&oldTotal=${oldTotal}`
    })
  }
}

async function initRound() {
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
}

onMounted(async () => {
  await initRound()
})

onShow(async () => {
  if (roundFinished.value) {
    await initRound()
    currentIndex.value = 0
    correctCount.value = 0
    roundFinished.value = false
    roundKey.value++
  }
})
</script>

<style scoped>
.pinyin-page {
  min-height: 100vh;
}
.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
  color: var(--color-text-light);
  font-size: 32rpx;
}
.back-btn {
  margin-top: 32rpx;
  padding: 20rpx 48rpx;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-btn);
  font-size: 28rpx;
}
</style>
