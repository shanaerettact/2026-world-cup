<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Play, Zap } from 'lucide-vue-next'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { useMatchStore } from '@/stores/matchStore'
import { useHomeStore, gameToFeaturedCardView, type FeaturedCardView } from '@/stores/homeStore'
import type { Group } from '@/schema/homeSchema'
import { useSiteGameStore } from '@/stores/siteGameStore'
import { flagEmojiForTeamTitle } from '@/services/api/matchApi'

const props = defineProps<{
  group: Group
}>()

const betSlipStore = useBetSlipStore()
const matchStore = useMatchStore()
const homeStore = useHomeStore()
const siteGameStore = useSiteGameStore()

const { t, locale } = useI18n()

const view = computed((): FeaturedCardView | null => {
  const g = props.group.game?.[0]
  if (!g) return null
  return gameToFeaturedCardView(g)
})

const team1FlagEmoji = computed(() =>
  view.value ? flagEmojiForTeamTitle(view.value.game.team1_title, t) : undefined
)
const team2FlagEmoji = computed(() =>
  view.value ? flagEmojiForTeamTitle(view.value.game.team2_title, t) : undefined
)

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
  const rows = v.game.odds.map((o) => ({ id: o.id, odds: o.odds, title: o.title }))
  const draw = rows.find((o) => o.title === '平手')
  const rest = rows.filter((o) => o.title !== '平手')
  if (draw && rest.length === 2) {
    return [rest[0], draw, rest[1]]
  }
  return rows
})

const getSelectionId = (oddId: string) => {
  const raw = view.value?.game.id
  if (raw == null || raw === '') return ''
  return `${Number(raw)}-Moneyline-${oddId}`
}

const formatOdds = (s: string) => {
  const n = Number(s)
  return Number.isFinite(n) ? n.toFixed(2) : '—'
}

const handleOddsClick = (oddId: string, odds: string, title: string) => {
  const v = view.value
  if (!v) return
  const slipId = getSelectionId(oddId)
  const payload = {
    id: slipId,
    betApiId: oddId,
    matchId: Number(v.game.id),
    matchTitle: matchTitle.value,
    betType: t('match.betType.fullTimeResult'),
    selection: title,
    odds: Number(odds),
  }
  if (betSlipStore.isSelected(slipId)) {
    betSlipStore.removeSelection(slipId)
  } else {
    betSlipStore.addSelection(payload)
    betSlipStore.openDrawer()
  }
}

const openMatchDetail = (scrollToTabs = false) => {
  const v = view.value
  if (!v) return
  matchStore.clearSelectedMatch()
  homeStore.selectGame(v.game, { scrollToTabs })
  siteGameStore.fetchSiteGame(Number(v.game.id))
}
onMounted(() => {
  console.log('openMatchDetail', view.value?.game)
})

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
          <span
            v-if="team1FlagEmoji"
            class="text-4xl leading-none select-none"
            aria-hidden="true"
          >{{ team1FlagEmoji }}</span>
          <img
            v-else-if="view.game.team1_icon && !team1ImgError"
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
          <span
            v-if="team2FlagEmoji"
            class="text-4xl leading-none select-none"
            aria-hidden="true"
          >{{ team2FlagEmoji }}</span>
          <img
            v-else-if="view.game.team2_icon && !team2ImgError"
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
        :key="odd.id"
        @click="handleOddsClick(odd.id, odd.odds, odd.title)"
        class="relative py-3 px-2 rounded-xl font-semibold text-center
               transition-all duration-200 active:scale-95
               border-2"
        :class="betSlipStore.isSelected(getSelectionId(odd.id))
          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
          : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)] hover:border-primary/50'"
      >
        <span class="text-[10px] text-[var(--color-muted)] block mb-0.5"
              :class="betSlipStore.isSelected(getSelectionId(odd.id)) ? 'text-white/70' : ''">
          {{ odd.title }}
        </span>
        <span class="text-lg">{{ formatOdds(odd.odds) }}</span>
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
