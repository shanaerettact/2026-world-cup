<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, TrendingUp, Star, Zap, Target, ArrowUpRight } from 'lucide-vue-next'
import { useBettingModalStore } from '@/stores/bettingModalStore'
import { useChampionListStore } from '@/stores/championListStore'
import { useChampionDetailStore } from '@/stores/championDetailStore'
import { useBetSlipStore } from '@/stores/betSlipStore'
import type { BetSelection } from '@/stores/betSlipStore'
import type { ChampionOddsItem } from '@/schema/championListSchema'

const { t } = useI18n()
const store = useBettingModalStore()
const betSlipStore = useBetSlipStore()
const championDetailStore = useChampionDetailStore()
const placingBetId = ref<string | null>(null)
const championListStore = useChampionListStore()

/** 冠軍列表卡片輪播用主題色（與 championList 合併） */
const championThemeColors = [
  { gradFrom: '#1e3a8a', gradTo: '#3b82f6', glowColor: 'rgba(78,128,238,0.45)', accentHex: '#4e80ee' },
  { gradFrom: '#78350f', gradTo: '#f59e0b', glowColor: 'rgba(245,158,11,0.45)', accentHex: '#f59e0b' },
  { gradFrom: '#064e3b', gradTo: '#10b981', glowColor: 'rgba(16,185,129,0.45)', accentHex: '#10b981' },
  { gradFrom: '#7f1d1d', gradTo: '#ef4444', glowColor: 'rgba(239,68,68,0.45)', accentHex: '#ef4444' },
  { gradFrom: '#3b0764', gradTo: '#8b5cf6', glowColor: 'rgba(139,92,246,0.45)', accentHex: '#8b5cf6' },
  { gradFrom: '#1e3a5f', gradTo: '#0ea5e9', glowColor: 'rgba(14,165,233,0.45)', accentHex: '#0ea5e9' },
] as const

const sectionDefs = [
  {
    id: 'moneyline',
    icon: TrendingUp,
    options: [
      { key: 'hw', odds: '2.10' },
      { key: 'dr', odds: '3.40' },
      { key: 'aw', odds: '3.75' },
    ],
  },
  {
    id: 'handicap',
    icon: Target,
    options: [
      { key: 'ah1', odds: '1.85' },
      { key: 'ah2', odds: '1.95' },
    ],
  },
  {
    id: 'overunder',
    icon: Zap,
    options: [
      { key: 'o25', odds: '1.72' },
      { key: 'u25', odds: '2.05' },
      { key: 'o35', odds: '2.90' },
    ],
  },
  {
    id: 'btts',
    icon: Star,
    options: [
      { key: 'btts_y', odds: '1.65' },
      { key: 'btts_n', odds: '2.15' },
    ],
  },
  {
    id: 'firstgoal',
    icon: ArrowUpRight,
    options: [
      { key: 'fgs_a', odds: '5.50' },
      { key: 'fgs_b', odds: '8.00' },
      { key: 'fgs_ng', odds: '12.00' },
    ],
  },
  {
    id: 'corners',
    icon: TrendingUp,
    options: [
      { key: 'co9', odds: '1.80' },
      { key: 'cu9', odds: '1.95' },
      { key: 'cmost', odds: '2.20' },
    ],
  },
]

const championList = computed(() => {
  const raw = championListStore.championList
  const tc = championThemeColors
  const sd = sectionDefs
  return raw.map((item, i) => ({
    ...item,
    ...tc[i % tc.length],
    themeIcon: sd[i % sd.length].icon,
    badge: item.number ? `#${item.number}` : '',
  }))
})

const sections = computed(() =>
  sectionDefs.map((def) => {
    const base = `bettingOptionsModal.sections.${def.id}`
    return {
      ...def,
      badge: t(`${base}.badge`),
      title: t(`${base}.title`),
      subtitle: t(`${base}.subtitle`),
      description: t(`${base}.description`),
      options: def.options.map((o) => ({
        ...o,
        label: t(`${base}.options.${o.key}.label`),
        hint: t(`${base}.options.${o.key}.hint`),
      })),
    }
  }),
)

function championNumericMatchId(championId: string): number {
  const n = Number(championId)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0
}

function championOddToBetSelection(
  champion: { id: string; title: string },
  odd: ChampionOddsItem,
  apiGame?: { title: string },
): BetSelection {
  const slipId = `champion-${champion.id}-${odd.id}`
  const o = Number(odd.odds)
  return {
    id: slipId,
    betApiId: odd.id,
    matchId: championNumericMatchId(champion.id),
    market: 'Champion',
    matchTitle: apiGame?.title ?? champion.title,
    betType: t('bettingOptionsModal.championBetType'),
    selection: odd.title,
    odds: Number.isFinite(o) ? o : 0,
  }
}

async function handleChampionOddClick(champion: { id: string; title: string }, odd: ChampionOddsItem) {
  placingBetId.value = `${champion.id}-${odd.id}`
  try {
    await championDetailStore.fetchChampionDetail(champion.id)
    const data = championDetailStore.championDetail
    if (!data) return
    const oddResolved = data.list.find((o) => o.id === odd.id) ?? odd
    betSlipStore.addSelection(championOddToBetSelection(champion, oddResolved, data.game), {
      championGameData: data,
    })
    store.close()
  } catch (e) {
    console.error(e)
  } finally {
    setTimeout(() => { placingBetId.value = null }, 1400)
  }
}

function parseStartTimeMs(s: string | undefined): number | null {
  if (!s?.trim()) return null
  const ms = Date.parse(s.trim().replace(' ', 'T'))
  return Number.isNaN(ms) ? null : ms
}

function formatDurationToOpen(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (days >= 1) return `${days}d ${pad(h)}:${pad(m)}:${pad(sec)}`
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}

const countdownTick = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

function championOpenCountdown(startTime: string): string {
  void countdownTick.value
  const startMs = parseStartTimeMs(startTime)
  if (startMs == null) return startTime?.trim() ? startTime : '—'
  const diff = startMs - Date.now()
  if (diff <= 0) return t('bettingOptionsModal.marketOpen')
  return formatDurationToOpen(diff)
}

watch(
  () => store.isOpen,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      if (countdownTimer == null) {
        countdownTimer = setInterval(() => { countdownTick.value++ }, 1000)
      }
    } else if (countdownTimer != null) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (countdownTimer != null) clearInterval(countdownTimer)
})

onMounted(() => {
  championListStore.fetchChampionList()
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="bom-fade">
      <div
        v-if="store.isOpen"
        class="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
        @click.self="store.close()"
        aria-hidden="true"
      />
    </Transition>

    <!-- Sheet -->
    <Transition name="bom-slide">
      <div
        v-if="store.isOpen"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('bettingOptionsModal.dialogAria')"
        class="fixed inset-x-0 bottom-0 z-[70] max-w-[430px] mx-auto flex flex-col max-h-[92dvh]"
      >
        <div
          class="flex flex-col rounded-t-3xl overflow-hidden shadow-2xl shadow-black/60
                 border-t border-x border-[var(--color-border)]"
          style="background: var(--color-card)"
        >
          <!-- Pull handle -->
          <div class="shrink-0 flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 rounded-full bg-[var(--color-border)]" />
          </div>

          <!-- Header -->
          <div
            class="shrink-0 flex items-center justify-between px-5 py-3
                   border-b border-[var(--color-border)]"
          >
            <div>
              <h2 class="text-lg font-bold text-[var(--color-text)] leading-tight">
                {{ $t('bettingOptionsModal.title') }}
              </h2>
              <p class="text-xs text-[var(--color-muted)] mt-0.5">
                {{ $t('bettingOptionsModal.subtitle', { count: sections.length }) }}
              </p>
            </div>
            <button
              @click="store.close()"
              class="w-9 h-9 rounded-xl flex items-center justify-center
                     bg-[var(--color-bg)] border border-[var(--color-border)]
                     text-[var(--color-muted)] hover:text-[var(--color-text)]
                     transition-all active:scale-90"
              :aria-label="$t('bettingOptionsModal.closeAria')"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
            <!-- Section card -->
            <article
              v-for="champion in championList"
              :key="champion.id"
              class="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm"
              style="background: var(--color-bg)"
            >
              <!-- Banner -->
              <div
                class="relative px-4 py-5 overflow-hidden"
                :style="`background: linear-gradient(135deg, ${champion.gradFrom} 0%, ${champion.gradTo} 100%)`"
              >
                <!-- Orb decorations -->
                <div
                  class="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-25 pointer-events-none"
                  :style="`background: ${champion.accentHex}`"
                />
                <div
                  class="absolute -bottom-8 -left-8 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none"
                  :style="`background: ${champion.accentHex}`"
                />

                <div class="relative z-10 flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <!-- 3-D icon sphere -->
                    <div
                      class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                             border border-white/20"
                      style="background: rgba(255,255,255,0.12); backdrop-filter: blur(8px)"
                      :style="`box-shadow: 0 0px 0 1px rgba(255,255,255,0.08) inset,
                                           0 6px 20px ${champion.glowColor}`"
                    >
                      <component :is="champion.themeIcon" class="w-5 h-5 text-white" />
                    </div>

                    <div>
                      <!-- Badge -->
                      <span
                        class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold
                               uppercase tracking-widest mb-1 text-white/90"
                        style="background: rgba(0,0,0,0.25); backdrop-filter: blur(4px)"
                      >
                        {{ champion.badge }}
                      </span>
                      <h3 class="text-base font-bold text-white leading-tight">{{ champion.title }}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Body -->
              <div class="p-4">
                <!-- Description -->
                <p class="text-xs text-[var(--color-muted)] my-0.5 tabular-nums">
                  {{ $t('bettingOptionsModal.openCountdownLabel') }}：{{ championOpenCountdown(champion.start_time) }}
                </p>
                <p
                  class="text-xs leading-relaxed text-[var(--color-muted)] mb-4"
                  v-html="champion.content"
                ></p>

                <!-- Odds rows -->
                <div class="space-y-2 mb-4">
                  <div
                    v-for="odd in champion.odds"
                    :key="odd.id"
                    class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl
                           border border-[var(--color-border)]"
                    style="background: var(--color-card)"
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-[var(--color-text)] truncate">
                        {{ odd.title }}
                      </p>
                    </div>
                    <button
                      @click="handleChampionOddClick(champion, odd)"
                      class="shrink-0 text-sm font-bold px-3 py-1.5 rounded-lg
                             border border-[var(--color-border)] transition-all active:scale-95"
                      style="background: var(--color-bg)"
                      :style="`color: ${champion.accentHex}`"
                    >
                      <Transition name="bom-fade" mode="out-in">
                        <span
                          v-if="placingBetId === `${champion.id}-${odd.id}`"
                          key="adding"
                          class="flex items-center gap-1"
                        >
                          <span
                            class="w-3 h-3 border-2 border-current/30 border-t-current
                                   rounded-full animate-spin"
                          />
                          {{ $t('bettingOptionsModal.added') }}
                        </span>
                        <span v-else key="odds">{{ odd.odds }}</span>
                      </Transition>
                    </button>
                  </div>
                </div>

                <!-- Primary CTA -->
                <!-- <button
                  @click="handlePlaceBet(champion.id, 'cta')"
                  class="w-full py-3 rounded-xl font-bold text-sm text-white
                         transition-all duration-200 active:scale-[0.97] flex items-center
                         justify-center gap-2 overflow-hidden"
                  :style="`background: linear-gradient(135deg, ${champion.gradFrom}, ${champion.gradTo});
                           box-shadow: 0 4px 20px ${champion.glowColor}`"
                >
                  <Transition name="bom-fade" mode="out-in">
                    <span
                      v-if="placingBetId === `${champion.id}-cta`"
                      key="placing"
                      class="flex items-center gap-2"
                    >
                      <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {{ $t('bettingOptionsModal.placingBet') }}
                    </span>
                    <span v-else key="cta" class="flex items-center gap-2">
                      {{ $t('bettingOptionsModal.placeBetCta', { section: champion.title }) }}
                      <ChevronRight class="w-4 h-4" />
                    </span>
                  </Transition>
                </button> -->
              </div>
            </article>

            <!-- Safe-area spacer -->
            <div class="h-4" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bom-fade-enter-active,
.bom-fade-leave-active { transition: opacity 0.25s ease; }
.bom-fade-enter-from,
.bom-fade-leave-to     { opacity: 0; }

.bom-slide-enter-active {
  transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.25s ease;
}
.bom-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.bom-slide-enter-from,
.bom-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
