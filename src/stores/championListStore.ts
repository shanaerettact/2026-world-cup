import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getChampionList } from '@/services/api/championListApi'
import type { ChampionListData } from '@/schema/championListSchema'

export const useChampionListStore = defineStore('championList', () => {
  const championList = ref<ChampionListData['list']>([])
  const fetchChampionList = async () => {
    const res = (await getChampionList()) as ChampionListData
    championList.value = res.list ?? []
  }
  return {
    championList,
    fetchChampionList,
  }
})