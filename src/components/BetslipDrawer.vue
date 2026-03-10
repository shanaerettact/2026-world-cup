<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Trash2, AlertTriangle, TrendingUp, Shield } from 'lucide-vue-next'
import { useBetSlipStore } from '@/stores/betSlipStore'

const betSlipStore = useBetSlipStore()
const { t, locale } = useI18n()

const riskColor = computed(() => {
  switch (betSlipStore.riskLevel) {
    case 'low': return 'text-primary bg-primary/10 border-primary/20'
    case 'medium': return 'text-warning bg-warning/10 border-warning/20'
    case 'high': return 'text-danger bg-danger/10 border-danger/20'
    default: return 'text-primary bg-primary/10 border-primary/20'
  }
})

const riskLabel = computed(() => {
  switch (betSlipStore.riskLevel) {
    case 'low': return t('risk.low')
    case 'medium': return t('risk.medium')
    case 'high': return t('risk.high')
    default: return t('risk.low')
  }
})

const RiskIcon = computed(() => {
  switch (betSlipStore.riskLevel) {
    case 'low': return Shield
    case 'medium': return TrendingUp
    case 'high': return AlertTriangle
    default: return Shield
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const handleStakeChange = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value) || 0
  betSlipStore.setStake(value)
}

// Lock body scroll when open
watch(() => betSlipStore.isDrawerOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="betSlipStore.isDrawerOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        @click="betSlipStore.closeDrawer"
      />
    </Transition>

    <!-- Drawer -->
    <Transition name="slide-up">
      <div
        v-if="betSlipStore.isDrawerOpen"
        class="fixed bottom-0 left-0 right-0 z-[60] max-w-[430px] mx-auto"
      >
        <div class="bg-[var(--color-card)] rounded-t-3xl shadow-2xl shadow-black/20
                    max-h-[80vh] flex flex-col">
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
            <div class="flex items-center gap-2">
              <button
                @click="betSlipStore.clearSelections"
                class="p-2 rounded-lg hover:bg-danger/10 text-danger transition-colors"
              >
                <Trash2 class="w-5 h-5" />
              </button>
              <button
                @click="betSlipStore.closeDrawer"
                class="p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
              >
                <X class="w-5 h-5 text-[var(--color-muted)]" />
              </button>
            </div>
          </div>

          <!-- Bet Mode Tabs -->
          <div class="px-4 py-3">
            <div class="flex gap-2 p-1 rounded-xl bg-[var(--color-bg)]">
              <button
                @click="betSlipStore.setBetMode('single')"
                class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                :class="betSlipStore.betMode === 'single'
                  ? 'bg-[var(--color-card)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-muted)]'"
              >
                {{ $t('common.single') }}
              </button>
              <button
                @click="betSlipStore.setBetMode('parlay')"
                class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                :class="betSlipStore.betMode === 'parlay'
                  ? 'bg-[var(--color-card)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-muted)]'"
              >
                {{ $t('common.parlay') }}
              </button>
            </div>
          </div>

          <!-- Selections -->
          <div class="flex-1 overflow-y-auto px-4 space-y-3 max-h-[30vh]">
            <div
              v-for="selection in betSlipStore.selections"
              :key="selection.id"
              class="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]
                     relative group"
            >
              <button
                @click="betSlipStore.removeSelection(selection.id)"
                class="absolute top-2 right-2 p-1 rounded-lg
                       opacity-0 group-hover:opacity-100
                       hover:bg-danger/10 text-danger transition-all"
              >
                <X class="w-4 h-4" />
              </button>
              <p class="text-xs text-[var(--color-muted)] mb-1">{{ selection.matchTitle }}</p>
              <p class="text-sm font-medium text-[var(--color-text)] mb-1">{{ selection.betType }}</p>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--color-text)]">{{ selection.selection }}</span>
                <span class="text-sm font-bold text-primary">{{ selection.odds.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="p-4 border-t border-[var(--color-border)] space-y-3">
            <!-- Risk Level -->
            <div 
              class="flex items-center gap-2 p-2 rounded-xl border"
              :class="riskColor"
            >
              <component :is="RiskIcon" class="w-4 h-4" />
              <span class="text-sm font-medium">{{ riskLabel }}</span>
            </div>

            <!-- Stake Input -->
            <div class="flex items-center gap-3">
              <span class="text-sm text-[var(--color-muted)]">{{ $t('common.stake') }}</span>
              <div class="flex-1 relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">{{ $t('common.currencySymbol') }}</span>
                <input
                  type="number"
                  :value="betSlipStore.stake"
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
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--color-muted)]">{{ $t('common.potentialPayout') }}</span>
                <span class="text-xl font-bold text-success">
                  {{ formatCurrency(betSlipStore.potentialPayout) }}
                </span>
              </div>
            </div>

            <!-- Place Bet Button -->
            <button
              @click="betSlipStore.openConfirmModal"
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
