<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { History, Clock, Trophy, XCircle, Users, Layers } from 'lucide-vue-next'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { useChampionStore } from '@/stores/championStore'
import type { BetRecord } from '@/stores/betSlipStore'

const betSlipStore = useBetSlipStore()
const championStore = useChampionStore()
const { t } = useI18n()

type HistoryTab = 'standard' | 'solo' | 'group'
const activeTab = ref<HistoryTab>('standard')

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

const championStatusConfig = (status: 'pending' | 'won' | 'lost') => {
  switch (status) {
    case 'won': return { icon: Trophy, class: 'text-success bg-success/10', labelKey: 'live.status.won' }
    case 'lost': return { icon: XCircle, class: 'text-danger bg-danger/10', labelKey: 'live.status.lost' }
    default: return { icon: Clock, class: 'text-[var(--color-muted)] bg-[var(--color-bg)]', labelKey: 'live.status.pending' }
  }
}

function formatOdds(n: number) { return n.toFixed(2) }
function formatMoney(n: number) { return n.toFixed(0) }
</script>

<template>
  <div class="px-4 py-4">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-5">
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark
                  flex items-center justify-center shadow-lg shadow-primary/20">
        <History class="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 class="text-xl font-bold text-[var(--color-text)]">{{ $t('live.title') }}</h1>
        <p class="text-sm text-[var(--color-muted)]">{{ $t('live.subtitle') }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-0 p-1 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] mb-5">
      <button
        type="button"
        @click="activeTab = 'standard'"
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
        :class="activeTab === 'standard'
          ? 'bg-primary text-white shadow-md shadow-primary/25'
          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'"
      >
        <Layers class="w-3.5 h-3.5" />
        {{ t('betHistory.tabs.standard') }}
      </button>
      <button
        type="button"
        @click="activeTab = 'solo'"
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
        :class="activeTab === 'solo'
          ? 'bg-primary text-white shadow-md shadow-primary/25'
          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'"
      >
        <Trophy class="w-3.5 h-3.5" />
        {{ t('betHistory.tabs.solo') }}
      </button>
      <button
        type="button"
        @click="activeTab = 'group'"
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
        :class="activeTab === 'group'
          ? 'bg-primary text-white shadow-md shadow-primary/25'
          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'"
      >
        <Users class="w-3.5 h-3.5" />
        {{ t('betHistory.tabs.group') }}
      </button>
    </div>

    <!-- ========== STANDARD TAB ========== -->
    <div v-if="activeTab === 'standard'" class="animate-fade-scale">
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
      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-20 h-20 rounded-full bg-[var(--color-card)] border border-[var(--color-border)]
                    flex items-center justify-center mb-4">
          <History class="w-8 h-8 text-[var(--color-muted)]" />
        </div>
        <h3 class="text-lg font-semibold text-[var(--color-text)] mb-1">{{ $t('live.empty.title') }}</h3>
        <p class="text-sm text-[var(--color-muted)]">{{ $t('live.empty.subtitle') }}</p>
      </div>
    </div>

    <!-- ========== SOLO PICK TAB ========== -->
    <div v-else-if="activeTab === 'solo'" class="animate-fade-scale">
      <div v-if="championStore.soloPredictions.length > 0" class="space-y-4">
        <div
          v-for="pred in championStore.soloPredictions"
          :key="pred.id"
          class="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-4"
        >
          <!-- Header row -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <Trophy class="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p class="font-semibold text-[var(--color-text)]">{{ t('betHistory.label.champion') }}</p>
            </div>
            <span
              class="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
              :class="championStatusConfig(pred.status).class"
            >
              <component :is="championStatusConfig(pred.status).icon" class="w-3 h-3" />
              {{ $t(championStatusConfig(pred.status).labelKey) }}
            </span>
          </div>

          <!-- Team chip -->
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="team in pred.teams"
              :key="team.id"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                     bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20
                     text-sm font-semibold text-[var(--color-text)]"
            >
              {{ team.flag }} {{ team.name }}
            </span>
          </div>

          <!-- Stats -->
          <div class="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)]">
            <span class="text-[var(--color-muted)]">{{ t('common.stake') }} {{ formatMoney(pred.stake) }}</span>
            <span class="font-semibold text-[var(--color-text)]">
              {{ formatMoney(pred.potentialPayout) }}
              <span class="text-xs text-[var(--color-muted)] font-normal">@ {{ formatOdds(pred.odds) }}</span>
            </span>
          </div>
          <div class="text-[10px] text-[var(--color-muted)] mt-2">{{ formatTime(pred.timestamp) }}</div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-20 h-20 rounded-full bg-[var(--color-card)] border border-[var(--color-border)]
                    flex items-center justify-center mb-4">
          <Trophy class="w-8 h-8 text-[var(--color-muted)]" />
        </div>
        <h3 class="text-lg font-semibold text-[var(--color-text)] mb-1">{{ t('betHistory.solo.empty') }}</h3>
        <p class="text-sm text-[var(--color-muted)]">{{ t('betHistory.solo.emptyHint') }}</p>
      </div>
    </div>

    <!-- ========== GROUP PARLAY TAB ========== -->
    <div v-else class="animate-fade-scale">
      <div v-if="championStore.groupPredictions.length > 0" class="space-y-4">
        <div
          v-for="pred in championStore.groupPredictions"
          :key="pred.id"
          class="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-4"
        >
          <!-- Header row -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <Users class="w-4 h-4 text-primary flex-shrink-0" />
              <p class="font-semibold text-[var(--color-text)]">{{ t('betHistory.label.anyOf') }} {{ pred.teams.length }} {{ t('champion.tabs.group') }}</p>
            </div>
            <span
              class="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
              :class="championStatusConfig(pred.status).class"
            >
              <component :is="championStatusConfig(pred.status).icon" class="w-3 h-3" />
              {{ $t(championStatusConfig(pred.status).labelKey) }}
            </span>
          </div>

          <!-- Team chips -->
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="team in pred.teams"
              :key="team.id"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                     bg-primary/10 border border-primary/20
                     text-xs font-semibold text-[var(--color-text)]"
            >
              {{ team.flag }} {{ team.name }}
            </span>
          </div>

          <!-- Stats -->
          <div class="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)]">
            <span class="text-[var(--color-muted)]">{{ t('common.stake') }} {{ formatMoney(pred.stake) }}</span>
            <span class="font-semibold text-[var(--color-text)]">
              {{ formatMoney(pred.potentialPayout) }}
              <span class="text-xs text-[var(--color-muted)] font-normal">@ {{ formatOdds(pred.odds) }}</span>
            </span>
          </div>
          <div class="text-[10px] text-[var(--color-muted)] mt-2">{{ formatTime(pred.timestamp) }}</div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-20 h-20 rounded-full bg-[var(--color-card)] border border-[var(--color-border)]
                    flex items-center justify-center mb-4">
          <Users class="w-8 h-8 text-[var(--color-muted)]" />
        </div>
        <h3 class="text-lg font-semibold text-[var(--color-text)] mb-1">{{ t('betHistory.group.empty') }}</h3>
        <p class="text-sm text-[var(--color-muted)]">{{ t('betHistory.group.emptyHint') }}</p>
      </div>
    </div>
  </div>
</template>
