<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { X, Trash2, CircleHelp } from 'lucide-vue-next'
import { useBetSlipStore } from '@/stores/betSlipStore'

const betSlipStore = useBetSlipStore()
const { purchaseInsurance } = storeToRefs(betSlipStore)
const { locale } = useI18n()

const insuranceHelpOpen = ref(false)
const insuranceHelpWrapRef = ref<HTMLElement | null>(null)

watch(insuranceHelpOpen, (open) => {
  if (!open) return
  const close = (e: MouseEvent) => {
    const t = e.target as Node
    if (insuranceHelpWrapRef.value && !insuranceHelpWrapRef.value.contains(t)) {
      insuranceHelpOpen.value = false
    }
  }
  const id = window.setTimeout(() => document.addEventListener('click', close, true), 0)
  return () => {
    window.clearTimeout(id)
    document.removeEventListener('click', close, true)
  }
})

function toggleInsuranceHelp(e: MouseEvent) {
  e.stopPropagation()
  insuranceHelpOpen.value = !insuranceHelpOpen.value
}

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

// Lock body scroll when open；關閉抽屜時收合保險說明
watch(() => betSlipStore.isDrawerOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) insuranceHelpOpen.value = false
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

          <!-- Selections -->
          <div class="flex-1 px-4 space-y-3">
            <div
              v-for="selection in betSlipStore.selections"
              :key="selection.id"
              class="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] relative group"
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
          <div class="p-4 space-y-3">
            <!-- Purchase insurance -->
            <div
              class="flex items-center gap-2 p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]"
            >
              <label class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer select-none">
                <input
                  v-model="purchaseInsurance"
                  type="checkbox"
                  class="w-4 h-4 rounded border-[var(--color-border)] text-primary focus:ring-primary shrink-0"
                />
                <span class="text-sm font-medium text-[var(--color-text)]">{{ $t('betSlip.insurance.label') }}</span>
              </label>
              <div ref="insuranceHelpWrapRef" class="relative shrink-0">
                <button
                  type="button"
                  class="p-1 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-card)] hover:text-primary transition-colors"
                  :aria-label="$t('betSlip.insurance.helpAria')"
                  :aria-expanded="insuranceHelpOpen"
                  @click="toggleInsuranceHelp"
                >
                  <CircleHelp class="w-5 h-5" />
                </button>
                <Transition name="fade">
                  <div
                    v-if="insuranceHelpOpen"
                    class="absolute bottom-full right-0 mb-2 z-[70] w-[min(100vw-2rem,18rem)] rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-xl shadow-black/20"
                    role="tooltip"
                  >
                    <p class="text-xs text-[var(--color-text)] leading-relaxed">
                      {{ $t('betSlip.insurance.tooltip') }}
                    </p>
                  </div>
                </Transition>
              </div>
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
