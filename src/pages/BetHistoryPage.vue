<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { History, Clock, Trophy, XCircle, Star, AlertTriangle, CheckCircle, Equal } from 'lucide-vue-next'
import type { BetRecord } from '@/stores/betSlipStore'
import { useGameOrderStore } from '@/stores/gameOrderStore'
import { useChampionOrderStore } from '@/stores/championOrderStore'
import type { BetHistoryData } from '@/schema/gameOrderSchema'
import type { ChampionOrderRecord } from '@/schema/championOrderSchema'
import { getEscapeGame } from '@/services/api/escapeGameApi'

const gameOrderStore = useGameOrderStore()
const championOrderStore = useChampionOrderStore()
const { locale, t } = useI18n()

type GameOrderStatusFilter = '1' | '2'
type RecordKindTab = 'special' | 'other'
const orderStatusFilter = ref<GameOrderStatusFilter>('1')
const recordKindTab = ref<RecordKindTab>('other')
const escapeLoadingId = ref<string | null>(null)

const gameOrderList = computed<BetHistoryData['list']>(() => gameOrderStore.gameOrderList ?? [])
const championOrderList = computed<ChampionOrderRecord[]>(() => championOrderStore.championOrderList ?? [])

const championPlayMarkers = computed(() => {
  const s = new Set<string>()
  for (const x of [
    t('bettingOptionsModal.championBetType'),
    '冠軍賽',
    'Outright',
    'Champion',
  ]) {
    const v = String(x ?? '').trim()
    if (v) s.add(v)
  }
  return s
})

function isBettingOptionsModalRecord(bet: BetHistoryData['list'][number]) {
  const pt = String(bet.play_title ?? '').trim()
  const ct = String(bet.class_title ?? '').trim()
  const markers = championPlayMarkers.value
  if (markers.has(pt) || markers.has(ct)) return true
  if (/^champion$/i.test(pt) || /^champion$/i.test(ct)) return true
  return false
}

const filteredGameOrderList = computed(() => gameOrderList.value.filter((b) => !isBettingOptionsModalRecord(b)))

const listEmpty = computed(() =>
  recordKindTab.value === 'special'
    ? championOrderList.value.length === 0
    : filteredGameOrderList.value.length === 0,
)

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

function bonusToneClass(bonus: string) {
  const n = Number(String(bonus).replace(/,/g, ''))
  if (Number.isNaN(n) || n === 0) return 'text-[var(--color-text)]'
  return n > 0 ? 'text-success' : 'text-danger'
}

function parseAmount(s: string) {
  const n = Number(String(s).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function pctToNumber(s: string | undefined) {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function betTotalOdds(bet: BetHistoryData['list'][number]) {
  return parseAmount(bet.odds)
}

function showInsuranceBreakdown(bet: BetHistoryData['list'][number]) {
  return bet.escape === '1'
}

function insuranceFeeAmount(bet: BetHistoryData['list'][number]) {
  if (!showInsuranceBreakdown(bet)) return 0
  const stake = parseAmount(bet.amount)
  return stake * (pctToNumber(bet.escape_fee) / 100)
}

function insuranceWinProfitAmount(bet: BetHistoryData['list'][number]) {
  if (!showInsuranceBreakdown(bet)) return 0
  const stake = parseAmount(bet.amount)
  const odds = betTotalOdds(bet)
  const p = pctToNumber(bet.escape_win)
  return stake * Math.max(0, odds - 1) * (p / 100)
}

function insuranceLoseRefundAmount(bet: BetHistoryData['list'][number]) {
  if (!showInsuranceBreakdown(bet)) return 0
  const stake = parseAmount(bet.amount)
  return stake * (pctToNumber(bet.escape_lose) / 100)
}

function potentialPayoutForBet(bet: BetHistoryData['list'][number]) {
  const stake = parseAmount(bet.amount)
  return stake * betTotalOdds(bet) + stake
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const statusConfig = (status: BetRecord['status']) => {
  switch (status) {
    case 'won': return { icon: Trophy, class: 'text-success bg-success/10', labelKey: 'live.status.won' }
    case 'lost': return { icon: XCircle, class: 'text-danger bg-danger/10', labelKey: 'live.status.lost' }
    default: return { icon: Clock, class: 'text-[var(--color-muted)] bg-[var(--color-bg)]', labelKey: 'live.status.pending' }
  }
}

function toApiDateTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function gameOrderRangeLastTwoYears() {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setFullYear(start.getFullYear() - 2)
  start.setHours(0, 0, 0, 0)
  return { start_time: toApiDateTime(start), end_time: toApiDateTime(end) }
}

function championOrderStatusConfig(bet: ChampionOrderRecord) {
  const st = String(bet.status ?? '').trim()
  if (st === '1') return statusConfig('pending')
  const r = String(bet.result ?? '').trim()
  if (r === '2') return statusConfig('won')
  if (r === '1') return statusConfig('lost')
  if (r === '3') {
    return {
      icon: Equal,
      class: 'text-[var(--color-muted)] bg-[var(--color-bg)]',
      labelKey: 'live.status.draw',
    }
  }
  return statusConfig('pending')
}

function betTotalOddsChampion(bet: ChampionOrderRecord) {
  return parseAmount(bet.odds)
}

function potentialPayoutChampion(bet: ChampionOrderRecord) {
  const stake = parseAmount(bet.amount)
  return stake * betTotalOddsChampion(bet) + stake
}

function loadChampionOrders() {
  const { start_time, end_time } = gameOrderRangeLastTwoYears()
  return championOrderStore.fetchChampionOrderList({
    status: orderStatusFilter.value === '1' ? '1' : '3',
    startTime: start_time,
    endTime: end_time,
  })
}

function loadGameOrders() {
  const { start_time, end_time } = gameOrderRangeLastTwoYears()
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
  void loadChampionOrders()
}

type InsuranceModalVariant = 'ok' | 'error'
const insuranceModalOpen = ref(false)
const insuranceModalMessage = ref('')
const insuranceModalVariant = ref<InsuranceModalVariant>('ok')

function closeInsuranceModal() {
  insuranceModalOpen.value = false
}

function showInsuranceApiModal(message: string, variant: InsuranceModalVariant) {
  const trimmed = message.trim()
  insuranceModalMessage.value =
    trimmed ||
    (variant === 'ok' ? t('betSlip.insurance.modalDefaultOk') : t('betSlip.insurance.modalDefaultErr'))
  insuranceModalVariant.value = variant
  insuranceModalOpen.value = true
}

async function handleBuyInsurance(bet: BetHistoryData['list'][number]) {
  const id = String(bet.id ?? '').trim()
  if (!id) return
  escapeLoadingId.value = id
  try {
    const { message } = await getEscapeGame(id)
    await loadGameOrders()
    showInsuranceApiModal(message, 'ok')
  } catch (e) {
    const text = e instanceof Error ? e.message : String(e)
    showInsuranceApiModal(text, 'error')
  } finally {
    escapeLoadingId.value = null
  }
}

onMounted(() => {
  loadGameOrders()
  void loadChampionOrders()
})
</script>

<template>
  <div class="bet-history-page">
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

    <!-- Tab Groups Container -->
    <div class="space-y-3 mb-6">
      <!-- Status Filter Tabs -->
      <div class="relative">
        <div
          class="flex gap-2 p-1.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm"
          role="tablist"
        >
          <button
            v-for="status in [{ key: '1', label: 'status1' }, { key: '2', label: 'status2' }] as const"
            :key="status.key"
            type="button"
            role="tab"
            :aria-selected="orderStatusFilter === status.key"
            class="relative flex-1 py-3 px-4 rounded-xl text-sm font-semibold
                   transition-all duration-300 ease-out overflow-hidden group"
            :class="
              orderStatusFilter === status.key
                ? 'text-white scale-[1.02]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]/50 active:scale-95'
            "
            @click="setOrderStatusTab(status.key as GameOrderStatusFilter)"
          >
            <span
              v-if="orderStatusFilter === status.key"
              class="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-dark
                     shadow-lg shadow-primary/25 rounded-xl"
            />
            <span
              v-if="orderStatusFilter === status.key"
              class="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-xl"
            />
            <span class="relative z-10 flex items-center justify-center gap-2">
              <Clock v-if="status.key === '1'" class="w-4 h-4" />
              <Trophy v-else class="w-4 h-4" />
              {{ $t(`live.tabs.${status.label}`) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Record Type Tabs -->
      <div class="relative">
        <div
          class="flex gap-2 p-1.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm"
          role="tablist"
          :aria-label="$t('live.recordKindAria')"
        >
          <button
            v-for="kind in [{ key: 'other', label: 'otherBets' }, { key: 'special', label: 'specialMarkets' }] as const"
            :key="kind.key"
            type="button"
            role="tab"
            :aria-selected="recordKindTab === kind.key"
            class="relative flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold
                   transition-all duration-300 ease-out overflow-hidden group uppercase tracking-wide"
            :class="
              recordKindTab === kind.key
                ? 'text-white scale-[1.02]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]/50 active:scale-95'
            "
            @click="recordKindTab = kind.key as RecordKindTab"
          >
            <span
              v-if="recordKindTab === kind.key"
              class="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 shadow-lg shadow-amber-500/25"
            />
            <span
              v-if="recordKindTab === kind.key"
              class="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-xl"
            />
            <span class="relative z-10 flex items-center justify-center gap-1.5">
              <Star v-if="kind.key === 'special'" class="w-3.5 h-3.5" />
              {{ $t(`live.tabs.${kind.label}`) }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <Transition name="page" mode="out-in">
      <div :key="`${orderStatusFilter}-${recordKindTab}`">
        <div v-if="!listEmpty" class="space-y-4">
          <template v-if="recordKindTab === 'special'">
            <div
              v-for="bet in championOrderList"
              :key="bet.id"
              class="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-4"
            >
              <div class="flex items-start justify-between gap-3 mb-3">
                <p class="font-semibold text-[var(--color-text)] line-clamp-2">{{ bet.champion_title }}</p>
                <span
                  class="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
                  :class="championOrderStatusConfig(bet).class"
                >
                  <component :is="championOrderStatusConfig(bet).icon" class="w-3 h-3" />
                  {{ $t(championOrderStatusConfig(bet).labelKey) }}
                </span>
              </div>
              <div class="flex flex-col gap-1 text-sm text-[var(--color-muted)] mb-2 min-w-0">
                <span>{{ $t('betSlip.playTypeLabel') }}{{ $t('bettingOptionsModal.championBetType') }}</span>
                <span>{{ $t('betSlip.betSelectionLabel') }}{{ bet.odds_title }}</span>
              </div>
              <div
                v-if="String(bet.status).trim() === '3' && bet.result_title"
                class="text-xs text-[var(--color-muted)] mb-2"
              >
                {{ $t('live.champion.resultLabel') }}{{ bet.result_title }}
              </div>
              <div class="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)]">
                <span class="text-[var(--color-muted)]">{{ $t('common.stake') }} {{ $t('common.currencySymbol') }}{{ bet.amount }}</span>
                <span class="font-semibold">
                  <span :class="bonusToneClass(bet.bonus)">{{ $t('common.currencySymbol') }}{{ bet.bonus }}</span>
                  <span class="text-xs text-[var(--color-muted)] font-normal">@ {{ bet.odds }}</span>
                </span>
              </div>
              <div class="space-y-2 pt-2 border-t border-[var(--color-border)]">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[var(--color-muted)]">{{ $t('common.totalOdds') }}</span>
                  <span class="font-semibold text-[var(--color-text)]">
                    {{ betTotalOddsChampion(bet).toFixed(2) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--color-muted)]">{{ $t('common.potentialPayout') }}</span>
                  <span class="text-xl font-bold text-success">
                    {{ formatCurrency(potentialPayoutChampion(bet)) }}
                  </span>
                </div>
              </div>
              <div class="text-[10px] text-[var(--color-muted)] mt-2">{{ bet.bet_time }}</div>
            </div>
          </template>
          <template v-else>
            <div
              v-for="bet in filteredGameOrderList"
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
              <div class="flex justify-between gap-3 text-sm text-[var(--color-muted)] mb-2">
                <div class="flex flex-col min-w-0">
                  <span>{{ $t('betSlip.playTypeLabel') }}{{ bet.play_title }}</span>
                  <span>{{ $t('betSlip.betSelectionLabel') }}{{ bet.odds_title }}</span>
                </div>
                <div v-if="showInsuranceBreakdown(bet)" class="flex-shrink-0 self-start">
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold
                           bg-primary/15 text-primary border border-primary/30
                           transition-all active:scale-[0.98]
                           disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap"
                    :disabled="escapeLoadingId === bet.id"
                    @click="handleBuyInsurance(bet)"
                  >
                    <span
                      v-if="escapeLoadingId === bet.id"
                      class="inline-block w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin align-[-2px] mr-1"
                    />
                    {{ $t('betSlip.insurance.label') }}
                  </button>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)]">
                <span class="text-[var(--color-muted)]">{{ $t('common.stake') }} {{ $t('common.currencySymbol') }}{{ bet.amount }}</span>
                <span class="font-semibold">
                  <span :class="bonusToneClass(bet.bonus)">{{ $t('common.currencySymbol') }}{{ bet.bonus }}</span>
                  <span class="text-xs text-[var(--color-muted)] font-normal">@ {{ bet.odds }}</span>
                </span>
              </div>
              <div class="space-y-2 pt-2 border-t border-[var(--color-border)]">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[var(--color-muted)]">{{ $t('common.totalOdds') }}</span>
                  <span class="font-semibold text-[var(--color-text)]">
                    {{ betTotalOdds(bet).toFixed(2) }}
                  </span>
                </div>
                <template v-if="showInsuranceBreakdown(bet)">
                  <div class="flex items-start justify-between gap-2 text-sm">
                    <div class="min-w-0">
                      <span class="text-[var(--color-muted)]">{{ $t('betSlip.insurance.feeLabel') }}</span>
                      <p class="text-xs text-[var(--color-muted)]/80 mt-0.5">
                        {{ $t('betSlip.insurance.feeSub', { rate: bet.escape_fee ?? '0' }) }}
                      </p>
                    </div>
                    <span class="font-semibold text-[var(--color-text)] shrink-0 tabular-nums">
                      {{ formatCurrency(insuranceFeeAmount(bet)) }}
                    </span>
                  </div>
                  <div class="flex items-start justify-between gap-2 text-sm">
                    <div class="min-w-0">
                      <span class="text-[var(--color-muted)]">{{ $t('betSlip.insurance.winTrialLabel') }}</span>
                      <p class="text-xs text-[var(--color-muted)]/80 mt-0.5">
                        {{ $t('betSlip.insurance.winTrialSub', { rate: bet.escape_win ?? '0' }) }}
                      </p>
                    </div>
                    <span class="font-semibold text-[var(--color-text)] shrink-0 tabular-nums">
                      {{ formatCurrency(insuranceWinProfitAmount(bet)) }}
                    </span>
                  </div>
                  <div class="flex items-start justify-between gap-2 text-sm">
                    <div class="min-w-0">
                      <span class="text-[var(--color-muted)]">{{ $t('betSlip.insurance.loseTrialLabel') }}</span>
                      <p class="text-xs text-[var(--color-muted)]/80 mt-0.5">
                        {{ $t('betSlip.insurance.loseTrialSub', { rate: bet.escape_lose ?? '0' }) }}
                      </p>
                    </div>
                    <span class="font-semibold text-[var(--color-text)] shrink-0 tabular-nums">
                      {{ formatCurrency(insuranceLoseRefundAmount(bet)) }}
                    </span>
                  </div>
                </template>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--color-muted)]">{{ $t('common.potentialPayout') }}</span>
                  <span class="text-xl font-bold text-success">
                    {{ formatCurrency(potentialPayoutForBet(bet)) }}
                  </span>
                </div>
              </div>
              <div class="text-[10px] text-[var(--color-muted)] mt-2">{{ bet.bet_time }}</div>
            </div>
          </template>
        </div>
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

  <Teleport to="body">
    <Transition name="insurance-fade">
      <div
        v-if="insuranceModalOpen"
        class="fixed inset-0 z-[90] bg-black/45 backdrop-blur-md flex items-center justify-center p-4"
        @click="closeInsuranceModal"
      >
        <div
          class="w-full max-w-xs rounded-2xl border bg-white/10 backdrop-blur-xl
                 shadow-2xl shadow-black/30 p-4"
          :class="insuranceModalVariant === 'error' ? 'border-warning/30' : 'border-success/30'"
          @click.stop
        >
          <div
            class="flex items-center gap-2 mb-2"
            :class="insuranceModalVariant === 'error' ? 'text-warning' : 'text-success'"
          >
            <AlertTriangle v-if="insuranceModalVariant === 'error'" class="w-5 h-5 shrink-0" />
            <CheckCircle v-else class="w-5 h-5 shrink-0" />
            <p class="font-semibold">
              {{
                insuranceModalVariant === 'error'
                  ? $t('betSlip.insurance.modalTitleError')
                  : $t('betSlip.insurance.modalTitleOk')
              }}
            </p>
          </div>
          <p class="text-sm text-white/95 leading-relaxed whitespace-pre-wrap break-words">
            {{ insuranceModalMessage }}
          </p>
          <button
            type="button"
            class="mt-4 w-full py-2 rounded-xl font-medium transition-colors"
            :class="
              insuranceModalVariant === 'error'
                ? 'bg-warning/80 text-black hover:bg-warning'
                : 'bg-success/80 text-white hover:bg-success'
            "
            @click="closeInsuranceModal"
          >
            {{ $t('betSlip.insurance.modalAck') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
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

.insurance-fade-enter-active,
.insurance-fade-leave-active {
  transition: opacity 0.3s ease;
}

.insurance-fade-enter-from,
.insurance-fade-leave-to {
  opacity: 0;
}
</style>
