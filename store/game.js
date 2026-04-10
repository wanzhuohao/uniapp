// store/game.js
import { defineStore } from 'pinia'
import { loadState, saveState } from '../utils/common/storage.js'
import { queryCollection, addDocument, updateDocument } from '../utils/common/cloudDb.js'

const db = uniCloud.database()
let syncing = false

export const useGameStore = defineStore('game', {
  state: () => {
    const saved = loadState()
    return {
      totalStars: saved?.totalStars ?? 0,
      mathLevel: saved?.mathLevel ?? 1,
      mathHistory: saved?.mathHistory ?? [],
      currentUnit: saved?.currentUnit ?? '2-1',
      _statsId: null, // 云端记录 ID，用于更新
    }
  },

  actions: {
    // 从云端拉取用户数据，合并到本地
    async loadFromCloud() {
      const username = uni.getStorageSync('username')
      if (!username) return
      try {
        const records = await queryCollection('user_stats', { username }, { limit: 1 })
        if (records.length > 0) {
          const r = records[0]
          this._statsId = r._id
          // 云端数据优先（除非本地星星更多）
          if ((r.totalStars || 0) >= this.totalStars) {
            this.totalStars = r.totalStars || 0
          }
          this.mathLevel = r.mathLevel || this.mathLevel
          this.mathHistory = r.mathHistory || this.mathHistory
          if (r.currentUnit) this.currentUnit = r.currentUnit
          // 同步到本地
          saveState({
            totalStars: this.totalStars,
            mathLevel: this.mathLevel,
            mathHistory: this.mathHistory,
            currentUnit: this.currentUnit,
          })
        }
      } catch (e) {
        console.error('loadFromCloud failed:', e)
      }
    },

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
      this.currentUnit = '2-1'
      this._persist()
    },

    // 切换用户：清空内存状态，重新从云端加载
    async switchUser() {
      this.totalStars = 0
      this.mathLevel = 1
      this.mathHistory = []
      this.currentUnit = '2-1'
      this._statsId = null
      // 从新用户的云端拉取
      await this.loadFromCloud()
    },

    _persist() {
      // 本地持久化
      saveState({
        totalStars: this.totalStars,
        mathLevel: this.mathLevel,
        mathHistory: this.mathHistory,
        currentUnit: this.currentUnit,
      })
      // 异步同步到云端（防抖）
      this._syncCloud()
    },

    async _syncCloud() {
      if (syncing) return
      syncing = true
      // 延迟 1 秒批量同步，避免频繁写
      setTimeout(async () => {
        syncing = false
        const username = uni.getStorageSync('username')
        if (!username) return
        const data = {
          username,
          totalStars: this.totalStars,
          mathLevel: this.mathLevel,
          mathHistory: this.mathHistory,
          currentUnit: this.currentUnit,
          updatedAt: Date.now(),
        }
        try {
          if (this._statsId) {
            await updateDocument('user_stats', this._statsId, data)
          } else {
            // 查找是否已有记录
            const existing = await queryCollection('user_stats', { username }, { limit: 1 })
            if (existing.length > 0) {
              this._statsId = existing[0]._id
              await updateDocument('user_stats', this._statsId, data)
            } else {
              const res = await addDocument('user_stats', data)
              if (res?.id) this._statsId = res.id
              else if (res?._id) this._statsId = res._id
            }
          }
        } catch (e) {
          console.error('syncCloud failed:', e)
          uni.showToast({ title: '云端同步失败，数据仅本地保存', icon: 'none', duration: 2000 })
        }
      }, 1000)
    },
  },
})
