<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { X, Check, AlertTriangle, TrendingUp, Shield } from 'lucide-vue-next'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { postGameBet } from '@/services/api/gameBetApi'

const betSlipStore = useBetSlipStore()
const { purchaseInsurance, stake } = storeToRefs(betSlipStore)
const { t, locale } = useI18n()

const activePeriod = computed(() => betSlipStore.siteGame?.list?.[0] ?? null)
const showPurchaseInsurance = computed(
  () => betSlipStore.siteGame?.list?.[0]?.escape === '1'
)
function pctToNumber(s: string | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}
const showInsuranceBreakdown = computed(
  () =>
    purchaseInsurance.value &&
    showPurchaseInsurance.value &&
    activePeriod.value != null
)
const insuranceFeeAmount = computed(() => {
  if (!showInsuranceBreakdown.value) return 0
  return stake.value * (pctToNumber(activePeriod.value?.escape_fee) / 100)
})
const insuranceWinProfitAmount = computed(() => {
  if (!showInsuranceBreakdown.value) return 0
  const p = pctToNumber(activePeriod.value?.escape_win)
  const odds = betSlipStore.totalOdds
  return stake.value * Math.max(0, odds - 1) * (p / 100)
})
const insuranceLoseRefundAmount = computed(() => {
  if (!showInsuranceBreakdown.value) return 0
  return stake.value * (pctToNumber(activePeriod.value?.escape_lose) / 100)
})
const isConfirmed = ref(false)
const isProcessing = ref(false)
const confirmBetError = ref<string | null>(null)

const riskColor = computed(() => {
  switch (betSlipStore.riskLevel) {
    case 'low': return 'text-primary'
    case 'medium': return 'text-warning'
    case 'high': return 'text-danger'
    default: return 'text-primary'
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

const handleConfirm = async () => {
  confirmBetError.value = null
  isProcessing.value = true
  try {
    const sel = betSlipStore.selections[0]
    const payload = {
      id: String(sel.betApiId ?? sel.id),
      amount: betSlipStore.stake,
      escape: (betSlipStore.purchaseInsurance ? '1' : '2') as '1' | '2',
    }
    await postGameBet(payload)
    isConfirmed.value = true
    window.setTimeout(() => {
      betSlipStore.confirmBet()
      isConfirmed.value = false
    }, 2000)
  } catch (e: unknown) {
    isConfirmed.value = false
    confirmBetError.value = e instanceof Error ? e.message : String(e)
  } finally {
    isProcessing.value = false
  }
}

const handleClose = () => {
  betSlipStore.closeConfirmModal()
  isConfirmed.value = false
  confirmBetError.value = null
}

watch(() => betSlipStore.isConfirmModalOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) confirmBetError.value = null
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="betSlipStore.isConfirmModalOpen"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]
               flex items-center justify-center p-4"
        @click.self="!isProcessing && !isConfirmed && handleClose()"
      >
        <!-- Modal -->
        <Transition name="scale" mode="out-in">
          <!-- Success State -->
          <div
            v-if="isConfirmed"
            key="success"
            class="w-full max-w-sm bg-[var(--color-card)] rounded-3xl p-8
                   flex flex-col items-center text-center animate-fade-scale"
          >
            <div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4
                        animate-bounce-in">
              <div class="w-14 h-14 rounded-full bg-success flex items-center justify-center">
                <Check class="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 class="text-xl font-bold text-[var(--color-text)] mb-2">{{ $t('betConfirm.success.title') }}</h2>
            <p class="text-sm text-[var(--color-muted)]">{{ $t('betConfirm.success.subtitle') }}</p>
          </div>

          <!-- Confirm State -->
          <div
            v-else
            key="confirm"
            class="w-full max-w-sm bg-[var(--color-card)] rounded-3xl overflow-hidden
                   animate-fade-scale"
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <h2 class="text-lg font-bold text-[var(--color-text)]">{{ $t('betConfirm.title') }}</h2>
              <button
                @click="handleClose"
                :disabled="isProcessing"
                class="p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors
                       disabled:opacity-50"
              >
                <X class="w-5 h-5 text-[var(--color-muted)]" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-4 space-y-4">
              <p
                v-if="confirmBetError"
                class="text-sm text-danger rounded-xl bg-danger/10 border border-danger/20 px-3 py-2"
                role="alert"
              >
                {{ confirmBetError }}
              </p>
              <!-- Selections Summary -->
              <div class="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <p class="text-xs text-[var(--color-muted)] mb-2">
                  {{ $t('betConfirm.selectionSummary', { count: betSlipStore.selectionCount, mode: $t('common.single') }) }}
                </p>
                <div class="space-y-2 max-h-32 overflow-y-auto">
                  <div
                    v-for="selection in betSlipStore.selections"
                    :key="selection.id"
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-[var(--color-text)] truncate flex-1 mr-2">
                      {{ selection.selection }}
                    </span>
                    <span class="font-semibold text-primary">{{ selection.odds.toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <!-- Risk Level -->
              <div class="flex items-center gap-2" :class="riskColor">
                <component :is="RiskIcon" class="w-4 h-4" />
                <span class="text-sm font-medium">{{ riskLabel }}</span>
              </div>

              <!-- Summary -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[var(--color-muted)]">{{ $t('common.stake') }}</span>
                  <span class="font-semibold text-[var(--color-text)]">
                    {{ formatCurrency(betSlipStore.stake) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[var(--color-muted)]">{{ $t('common.totalOdds') }}</span>
                  <span class="font-semibold text-[var(--color-text)]">
                    {{ betSlipStore.totalOdds.toFixed(2) }}
                  </span>
                </div>
                <template v-if="showInsuranceBreakdown">
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
                <div class="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                  <span class="text-sm text-[var(--color-muted)]">{{ $t('common.potentialPayout') }}</span>
                  <span class="text-xl font-bold text-success">
                    {{ formatCurrency(betSlipStore.potentialPayout) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="p-4 pt-0 flex gap-3">
              <button
                @click="handleClose"
                :disabled="isProcessing"
                class="flex-1 py-3 rounded-xl font-medium
                       bg-[var(--color-bg)] border border-[var(--color-border)]
                       text-[var(--color-text)]
                       transition-all active:scale-95
                       disabled:opacity-50"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                @click="handleConfirm"
                :disabled="isProcessing"
                class="flex-1 py-3 rounded-xl font-bold text-white
                       bg-gradient-to-r from-primary to-primary-light
                       shadow-lg shadow-primary/30
                       transition-all active:scale-95
                       disabled:opacity-80 flex items-center justify-center gap-2"
              >
                <span v-if="isProcessing" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{{ isProcessing ? $t('common.processing') : $t('common.confirm') }}</span>
              </button>
            </div>
          </div>
        </Transition>
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

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
