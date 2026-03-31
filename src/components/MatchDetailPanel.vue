<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Share2, Zap, Gift, MessageCircle } from 'lucide-vue-next'
import { useMatchStore } from '@/stores/matchStore'
import { useHomeStore, homeGameToMatch } from '@/stores/homeStore'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { useChatStore } from '@/stores/chatStore'
import { useSiteGameStore } from '@/stores/siteGameStore'
import type { GamePeriod, OddsItem, PlayItem } from '@/schema/siteGameSchema'
import type { BetSelection } from '@/stores/betSlipStore'

const matchStore = useMatchStore()
const homeStore = useHomeStore()
const betSlipStore = useBetSlipStore()
const chatStore = useChatStore()
const siteGameStore = useSiteGameStore() 
const { t } = useI18n()

const tabs = computed(() =>
  siteGameStore.siteGame?.list.map((item: GamePeriod) => ({
    key: item.id,
    label: item.title,
    item: item.item,
  }))
)
const activeTab = ref('')

const activePeriod = computed(() => {
  const list = siteGameStore.siteGame?.list
  if (!list?.length || !activeTab.value) return null
  return list.find((p) => p.id === activeTab.value) ?? null
})

const activePlayItems = computed((): PlayItem[] => {
  const period = activePeriod.value
  if (!period) return []

  const direct = period.item
  if (Array.isArray(direct) && direct.length > 0) return direct

  const list = siteGameStore.siteGame?.list ?? []
  const populated = list.filter((p) => Array.isArray(p.item) && p.item.length > 0)
  if (populated.length === 1) return populated[0].item!

  const escape = period.escape
  const peers = populated.filter((p) => p.escape === escape)
  if (peers.length === 1) return peers[0].item!

  const title = period.title?.trim()
  if (title && peers.length > 1) {
    const byTitle = peers.find((p) => p.title?.trim() === title)
    if (byTitle?.item?.length) return byTitle.item
  }

  return []
})

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

function parseApiDateTime(s: string | undefined): number | null {
  if (!s?.trim()) return null
  const ms = Date.parse(s.trim().replace(' ', 'T'))
  return Number.isNaN(ms) ? null : ms
}

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
const getSelectionId = (market: string, type: string, betApiId?: string) => 
  `${match.value?.id}-${market}-${type}${betApiId ? `-${betApiId}` : ''}`

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

function hasPlayableOdds(odds: string | undefined): boolean {
  if (odds == null || odds === '') return false
  return Number.isFinite(Number(odds))
}

function isDrawOddsTitle(title: string | undefined): boolean {
  if (!title?.trim()) return false
  const s = title.trim()
  return s === '平手' || s === '和' || s === 'Draw' || s.toLowerCase() === 'draw'
}

function resolveMoneylineOdds(items: OddsItem[] | null | undefined): {
  home?: OddsItem
  draw?: OddsItem
  away?: OddsItem
} {
  const list = (items ?? []).filter((o) => o?.id)
  const draw = list.find((o) => isDrawOddsTitle(o.title))
  const sides = draw ? list.filter((o) => o !== draw) : [...list]
  const g = siteGameStore.siteGame?.game
  const tHome = g?.team1_title?.trim()
  const tAway = g?.team2_title?.trim()
  let home: OddsItem | undefined = sides.find((o) => tHome !== undefined && tHome !== '' && o.title.trim() === tHome)
  let away: OddsItem | undefined = sides.find((o) => tAway !== undefined && tAway !== '' && o.title.trim() === tAway)
  if (!home) home = sides.find((o) => o.title.trim() === homeTeamName.value.trim())
  if (!away) away = sides.find((o) => o.title.trim() === awayTeamName.value.trim())
  if (!home && sides.length >= 1) home = sides[0]
  if (!away && sides.length >= 2) {
    away = sides.find((o) => o.id !== home?.id) ?? sides[1]
  }
  return { home, draw, away }
}

function playTypeTokenMatches(raw: string | undefined, code: string): boolean {
  if (raw == null) return false
  const s = String(raw).trim()
  if (s === '') return false
  if (s === code) return true
  const n = Number(s)
  const c = Number(code)
  return Number.isFinite(n) && Number.isFinite(c) && n === c
}

/** 比對玩法：`type`／`class_id`（含數字字串），必要時用標題關鍵字（全場與各時段 API 欄位可能不一致） */
function playItemIsMarketType(item: PlayItem, code: '1' | '2' | '3' | '4'): boolean {
  if (
    playTypeTokenMatches(item.type, code) ||
    playTypeTokenMatches(item.class_id, code)
  ) {
    return true
  }
  const title = item.title?.trim() ?? ''
  if (!title) return false
  if (code === '1') {
    return title.includes('獨贏') || title.includes('独赢')
  }
  if (code === '2') {
    return title.includes('讓球') || title.includes('让球')
  }
  if (code === '3') {
    return title.includes('大小')
  }
  if (code === '4') {
    return title.includes('單雙') || title.includes('单双')
  }
  return false
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

const handleOddsClick = (
  market: string,
  type: string,
  label: string,
  odds: number,
  betApiId?: string,
  playTitle?: string
) => {
  if (!match.value) return
  const id = getSelectionId(market, type, betApiId)
  const payload: BetSelection = {
    id,
    matchId: match.value.id,
    matchTitle: matchTitle.value,
    betType: marketLabel(market),
    selection: label,
    odds,
    ...(betApiId != null && betApiId !== '' ? { betApiId } : {}),
    ...(playTitle != null && playTitle !== '' ? { playTitle } : {}),
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

function resetActiveTabToFirst() {
  const list = tabs.value
  if (list?.length) {
    activeTab.value = list[0].key
  }
}

watch(tabs, (list) => {
  if (!list?.length) return
  if (!activeTab.value || !list.some((t: { key: string }) => t.key === activeTab.value)) {
    activeTab.value = list[0].key
  }
})

watch(
  () => matchStore.selectedMatch,
  (m) => {
    if (m) homeStore.clearSelectedGame()
  }
)

watch(isOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) resetActiveTabToFirst()
})
onMounted(() => {
  if (!match.value?.id) return
  siteGameStore.fetchSiteGame(match.value.id)
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

          <!-- 賠率表 -->
          <div class="mt-4 mx-4 mb-6">
            <!-- 獨贏（主｜和｜客由 resolveMoneylineOdds 對齊，不依 API 陣列順序） -->
            <template v-for="item in activePlayItems" :key="item.id">
              <template v-if="playItemIsMarketType(item, '1')">
                <div v-for="ml in [resolveMoneylineOdds(item.item)]" :key="`${item.id}-ml`" class="mb-4">
                  <h3 class="text-sm font-semibold text-[var(--color-text)] mb-2">{{ item.title }}</h3>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      @click="handleOddsClick('Moneyline', 'home', homeTeamName, playItemOddsNumber(ml.home?.odds), ml.home?.id, item.title)"
                      class="py-3 rounded-xl font-semibold text-center transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                      :class="!hasPlayableOdds(ml.home?.odds)
                        ? 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                        : betSlipStore.isSelected(getSelectionId('Moneyline', 'home', ml.home?.id))
                          ? 'bg-primary text-white border-primary active:scale-95'
                          : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                      :disabled="!hasPlayableOdds(ml.home?.odds)"
                    >
                      <span class="text-xs block"
                            :class="hasPlayableOdds(ml.home?.odds) && betSlipStore.isSelected(getSelectionId('Moneyline', 'home', ml.home?.id)) ? 'text-white/70' : 'text-[var(--color-muted)]'">
                        {{ ml.home?.title }}
                      </span>
                      <span>{{ formatPlayItemOdds(ml.home?.odds) }}</span>
                    </button>
                    <button
                      @click="handleOddsClick('Moneyline', 'draw', ml.draw?.title ?? t('common.draw'), playItemOddsNumber(ml.draw?.odds), ml.draw?.id, item.title)"
                      class="py-3 rounded-xl font-semibold text-center transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                      :class="!hasPlayableOdds(ml.draw?.odds)
                        ? 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                        : betSlipStore.isSelected(getSelectionId('Moneyline', 'draw', ml.draw?.id))
                          ? 'bg-primary text-white border-primary active:scale-95'
                          : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                      :disabled="!hasPlayableOdds(ml.draw?.odds)"
                    >
                      <span class="text-xs block"
                            :class="hasPlayableOdds(ml.draw?.odds) && betSlipStore.isSelected(getSelectionId('Moneyline', 'draw', ml.draw?.id)) ? 'text-white/70' : 'text-[var(--color-muted)]'">
                        {{ ml.draw?.title ?? t('common.draw') }}
                      </span>
                      <span>{{ formatPlayItemOdds(ml.draw?.odds) }}</span>
                    </button>
                    <button
                      @click="handleOddsClick('Moneyline', 'away', awayTeamName, playItemOddsNumber(ml.away?.odds), ml.away?.id, item.title)"
                      class="py-3 rounded-xl font-semibold text-center transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                      :class="!hasPlayableOdds(ml.away?.odds)
                        ? 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                        : betSlipStore.isSelected(getSelectionId('Moneyline', 'away', ml.away?.id))
                          ? 'bg-primary text-white border-primary active:scale-95'
                          : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                      :disabled="!hasPlayableOdds(ml.away?.odds)"
                    >
                      <span class="text-xs block"
                            :class="hasPlayableOdds(ml.away?.odds) && betSlipStore.isSelected(getSelectionId('Moneyline', 'away', ml.away?.id)) ? 'text-white/70' : 'text-[var(--color-muted)]'">
                        {{ ml.away?.title }}
                      </span>
                      <span>{{ formatPlayItemOdds(ml.away?.odds) }}</span>
                    </button>
                  </div>
                </div>
              </template>
            </template>

            <!-- 讓球 -->
            <template v-for="item in activePlayItems" :key="item.id">
              <div v-if="playItemIsMarketType(item, '2')" class="mb-4">
                <h3 class="text-sm font-semibold text-[var(--color-text)] mb-2">{{ item.title }}</h3>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="handleOddsClick('Handicap', 'home', `${homeTeamName} ${item.item?.[0]?.draw ?? ''}`, playItemOddsNumber(item.item?.[0]?.odds), item.item?.[0]?.id, item.title)"
                    class="py-3 rounded-xl font-semibold text-center transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    :class="!hasPlayableOdds(item.item?.[0]?.odds)
                      ? 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                      : betSlipStore.isSelected(getSelectionId('Handicap', 'home', item.item?.[0]?.id))
                        ? 'bg-primary text-white border-primary active:scale-95'
                        : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                    :disabled="!hasPlayableOdds(item.item?.[0]?.odds)"
                  >
                    <span class="text-xs block"
                          :class="hasPlayableOdds(item.item?.[0]?.odds) && betSlipStore.isSelected(getSelectionId('Handicap', 'home', item.item?.[0]?.id)) ? 'text-white/70' : 'text-[var(--color-muted)]'">
                      {{ item.item?.[0]?.title }}
                      <template v-if="item.item?.[0]?.draw">({{ item.item?.[0]?.draw }})</template>
                    </span>
                    <span>{{ formatPlayItemOdds(item.item?.[0]?.odds) }}</span>
                  </button>
                  <button
                    @click="handleOddsClick('Handicap', 'away', `${awayTeamName} ${item.item?.[1]?.draw ?? ''}`, playItemOddsNumber(item.item?.[1]?.odds), item.item?.[1]?.id, item.title)"
                    class="py-3 rounded-xl font-semibold text-center transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    :class="!hasPlayableOdds(item.item?.[1]?.odds)
                      ? 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                      : betSlipStore.isSelected(getSelectionId('Handicap', 'away', item.item?.[1]?.id))
                        ? 'bg-primary text-white border-primary active:scale-95'
                        : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                    :disabled="!hasPlayableOdds(item.item?.[1]?.odds)"
                  >
                    <span class="text-xs block"
                          :class="hasPlayableOdds(item.item?.[1]?.odds) && betSlipStore.isSelected(getSelectionId('Handicap', 'away', item.item?.[1]?.id)) ? 'text-white/70' : 'text-[var(--color-muted)]'">
                      {{ item.item?.[1]?.title }}
                      <template v-if="item.item?.[1]?.draw">({{ item.item?.[1]?.draw }})</template>
                    </span>
                    <span>{{ formatPlayItemOdds(item.item?.[1]?.odds) }}</span>
                  </button>
                </div>
              </div>
            </template>

            <!-- 大小 -->
            <template v-for="item in activePlayItems" :key="`ou-${item.id}`">
              <div v-if="playItemIsMarketType(item, '3')" class="mb-4">
                <h3 class="text-sm font-semibold text-[var(--color-text)] mb-2">{{ item.title || $t('matchDetail.markets.overUnder') }}</h3>
                <div class="grid grid-cols-2 gap-2">
                  <template v-for="ou in item.item" :key="ou.id">
                    <button
                      @click="handleOddsClick('O/U', 'over', `${t('common.over')} ${ou.title ?? ''}`, playItemOddsNumber(ou.odds), ou.id, item.title)"
                      class="py-3 rounded-xl font-semibold text-center transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                      :class="!hasPlayableOdds(ou.odds)
                        ? 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                        : betSlipStore.isSelected(getSelectionId('O/U', 'over', ou.id))
                          ? 'bg-primary text-white border-primary active:scale-95'
                          : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                      :disabled="!hasPlayableOdds(ou.odds)"
                    >
                      <span class="text-xs block"
                            :class="hasPlayableOdds(ou.odds) && betSlipStore.isSelected(getSelectionId('O/U', 'over', ou.id)) ? 'text-white/70' : 'text-[var(--color-muted)]'">
                        {{ ou.title }}
                      </span>
                      <span>{{ formatPlayItemOdds(ou.odds) }}</span>
                    </button>
                  </template>
                </div>
              </div>
            </template>

            <!-- 單雙 -->
            <template v-for="item in activePlayItems" :key="item.id">
              <div v-if="playItemIsMarketType(item, '4')" class="mb-4">
                <h3 class="text-sm font-semibold text-[var(--color-text)] mb-2">{{ item.title || $t('matchDetail.markets.oddEven') }}</h3>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="handleOddsClick('OddEven', 'odd', item.item?.[0]?.title ?? t('common.odd'), playItemOddsNumber(item.item?.[0]?.odds), item.item?.[0]?.id, item.title)"
                    class="py-3 rounded-xl font-semibold text-center transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    :class="!hasPlayableOdds(item.item?.[0]?.odds)
                      ? 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                      : betSlipStore.isSelected(getSelectionId('OddEven', 'odd', item.item?.[0]?.id))
                        ? 'bg-primary text-white border-primary active:scale-95'
                        : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                    :disabled="!hasPlayableOdds(item.item?.[0]?.odds)"
                  >
                    <span class="text-xs block"
                          :class="hasPlayableOdds(item.item?.[0]?.odds) && betSlipStore.isSelected(getSelectionId('OddEven', 'odd', item.item?.[0]?.id)) ? 'text-white/70' : 'text-[var(--color-muted)]'">
                      {{ item.item?.[0]?.title || $t('common.odd') }}
                    </span>
                    <span>{{ formatPlayItemOdds(item.item?.[0]?.odds) }}</span>
                  </button>
                  <button
                    @click="handleOddsClick('OddEven', 'even', item.item?.[1]?.title ?? t('common.even'), playItemOddsNumber(item.item?.[1]?.odds), item.item?.[1]?.id, item.title)"
                    class="py-3 rounded-xl font-semibold text-center transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    :class="!hasPlayableOdds(item.item?.[1]?.odds)
                      ? 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]'
                      : betSlipStore.isSelected(getSelectionId('OddEven', 'even', item.item?.[1]?.id))
                        ? 'bg-primary text-white border-primary active:scale-95'
                        : 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]'"
                    :disabled="!hasPlayableOdds(item.item?.[1]?.odds)"
                  >
                    <span class="text-xs block"
                          :class="hasPlayableOdds(item.item?.[1]?.odds) && betSlipStore.isSelected(getSelectionId('OddEven', 'even', item.item?.[1]?.id)) ? 'text-white/70' : 'text-[var(--color-muted)]'">
                      {{ item.item?.[1]?.title || $t('common.even') }}
                    </span>
                    <span>{{ formatPlayItemOdds(item.item?.[1]?.odds) }}</span>
                  </button>
                </div>
              </div>
            </template>
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
