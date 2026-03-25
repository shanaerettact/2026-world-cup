import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ChampionTeam {
  id: string
  code: string
  name: string
  flag: string
  odds: number
}

export type ChampionPredictionType = 'solo' | 'group'

export interface ChampionPrediction {
  id: string
  type: ChampionPredictionType
  teams: ChampionTeam[]
  odds: number
  stake: number
  potentialPayout: number
  status: 'pending' | 'won' | 'lost'
  timestamp: number
}

// Mock teams data
const MOCK_TEAMS: ChampionTeam[] = [
  { id: 'BRA', code: 'BRA', name: 'Brazil', flag: '🇧🇷', odds: 5.5 },
  { id: 'ARG', code: 'ARG', name: 'Argentina', flag: '🇦🇷', odds: 6.0 },
  { id: 'FRA', code: 'FRA', name: 'France', flag: '🇫🇷', odds: 6.5 },
  { id: 'ESP', code: 'ESP', name: 'Spain', flag: '🇪🇸', odds: 7.0 },
  { id: 'ENG', code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', odds: 7.5 },
  { id: 'GER', code: 'GER', name: 'Germany', flag: '🇩🇪', odds: 8.0 },
  { id: 'POR', code: 'POR', name: 'Portugal', flag: '🇵🇹', odds: 9.0 },
  { id: 'NED', code: 'NED', name: 'Netherlands', flag: '🇳🇱', odds: 10.0 },
  { id: 'BEL', code: 'BEL', name: 'Belgium', flag: '🇧🇪', odds: 11.0 },
  { id: 'ITA', code: 'ITA', name: 'Italy', flag: '🇮🇹', odds: 12.0 },
  { id: 'URU', code: 'URU', name: 'Uruguay', flag: '🇺🇾', odds: 15.0 },
  { id: 'MEX', code: 'MEX', name: 'Mexico', flag: '🇲🇽', odds: 18.0 },
  { id: 'USA', code: 'USA', name: 'United States', flag: '🇺🇸', odds: 20.0 },
  { id: 'CAN', code: 'CAN', name: 'Canada', flag: '🇨🇦', odds: 25.0 },
  { id: 'COL', code: 'COL', name: 'Colombia', flag: '🇨🇴', odds: 22.0 },
  { id: 'CRO', code: 'CRO', name: 'Croatia', flag: '🇭🇷', odds: 16.0 },
  { id: 'MAR', code: 'MAR', name: 'Morocco', flag: '🇲🇦', odds: 28.0 },
  { id: 'JPN', code: 'JPN', name: 'Japan', flag: '🇯🇵', odds: 30.0 },
  { id: 'KOR', code: 'KOR', name: 'South Korea', flag: '🇰🇷', odds: 35.0 },
  { id: 'SEN', code: 'SEN', name: 'Senegal', flag: '🇸🇳', odds: 40.0 },
]

export const useChampionStore = defineStore('champion', () => {
  const allTeams = ref<ChampionTeam[]>([...MOCK_TEAMS])
  const predictions = ref<ChampionPrediction[]>([])
  
  // Solo Pick State
  const selectedSoloTeam = ref<ChampionTeam | null>(null)
  const soloStake = ref<number>(100)
  
  // Group Parlay State
  const selectedGroupTeams = ref<ChampionTeam[]>([])
  const groupStake = ref<number>(100)
  
  // Confirmation Modal State
  const isConfirmModalOpen = ref(false)
  const confirmationType = ref<ChampionPredictionType>('solo')

  // Solo Pick Computed
  const soloPotentialPayout = computed(() => {
    if (!selectedSoloTeam.value) return 0
    return soloStake.value * selectedSoloTeam.value.odds
  })

  // Group Parlay Computed
  const groupCombinedOdds = computed(() => {
    if (selectedGroupTeams.value.length === 0) return 0
    // Calculate combined odds (reduced odds for group coverage)
    const baseOdds = selectedGroupTeams.value.reduce((acc, team) => acc + (1 / team.odds), 0)
    return 1 / baseOdds
  })

  const groupPotentialPayout = computed(() => {
    return groupStake.value * groupCombinedOdds.value
  })

  const isGroupValid = computed(() => {
    return selectedGroupTeams.value.length >= 2 && selectedGroupTeams.value.length <= 8
  })

  // Separate prediction lists by type
  const soloPredictions = computed(() => {
    return predictions.value.filter(p => p.type === 'solo')
  })

  const groupPredictions = computed(() => {
    return predictions.value.filter(p => p.type === 'group')
  })

  // Solo Pick Actions
  function selectSoloTeam(team: ChampionTeam) {
    selectedSoloTeam.value = team
  }

  function clearSoloSelection() {
    selectedSoloTeam.value = null
  }

  function setSoloStake(amount: number) {
    soloStake.value = Math.max(0, amount)
  }

  // Group Parlay Actions
  function toggleGroupTeam(team: ChampionTeam) {
    const index = selectedGroupTeams.value.findIndex(t => t.id === team.id)
    if (index > -1) {
      selectedGroupTeams.value.splice(index, 1)
    } else {
      if (selectedGroupTeams.value.length < 8) {
        selectedGroupTeams.value.push(team)
      }
    }
  }

  function removeGroupTeam(teamId: string) {
    selectedGroupTeams.value = selectedGroupTeams.value.filter(t => t.id !== teamId)
  }

  function clearGroupSelection() {
    selectedGroupTeams.value = []
  }

  function setGroupStake(amount: number) {
    groupStake.value = Math.max(0, amount)
  }

  function isTeamInGroup(teamId: string): boolean {
    return selectedGroupTeams.value.some(t => t.id === teamId)
  }

  // Confirmation Modal
  function openConfirmModal(type: ChampionPredictionType) {
    confirmationType.value = type
    isConfirmModalOpen.value = true
  }

  function closeConfirmModal() {
    isConfirmModalOpen.value = false
  }

  // Place Prediction
  function confirmPrediction() {
    const type = confirmationType.value
    const timestamp = Date.now()
    
    if (type === 'solo' && selectedSoloTeam.value) {
      const prediction: ChampionPrediction = {
        id: `solo-${timestamp}`,
        type: 'solo',
        teams: [selectedSoloTeam.value],
        odds: selectedSoloTeam.value.odds,
        stake: soloStake.value,
        potentialPayout: soloPotentialPayout.value,
        status: 'pending',
        timestamp
      }
      predictions.value.unshift(prediction)
      clearSoloSelection()
    } else if (type === 'group' && isGroupValid.value) {
      const prediction: ChampionPrediction = {
        id: `group-${timestamp}`,
        type: 'group',
        teams: [...selectedGroupTeams.value],
        odds: groupCombinedOdds.value,
        stake: groupStake.value,
        potentialPayout: groupPotentialPayout.value,
        status: 'pending',
        timestamp
      }
      predictions.value.unshift(prediction)
      clearGroupSelection()
    }
    
    closeConfirmModal()
  }

  return {
    // State
    allTeams,
    predictions,
    selectedSoloTeam,
    soloStake,
    selectedGroupTeams,
    groupStake,
    isConfirmModalOpen,
    confirmationType,
    
    // Computed
    soloPotentialPayout,
    groupCombinedOdds,
    groupPotentialPayout,
    isGroupValid,
    soloPredictions,
    groupPredictions,
    
    // Actions
    selectSoloTeam,
    clearSoloSelection,
    setSoloStake,
    toggleGroupTeam,
    removeGroupTeam,
    clearGroupSelection,
    setGroupStake,
    isTeamInGroup,
    openConfirmModal,
    closeConfirmModal,
    confirmPrediction,
  }
})
