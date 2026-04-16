<script setup lang="ts">
import { watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { X } from 'lucide-vue-next'
import { useBetSlipStore, type BetSelection } from '@/stores/betSlipStore'

const COMPACT_MARKETS = new Set(['Moneyline', 'Handicap'])
function isCompactMarket(s: BetSelection): boolean {
  if (s.market) return COMPACT_MARKETS.has(s.market)
  return true
}

/** 大小玩法：投注單只顯示「大」或「小」，不顯示「大於／小於」等字 */
function displaySelectionLabel(s: BetSelection): string {
  const raw = s.selection.trim()
  if (raw.startsWith('大於')) return '大'
  if (raw.startsWith('小於')) return '小'
  if (/^over\b/i.test(raw)) return '大'
  if (/^under\b/i.test(raw)) return '小'
  return s.selection
}

const betSlipStore = useBetSlipStore()
const { stake } = storeToRefs(betSlipStore)

const showPurchaseInsurance = computed(
  () => betSlipStore.siteGame?.list?.[0]?.escape === '1'
)

const activePeriod = computed(() => betSlipStore.siteGame?.list?.[0] ?? null)

function pctToNumber(s: string | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const showInsuranceBreakdown = computed(
  () => showPurchaseInsurance.value && activePeriod.value != null
)

const insuranceFeeAmount = computed(() => {
  if (!showInsuranceBreakdown.value) return 0
  const p = pctToNumber(activePeriod.value?.escape_fee)
  return stake.value * (p / 100)
})

const insuranceWinProfitAmount = computed(() => {
  if (!showInsuranceBreakdown.value) return 0
  const p = pctToNumber(activePeriod.value?.escape_win)
  const odds = betSlipStore.totalOdds
  return stake.value * Math.max(0, odds - 1) * (p / 100)
})

const insuranceLoseRefundAmount = computed(() => {
  if (!showInsuranceBreakdown.value) return 0
  const p = pctToNumber(activePeriod.value?.escape_lose)
  return stake.value * (p / 100)
})

const resolvedSiteGameId = computed(() => {
  return betSlipStore.selections[0]?.matchId ?? null
})

const firstSelectionMarket = computed(() => betSlipStore.selections[0]?.market)
const { locale } = useI18n()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function handleStakeChange(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const value = parseFloat(raw)
  betSlipStore.setStake(Number.isFinite(value) ? Math.max(0, value) : 0)
}

watch(() => betSlipStore.isDrawerOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    if (!betSlipStore.isConfirmModalOpen) document.body.style.overflow = ''
  }
})

watch(
  () =>
    [betSlipStore.isDrawerOpen, resolvedSiteGameId.value, firstSelectionMarket.value] as const,
  ([open, id, market]) => {
    if (open && id != null && id > 0 && market !== 'Champion') {
      betSlipStore.fetchSiteGame(id)
    }
  },
  { immediate: true }
)
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="betSlipStore.isDrawerOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[75]"
        @click="betSlipStore.closeDrawer"
      />
    </Transition>

    <!-- Drawer -->
    <Transition name="slide-up">
      <div
        v-if="betSlipStore.isDrawerOpen"
        class="fixed bottom-0 left-0 right-0 z-[75] max-w-[430px] mx-auto"
      >
        <div class="bg-[var(--color-card)] rounded-t-3xl shadow-2xl shadow-black/20
                    max-h-[100vh] flex flex-col">
          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-2">
            <div class="w-10 h-1 rounded-full bg-[var(--color-border)]" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-4 pb-3 border-b border-[var(--color-border)]">
            <h2 class="text-lg font-bold text-[var(--color-text)]">
              {{ $t('betSlip.title') }}
              <span class="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm">
                {{ betSlipStore.selectionCount }}
              </span>
            </h2>
            <button
              type="button"
              @click="betSlipStore.clearSelections({ fromDrawerHeader: true })"
              class="p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
            >
              <X class="w-5 h-5 text-[var(--color-muted)]" />
            </button>
          </div>

          <!-- 冠軍賽：/site/champion 回傳資料 -->
          <div
            v-if="betSlipStore.championGameData"
            class="mx-4 mb-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]"
          >
            <p class="text-sm font-semibold text-[var(--color-text)] leading-snug">
              {{ betSlipStore.championGameData.game.title }}
            </p>
            <p class="text-xs text-[var(--color-muted)] mt-1 tabular-nums">
              {{ betSlipStore.championGameData.game.start_time }}
              <span class="mx-1 opacity-60">—</span>
              {{ betSlipStore.championGameData.game.end_time }}
            </p>
          </div>

          <!-- Selections（與 MatchDetailPanel handleOddsClick / FeaturedMatchCard 寫入的 payload 一致） -->
          <div class="flex-1 px-4 space-y-3 overflow-y-auto">
            <div
              v-for="selection in betSlipStore.selections"
              :key="selection.id"
              class="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] relative group"
            >
              <button
                type="button"
                @click="betSlipStore.removeSelection(selection.id)"
                class="absolute top-2 right-2 p-1 rounded-lg
                       opacity-0 group-hover:opacity-100
                       hover:bg-danger/10 text-danger transition-all"
              >
                <X class="w-4 h-4" />
              </button>
              <p class="text-xs text-[var(--color-muted)] mb-1">{{ selection.matchTitle }}</p>
              <template v-if="isCompactMarket(selection)">
                <p class="text-sm font-medium text-[var(--color-text)] mb-1">{{ $t('betSlip.playTypeLabel') }}{{ selection.playTitle || selection.betType }}</p>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--color-text)]">{{ displaySelectionLabel(selection) }}</span>
                  <span class="text-sm font-bold text-primary">{{ selection.odds.toFixed(2) }}</span>
                </div>
              </template>
              <template v-else>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-[var(--color-text)]">{{ displaySelectionLabel(selection) }}</span>
                  <span class="text-sm font-bold text-primary">{{ selection.odds.toFixed(2) }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Summary -->
          <div class="p-4 space-y-3">
            <!-- Stake Input -->
            <div class="flex items-center gap-3">
              <span class="text-sm text-[var(--color-muted)]">{{ $t('common.stake') }}</span>
              <div class="flex-1 relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">{{ $t('common.currencySymbol') }}</span>
                <input
                  type="number"
                  min="0"
                  :value="stake"
                  @input="handleStakeChange"
                  class="w-full py-2.5 pl-[50px] pr-3 rounded-xl bg-[var(--color-bg)] 
                         border border-[var(--color-border)] text-[var(--color-text)]
                         focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <!-- Quick Stakes -->
            <div class="flex gap-2">
              <button
                v-for="amount in [100, 500, 1000, 2000]"
                :key="amount"
                @click="betSlipStore.setStake(amount)"
                class="flex-1 py-2 rounded-lg text-sm font-medium
                       bg-[var(--color-bg)] border border-[var(--color-border)]
                       text-[var(--color-text)] hover:border-primary/50
                       transition-all active:scale-95"
                :class="betSlipStore.stake === amount ? 'border-primary bg-primary/10' : ''"
              >
                {{ $t('common.currencySymbol') }}{{ amount }}
              </button>
            </div>

            <!-- Totals -->
            <div class="space-y-2 pt-2 border-t border-[var(--color-border)]">
              <div class="flex items-center justify-between text-sm">
                <span class="text-[var(--color-muted)]">{{ $t('common.totalOdds') }}</span>
                <span class="font-semibold text-[var(--color-text)]">
                  {{ betSlipStore.totalOdds.toFixed(2) }}
                </span>
              </div>
              <template v-if="showPurchaseInsurance">
                <div class="flex items-start justify-between gap-2 text-sm">
                  <div class="min-w-0">
                    <span class="text-[var(--color-muted)]">{{ $t('betSlip.insurance.feeLabel') }}</span>
                    <p class="text-xs text-[var(--color-muted)]/80 mt-0.5">
                      {{ $t('betSlip.insurance.feeSub', { rate: activePeriod?.escape_fee ?? '0' }) }}
                    </p>
                  </div>
                  <span class="font-semibold text-[var(--color-text)] shrink-0 tabular-nums">
                    {{ formatCurrency(insuranceFeeAmount) }}
                  </span>
                </div>
                <div class="flex items-start justify-between gap-2 text-sm">
                  <div class="min-w-0">
                    <span class="text-[var(--color-muted)]">{{ $t('betSlip.insurance.winTrialLabel') }}</span>
                    <p class="text-xs text-[var(--color-muted)]/80 mt-0.5">
                      {{ $t('betSlip.insurance.winTrialSub', { rate: activePeriod?.escape_win ?? '0' }) }}
                    </p>
                  </div>
                  <span class="font-semibold text-[var(--color-text)] shrink-0 tabular-nums">
                    {{ formatCurrency(insuranceWinProfitAmount) }}
                  </span>
                </div>
                <div class="flex items-start justify-between gap-2 text-sm">
                  <div class="min-w-0">
                    <span class="text-[var(--color-muted)]">{{ $t('betSlip.insurance.loseTrialLabel') }}</span>
                    <p class="text-xs text-[var(--color-muted)]/80 mt-0.5">
                      {{ $t('betSlip.insurance.loseTrialSub', { rate: activePeriod?.escape_lose ?? '0' }) }}
                    </p>
                  </div>
                  <span class="font-semibold text-[var(--color-text)] shrink-0 tabular-nums">
                    {{ formatCurrency(insuranceLoseRefundAmount) }}
                  </span>
                </div>
              </template>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--color-muted)]">{{ $t('common.potentialPayout') }}</span>
                <span class="text-xl font-bold text-success">
                  {{ formatCurrency(betSlipStore.potentialPayout) }}
                </span>
              </div>
            </div>

            <!-- Place Bet Button -->
            <button
              type="button"
              @click.stop="betSlipStore.openConfirmModal()"
              :disabled="betSlipStore.selectionCount === 0 || betSlipStore.stake <= 0"
              class="w-full py-4 rounded-2xl font-bold text-white
                     bg-gradient-to-r from-primary to-primary-light
                     shadow-lg shadow-primary/30
                     transition-all active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('common.placeBet') }}
            </button>
          </div>
        </div>
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

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
