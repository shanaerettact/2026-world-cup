import { getSiteGame } from '@/services/api/siteGameApi'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GameDetailData } from '@/schema/siteGameSchema'

export const useSiteGameStore = defineStore('siteGame', () => {
  const siteGame = ref<GameDetailData | null>(null)

  const fetchSiteGame = async (id: number) => {
    siteGame.value = await getSiteGame(id)
  }

  return {
    siteGame,
    fetchSiteGame,
  }
})