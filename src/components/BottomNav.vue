<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Home, Zap, Wallet, MessageCircle } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chatStore'
import { useBetSlipStore } from '@/stores/betSlipStore'

const route = useRoute()
const chatStore = useChatStore()
const betSlipStore = useBetSlipStore()

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
                  px-2 py-2 flex items-center justify-around">
        <!-- Nav Items -->
        <router-link
          v-for="item in navItems"
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
          
          <!-- Active indicator -->
          <div
            v-if="isActive(item.path)"
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
          
          <!-- Online indicator -->
          <span class="absolute top-2 right-3 w-2 h-2 bg-success rounded-full animate-pulse" />
        </button>

        <!-- Bet Slip FAB -->
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
