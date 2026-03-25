<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trophy, Users, Search, Plus, X, CheckCircle2, ChevronRight } from 'lucide-vue-next'
import { useChampionStore } from '@/stores/championStore'
import ChampionConfirmModal from '@/components/ChampionConfirmModal.vue'

const { t } = useI18n()
const store = useChampionStore()

type Tab = 'solo' | 'group'
const activeTab = ref<Tab>('solo')
const soloSearch = ref('')
const groupSearch = ref('')
const soloStakeInput = ref(String(store.soloStake))
const groupStakeInput = ref(String(store.groupStake))

const filteredTeams = computed(() => {
  const q = (activeTab.value === 'solo' ? soloSearch.value : groupSearch.value).toLowerCase().trim()
  if (!q) return store.allTeams
  return store.allTeams.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
})

function handleSoloStakeChange(val: string) {
  soloStakeInput.value = val
  const n = parseFloat(val)
  if (!isNaN(n) && n >= 0) store.setSoloStake(n)
}

function handleGroupStakeChange(val: string) {
  groupStakeInput.value = val
  const n = parseFloat(val)
  if (!isNaN(n) && n >= 0) store.setGroupStake(n)
}

function formatOdds(n: number) {
  return n.toFixed(2)
}

function formatPayout(n: number) {
  return n.toFixed(0)
}
</script>

<template>
  <!-- Section Header -->
  <section class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
        <Trophy class="w-5 h-5 text-amber-400" />
        {{ t('champion.sectionTitle') }}
      </h2>
      <span class="text-xs text-[var(--color-muted)]">{{ t('champion.sectionSubtitle') }}</span>
    </div>

    <!-- Tab Toggle -->
    <div class="flex gap-0 p-1 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] mb-4">
      <button
        type="button"
        @click="activeTab = 'solo'"
        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
        :class="activeTab === 'solo'
          ? 'bg-primary text-white shadow-md shadow-primary/25'
          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'"
      >
        <Trophy class="w-4 h-4" />
        {{ t('champion.tabs.solo') }}
      </button>
      <button
        type="button"
        @click="activeTab = 'group'"
        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
        :class="activeTab === 'group'
          ? 'bg-primary text-white shadow-md shadow-primary/25'
          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'"
      >
        <Users class="w-4 h-4" />
        {{ t('champion.tabs.group') }}
      </button>
    </div>

    <!-- ===================== SOLO PICK PANEL ===================== -->
    <div v-if="activeTab === 'solo'" class="animate-fade-scale">
      <!-- Hint -->
      <p class="text-xs text-[var(--color-muted)] mb-3 text-center">{{ t('champion.solo.subtitle') }}</p>

      <!-- Search -->
      <div class="relative mb-3">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
        <input
          v-model="soloSearch"
          type="text"
          :placeholder="t('champion.solo.searchPlaceholder')"
          class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]
                 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]
                 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <!-- Team Grid -->
      <div class="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-0.5">
        <button
          v-for="team in filteredTeams"
          :key="team.id"
          type="button"
          @click="store.selectSoloTeam(team)"
          class="relative flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-all duration-200 active:scale-95 text-left"
          :class="store.selectedSoloTeam?.id === team.id
            ? 'bg-primary/10 border-primary shadow-md shadow-primary/15'
            : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-primary/40'"
        >
          <span class="text-2xl leading-none">{{ team.flag }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-[var(--color-text)] truncate">{{ team.name }}</p>
            <p class="text-xs text-[var(--color-muted)]">{{ t('champion.solo.oddsLabel') }} {{ formatOdds(team.odds) }}</p>
          </div>
          <CheckCircle2
            v-if="store.selectedSoloTeam?.id === team.id"
            class="w-4 h-4 text-primary flex-shrink-0 animate-bounce-in"
          />
        </button>
      </div>

      <!-- Selected Summary + Stake -->
      <Transition name="slide-up-fade">
        <div
          v-if="store.selectedSoloTeam"
          class="mt-4 rounded-2xl bg-[var(--color-card)] border border-primary/30 p-4"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="text-3xl">{{ store.selectedSoloTeam.flag }}</span>
            <div class="flex-1">
              <p class="font-bold text-[var(--color-text)]">{{ store.selectedSoloTeam.name }}</p>
              <p class="text-xs text-primary font-semibold">{{ t('champion.solo.oddsLabel') }} {{ formatOdds(store.selectedSoloTeam.odds) }}</p>
            </div>
            <button
              type="button"
              @click="store.clearSoloSelection()"
              class="p-1.5 rounded-lg bg-[var(--color-bg)] hover:bg-danger/10 transition-colors"
              :aria-label="t('champion.group.removeTeam')"
            >
              <X class="w-4 h-4 text-[var(--color-muted)]" />
            </button>
          </div>

          <!-- Stake Row -->
          <div class="flex items-center gap-3 mb-3">
            <label class="text-xs font-semibold text-[var(--color-muted)] whitespace-nowrap">{{ t('champion.stake.label') }}</label>
            <input
              type="number"
              :value="soloStakeInput"
              @input="handleSoloStakeChange(($event.target as HTMLInputElement).value)"
              min="0"
              class="flex-1 px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]
                     text-sm font-bold text-[var(--color-text)] text-right
                     focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <!-- Payout -->
          <div class="flex items-center justify-between text-sm mb-3">
            <span class="text-[var(--color-muted)]">{{ t('champion.stake.potential') }}</span>
            <span class="font-bold text-success text-base">{{ formatPayout(store.soloPotentialPayout) }}</span>
          </div>

          <!-- Confirm Button -->
          <button
            type="button"
            @click="store.openConfirmModal('solo')"
            class="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm
                   shadow-lg shadow-primary/25 transition-all duration-200 active:scale-95
                   flex items-center justify-center gap-2"
          >
            {{ t('champion.solo.confirmBtn') }}
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </Transition>
    </div>

    <!-- ===================== GROUP PARLAY PANEL ===================== -->
    <div v-else class="animate-fade-scale">
      <!-- Hint -->
      <p class="text-xs text-[var(--color-muted)] mb-3 text-center">{{ t('champion.group.subtitle') }}</p>

      <!-- Selected Group Chips -->
      <div v-if="store.selectedGroupTeams.length > 0" class="flex flex-wrap gap-2 mb-3">
        <span
          v-for="team in store.selectedGroupTeams"
          :key="team.id"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                 bg-primary/10 border border-primary/30 text-xs font-semibold text-primary"
        >
          {{ team.flag }} {{ team.name }}
          <button
            type="button"
            @click="store.removeGroupTeam(team.id)"
            class="hover:text-danger transition-colors"
            :aria-label="t('champion.group.removeTeam')"
          >
            <X class="w-3 h-3" />
          </button>
        </span>
      </div>
      <p v-else class="text-xs text-[var(--color-muted)] text-center mb-3 italic">
        {{ t('champion.group.minHint') }}
      </p>

      <!-- Team count badge -->
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-semibold text-[var(--color-muted)]">
          {{ t('champion.group.teamsSelected', { count: store.selectedGroupTeams.length }) }}
          <span class="text-[var(--color-muted)]/60">/ 8</span>
        </p>
        <button
          v-if="store.selectedGroupTeams.length > 0"
          type="button"
          @click="store.clearGroupSelection()"
          class="text-xs text-danger hover:underline"
        >
          {{ t('champion.group.removeTeam') }} {{ t('common.all') }}
        </button>
      </div>

      <!-- Search -->
      <div class="relative mb-3">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
        <input
          v-model="groupSearch"
          type="text"
          :placeholder="t('champion.solo.searchPlaceholder')"
          class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]
                 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]
                 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <!-- Team Grid -->
      <div class="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-0.5">
        <button
          v-for="team in filteredTeams"
          :key="team.id"
          type="button"
          @click="store.toggleGroupTeam(team)"
          :disabled="!store.isTeamInGroup(team.id) && store.selectedGroupTeams.length >= 8"
          class="relative flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-all duration-200 active:scale-95 text-left disabled:opacity-40 disabled:cursor-not-allowed"
          :class="store.isTeamInGroup(team.id)
            ? 'bg-primary/10 border-primary shadow-md shadow-primary/15'
            : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-primary/40'"
        >
          <span class="text-2xl leading-none">{{ team.flag }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-[var(--color-text)] truncate">{{ team.name }}</p>
            <p class="text-xs text-[var(--color-muted)]">{{ formatOdds(team.odds) }}</p>
          </div>
          <CheckCircle2
            v-if="store.isTeamInGroup(team.id)"
            class="w-4 h-4 text-primary flex-shrink-0 animate-bounce-in"
          />
          <Plus
            v-else
            class="w-4 h-4 text-[var(--color-muted)] flex-shrink-0"
          />
        </button>
      </div>

      <!-- Group Summary + Stake -->
      <Transition name="slide-up-fade">
        <div
          v-if="store.isGroupValid"
          class="mt-4 rounded-2xl bg-[var(--color-card)] border border-primary/30 p-4"
        >
          <!-- Combined Odds -->
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-[var(--color-muted)]">{{ t('champion.group.combinedOdds') }}</span>
            <span class="font-bold text-primary text-base">{{ formatOdds(store.groupCombinedOdds) }}</span>
          </div>

          <!-- Stake Row -->
          <div class="flex items-center gap-3 mb-3">
            <label class="text-xs font-semibold text-[var(--color-muted)] whitespace-nowrap">{{ t('champion.stake.label') }}</label>
            <input
              type="number"
              :value="groupStakeInput"
              @input="handleGroupStakeChange(($event.target as HTMLInputElement).value)"
              min="0"
              class="flex-1 px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]
                     text-sm font-bold text-[var(--color-text)] text-right
                     focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <!-- Payout -->
          <div class="flex items-center justify-between text-sm mb-3">
            <span class="text-[var(--color-muted)]">{{ t('champion.stake.potential') }}</span>
            <span class="font-bold text-success text-base">{{ formatPayout(store.groupPotentialPayout) }}</span>
          </div>

          <!-- Confirm Button -->
          <button
            type="button"
            @click="store.openConfirmModal('group')"
            class="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm
                   shadow-lg shadow-primary/25 transition-all duration-200 active:scale-95
                   flex items-center justify-center gap-2"
          >
            {{ t('champion.group.confirmBtn') }}
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </Transition>
    </div>
  </section>

  <!-- Confirmation Modal -->
  <ChampionConfirmModal />
</template>

<style scoped>
.slide-up-fade-enter-active,
.slide-up-fade-leave-active {
  transition: all 0.25s ease;
}
.slide-up-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.slide-up-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
