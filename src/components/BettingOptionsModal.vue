<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, TrendingUp, Star, Zap, Target, ChevronRight, ArrowUpRight } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const placingBetSection = ref<string | null>(null)

const bettingSections = [
  {
    id: 'moneyline',
    icon: TrendingUp,
    accentColor: '#4e80ee',
    accentFrom: '#1e40af',
    accentTo: '#6aa1ff',
    badge: 'Most Popular',
    badgeColor: 'bg-primary/20 text-primary',
    title: 'Moneyline Betting',
    subtitle: 'Pick the outright winner',
    description:
      'Moneyline betting is the simplest form of sports wagering. You select which team will win the match outright. No spreads, no handicaps — just pick the winner. Odds reflect each team\'s probability of winning, so favorites offer lower returns while underdogs carry higher payouts.',
    options: [
      { label: 'Home Win', odds: '2.10', hint: 'Team playing at home ground' },
      { label: 'Draw', odds: '3.40', hint: 'Match ends level after 90 mins' },
      { label: 'Away Win', odds: '3.75', hint: 'Visiting team secures victory' },
    ],
  },
  {
    id: 'handicap',
    icon: Target,
    accentColor: '#f59e0b',
    accentFrom: '#b45309',
    accentTo: '#fbbf24',
    badge: 'Value Bet',
    badgeColor: 'bg-warning/20 text-warning',
    title: 'Asian Handicap',
    subtitle: 'Level the playing field',
    description:
      'Asian Handicap removes the draw outcome by giving one side a virtual head-start. A -1.5 handicap means the favored team must win by 2 or more goals for that bet to win. This market offers sharper lines and often better value compared to traditional 1X2 markets.',
    options: [
      { label: '-1.5 (Home)', odds: '1.85', hint: 'Home wins by 2+ goals' },
      { label: '+1.5 (Away)', odds: '1.95', hint: 'Away loses by 1 or wins' },
    ],
  },
  {
    id: 'overunder',
    icon: Zap,
    accentColor: '#10b981',
    accentFrom: '#065f46',
    accentTo: '#34d399',
    badge: 'High Action',
    badgeColor: 'bg-success/20 text-success',
    title: 'Over / Under Goals',
    subtitle: 'Bet on total goals scored',
    description:
      'Rather than predicting who wins, you wager on the total number of goals scored by both teams combined. If the line is 2.5, an Over bet wins if 3 or more goals are scored. Under wins if there are 2 or fewer. A great option when you have a strong read on game pace but are unsure of the winner.',
    options: [
      { label: 'Over 2.5', odds: '1.72', hint: '3 or more total goals' },
      { label: 'Under 2.5', odds: '2.05', hint: '2 or fewer total goals' },
      { label: 'Over 3.5', odds: '2.90', hint: '4 or more total goals' },
    ],
  },
  {
    id: 'bothscore',
    icon: Star,
    accentColor: '#ef4444',
    accentFrom: '#7f1d1d',
    accentTo: '#f87171',
    badge: 'Fan Favorite',
    badgeColor: 'bg-danger/20 text-danger',
    title: 'Both Teams to Score',
    subtitle: 'Will both sides find the net?',
    description:
      'Predict whether both teams will score at least one goal during the match. This market doesn\'t care about who wins — only whether each side manages to put the ball in the net. BTTS Yes is popular in high-scoring leagues while BTTS No suits tight defensive battles.',
    options: [
      { label: 'BTTS — Yes', odds: '1.65', hint: 'Both teams score 1+ goals' },
      { label: 'BTTS — No', odds: '2.15', hint: 'At least one team kept clean' },
    ],
  },
  {
    id: 'firstgoal',
    icon: ArrowUpRight,
    accentColor: '#8b5cf6',
    accentFrom: '#4c1d95',
    accentTo: '#a78bfa',
    badge: 'Quick Win',
    badgeColor: 'bg-violet-500/20 text-violet-400',
    title: 'First Goal Scorer',
    subtitle: 'Name the opening goal hero',
    description:
      'Predict which player will score the first goal of the match. Odds are typically generous since there are many possible scorers. It\'s a high-variance bet with significant upside — a single goal from the right player can multiply your stake many times over.',
    options: [
      { label: 'Striker A', odds: '5.50', hint: 'Top scorer this season' },
      { label: 'Midfielder B', odds: '8.00', hint: 'Known for long-range efforts' },
      { label: 'No Goal', odds: '12.00', hint: 'Match ends goalless' },
    ],
  },
]

const handlePlaceBet = (sectionId: string, optionLabel: string) => {
  placingBetSection.value = `${sectionId}-${optionLabel}`
  setTimeout(() => {
    placingBetSection.value = null
  }, 1500)
}

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  }
)
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="bom-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md"
        @click.self="emit('close')"
        role="dialog"
        aria-modal="true"
        aria-label="Betting Options"
      />
    </Transition>

    <!-- Modal Sheet -->
    <Transition name="bom-slide">
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-[70] max-w-[430px] mx-auto
               flex flex-col max-h-[92dvh]"
      >
        <!-- Glassy container -->
        <div class="flex flex-col rounded-t-3xl overflow-hidden
                    bg-[var(--color-card)] shadow-2xl shadow-black/40
                    border-t border-x border-[var(--color-border)]">

          <!-- Handle bar -->
          <div class="shrink-0 flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 rounded-full bg-[var(--color-border)]" />
          </div>

          <!-- Header -->
          <div class="shrink-0 flex items-center justify-between px-5 py-3
                      border-b border-[var(--color-border)]">
            <div>
              <h2 class="text-lg font-bold text-[var(--color-text)] leading-tight">
                Betting Markets
              </h2>
              <p class="text-xs text-[var(--color-muted)] mt-0.5">
                {{ bettingSections.length }} markets available
              </p>
            </div>
            <button
              @click="emit('close')"
              class="w-9 h-9 rounded-xl flex items-center justify-center
                     bg-[var(--color-bg)] border border-[var(--color-border)]
                     text-[var(--color-muted)] hover:text-[var(--color-text)]
                     transition-all active:scale-90"
              aria-label="Close modal"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Scrollable sections -->
          <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
            <article
              v-for="section in bettingSections"
              :key="section.id"
              class="rounded-2xl overflow-hidden border border-[var(--color-border)]
                     bg-[var(--color-bg)] shadow-sm"
            >
              <!-- Banner -->
              <div
                class="relative px-4 py-5 overflow-hidden"
                :style="`background: linear-gradient(135deg, ${section.accentFrom}cc, ${section.accentTo}99)`"
              >
                <!-- Decorative orbs -->
                <div
                  class="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl"
                  :style="`background: ${section.accentColor}`"
                />
                <div
                  class="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15 blur-xl"
                  :style="`background: ${section.accentColor}`"
                />

                <div class="relative z-10 flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <!-- Icon sphere -->
                    <div
                      class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                             bg-white/15 backdrop-blur-sm border border-white/20
                             shadow-lg"
                      :style="`box-shadow: 0 4px 20px ${section.accentColor}50`"
                    >
                      <component :is="section.icon" class="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span
                        class="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold
                               uppercase tracking-wider mb-1"
                        :class="section.badgeColor"
                        style="backdrop-filter: blur(4px); background-color: rgba(0,0,0,0.2); color: white"
                      >
                        {{ section.badge }}
                      </span>
                      <h3 class="text-base font-bold text-white leading-tight">{{ section.title }}</h3>
                      <p class="text-xs text-white/70 mt-0.5">{{ section.subtitle }}</p>
                    </div>
                  </div>
                  <ChevronRight class="w-4 h-4 text-white/50 mt-3 shrink-0" />
                </div>
              </div>

              <!-- Body -->
              <div class="p-4">
                <!-- Description -->
                <p class="text-xs text-[var(--color-muted)] leading-relaxed mb-4">
                  {{ section.description }}
                </p>

                <!-- Odds Options -->
                <div class="space-y-2 mb-4">
                  <div
                    v-for="option in section.options"
                    :key="option.label"
                    class="flex items-center justify-between gap-3
                           px-3 py-2.5 rounded-xl
                           bg-[var(--color-card)] border border-[var(--color-border)]"
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-[var(--color-text)] truncate">{{ option.label }}</p>
                      <p class="text-[10px] text-[var(--color-muted)] truncate">{{ option.hint }}</p>
                    </div>
                    <span
                      class="shrink-0 text-base font-bold px-3 py-1 rounded-lg
                             bg-[var(--color-bg)] border border-[var(--color-border)]"
                      :style="`color: ${section.accentColor}`"
                    >
                      {{ option.odds }}
                    </span>
                  </div>
                </div>

                <!-- Place Bet CTA -->
                <button
                  @click="handlePlaceBet(section.id, 'quick')"
                  class="w-full py-3 rounded-xl font-bold text-sm text-white
                         transition-all duration-200 active:scale-[0.97]
                         flex items-center justify-center gap-2 relative overflow-hidden"
                  :style="`background: linear-gradient(135deg, ${section.accentFrom}, ${section.accentTo});
                           box-shadow: 0 4px 20px ${section.accentColor}40`"
                >
                  <Transition name="bom-fade" mode="out-in">
                    <span
                      v-if="placingBetSection === `${section.id}-quick`"
                      key="done"
                      class="flex items-center gap-2"
                    >
                      <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Placing Bet...
                    </span>
                    <span v-else key="cta" class="flex items-center gap-2">
                      Place Bet on {{ section.title }}
                      <ChevronRight class="w-4 h-4" />
                    </span>
                  </Transition>
                </button>
              </div>
            </article>

            <!-- Bottom spacing for safe area -->
            <div class="h-4" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop fade */
.bom-fade-enter-active,
.bom-fade-leave-active {
  transition: opacity 0.3s ease;
}
.bom-fade-enter-from,
.bom-fade-leave-to {
  opacity: 0;
}

/* Modal slide-up */
.bom-slide-enter-active {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
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
