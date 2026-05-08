import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getChampionOrderList } from '@/services/api/championOrderApi'
import type { ChampionOrderListData, ChampionOrderListParams } from '@/schema/championOrderSchema'

export const useChampionOrderStore = defineStore('championOrder', () => {
  const championOrderList = ref<ChampionOrderListData['list']>([])
  const fetchChampionOrderList = async (params: ChampionOrderListParams) => {
    try {
      const res = await getChampionOrderList(params)
      championOrderList.value = res.list ?? []
    } catch (e) {
      console.error(e)
      championOrderList.value = []
    }
  }
  return {
    championOrderList,
    fetchChampionOrderList,
  }
})
