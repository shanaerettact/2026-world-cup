<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trophy, TrendingUp, Flame } from 'lucide-vue-next'
import { useMatchStore } from '@/stores/matchStore'
import FeaturedMatchCard from '@/components/FeaturedMatchCard.vue'

const matchStore = useMatchStore()
const { locale } = useI18n()

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
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
            <Flame class="w-4 h-4 text-amber-300" />
            <span class="text-xs font-medium text-white">{{ $t('home.hero.liveMatches', { count: matchStore.liveMatches.length }) }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
            <TrendingUp class="w-4 h-4 text-success" />
            <span class="text-xs font-medium text-white">{{ $t('home.hero.hotOdds') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Now Section -->
    <section v-if="matchStore.liveMatches.length > 0" class="mb-6">
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
          v-for="match in matchStore.liveMatches"
          :key="match.id"
          :match="match"
        />
      </div>
    </section>

    <!-- Upcoming Matches -->
    <section>
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
          v-for="match in filteredUpcomingMatches"
          :key="match.id"
          :match="match"
        />
        <p
          v-if="filteredUpcomingMatches.length === 0"
          class="py-8 text-center text-sm text-[var(--color-muted)]"
        >
          {{ selectedDate ? $t('live.empty.subtitle') : $t('live.empty.title') }}
        </p>
      </div>
    </section>
  </div>
</template>
