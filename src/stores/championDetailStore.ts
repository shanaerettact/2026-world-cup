import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getChampionDetail } from '@/services/api/championDetailApi'
import type { ChampionGameData } from '@/schema/championDetailSchema'

export const useChampionDetailStore = defineStore('championDetail', () => {
  const championDetail = ref<ChampionGameData | null>(null)
  const fetchChampionDetail = async (id: string) => {
    championDetail.value = await getChampionDetail(id)
  }
  return { championDetail, fetchChampionDetail }
})