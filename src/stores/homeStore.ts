import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getHomeData } from '@/services/api/homeApi'
import { bootstrapWorldcupAuth } from '@/utils/request'
import type { HomeData, Game, FeaturedCardViewData } from '@/schema/homeSchema'
import type { Match } from '@/services/api/matchApi'

export type FeaturedCardView = FeaturedCardViewData

export function normalizeGameStatus(s: string): Match['status'] {
  if (s === 'live') return 'live'
  if (s === 'finished' || s === 'end') return 'finished'
  return 'upcoming'
}

export function homeGameToMatch(g: Game): Match {
  const h = Number(g.odds?.[0]?.odds ?? 0)
  const d = Number(g.odds?.[2]?.odds ?? 0)
  const a = Number(g.odds?.[1]?.odds ?? 0)
  const s1 = g.team1_score ? Number(g.team1_score) : NaN
  const s2 = g.team2_score ? Number(g.team2_score) : NaN
  return {
    id: Number(g.id),
    homeTeam: g.team1_title,
    awayTeam: g.team2_title,
    homeFlag: g.team1_icon,
    awayFlag: g.team2_icon,
    kickoff: g.start_time,
    status: normalizeGameStatus(g.status),
    score:
      !Number.isNaN(s1) && !Number.isNaN(s2) ? { home: s1, away: s2 } : undefined,
    odds: { home: h, draw: d, away: a },
  }
}

export function gameToFeaturedCardView(g: Game): FeaturedCardView {
  // 與 homeGameToMatch 一致：[0] 主、[1] 客、[2] 和
  return {
    game: g,
    showScore: g.status === 'live' && !!g.team1_score && !!g.team2_score,
    oddsHome: Number(g.odds?.[0]?.odds ?? 0),
    oddsDraw: Number(g.odds?.[2]?.odds ?? 0),
    oddsAway: Number(g.odds?.[1]?.odds ?? 0),
  }
}

const loginUserForRelogin = () => import.meta.env.VITE_LOGIN_USER || 'user01'

function isAuthRecoverableMessage(msg: string) {
  return (
    msg.includes('無法登入') ||
    msg.includes('已失效') ||
    msg.includes('其他地方登入')
  )
}

export const useHomeStore = defineStore('home', () => {
  const homeData = ref<HomeData | null>(null)
  const selectedGame = ref<Game | null>(null)
  const detailScrollToTabs = ref(false)

  let fetchHomeDataInFlight: Promise<void> | null = null

  const fetchHomeData = async () => {
    if (fetchHomeDataInFlight) return fetchHomeDataInFlight
    fetchHomeDataInFlight = (async () => {
      const loadOnce = async () => {
        homeData.value = await getHomeData()
      }
      try {
        await loadOnce()
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        if (isAuthRecoverableMessage(msg)) {
          try {
            await bootstrapWorldcupAuth(loginUserForRelogin())
            await loadOnce()
            return
          } catch (e) {
            console.error(e)
          }
        }
        console.error(error)
      }
    })()
    try {
      await fetchHomeDataInFlight
    } finally {
      fetchHomeDataInFlight = null
    }
  }

  function selectGame(game: Game, options?: { scrollToTabs?: boolean }) {
    selectedGame.value = game
    detailScrollToTabs.value = !!options?.scrollToTabs
  }

  function clearSelectedGame() {
    selectedGame.value = null
    detailScrollToTabs.value = false
  }

  function clearDetailScrollToTabs() {
    detailScrollToTabs.value = false
  }

  return {
    homeData,
    fetchHomeData,
    selectedGame,
    detailScrollToTabs,
    selectGame,
    clearSelectedGame,
    clearDetailScrollToTabs,
  }
})