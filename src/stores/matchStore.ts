import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { matchApi, type Match } from '@/services/api/matchApi'

export const useMatchStore = defineStore('match', () => {
  const matches = ref<Match[]>([])
  const selectedMatch = ref<Match | null>(null)
  const scrollToTabsOnOpen = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const liveMatches = computed(() => matches.value.filter(m => m.status === 'live'))
  const upcomingMatches = computed(() => matches.value.filter(m => m.status === 'upcoming'))

  async function fetchMatches() {
    isLoading.value = true
    error.value = null
    try {
      matches.value = await matchApi.getMatches()
    } catch (e) {
      error.value = 'Failed to load matches'
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMatch(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const match = await matchApi.getMatch(id)
      if (match) {
        selectedMatch.value = match
      }
    } catch (e) {
      error.value = 'Failed to load match'
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  function selectMatch(match: Match, options?: { scrollToTabs?: boolean }) {
    selectedMatch.value = match
    scrollToTabsOnOpen.value = !!options?.scrollToTabs
  }

  function clearSelectedMatch() {
    selectedMatch.value = null
    scrollToTabsOnOpen.value = false
  }

  function clearScrollToTabsOnOpen() {
    scrollToTabsOnOpen.value = false
  }

  return {
    matches,
    selectedMatch,
    isLoading,
    error,
    liveMatches,
    upcomingMatches,
    fetchMatches,
    fetchMatch,
    selectMatch,
    clearSelectedMatch,
    clearScrollToTabsOnOpen,
    scrollToTabsOnOpen
  }
})
