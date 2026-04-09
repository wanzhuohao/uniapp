// store/game.js
import { defineStore } from 'pinia'
import { loadState, saveState } from '../utils/common/storage.js'

const THEME_THRESHOLDS = [
  { stars: 50, id: 'theme_blue', name: '海洋蓝' },
  { stars: 100, id: 'theme_pink', name: '樱花粉' },
  { stars: 200, id: 'theme_gold', name: '金色王冠' },
]

export const useGameStore = defineStore('game', {
  state: () => {
    const saved = loadState()
    return {
      totalStars: saved?.totalStars ?? 0,
      mathLevel: saved?.mathLevel ?? 1,
      mathHistory: saved?.mathHistory ?? [],
      unlockedThemes: saved?.unlockedThemes ?? [],
      currentUnit: saved?.currentUnit ?? '1-1', // 默认一年级上册第1单元
    }
  },

  getters: {
    nextThreshold(state) {
      return THEME_THRESHOLDS.find(t => !state.unlockedThemes.includes(t.id)) || null
    },
  },

  actions: {
    addStars(count) {
      this.totalStars += count
      for (const t of THEME_THRESHOLDS) {
        if (this.totalStars >= t.stars && !this.unlockedThemes.includes(t.id)) {
          this.unlockedThemes.push(t.id)
        }
      }
      this._persist()
    },

    recordMathRound(correct, total) {
      this.mathHistory.push({ correct, total })
      if (this.mathHistory.length > 2) {
        this.mathHistory.shift()
      }
      if (this.mathHistory.length === 2) {
        const allHigh = this.mathHistory.every(h => h.correct / h.total >= 0.8)
        const allLow = this.mathHistory.every(h => h.correct / h.total < 0.5)
        if (allHigh && this.mathLevel < 3) {
          this.mathLevel++
          this.mathHistory = []
        } else if (allLow && this.mathLevel > 1) {
          this.mathLevel--
          this.mathHistory = []
        }
      }
      this._persist()
    },

    setUnit(val) {
      this.currentUnit = val
      this._persist()
    },

    resetAll() {
      this.totalStars = 0
      this.mathLevel = 1
      this.mathHistory = []
      this.unlockedThemes = []
      this.currentUnit = '1-1'
      this._persist()
    },

    _persist() {
      saveState({
        totalStars: this.totalStars,
        mathLevel: this.mathLevel,
        mathHistory: this.mathHistory,
        unlockedThemes: this.unlockedThemes,
        currentUnit: this.currentUnit,
      })
    },
  },
})
