<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  Wallet, 
  CreditCard,
  History,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Plus
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const { username, formattedBalance } = storeToRefs(userStore)
const { t } = useI18n()
const depositAmount = ref(100)
const showDepositModal = ref(false)

const menuItems = computed(() => [
  { key: 'betHistory', icon: History, label: t('account.menu.betHistory'), badge: '12' },
  { key: 'paymentMethods', icon: CreditCard, label: t('account.menu.paymentMethods') },
  { key: 'settings', icon: Settings, label: t('account.menu.settings') },
  { key: 'helpSupport', icon: HelpCircle, label: t('account.menu.helpSupport') },
])


const handleDeposit = () => {
  if (depositAmount.value > 0) {
    userStore.deposit(depositAmount.value)
    showDepositModal.value = false
  }
}

onMounted(() => {
  userStore.fetchUserInfo()
})
</script>

<template>
  <div>
  <div class="px-4 py-4">
    <!-- Profile Card -->
    <div class="relative rounded-2xl overflow-hidden mb-6
                bg-gradient-to-br from-primary via-primary-light to-primary-dark
                p-5 shadow-xl shadow-primary/20">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
      </div>
      
      <div class="relative z-10">
        <div class="flex items-center gap-4 mb-4">
          <div 
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
          >
            {{ (username).charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">{{ username }}</h2>
            <p class="text-sm text-white/70">{{ $t('account.membership.premium') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Wallet Card -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 mb-6
                border border-[var(--color-border)] shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet class="w-6 h-6 text-primary" />
          </div>
          <div>
            <p class="text-sm text-[var(--color-muted)]">{{ $t('account.balance.available') }}</p>
            <p class="text-2xl font-bold text-[var(--color-text)]">
              {{ formattedBalance }}
            </p>
          </div>
        </div>
      </div>

      <!-- Deposit Button -->
      <button
        @click="showDepositModal = true"
        :disabled="userStore.isDepositing"
        class="w-full py-3.5 rounded-xl font-bold text-white
               bg-gradient-to-r from-primary to-primary-light
               shadow-lg shadow-primary/20
               transition-all active:scale-[0.98]
               disabled:opacity-80 flex items-center justify-center gap-2"
      >
        <span v-if="userStore.isDepositing" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <Plus v-else class="w-5 h-5" />
        <span>{{ userStore.isDepositing ? $t('common.processing') : $t('account.deposit.cta') }}</span>
      </button>
    </div>

    <!-- Stats Grid -->

    <!-- Menu -->
    <div class="bg-[var(--color-card)] rounded-2xl overflow-hidden
                border border-[var(--color-border)]">
      <button
        v-for="(item, index) in menuItems"
        :key="item.key"
        class="w-full flex items-center justify-between p-4
               transition-colors hover:bg-[var(--color-bg)] active:bg-[var(--color-bg)]"
        :class="index !== menuItems.length - 1 ? 'border-b border-[var(--color-border)]' : ''"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[var(--color-bg)] flex items-center justify-center">
            <component :is="item.icon" class="w-5 h-5 text-[var(--color-text)]" />
          </div>
          <span class="font-medium text-[var(--color-text)]">{{ item.label }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            v-if="item.badge"
            class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
          >
            {{ item.badge }}
          </span>
          <ChevronRight class="w-5 h-5 text-[var(--color-muted)]" />
        </div>
      </button>
    </div>

    <!-- Logout -->
    <button
      class="w-full mt-4 flex items-center justify-center gap-2 p-4
             rounded-2xl bg-danger/10 text-danger font-medium
             transition-all active:scale-[0.98]"
    >
      <LogOut class="w-5 h-5" />
      <span>{{ $t('account.signOut') }}</span>
    </button>
  </div>

  <!-- Deposit Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showDepositModal"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]
               flex items-center justify-center p-4"
        @click.self="showDepositModal = false"
      >
        <div class="w-full max-w-sm bg-[var(--color-card)] rounded-3xl p-6 animate-fade-scale">
          <h2 class="text-xl font-bold text-[var(--color-text)] mb-4 text-center">
            {{ $t('account.depositModal.title') }}
          </h2>
          
          <!-- Amount Input -->
          <div class="mb-4">
            <label class="text-sm text-[var(--color-muted)] mb-2 block">{{ $t('account.depositModal.amount') }}</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-lg">{{ $t('common.currencySymbol') }}</span>
              <input
                v-model.number="depositAmount"
                type="number"
                class="w-full py-4 pl-8 pr-4 rounded-xl bg-[var(--color-bg)]
                       border border-[var(--color-border)] text-[var(--color-text)]
                       text-xl font-semibold text-center
                       focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <!-- Quick Amounts -->
          <div class="grid grid-cols-4 gap-2 mb-6">
            <button
              v-for="amount in [100, 500, 1000, 5000]"
              :key="amount"
              @click="depositAmount = amount"
              class="py-2.5 rounded-lg text-sm font-medium
                     bg-[var(--color-bg)] border border-[var(--color-border)]
                     text-[var(--color-text)] hover:border-primary/50
                     transition-all active:scale-95"
              :class="depositAmount === amount ? 'border-primary bg-primary/10' : ''"
            >
              {{ $t('common.currencySymbol') }}{{ amount }}
            </button>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="showDepositModal = false"
              class="flex-1 py-3.5 rounded-xl font-medium
                     bg-[var(--color-bg)] border border-[var(--color-border)]
                     text-[var(--color-text)]
                     transition-all active:scale-95"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              @click="handleDeposit"
              :disabled="depositAmount <= 0"
              class="flex-1 py-3.5 rounded-xl font-bold text-white
                     bg-gradient-to-r from-primary to-primary-light
                     shadow-lg shadow-primary/30
                     transition-all active:scale-95
                     disabled:opacity-50"
            >
              {{ $t('common.deposit') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  </div>
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
</style>
