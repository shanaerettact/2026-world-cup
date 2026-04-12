import { defineStore } from 'pinia'
import { ref } from 'vue'
import { GameOrderListParams, getGameOrderList } from '@/services/api/gameOrderApi'
import type { BetHistoryData } from '@/schema/gameOrderSchema'

export const useGameOrderStore = defineStore('gameOrder', () => {
  const gameOrderList = ref<BetHistoryData['list']>([])
  const fetchGameOrderList = async (params: GameOrderListParams) => {
    try {
      const res = await getGameOrderList(params)
      gameOrderList.value = res.list ?? []
    } catch (e) {
      console.error(e)
      gameOrderList.value = []
    }
  }
  return {
    gameOrderList,
    fetchGameOrderList,
  }
})