<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Play, Zap } from 'lucide-vue-next'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { useMatchStore } from '@/stores/matchStore'
import { useHomeStore, gameToFeaturedCardView, type FeaturedCardView } from '@/stores/homeStore'
import type { Group } from '@/schema/homeSchema'

const props = defineProps<{
  group: Group
}>()

const betSlipStore = useBetSlipStore()
const matchStore = useMatchStore()
const homeStore = useHomeStore()

const { t, locale } = useI18n()

const view = computed((): FeaturedCardView | null => {
  const g = props.group.game?.[0]
  if (!g) return null
  return gameToFeaturedCardView(g)
})

const team1ImgError = ref(false)
const team2ImgError = ref(false)

watch(
  () => [props.group.game?.[0]?.id, props.group.game?.[0]?.team1_icon, props.group.game?.[0]?.team2_icon],
  () => {
    team1ImgError.value = false
    team2ImgError.value = false
  }
)

const matchTitle = computed(() => {
  const g = view.value?.game
  if (!g) return ''
  return `${g.team1_title} vs ${g.team2_title}`
})

const formatKickoff = computed(() => {
  const kick = view.value?.game.start_time
  if (!kick) return ''
  const date = new Date(kick)
  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})

const odds = computed(() => {
  const v = view.value
  if (!v) return []
  const g = v.game
  return [
    { key: 'home' as const, label: () => g.team1_title, value: () => v.oddsHome },
    { key: 'draw' as const, label: () => t('common.draw'), value: () => v.oddsDraw },
    { key: 'away' as const, label: () => g.team2_title, value: () => v.oddsAway },
  ]
})

const getSelectionId = (type: string) => `${view.value?.game.id ?? ''}-fulltime-${type}`

const fulltimeTypes = ['home', 'draw', 'away']
const handleOddsClick = (type: string, label: string, oddsVal: number) => {
  const v = view.value
  if (!v) return
  const id = getSelectionId(type)
  const payload = {
    id,
    matchId: Number(v.game.id),
    matchTitle: matchTitle.value,
    betType: t('match.betType.fullTimeResult'),
    selection: label,
    odds: oddsVal,
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
  const v = view.value
  if (!v) return
  matchStore.clearSelectedMatch()
  homeStore.selectGame(v.game, { scrollToTabs })
}
</script>

<template>
  <div
    v-if="view"
    class="relative bg-[var(--color-card)] rounded-2xl p-4 
              border border-[var(--color-border)]
              shadow-xl shadow-black/5
              transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
  >
    <!-- Live Badge -->
    <div
      v-if="view.game.status === 'live'"
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
        <span class="text-4xl flex items-center justify-center min-h-[2.5rem]">
          <img
            v-if="view.game.team1_icon && !team1ImgError"
            :src="view.game.team1_icon"
            :alt="view.game.team1_title"
            class="w-full h-full object-contain"
            @error="team1ImgError = true"
          />
          <i v-else class="ri-flag-line text-4xl leading-none text-[var(--color-muted)]" aria-hidden="true" />
        </span>
        <span class="text-sm font-semibold text-[var(--color-text)] text-center">
          {{ view.game.team1_title }}
        </span>
      </div>

      <!-- Score / VS -->
      <div class="flex flex-col items-center px-4">
        <div
          v-if="view.showScore"
          class="flex items-center gap-2"
        >
          <span class="text-3xl font-bold text-[var(--color-text)]">{{ view.game.team1_score }}</span>
          <span class="text-lg text-[var(--color-muted)]">-</span>
          <span class="text-3xl font-bold text-[var(--color-text)]">{{ view.game.team2_score }}</span>
        </div>
        <span
          v-else
          class="text-lg font-bold text-[var(--color-muted)]"
        >{{ $t('common.vs') }}</span>
        <span class="text-xs text-[var(--color-muted)] mt-1">{{ formatKickoff }}</span>
      </div>

      <!-- Away Team -->
      <div class="flex flex-col items-center gap-2 flex-1">
        <span class="text-4xl flex items-center justify-center min-h-[2.5rem]">
          <img
            v-if="view.game.team2_icon && !team2ImgError"
            :src="view.game.team2_icon"
            :alt="view.game.team2_title"
            class="w-full h-full object-contain"
            @error="team2ImgError = true"
          />
          <i v-else class="ri-flag-line text-4xl leading-none text-[var(--color-muted)]" aria-hidden="true" />
        </span>
        <span class="text-sm font-semibold text-[var(--color-text)] text-center">
          {{ view.game.team2_title }}
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
