<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Trophy, Users, CheckCircle2 } from 'lucide-vue-next'
import { useChampionStore } from '@/stores/championStore'

const { t } = useI18n()
const store = useChampionStore()

const isSolo = computed(() => store.confirmationType === 'solo')

const teams = computed(() =>
  isSolo.value ? (store.selectedSoloTeam ? [store.selectedSoloTeam] : []) : store.selectedGroupTeams
)
const odds = computed(() =>
  isSolo.value ? (store.selectedSoloTeam?.odds ?? 0) : store.groupCombinedOdds
)
const stake = computed(() =>
  isSolo.value ? store.soloStake : store.groupStake
)
const payout = computed(() =>
  isSolo.value ? store.soloPotentialPayout : store.groupPotentialPayout
)

function formatOdds(n: number) {
  return n.toFixed(2)
}
function formatMoney(n: number) {
  return n.toFixed(0)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="store.isConfirmModalOpen"
        class="fixed inset-0 z-50 flex items-end justify-center"
        @click.self="store.closeConfirmModal()"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="store.closeConfirmModal()" />

        <!-- Sheet -->
        <div class="relative w-full max-w-lg rounded-t-3xl bg-[var(--color-card)] border-t border-[var(--color-border)]
                    p-6 animate-slide-up shadow-2xl">
          <!-- Handle -->
          <div class="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[var(--color-border)]" />

          <!-- Header -->
          <div class="flex items-center justify-between mb-5 mt-2">
            <div class="flex items-center gap-2">
              <component
                :is="isSolo ? Trophy : Users"
                class="w-5 h-5 text-primary"
              />
              <h2 class="text-lg font-bold text-[var(--color-text)]">
                {{ isSolo ? t('champion.confirmModal.soloTitle') : t('champion.confirmModal.groupTitle') }}
              </h2>
            </div>
            <button
              type="button"
              @click="store.closeConfirmModal()"
              class="p-2 rounded-xl bg-[var(--color-bg)] hover:bg-danger/10 transition-colors"
              :aria-label="t('champion.confirmModal.cancel')"
            >
              <X class="w-4 h-4 text-[var(--color-muted)]" />
            </button>
          </div>

          <!-- Teams -->
          <div class="mb-4">
            <p class="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
              {{ isSolo ? t('champion.confirmModal.teams') : t('betHistory.label.anyOf') }}
            </p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="team in teams"
                :key="team.id"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       bg-primary/10 border border-primary/20 text-sm font-semibold text-[var(--color-text)]"
              >
                {{ team.flag }} {{ team.name }}
              </span>
            </div>
          </div>

          <!-- Divider -->
          <div class="h-px bg-[var(--color-border)] mb-4" />

          <!-- Stats -->
          <div class="space-y-2.5 mb-5">
            <div class="flex items-center justify-between">
              <span class="text-sm text-[var(--color-muted)]">{{ t('champion.confirmModal.odds') }}</span>
              <span class="font-bold text-[var(--color-text)]">{{ formatOdds(odds) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-[var(--color-muted)]">{{ t('champion.confirmModal.stake') }}</span>
              <span class="font-bold text-[var(--color-text)]">{{ formatMoney(stake) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-[var(--color-muted)]">{{ t('champion.confirmModal.payout') }}</span>
              <span class="text-lg font-bold text-success">{{ formatMoney(payout) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              type="button"
              @click="store.closeConfirmModal()"
              class="flex-1 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]
                     text-sm font-semibold text-[var(--color-muted)] transition-all active:scale-95 hover:border-primary/40"
            >
              {{ t('champion.confirmModal.cancel') }}
            </button>
            <button
              type="button"
              @click="store.confirmPrediction()"
              class="flex-2 flex-grow py-3 px-6 rounded-xl bg-primary text-white font-bold text-sm
                     shadow-lg shadow-primary/25 transition-all active:scale-95
                     flex items-center justify-center gap-2"
            >
              <CheckCircle2 class="w-4 h-4" />
              {{ t('champion.confirmModal.placeBet') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
