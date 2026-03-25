<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, TrendingUp, Star, Zap, Target, ChevronRight, ArrowUpRight } from 'lucide-vue-next'
import { useBettingModalStore } from '@/stores/bettingModalStore'

const store = useBettingModalStore()
const placingBetId = ref<string | null>(null)

const sections = [
  {
    id: 'moneyline',
    icon: TrendingUp,
    gradFrom: '#1e3a8a',
    gradTo: '#3b82f6',
    glowColor: 'rgba(78,128,238,0.45)',
    accentHex: '#4e80ee',
    badge: 'Most Popular',
    title: 'Moneyline',
    subtitle: 'Pick the outright winner',
    description:
      'The simplest form of wagering — select which side wins the match. No spreads or handicaps. Odds reflect probability: favorites return less, underdogs return more. Ideal for beginners and for markets where one team is clearly stronger.',
    options: [
      { key: 'hw', label: 'Home Win',  odds: '2.10', hint: 'Home team wins in 90 min' },
      { key: 'dr', label: 'Draw',      odds: '3.40', hint: 'Level after full time' },
      { key: 'aw', label: 'Away Win',  odds: '3.75', hint: 'Visiting team wins' },
    ],
  },
  {
    id: 'handicap',
    icon: Target,
    gradFrom: '#78350f',
    gradTo: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.45)',
    accentHex: '#f59e0b',
    badge: 'Value Bet',
    title: 'Asian Handicap',
    subtitle: 'Level the playing field',
    description:
      'Eliminates the draw by giving one team a virtual head-start. A −1.5 handicap on the favorite means they must win by 2+ goals. Sharper lines and often better value than traditional 1X2 markets — popular with experienced bettors.',
    options: [
      { key: 'ah1', label: 'Home −1.5', odds: '1.85', hint: 'Home wins by 2 or more goals' },
      { key: 'ah2', label: 'Away +1.5', odds: '1.95', hint: 'Away loses by 1 or wins' },
    ],
  },
  {
    id: 'overunder',
    icon: Zap,
    gradFrom: '#064e3b',
    gradTo: '#10b981',
    glowColor: 'rgba(16,185,129,0.45)',
    accentHex: '#10b981',
    badge: 'High Action',
    title: 'Over / Under',
    subtitle: 'Total goals scored',
    description:
      'Wager on the combined number of goals by both teams. If the line is 2.5, Over wins with 3+ goals, Under wins with 2 or fewer. Great when you have conviction on game pace but are uncertain of the winner.',
    options: [
      { key: 'o25', label: 'Over 2.5',  odds: '1.72', hint: '3 or more total goals' },
      { key: 'u25', label: 'Under 2.5', odds: '2.05', hint: '2 or fewer total goals' },
      { key: 'o35', label: 'Over 3.5',  odds: '2.90', hint: '4 or more total goals' },
    ],
  },
  {
    id: 'btts',
    icon: Star,
    gradFrom: '#7f1d1d',
    gradTo: '#ef4444',
    glowColor: 'rgba(239,68,68,0.45)',
    accentHex: '#ef4444',
    badge: 'Fan Favorite',
    title: 'Both Teams to Score',
    subtitle: 'Will both sides find the net?',
    description:
      "Predict whether each side scores at least one goal. The final result doesn't matter — only whether both nets are broken. BTTS Yes thrives in high-scoring matchups; BTTS No suits tight, defensive encounters.",
    options: [
      { key: 'btts_y', label: 'BTTS — Yes', odds: '1.65', hint: 'Both teams score 1+ goals' },
      { key: 'btts_n', label: 'BTTS — No',  odds: '2.15', hint: 'At least one clean sheet kept' },
    ],
  },
  {
    id: 'firstgoal',
    icon: ArrowUpRight,
    gradFrom: '#3b0764',
    gradTo: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.45)',
    accentHex: '#8b5cf6',
    badge: 'Quick Win',
    title: 'First Goal Scorer',
    subtitle: 'Name the opening goal hero',
    description:
      'Predict which player will score first. Odds are generous given the many possible scorers. High variance with significant upside — a single goal from the right player can multiply your stake many times over.',
    options: [
      { key: 'fgs_a', label: 'Striker A',   odds: '5.50',  hint: 'Top scorer this season' },
      { key: 'fgs_b', label: 'Midfielder B', odds: '8.00',  hint: 'Known for long-range efforts' },
      { key: 'fgs_ng', label: 'No Goal',    odds: '12.00', hint: 'Match ends goalless' },
    ],
  },
  {
    id: 'corners',
    icon: TrendingUp,
    gradFrom: '#1e3a5f',
    gradTo: '#0ea5e9',
    glowColor: 'rgba(14,165,233,0.45)',
    accentHex: '#0ea5e9',
    badge: 'Specialist',
    title: 'Corner Betting',
    subtitle: 'Wager on set-piece volume',
    description:
      'Bet on the total number of corners, which team wins more corners, or exact corner count intervals. A specialist market that rewards tactical knowledge — teams that dominate possession typically generate more corners.',
    options: [
      { key: 'co9',   label: 'Over 9.5 Corners',  odds: '1.80', hint: '10 or more corners total' },
      { key: 'cu9',   label: 'Under 9.5 Corners', odds: '1.95', hint: '9 or fewer corners total' },
      { key: 'cmost', label: 'Home Most Corners',  odds: '2.20', hint: 'Home team wins corner count' },
    ],
  },
]

function handlePlaceBet(sectionId: string, key: string) {
  const id = `${sectionId}-${key}`
  placingBetId.value = id
  setTimeout(() => { placingBetId.value = null }, 1400)
}

watch(
  () => store.isOpen,
  (open) => { document.body.style.overflow = open ? 'hidden' : '' },
)
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
        aria-label="Betting Markets"
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
                Betting Markets
              </h2>
              <p class="text-xs text-[var(--color-muted)] mt-0.5">
                {{ sections.length }} markets available · World Cup 2026
              </p>
            </div>
            <button
              @click="store.close()"
              class="w-9 h-9 rounded-xl flex items-center justify-center
                     bg-[var(--color-bg)] border border-[var(--color-border)]
                     text-[var(--color-muted)] hover:text-[var(--color-text)]
                     transition-all active:scale-90"
              aria-label="Close betting markets"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
            <!-- Section card -->
            <article
              v-for="section in sections"
              :key="section.id"
              class="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm"
              style="background: var(--color-bg)"
            >
              <!-- Banner -->
              <div
                class="relative px-4 py-5 overflow-hidden"
                :style="`background: linear-gradient(135deg, ${section.gradFrom} 0%, ${section.gradTo} 100%)`"
              >
                <!-- Orb decorations -->
                <div
                  class="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-25 pointer-events-none"
                  :style="`background: ${section.accentHex}`"
                />
                <div
                  class="absolute -bottom-8 -left-8 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none"
                  :style="`background: ${section.accentHex}`"
                />

                <div class="relative z-10 flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <!-- 3-D icon sphere -->
                    <div
                      class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                             border border-white/20"
                      style="background: rgba(255,255,255,0.12); backdrop-filter: blur(8px)"
                      :style="`box-shadow: 0 0px 0 1px rgba(255,255,255,0.08) inset,
                                           0 6px 20px ${section.glowColor}`"
                    >
                      <component :is="section.icon" class="w-5 h-5 text-white" />
                    </div>

                    <div>
                      <!-- Badge -->
                      <span
                        class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold
                               uppercase tracking-widest mb-1 text-white/90"
                        style="background: rgba(0,0,0,0.25); backdrop-filter: blur(4px)"
                      >
                        {{ section.badge }}
                      </span>
                      <h3 class="text-base font-bold text-white leading-tight">{{ section.title }}</h3>
                      <p class="text-xs text-white/65 mt-0.5">{{ section.subtitle }}</p>
                    </div>
                  </div>

                  <ChevronRight class="w-4 h-4 text-white/40 mt-3 shrink-0" />
                </div>
              </div>

              <!-- Body -->
              <div class="p-4">
                <!-- Description -->
                <p class="text-xs leading-relaxed text-[var(--color-muted)] mb-4">
                  {{ section.description }}
                </p>

                <!-- Odds rows -->
                <div class="space-y-2 mb-4">
                  <div
                    v-for="option in section.options"
                    :key="option.key"
                    class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl
                           border border-[var(--color-border)]"
                    style="background: var(--color-card)"
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-[var(--color-text)] truncate">
                        {{ option.label }}
                      </p>
                      <p class="text-[10px] text-[var(--color-muted)] truncate">
                        {{ option.hint }}
                      </p>
                    </div>
                    <button
                      @click="handlePlaceBet(section.id, option.key)"
                      class="shrink-0 text-sm font-bold px-3 py-1.5 rounded-lg
                             border border-[var(--color-border)] transition-all active:scale-95"
                      style="background: var(--color-bg)"
                      :style="`color: ${section.accentHex}`"
                    >
                      <Transition name="bom-fade" mode="out-in">
                        <span
                          v-if="placingBetId === `${section.id}-${option.key}`"
                          key="adding"
                          class="flex items-center gap-1"
                        >
                          <span
                            class="w-3 h-3 border-2 border-current/30 border-t-current
                                   rounded-full animate-spin"
                          />
                          Added
                        </span>
                        <span v-else key="odds">{{ option.odds }}</span>
                      </Transition>
                    </button>
                  </div>
                </div>

                <!-- Primary CTA -->
                <button
                  @click="handlePlaceBet(section.id, 'cta')"
                  class="w-full py-3 rounded-xl font-bold text-sm text-white
                         transition-all duration-200 active:scale-[0.97] flex items-center
                         justify-center gap-2 overflow-hidden"
                  :style="`background: linear-gradient(135deg, ${section.gradFrom}, ${section.gradTo});
                           box-shadow: 0 4px 20px ${section.glowColor}`"
                >
                  <Transition name="bom-fade" mode="out-in">
                    <span
                      v-if="placingBetId === `${section.id}-cta`"
                      key="placing"
                      class="flex items-center gap-2"
                    >
                      <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Placing Bet...
                    </span>
                    <span v-else key="cta" class="flex items-center gap-2">
                      Place Bet — {{ section.title }}
                      <ChevronRight class="w-4 h-4" />
                    </span>
                  </Transition>
                </button>
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
