<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { History, Clock, Trophy, XCircle } from 'lucide-vue-next'
import type { BetRecord } from '@/stores/betSlipStore'
import { useGameOrderStore } from '@/stores/gameOrderStore'
import type { BetHistoryData } from '@/schema/gameOrderSchema'

const gameOrderStore = useGameOrderStore()
const { locale, t } = useI18n()

type GameOrderStatusFilter = '1' | '2'
const orderStatusFilter = ref<GameOrderStatusFilter>('1')

const gameOrderList = computed<BetHistoryData['list']>(() => gameOrderStore.gameOrderList ?? [])

/** 年／月／日＋時分，依目前語系地區格式 */
function formatBetDateTime(ts: number) {
  const d = new Date(ts)
  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function betTimeLine(ts: number) {
  return t('live.betTime', { time: formatBetDateTime(ts) })
}

function bonusToneClass(bonus: string) {
  const n = Number(String(bonus).replace(/,/g, ''))
  if (Number.isNaN(n) || n === 0) return 'text-[var(--color-text)]'
  return n > 0 ? 'text-success' : 'text-danger'
}

const statusConfig = (status: BetRecord['status']) => {
  switch (status) {
    case 'won': return { icon: Trophy, class: 'text-success bg-success/10', labelKey: 'live.status.won' }
    case 'lost': return { icon: XCircle, class: 'text-danger bg-danger/10', labelKey: 'live.status.lost' }
    default: return { icon: Clock, class: 'text-[var(--color-muted)] bg-[var(--color-bg)]', labelKey: 'live.status.pending' }
  }
}

/** 與後端一致：yyyy-MM-dd HH:mm:ss（本地時區） */
function toApiDateTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function gameOrderRangeFromTodayThroughJulyEnd() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const y = start.getFullYear()
  const end = new Date(y, 6, 31, 23, 59, 59)
  return { start_time: toApiDateTime(start), end_time: toApiDateTime(end) }
}

function loadGameOrders() {
  const { start_time, end_time } = gameOrderRangeFromTodayThroughJulyEnd()
  return gameOrderStore.fetchGameOrderList({
    status: orderStatusFilter.value,
    start_time,
    end_time,
  })
}

function setOrderStatusTab(s: GameOrderStatusFilter) {
  if (orderStatusFilter.value === s) return
  orderStatusFilter.value = s
  loadGameOrders()
}

onMounted(() => {
  loadGameOrders()
})
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

    <div
      class="flex rounded-xl bg-[var(--color-bg)] p-1 mb-4 border border-[var(--color-border)]"
      role="tablist"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="orderStatusFilter === '1'"
        class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="
          orderStatusFilter === '1'
            ? 'bg-[var(--color-card)] text-white shadow-sm bg-gradient-to-br from-primary to-primary-dark'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        "
        @click="setOrderStatusTab('1')"
      >
        {{ $t('live.tabs.status1') }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="orderStatusFilter === '2'"
        class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="
          orderStatusFilter === '2'
            ? 'bg-[var(--color-card)] text-white shadow-sm bg-gradient-to-br from-primary to-primary-dark'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        "
        @click="setOrderStatusTab('2')"
      >
        {{ $t('live.tabs.status2') }}
      </button>
    </div>

    <Transition name="page" mode="out-in">
      <div :key="orderStatusFilter">
        <!-- Bet List -->
        <div v-if="gameOrderList.length > 0" class="space-y-4">
          <div
            v-for="bet in gameOrderList"
            :key="bet.id"
            class="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-4"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <p class="font-semibold text-[var(--color-text)] line-clamp-2">{{ bet.game_title }}</p>
              <span
                class="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
                :class="statusConfig(bet.status as any).class"
              >
                <component :is="statusConfig(bet.status as any).icon" class="w-3 h-3" />
                {{ $t(statusConfig(bet.status as any).labelKey) }}
              </span>
            </div>
            <div class="flex flex-col justify-between text-sm text-[var(--color-muted)] mb-2">
              <span>{{ $t('betSlip.playTypeLabel') }}{{ bet.play_title }}</span>
              <span>{{ $t('betSlip.betSelectionLabel') }}{{ bet.odds_title }}</span>
            </div>
            <div class="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)]">
              <span class="text-[var(--color-muted)]">{{ $t('common.stake') }} {{ $t('common.currencySymbol') }}{{ bet.amount }}</span>
              <span class="font-semibold">
                <span :class="bonusToneClass(bet.bonus)">{{ $t('common.currencySymbol') }}{{ bet.bonus }}</span>
                <span class="text-xs text-[var(--color-muted)] font-normal">@ {{ bet.odds }}</span>
              </span>
            </div>
            <div class="text-[10px] text-[var(--color-muted)] mt-2">{{ betTimeLine(new Date(bet.bet_time).getTime()) }}</div>
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
    </Transition>
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease-out;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
