<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { History, Clock, Trophy, XCircle } from 'lucide-vue-next'
import { useBetSlipStore } from '@/stores/betSlipStore'
import type { BetRecord } from '@/stores/betSlipStore'

const betSlipStore = useBetSlipStore()
useI18n()

const formatTime = (ts: number) => {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - ts
  if (diff < 86400000) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (diff < 86400000 * 7) return d.toLocaleDateString(undefined, { weekday: 'short' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const statusConfig = (status: BetRecord['status']) => {
  switch (status) {
    case 'won': return { icon: Trophy, class: 'text-success bg-success/10', labelKey: 'live.status.won' }
    case 'lost': return { icon: XCircle, class: 'text-danger bg-danger/10', labelKey: 'live.status.lost' }
    default: return { icon: Clock, class: 'text-[var(--color-muted)] bg-[var(--color-bg)]', labelKey: 'live.status.pending' }
  }
}
</script>

<template>
  <div class="px-4 py-4">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark
                  flex items-center justify-center shadow-lg shadow-primary/20">
        <History class="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 class="text-xl font-bold text-[var(--color-text)]">{{ $t('live.title') }}</h1>
        <p class="text-sm text-[var(--color-muted)]">{{ $t('live.subtitle') }}</p>
      </div>
    </div>

    <!-- Bet List -->
    <div v-if="betSlipStore.betHistory.length > 0" class="space-y-4">
      <div
        v-for="bet in betSlipStore.betHistory"
        :key="bet.id"
        class="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-4"
      >
        <div class="flex items-start justify-between gap-3 mb-3">
          <p class="font-semibold text-[var(--color-text)] line-clamp-2">{{ bet.matchTitle }}</p>
          <span
            class="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
            :class="statusConfig(bet.status).class"
          >
            <component :is="statusConfig(bet.status).icon" class="w-3 h-3" />
            {{ $t(statusConfig(bet.status).labelKey) }}
          </span>
        </div>
        <div class="flex items-center justify-between text-sm text-[var(--color-muted)] mb-2">
          <span>{{ bet.betType === 'parlay' ? $t('common.parlay') : bet.betType }} · {{ bet.selection }}</span>
        </div>
        <div class="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)]">
          <span class="text-[var(--color-muted)]">{{ $t('common.stake') }} {{ $t('common.currencySymbol') }}{{ bet.stake }}</span>
          <span class="font-semibold text-[var(--color-text)]">
            {{ $t('common.currencySymbol') }}{{ bet.potentialPayout.toFixed(0) }}
            <span class="text-xs text-[var(--color-muted)] font-normal">@ {{ bet.odds.toFixed(2) }}</span>
          </span>
        </div>
        <div class="text-[10px] text-[var(--color-muted)] mt-2">{{ formatTime(bet.timestamp) }}</div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <div class="w-20 h-20 rounded-full bg-[var(--color-card)] border border-[var(--color-border)]
                  flex items-center justify-center mb-4">
        <History class="w-8 h-8 text-[var(--color-muted)]" />
      </div>
      <h3 class="text-lg font-semibold text-[var(--color-text)] mb-1">{{ $t('live.empty.title') }}</h3>
      <p class="text-sm text-[var(--color-muted)]">{{ $t('live.empty.subtitle') }}</p>
    </div>
  </div>
</template>
