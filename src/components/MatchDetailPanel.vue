<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Share2, Zap, Gift, MessageCircle } from 'lucide-vue-next'
import { useMatchStore } from '@/stores/matchStore'
import { useHomeStore, homeGameToMatch } from '@/stores/homeStore'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { useChatStore } from '@/stores/chatStore'
import { useSiteGameStore } from '@/stores/siteGameStore'

const matchStore = useMatchStore()
const homeStore = useHomeStore()
const betSlipStore = useBetSlipStore()
const chatStore = useChatStore()
const siteGameStore = useSiteGameStore() 
const { t } = useI18n()

const activeTab = ref('1')

const tabs = computed(() => 
  siteGameStore.siteGame?.list.map(item => ({
    key: item.id,
    label: item.title,
    item: item.item,
  }))
)

const match = computed(
  () =>{
    return matchStore.selectedMatch ??
    (homeStore.selectedGame ? homeGameToMatch(homeStore.selectedGame) : null)
  }
)
const isOpen = computed(() => !!match.value)

const homeTeamName = computed(() =>
  match.value?.homeTeamKey ? t(match.value.homeTeamKey) : match.value?.homeTeam ?? ''
)
const awayTeamName = computed(() =>
  match.value?.awayTeamKey ? t(match.value.awayTeamKey) : match.value?.awayTeam ?? ''
)

const matchTitle = computed(() => 
  match.value ? `${homeTeamName.value} vs ${awayTeamName.value}` : ''
)

const formatKickoff = computed(() => {
  if (!match.value) return ''
  const date = siteGameStore.siteGame?.game.start_time ?? ''
  return date
})

/** API 格式 "yyyy-MM-dd HH:mm:ss"，依本地時區比對 */
function parseApiDateTime(s: string | undefined): number | null {
  if (!s?.trim()) return null
  const ms = Date.parse(s.trim().replace(' ', 'T'))
  return Number.isNaN(ms) ? null : ms
}

/** 依開賽／結束時間：未開賽、進行中、已結束 */
const matchTimePhase = computed<'notStarted' | 'inProgress' | 'ended' | null>(() => {
  const g = siteGameStore.siteGame?.game
  if (!g) return null
  const start = parseApiDateTime(g.start_time)
  const end = parseApiDateTime(g.end_time)
  if (start == null || end == null) return null
  const now = Date.now()
  if (now < start) return 'notStarted'
  if (now <= end) return 'inProgress'
  return 'ended'
})

const matchPhaseLabel = computed(() => {
  const p = matchTimePhase.value
  if (p === 'notStarted') return t('common.notStarted')
  if (p === 'inProgress') return t('common.inProgress')
  if (p === 'ended') return t('common.ended')
  return '—'
})

const matchPhaseClass = computed(() => {
  const p = matchTimePhase.value
  if (p === 'inProgress') return 'text-success'
  if (p === 'ended') return 'text-[var(--color-muted)]'
  return 'text-[var(--color-text)]'
})
const getSelectionId = (market: string, type: string) => 
  `${match.value?.id}-${market}-${type}`

function formatPlayItemOdds(odds: string | undefined): string {
  if (odds == null || odds === '') return '-'
  const n = Number(odds)
  return Number.isFinite(n) ? n.toFixed(2) : '-'
}

function playItemOddsNumber(odds: string | undefined): number {
  if (odds == null || odds === '') return 0
  const n = Number(odds)
  return Number.isFinite(n) ? n : 0
}

const marketLabel = (market: string) => {
  switch (market) {
    case 'Moneyline': return t('matchDetail.markets.moneyline')
    case 'Handicap': return t('matchDetail.markets.handicap')
    case 'O/U': return t('matchDetail.markets.overUnder')
    case 'OddEven': return t('matchDetail.markets.oddEven')
    default: return market
  }
}

const handleOddsClick = (market: string, type: string, label: string, odds: number) => {
  if (!match.value) return
  const id = getSelectionId(market, type)
  const payload = {
    id,
    matchId: match.value.id,
    matchTitle: matchTitle.value,
    betType: marketLabel(market),
    selection: label,
    odds
  }
  if (betSlipStore.isSelected(id)) {
    betSlipStore.removeSelection(id)
  } else {
    betSlipStore.addSelection(payload)
  }
}

const closePanel = () => {
  matchStore.clearSelectedMatch()
  homeStore.clearSelectedGame()
}

function onPanelAfterEnter() {
  const scroll = matchStore.scrollToTabsOnOpen || homeStore.detailScrollToTabs
  if (!scroll) return
  matchStore.clearScrollToTabsOnOpen()
  homeStore.clearDetailScrollToTabs()
  nextTick(() => {
    const target = document.querySelector('[data-match-detail-tabs]')
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  })
}

function onTabClick(key: string) {
  activeTab.value = key
}

watch(
  () => matchStore.selectedMatch,
  (m) => {
    if (m) homeStore.clearSelectedGame()
  }
)

watch(isOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
onMounted(() => {
  if (!match.value?.id) return
  siteGameStore.fetchSiteGame(match.value.id)
  console.log('siteGameStore.siteGame', siteGameStore.siteGame)
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        @click="closePanel"
      />
    </Transition>

    <!-- Panel -->
    <Transition name="slide-right" @after-enter="onPanelAfterEnter">
      <div
        v-if="isOpen && match"
        class="fixed top-0 right-0 bottom-0 w-full max-w-[430px] z-50
               bg-[var(--color-bg)] flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <header class="flex items-center justify-between px-4 py-3 
                       bg-[var(--color-card)] border-b border-[var(--color-border)]">
          <button
            @click="closePanel"
            class="w-10 h-10 rounded-xl flex items-center justify-center
                   hover:bg-[var(--color-bg)] transition-colors active:scale-90"
          >
            <ArrowLeft class="w-5 h-5 text-[var(--color-text)]" />
          </button>
          <h1 class="font-semibold text-[var(--color-text)]">{{ matchTitle }}</h1>
          <button
            class="w-10 h-10 rounded-xl flex items-center justify-center
                   hover:bg-[var(--color-bg)] transition-colors active:scale-90"
          >
            <Share2 class="w-5 h-5 text-[var(--color-text)]" />
          </button>
        </header>

        <!-- Scrollable Content -->
        <div data-match-detail-scroll class="flex-1 overflow-y-scroll overflow-x-hidden min-h-0 pb-24">
          <!-- Live Stream Section -->
          <div class="relative aspect-video bg-black">
            <div class="absolute top-3 left-3 z-10 px-2 py-1 rounded-md bg-danger/90 flex items-center gap-1">
              <Zap class="w-3 h-3 text-white fill-white" />
              <span class="text-[10px] font-bold text-white">{{ $t('common.live') }}</span>
            </div>
            <!-- <iframe
              class="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/kRP1jToTXAc?autoplay=1&mute=1"
              title="YouTube"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            /> -->
          </div>

          <!-- Promo Banner -->
          <div class="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-r from-primary to-primary-light
                      flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Gift class="w-5 h-5 text-white" />
              </div>
              <div>
                <p class="text-sm font-bold text-white">{{ $t('matchDetail.promo.title') }}</p>
                <p class="text-xs text-white/70">{{ $t('matchDetail.promo.subtitle') }}</p>
              </div>
            </div>
            <button class="px-4 py-2 rounded-xl bg-white text-primary font-semibold text-sm
                          transition-all active:scale-95">
              {{ $t('common.claim') }}
            </button>
          </div>

          <!-- Match Info -->
          <div class="mx-4 mt-4 p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-[var(--color-muted)]">{{ $t('common.matchId') }}</span>
                <p class="font-semibold text-[var(--color-text)]">#{{ match.id.toString().padStart(6, '0') }}</p>
              </div>
              <div>
                <span class="text-[var(--color-muted)]">{{ $t('common.status') }}</span>
                <p class="font-semibold" :class="matchPhaseClass">
                  {{ matchPhaseLabel }}
                </p>
              </div>
              <div class="col-span-2">
                <span class="text-[var(--color-muted)]">{{ $t('common.kickoff') }}</span>
                <p class="font-semibold text-[var(--color-text)]">{{ formatKickoff }}</p>
              </div>
              <template v-if="match.roundKey || match.venueKey">
                <div v-if="match.roundKey" class="col-span-2">
                  <span class="text-[var(--color-muted)]">{{ $t('common.round') }}</span>
                  <p class="font-semibold text-[var(--color-text)]">{{ $t(match.roundKey) }}</p>
                </div>
                <div v-if="match.venueKey" class="col-span-2">
                  <span class="text-[var(--color-muted)]">{{ $t('common.venue') }}</span>
                  <p class="font-semibold text-[var(--color-text)]">{{ $t(match.venueKey) }}</p>
                </div>
              </template>
            </div>
          </div>

          <!-- Tabs -->
          <div data-match-detail-tabs class="mt-4 px-4">
            <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-x-auto scrollbar-hide">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                @click="onTabClick(tab.key)"
                class="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium
                       transition-all duration-200 whitespace-nowrap"
                :class="activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- Odds Table -->
          <div class="mt-4 mx-4 mb-6">
            <!-- Moneyline -->
            <template v-for="item in siteGameStore.siteGame?.list?.[0]?.item" :key="item.id">
              <div v-if="activeTab === '1'" class="mb-4">
                <h3 class="text-sm font-semibold text-[var(--color-text)] mb-2">{{ $t(item.title) }}</h3>
                <div 
                class="grid grid-cols-3 gap-2">
                  <button
                    @click="handleOddsClick('Moneyline', 'home', homeTeamName, match.odds.home)"
                    class="py-3 rounded-xl font-semibold text-center transition-all duration-200 
                          active:scale-95 border-2"
                    :class="betSlipStore.isSelected(getSelectionId('Moneyline', 'home'))
                      ? 'bg-primary text-white border-primary'
                      : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                  >
                    <span class="text-xs text-[var(--color-muted)] block"
                          :class="betSlipStore.isSelected(getSelectionId('Moneyline', 'home')) ? 'text-white/70' : ''">
                      {{ item.item?.[0]?.title }}
                    </span>
                    <span>{{ formatPlayItemOdds(item.item?.[0]?.odds) }}</span>
                  </button>
                  <button
                    @click="handleOddsClick('Moneyline', 'away', awayTeamName, match.odds.away)"
                    class="py-3 rounded-xl font-semibold text-center transition-all duration-200 
                          border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    :class="item.item?.[2]?.odds == null
                      ? 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                      : betSlipStore.isSelected(getSelectionId('Moneyline', 'away'))
                        ? 'bg-primary text-white border-primary active:scale-95'
                        : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)] active:scale-95'"
                    :disabled="item.item?.[2]?.odds == null"
                  >
                    <span class="text-xs text-[var(--color-muted)] block"
                          :class="item.item?.[2]?.odds != null && betSlipStore.isSelected(getSelectionId('Moneyline', 'away')) ? 'text-white/70' : ''">
                      {{ item.item?.[2]?.title }}
                    </span>
                    <span>{{ formatPlayItemOdds(item.item?.[2]?.odds) }}</span>
                  </button>

                  <button
                    @click="handleOddsClick('Moneyline', 'draw', t('common.draw'), match.odds.draw)"
                    class="py-3 rounded-xl font-semibold text-center transition-all duration-200 
                          active:scale-95 border-2"
                    :class="betSlipStore.isSelected(getSelectionId('Moneyline', 'draw'))
                      ? 'bg-primary text-white border-primary'
                      : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                  >
                    <span class="text-xs text-[var(--color-muted)] block"
                          :class="betSlipStore.isSelected(getSelectionId('Moneyline', 'draw')) ? 'text-white/70' : ''">
                      {{ item.item?.[1]?.title }}
                    </span>
                    <span>{{ formatPlayItemOdds(item.item?.[1]?.odds) }}</span>
                  </button>
                </div>
              </div>
            </template>

            <!-- Handicap -->
            <template v-for="item in siteGameStore.siteGame?.list?.[1]?.item" :key="item.id">
              <div v-if="activeTab === '2'" class="mb-4">
                  <h3 class="text-sm font-semibold text-[var(--color-text)] mb-2">{{ $t(item.title) }}</h3>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="handleOddsClick('Handicap', 'home', `${homeTeamName} ${item.item?.[0]?.draw ?? ''}`, playItemOddsNumber(item.item?.[0]?.odds))"
                    class="py-3 rounded-xl font-semibold text-center transition-all duration-200 
                          active:scale-95 border-2"
                    :class="betSlipStore.isSelected(getSelectionId('Handicap', 'home'))
                      ? 'bg-primary text-white border-primary'
                      : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                  >
                    <span class="text-xs text-[var(--color-muted)] block"
                          :class="betSlipStore.isSelected(getSelectionId('Handicap', 'home')) ? 'text-white/70' : ''">
                      {{ item.item?.[0]?.title }} 
                      <template v-if="item.item?.[0]?.draw">({{ item.item?.[0]?.draw }})</template>
                    </span>
                    <span>{{ formatPlayItemOdds(item.item?.[0]?.odds) }}</span>
                  </button>
                  <button
                  @click="handleOddsClick('Handicap', 'away', `${awayTeamName} ${item.item?.[1]?.draw ?? ''}`, playItemOddsNumber(item.item?.[1]?.odds))"
                  class="py-3 rounded-xl font-semibold text-center transition-all duration-200 
                         active:scale-95 border-2"
                  :class="betSlipStore.isSelected(getSelectionId('Handicap', 'away'))
                    ? 'bg-primary text-white border-primary'
                    : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                >
                  <span class="text-xs text-[var(--color-muted)] block"
                        :class="betSlipStore.isSelected(getSelectionId('Handicap', 'away')) ? 'text-white/70' : ''">
                    {{ item.item?.[1]?.title }} 
                    <template v-if="item.item?.[1]?.draw">({{ item.item?.[1]?.draw }})</template>
                  </span>
                  <span>{{ formatPlayItemOdds(item.item?.[1]?.odds) }}</span>
                </button>
                </div>
              </div>
            </template>

            <!-- Over/Under -->
              <div v-if="activeTab === '3'" class="mb-4">
                <h3 class="text-sm font-semibold text-[var(--color-text)] mb-2">{{ $t(siteGameStore.siteGame?.list?.[2]?.item?.[0]?.title ?? '') }}</h3> 
                <div class="grid grid-cols-3 gap-2">
                  <template v-for="item in siteGameStore.siteGame?.list?.[2]?.item?.[0]?.item" :key="item.id">

                  <button
                    @click="handleOddsClick('O/U', 'over', `${t('common.over')} ${item.title ?? ''}`, playItemOddsNumber(item.odds))"
                    class="py-3 rounded-xl font-semibold text-center transition-all duration-200 
                          active:scale-95 border-2"
                    :class="betSlipStore.isSelected(getSelectionId('O/U', 'over'))
                      ? 'bg-primary text-white border-primary'
                      : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                  >
                    <span class="text-xs text-[var(--color-muted)] block"
                          :class="betSlipStore.isSelected(getSelectionId('O/U', 'over')) ? 'text-white/70' : ''">
                      {{ item.title }}
                    </span>
                    <span>{{ formatPlayItemOdds(item.odds) }}</span>
                  </button>
                  </template>
                </div>
              </div>

            <!-- Odd/Even -->
            <div v-if="activeTab === '4' && match.markets">
              <h3 class="text-sm font-semibold text-[var(--color-text)] mb-2">{{ $t('matchDetail.markets.oddEven') }}</h3>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="handleOddsClick('OddEven', 'odd', t('common.odd'), match.markets.oddEven.odd)"
                  class="py-3 rounded-xl font-semibold text-center transition-all duration-200 
                         active:scale-95 border-2"
                  :class="betSlipStore.isSelected(getSelectionId('OddEven', 'odd'))
                    ? 'bg-primary text-white border-primary'
                    : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                >
                  <span class="text-xs text-[var(--color-muted)] block"
                        :class="betSlipStore.isSelected(getSelectionId('OddEven', 'odd')) ? 'text-white/70' : ''">
                    {{ $t('common.odd') }}
                  </span>
                  <span>{{ match.markets.oddEven.odd.toFixed(2) }}</span>
                </button>
                <button
                  @click="handleOddsClick('OddEven', 'even', t('common.even'), match.markets.oddEven.even)"
                  class="py-3 rounded-xl font-semibold text-center transition-all duration-200 
                         active:scale-95 border-2"
                  :class="betSlipStore.isSelected(getSelectionId('OddEven', 'even'))
                    ? 'bg-primary text-white border-primary'
                    : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                >
                  <span class="text-xs text-[var(--color-muted)] block"
                        :class="betSlipStore.isSelected(getSelectionId('OddEven', 'even')) ? 'text-white/70' : ''">
                    {{ $t('common.even') }}
                  </span>
                  <span>{{ match.markets.oddEven.even.toFixed(2) }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat toggle (fixed at bottom of panel) -->
        <button
          @click="chatStore.toggleChat()"
          class="absolute bottom-4 left-4 right-4 py-3 rounded-xl font-semibold text-white
                 bg-gradient-to-r from-primary to-primary-light shadow-lg shadow-primary/20
                 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <MessageCircle class="w-5 h-5" />
          <span>{{ chatStore.isChatOpen ? $t('chat.close') : $t('nav.chat') }}</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
