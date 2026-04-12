<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Home, Zap, Wallet, MessageCircle, LayoutGrid } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chatStore'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { useBettingModalStore } from '@/stores/bettingModalStore'
import { useChampionListStore } from '@/stores/championListStore'

const route = useRoute()
const chatStore = useChatStore()
const betSlipStore = useBetSlipStore()
const bettingModalStore = useBettingModalStore()
const championListStore = useChampionListStore()

function openBettingMarkets() {
  bettingModalStore.open()
  void championListStore.fetchChampionList()
}

const navItems = [
  { labelKey: 'nav.home', path: '/', icon: Home },
  { labelKey: 'nav.live', path: '/live', icon: Zap },
  { labelKey: 'nav.account', path: '/account', icon: Wallet },
]

const isActive = (path: string) => route.path === path
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40">
    <div class="max-w-[430px] mx-auto">
      <div class="bg-[var(--color-card)]/95 backdrop-blur-xl border-t border-[var(--color-border)]
                  px-2 py-2 flex items-center justify-around relative">

        <!-- Nav Items (left side: Home, Live) -->
        <router-link
          v-for="item in navItems.slice(0, 2)"
          :key="item.path"
          :to="item.path"
          class="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl
                 transition-all duration-300 active:scale-90"
          :class="isActive(item.path)
            ? 'text-primary'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'"
        >
          <div
            class="absolute inset-0 rounded-xl transition-all duration-300"
            :class="isActive(item.path) ? 'bg-primary/10' : ''"
          />
          <component :is="item.icon" class="w-6 h-6 relative z-10" />
          <span class="text-[10px] font-medium mt-1 relative z-10">{{ $t(item.labelKey) }}</span>
          <div
            v-if="isActive(item.path)"
            class="absolute -bottom-2 w-8 h-1 rounded-full bg-primary"
          />
        </router-link>

        <!-- All Markets Centre FAB -->
        <div class="relative flex flex-col items-center justify-center w-16">
          <!-- Raised circular button sitting above the nav bar -->
          <button
            @click="openBettingMarkets"
            class="markets-fab-nav absolute -top-8 w-14 h-14 rounded-full
                   flex flex-col items-center justify-center gap-0.5
                   transition-all duration-200 active:scale-90 select-none"
            aria-label="Open Betting Markets"
          >
            <LayoutGrid class="w-5 h-5 text-white" />
          </button>
          <!-- Label sits in the normal flow of the nav bar -->
          <span class="text-[10px] font-semibold text-primary mt-auto pt-1">特殊玩法</span>
        </div>

        <!-- Nav Items (right side: Account) -->
        <router-link
          :to="navItems[2].path"
          class="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl
                 transition-all duration-300 active:scale-90"
          :class="isActive(navItems[2].path)
            ? 'text-primary'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'"
        >
          <div
            class="absolute inset-0 rounded-xl transition-all duration-300"
            :class="isActive(navItems[2].path) ? 'bg-primary/10' : ''"
          />
          <component :is="navItems[2].icon" class="w-6 h-6 relative z-10" />
          <span class="text-[10px] font-medium mt-1 relative z-10">{{ $t(navItems[2].labelKey) }}</span>
          <div
            v-if="isActive(navItems[2].path)"
            class="absolute -bottom-2 w-8 h-1 rounded-full bg-primary"
          />
        </router-link>

        <!-- Chat Button -->
        <button
          @click="chatStore.toggleChat"
          class="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl
                 text-[var(--color-muted)] hover:text-[var(--color-text)]
                 transition-all duration-300 active:scale-90"
        >
          <MessageCircle class="w-6 h-6" />
          <span class="text-[10px] font-medium mt-1">{{ $t('nav.chat') }}</span>
          <span class="absolute top-2 right-3 w-2 h-2 bg-success rounded-full animate-pulse" />
        </button>

        <!-- Bet Slip FAB (only when there are selections) -->
        <button
          v-if="betSlipStore.selectionCount > 0"
          @click="betSlipStore.toggleDrawer"
          class="absolute -top-6 right-4 w-14 h-14 rounded-2xl
                 bg-gradient-to-br from-primary to-primary-dark
                 flex items-center justify-center
                 shadow-lg shadow-primary/30 animate-pulse-glow
                 transition-all duration-300 active:scale-90"
        >
          <span class="text-white font-bold text-lg">{{ betSlipStore.selectionCount }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>
