// store/game.js
import { defineStore } from 'pinia'
import { loadState, saveState } from '../utils/common/storage.js'

export const useGameStore = defineStore('game', {
  state: () => {
    const saved = loadState()
    return {
      totalStars: saved?.totalStars ?? 0,
      mathLevel: saved?.mathLevel ?? 1,
      mathHistory: saved?.mathHistory ?? [],
      currentUnit: saved?.currentUnit ?? '1-1',
    }
  },

  actions: {
    addStars(count) {
      this.totalStars += count
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
      this.currentUnit = '1-1'
      this._persist()
    },

    _persist() {
      saveState({
        totalStars: this.totalStars,
        mathLevel: this.mathLevel,
        mathHistory: this.mathHistory,
        currentUnit: this.currentUnit,
      })
    },
  },
})
