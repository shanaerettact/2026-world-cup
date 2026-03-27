import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface BetSelection {
  id: string
  /** 送 /game/bet 的線別 id（與 id 不同時使用，例如 id 為 slip 複合鍵） */
  betApiId?: string
  matchId: number
  matchTitle: string
  betType: string
  selection: string
  odds: number
}

export type BetMode = 'single' | 'parlay'
export type RiskLevel = 'low' | 'medium' | 'high'
export type BetStatus = 'pending' | 'won' | 'lost'

export interface BetRecord {
  id: string
  matchTitle: string
  betType: string
  selection: string
  odds: number
  stake: number
  potentialPayout: number
  status: BetStatus
  timestamp: number
}

const MOCK_BET_HISTORY: BetRecord[] = [
  { id: '1', matchTitle: 'Brazil vs Argentina', betType: 'Full Time Result', selection: 'Brazil', odds: 2.15, stake: 100, potentialPayout: 215, status: 'won', timestamp: Date.now() - 86400000 * 2 },
  { id: '2', matchTitle: 'Germany vs France', betType: 'Over/Under', selection: 'Over 2.5', odds: 1.85, stake: 50, potentialPayout: 92.5, status: 'lost', timestamp: Date.now() - 86400000 },
  { id: '3', matchTitle: 'Spain vs Italy', betType: 'Handicap', selection: 'Spain -0.5', odds: 1.92, stake: 80, potentialPayout: 153.6, status: 'pending', timestamp: Date.now() - 3600000 },
]

export const useBetSlipStore = defineStore('betSlip', () => {
  const selections = ref<BetSelection[]>([])
  const betHistory = ref<BetRecord[]>([...MOCK_BET_HISTORY])
  const stake = ref<number>(100)
  const betMode = ref<BetMode>('single')
  const isDrawerOpen = ref(false)
  const isConfirmModalOpen = ref(false)
  const purchaseInsurance = ref(false)

  const totalOdds = computed(() => {
    if (selections.value.length === 0) return 0
    return selections.value[0]?.odds || 0
  })

  const potentialPayout = computed(() => {
    return stake.value * totalOdds.value
  })

  const riskLevel = computed((): RiskLevel => {
    if (totalOdds.value < 2) return 'low'
    if (totalOdds.value <= 5) return 'medium'
    return 'high'
  })

  const selectionCount = computed(() => selections.value.length)

  /** 投注單只保留一筆：新選項會取代既有選項 */
  function addSelection(selection: BetSelection) {
    const exists = selections.value.some((s) => s.id === selection.id)
    if (exists) return
    selections.value = [selection]
    if (!isDrawerOpen.value) {
      isDrawerOpen.value = true
    }
  }

  function removeSelection(id: string) {
    selections.value = selections.value.filter(s => s.id !== id)
    if (selections.value.length === 0) {
      isDrawerOpen.value = false
    }
  }

  /** 同一賽事、同一玩法區塊內只保留一注：先清除該區塊再加選 */
  function removeSelectionsInMarket(matchId: number, market: string) {
    const prefix = `${matchId}-${market}-`
    selections.value = selections.value.filter(s => s.matchId !== matchId || !s.id.startsWith(prefix))
    if (selections.value.length === 0) isDrawerOpen.value = false
  }

  function toggleSelection(selection: BetSelection) {
    const exists = selections.value.find(s => s.id === selection.id)
    if (exists) {
      removeSelection(selection.id)
    } else {
      addSelection(selection)
    }
  }

  function isSelected(id: string): boolean {
    return selections.value.some(s => s.id === id)
  }

  function clearSelections() {
    selections.value = []
    isDrawerOpen.value = false
    purchaseInsurance.value = false
  }

  function setStake(amount: number) {
    stake.value = Math.max(0, amount)
  }

  function setBetMode(mode: BetMode) {
    betMode.value = mode
  }

  function openDrawer() {
    isDrawerOpen.value = true
  }

  function closeDrawer() {
    isDrawerOpen.value = false
  }

  function toggleDrawer() {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  function openConfirmModal() {
    isConfirmModalOpen.value = true
  }

  function closeConfirmModal() {
    isConfirmModalOpen.value = false
  }

  function confirmBet() {
    const record: BetRecord = {
      id: `bet-${Date.now()}`,
      matchTitle: selections.value.map(s => s.matchTitle).join(' + ') || '-',
      betType: selections.value[0]?.betType ?? '',
      selection: selections.value.map(s => s.selection).join(' / ') || '-',
      odds: totalOdds.value,
      stake: stake.value,
      potentialPayout: potentialPayout.value,
      status: 'pending',
      timestamp: Date.now()
    }
    betHistory.value.unshift(record)
    clearSelections()
    closeConfirmModal()
  }

  return {
    selections,
    stake,
    betMode,
    isDrawerOpen,
    isConfirmModalOpen,
    purchaseInsurance,
    totalOdds,
    potentialPayout,
    riskLevel,
    selectionCount,
    addSelection,
    removeSelection,
    removeSelectionsInMarket,
    toggleSelection,
    isSelected,
    clearSelections,
    setStake,
    setBetMode,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    openConfirmModal,
    closeConfirmModal,
    confirmBet,
    betHistory
  }
})
