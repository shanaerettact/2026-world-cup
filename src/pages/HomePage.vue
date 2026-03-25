<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trophy, TrendingUp, Flame, LayoutGrid } from 'lucide-vue-next'
import { useMatchStore } from '@/stores/matchStore'
import FeaturedMatchCard from '@/components/FeaturedMatchCard.vue'
import BettingOptionsModal from '@/components/BettingOptionsModal.vue'
import { useHomeStore } from '@/stores/homeStore'
import type { Match } from '@/services/api/matchApi'
import type { Game, Group } from '@/schema/homeSchema'

const bettingModalOpen = ref(false)

const matchStore = useMatchStore()
const { locale, t } = useI18n()
const homeStore = useHomeStore()
const selectedDate = ref<string>('')

const upcomingDates = computed(() => {
  const set = new Set<string>()
  matchStore.upcomingMatches.forEach(m => {
    const dateStr = m.kickoff.slice(0, 10)
    set.add(dateStr)
  })
  return Array.from(set).sort()
})

const filteredUpcomingMatches = computed(() => {
  if (!selectedDate.value) return matchStore.upcomingMatches
  return matchStore.upcomingMatches.filter(m => m.kickoff.slice(0, 10) === selectedDate.value)
})

function matchToGroup(m: Match): Group {
  const home = m.homeTeamKey ? t(m.homeTeamKey) : m.homeTeam
  const away = m.awayTeamKey ? t(m.awayTeamKey) : m.awayTeam
  const game: Game = {
    id: String(m.id),
    status: m.status,
    number: '',
    group_id: '',
    title: `${home} vs ${away}`,
    content: '',
    create_time: '',
    modify_time: '',
    start_time: m.kickoff,
    end_time: '',
    image: '',
    icon: '',
    odds: [
      { id: '0', title: home, odds: String(m.odds.home), draw: '' },
      { id: '1', title: t('common.draw'), odds: String(m.odds.draw), draw: '' },
      { id: '2', title: away, odds: String(m.odds.away), draw: '' },
    ],
    team1_title: home,
    team1_score: m.score ? String(m.score.home) : '',
    team1_result: '',
    team1_home: '1',
    team1_icon: m.homeFlag,
    team1_image: '',
    team1_content: '',
    team2_title: away,
    team2_score: m.score ? String(m.score.away) : '',
    team2_result: '',
    team2_home: '0',
    team2_icon: m.awayFlag,
    team2_image: '',
    team2_content: '',
    top: '',
  }
  return {
    id: `m-${m.id}`,
    title: '',
    icon: '',
    image: '',
    game: [game],
  }
}

const upcomingGroups = computed(() => {
  void locale.value
  return filteredUpcomingMatches.value.map(matchToGroup)
})

watch(upcomingDates, (dates) => {
  if (dates.length && selectedDate.value && !dates.includes(selectedDate.value)) selectedDate.value = ''
}, { immediate: true })

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat(locale.value, { month: 'numeric', day: 'numeric', weekday: 'short' }).format(date)
}

const dateScrollRef = ref<HTMLElement | null>(null)
const dateBarDragging = ref(false)
const dateBarStartX = ref(0)
const dateBarStartScroll = ref(0)

function onDateBarWheel(e: WheelEvent) {
  const el = dateScrollRef.value
  if (!el || el.scrollWidth <= el.clientWidth) return
  const canScrollLeft = el.scrollLeft > 0
  const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
  if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) e.preventDefault()
  el.scrollLeft += e.deltaY
}

function onDateBarMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  if (!dateScrollRef.value || dateScrollRef.value.scrollWidth <= dateScrollRef.value.clientWidth) return
  dateBarDragging.value = true
  dateBarStartX.value = e.clientX
  dateBarStartScroll.value = dateScrollRef.value.scrollLeft
}

function stopDateBarDrag() {
  dateBarDragging.value = false
  document.removeEventListener('mousemove', onDateBarMouseMove)
  document.removeEventListener('mouseup', stopDateBarDrag)
}

function onDateBarMouseMove(e: MouseEvent) {
  if (!dateScrollRef.value) return
  const dx = dateBarStartX.value - e.clientX
  dateScrollRef.value.scrollLeft = dateBarStartScroll.value + dx
}

function onDateBarMouseDownCapture(e: MouseEvent) {
  onDateBarMouseDown(e)
  document.addEventListener('mousemove', onDateBarMouseMove)
  document.addEventListener('mouseup', stopDateBarDrag)
}

onMounted(() => {
  matchStore.fetchMatches()
  homeStore.fetchHomeData()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDateBarMouseMove)
  document.removeEventListener('mouseup', stopDateBarDrag)
})
</script>

<template>
  <div class="px-4 py-4">
    <!-- Hero Section -->
    <div class="relative rounded-2xl overflow-hidden mb-6
                bg-gradient-to-br from-primary via-primary-light to-primary-dark
                p-5 shadow-xl shadow-primary/20">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
      </div>
      
      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-2">
          <Trophy class="w-5 h-5 text-amber-300" />
          <span class="text-xs font-semibold text-white/80 uppercase tracking-wider">{{ $t('home.hero.tournament') }}</span>
        </div>
        <h1 class="text-2xl font-bold text-white mb-1">2026</h1>
        <p class="text-sm text-white/70 mb-4">{{ $t('home.hero.hosts') }}</p>
        
        <div class="flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
            <Flame class="w-4 h-4 text-amber-300" />
            <span class="text-xs font-medium text-white">{{ $t('home.hero.liveMatches', { count: matchStore.liveMatches.length }) }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
            <TrendingUp class="w-4 h-4 text-success" />
            <span class="text-xs font-medium text-white">{{ $t('home.hero.hotOdds') }}</span>
          </div>

          <!-- 3D Floating Markets Button -->
          <button
            @click="bettingModalOpen = true"
            class="markets-fab flex items-center gap-2 px-3 py-1.5 rounded-full
                   text-xs font-semibold text-white
                   transition-all duration-200 active:scale-95 select-none"
            aria-label="Open Betting Markets"
          >
            <LayoutGrid class="w-4 h-4 text-amber-300 shrink-0" />
            <span>All Markets</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Betting Options Modal -->
    <BettingOptionsModal
      :open="bettingModalOpen"
      @close="bettingModalOpen = false"
    />

    <!-- Live Now Section -->
    <section v-if="(homeStore.homeData?.group?.length ?? 0) > 0" class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-danger animate-pulse" />
          {{ $t('home.liveNow.title') }}
        </h2>
        <router-link 
          to="/live" 
          class="text-sm font-medium text-primary hover:text-primary-light transition-colors"
        >
          {{ $t('common.viewAll') }}
        </router-link>
      </div>
      <div class="space-y-4">
        <FeaturedMatchCard
          v-for="g in homeStore.homeData?.group?.[0]?.game"
          :key="g.id"
          :group="{ id: g.id, title: '', icon: '', image: '', game: [g] }"
        />
      </div>
    </section>

    <!-- Upcoming Matches -->
    <section v-if="false">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold text-[var(--color-text)]">{{ $t('home.upcoming.title') }}</h2>
      </div>

      <!-- Date Filter -->
      <div
        v-if="!matchStore.isLoading && upcomingDates.length > 0"
        ref="dateScrollRef"
        class="flex gap-2 mb-4 overflow-x-auto pb-1 select-none"
        :class="dateBarDragging ? 'cursor-grabbing' : 'cursor-grab'"
        @wheel="onDateBarWheel"
        @mousedown="onDateBarMouseDownCapture"
      >
        <button
          type="button"
          @click="selectedDate = ''"
          class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                 border border-[var(--color-border)]"
          :class="!selectedDate
            ? 'bg-primary text-white border-primary'
            : 'bg-[var(--color-card)] text-[var(--color-text)] hover:border-primary/50'"
        >
          {{ $t('home.upcoming.allDates') }}
        </button>
        <button
          v-for="dateKey in upcomingDates"
          :key="dateKey"
          type="button"
          @click="selectedDate = dateKey"
          class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                 border border-[var(--color-border)] whitespace-nowrap"
          :class="selectedDate === dateKey
            ? 'bg-primary text-white border-primary'
            : 'bg-[var(--color-card)] text-[var(--color-text)] hover:border-primary/50'"
        >
          {{ formatDateLabel(dateKey) }}
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="matchStore.isLoading" class="space-y-4">
        <div 
          v-for="i in 3" 
          :key="i"
          class="h-48 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] animate-shimmer"
        />
      </div>
      
      <!-- Matches -->
      <div v-else class="space-y-4">
        <FeaturedMatchCard
          v-for="g in upcomingGroups"
          :key="g.id"
          :group="g"
        />
        <p
          v-if="upcomingGroups.length === 0"
          class="py-8 text-center text-sm text-[var(--color-muted)]"
        >
          {{ selectedDate ? $t('live.empty.subtitle') : $t('live.empty.title') }}
        </p>
      </div>
    </section>
  </div>
</template>
