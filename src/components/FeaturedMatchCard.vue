<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Play, Zap } from 'lucide-vue-next'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { useMatchStore } from '@/stores/matchStore'
import type { Match } from '@/services/api/matchApi'

const props = defineProps<{
  match: Match
}>()

const betSlipStore = useBetSlipStore()
const matchStore = useMatchStore()

const { t, locale } = useI18n()

const matchTitle = computed(() => {
  const home = props.match.homeTeamKey ? t(props.match.homeTeamKey) : props.match.homeTeam
  const away = props.match.awayTeamKey ? t(props.match.awayTeamKey) : props.match.awayTeam
  return `${home} vs ${away}`
})

const formatKickoff = computed(() => {
  const date = new Date(props.match.kickoff)
  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})

const odds = [
  { key: 'home', label: () => props.match.homeTeamKey ? t(props.match.homeTeamKey) : props.match.homeTeam, value: () => props.match.odds.home },
  { key: 'draw', label: () => t('common.draw'), value: () => props.match.odds.draw },
  { key: 'away', label: () => props.match.awayTeamKey ? t(props.match.awayTeamKey) : props.match.awayTeam, value: () => props.match.odds.away },
]

const getSelectionId = (type: string) => `${props.match.id}-fulltime-${type}`

const fulltimeTypes = ['home', 'draw', 'away']
const handleOddsClick = (type: string, label: string, oddsVal: number) => {
  const id = getSelectionId(type)
  const payload = {
    id,
    matchId: props.match.id,
    matchTitle: matchTitle.value,
    betType: t('match.betType.fullTimeResult'),
    selection: label,
    odds: oddsVal
  }
  if (betSlipStore.isSelected(id)) {
    betSlipStore.removeSelection(id)
  } else {
    for (const ty of fulltimeTypes) betSlipStore.removeSelection(getSelectionId(ty))
    betSlipStore.addSelection(payload)
    betSlipStore.openDrawer()
  }
}

const openMatchDetail = (scrollToTabs = false) => {
  matchStore.selectMatch(props.match, { scrollToTabs })
}
</script>

<template>
  <div class="relative bg-[var(--color-card)] rounded-2xl p-4 
              border border-[var(--color-border)]
              shadow-xl shadow-black/5
              transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
    <!-- Live Badge -->
    <div
      v-if="match.status === 'live'"
      class="absolute -top-2 left-4 px-3 py-1 rounded-full
             bg-gradient-to-r from-danger to-orange-500
             flex items-center gap-1 animate-pulse"
    >
      <Zap class="w-3 h-3 text-white fill-white" />
      <span class="text-[10px] font-bold text-white uppercase tracking-wider">{{ $t('common.live') }}</span>
    </div>

    <!-- Teams Section -->
    <div class="flex items-center justify-between mb-4 mt-2">
      <!-- Home Team -->
      <div class="flex flex-col items-center gap-2 flex-1">
        <span class="text-4xl">{{ match.homeFlag }}</span>
        <span class="text-sm font-semibold text-[var(--color-text)] text-center">
          {{ match.homeTeamKey ? $t(match.homeTeamKey) : match.homeTeam }}
        </span>
      </div>

      <!-- Score / VS -->
      <div class="flex flex-col items-center px-4">
        <div
          v-if="match.status === 'live' && match.score"
          class="flex items-center gap-2"
        >
          <span class="text-3xl font-bold text-[var(--color-text)]">{{ match.score.home }}</span>
          <span class="text-lg text-[var(--color-muted)]">-</span>
          <span class="text-3xl font-bold text-[var(--color-text)]">{{ match.score.away }}</span>
        </div>
        <span
          v-else
          class="text-lg font-bold text-[var(--color-muted)]"
        >{{ $t('common.vs') }}</span>
        <span class="text-xs text-[var(--color-muted)] mt-1">{{ formatKickoff }}</span>
      </div>

      <!-- Away Team -->
      <div class="flex flex-col items-center gap-2 flex-1">
        <span class="text-4xl">{{ match.awayFlag }}</span>
        <span class="text-sm font-semibold text-[var(--color-text)] text-center">
          {{ match.awayTeamKey ? $t(match.awayTeamKey) : match.awayTeam }}
        </span>
      </div>
    </div>

    <!-- Odds Buttons -->
    <div class="grid grid-cols-3 gap-2 mb-3">
      <button
        v-for="odd in odds"
        :key="odd.key"
        @click="handleOddsClick(odd.key, odd.label(), odd.value())"
        class="relative py-3 px-2 rounded-xl font-semibold text-center
               transition-all duration-200 active:scale-95
               border-2"
        :class="betSlipStore.isSelected(getSelectionId(odd.key))
          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
          : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)] hover:border-primary/50'"
      >
        <span class="text-[10px] text-[var(--color-muted)] block mb-0.5"
              :class="betSlipStore.isSelected(getSelectionId(odd.key)) ? 'text-white/70' : ''">
          {{ odd.label() }}
        </span>
        <span class="text-lg">{{ odd.value().toFixed(2) }}</span>
      </button>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2">
      <button
        @click="openMatchDetail(true)"
        class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4
               rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]
               text-sm font-medium text-[var(--color-text)]
               transition-all duration-200 active:scale-95 hover:border-primary/50"
      >
        <span>{{ $t('common.moreOdds') }}</span>
        <ChevronRight class="w-4 h-4" />
      </button>
      <button
        @click="openMatchDetail()"
        class="flex items-center justify-center gap-2 py-2.5 px-4
               rounded-xl bg-gradient-to-r from-primary to-primary-light
               text-sm font-medium text-white
               transition-all duration-200 active:scale-95
               shadow-lg shadow-primary/20"
      >
        <Play class="w-4 h-4 fill-white" />
        <span>{{ $t('common.watchLive') }}</span>
      </button>
    </div>
  </div>
</template>
