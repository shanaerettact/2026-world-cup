import { defineStore } from 'pinia'
import { ref } from 'vue'
import { GameOrderListParams, getGameOrderList } from '@/services/api/gameOrderApi'
import type { BetHistoryData } from '@/schema/gameOrderSchema'

export const useGameOrderStore = defineStore('gameOrder', () => {
  const gameOrderList = ref<BetHistoryData['list']>([])
  const fetchGameOrderList = async (params: GameOrderListParams) => {
    const res = (await getGameOrderList(params)) as unknown as BetHistoryData
    gameOrderList.value = res?.list ?? []
  }
  return {
    gameOrderList,
    fetchGameOrderList,
  }
})