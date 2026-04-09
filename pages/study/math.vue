<template>
  <view class="math-page">
    <StarBar :current="currentIndex + 1" :total="10" :stars="store.totalStars" />

    <!-- 等级标签 -->
    <view class="level-bar">
      <text
        v-for="lv in 3" :key="lv"
        class="level-tag"
        :class="{ active: lv === currentLevel }"
        @click="switchLevel(lv)"
      >
        Lv.{{ lv }} {{ levelLabel(lv) }}
      </text>
    </view>

    <QuestionCard
      v-if="currentQuestion"
      :key="roundKey + '-' + currentIndex"
      :question="currentQuestion.question"
      :questionType="currentQuestion.questionType"
      :options="currentQuestion.options"
      :index="currentIndex + 1"
      :total="10"
      @answer="handleAnswer"
    />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useGameStore } from '../../store/game.js'
import { generateMathRound, LEVEL_CONFIG } from '../../utils/study/mathGen.js'
import StarBar from '../../components/study/StarBar.vue'
import QuestionCard from '../../components/study/QuestionCard.vue'

const store = useGameStore()

const currentLevel = ref(store.mathLevel)
const questions = ref(generateMathRound(currentLevel.value))
const currentIndex = ref(0)
const correctCount = ref(0)
const roundKey = ref(0)
const roundFinished = ref(false)

function switchLevel(lv) {
  if (lv === currentLevel.value) return
  currentLevel.value = lv
  store.mathLevel = lv
  store.mathHistory = [] // 手动切换时清空升降级历史
  // 重新出题
  questions.value = generateMathRound(lv)
  currentIndex.value = 0
  correctCount.value = 0
  roundKey.value++
}

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)

function levelLabel(lv) {
  return LEVEL_CONFIG[lv]?.label || ''
}

function handleAnswer({ correct }) {
  if (correct) correctCount.value++

  if (currentIndex.value < 9) {
    currentIndex.value++
  } else {
    // 本轮结束
    const earned = correctCount.value + (correctCount.value === 10 ? 3 : 0)
    const oldTotal = store.totalStars
    store.addStars(earned)

    const oldLevel = currentLevel.value
    store.recordMathRound(correctCount.value, 10)
    const newLevel = store.mathLevel
    currentLevel.value = newLevel

    roundFinished.value = true
    uni.navigateTo({
      url: `/pages/study/result?module=math&correct=${correctCount.value}&total=10&earned=${earned}&oldLevel=${oldLevel}&newLevel=${newLevel}&oldTotal=${oldTotal}`
    })
  }
}

onShow(() => {
  if (roundFinished.value) {
    currentLevel.value = store.mathLevel
    questions.value = generateMathRound(currentLevel.value)
    currentIndex.value = 0
    correctCount.value = 0
    roundFinished.value = false
    roundKey.value++
  }
})
</script>

<style scoped>
.math-page {
  min-height: 100vh;
}
.level-bar {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  padding: 16rpx;
}
.level-tag {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  background: #eee;
  color: #aaa;
}
.level-tag:active {
  transform: scale(0.95);
}
.level-tag.active {
  background: #E8F5E9;
  color: var(--color-primary);
  font-weight: bold;
}
</style>
