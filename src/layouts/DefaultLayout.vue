<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import ThemeToggle from '@/components/ThemeToggle.vue'
import BottomNav from '@/components/BottomNav.vue'
import BetslipDrawer from '@/components/BetslipDrawer.vue'
import ConfirmBetModal from '@/components/ConfirmBetModal.vue'
import ChatRoom from '@/components/ChatRoom.vue'
import MatchDetailPanel from '@/components/MatchDetailPanel.vue'
import BettingOptionsModal from '@/components/BettingOptionsModal.vue'

// Initialize theme
useTheme()
</script>

<template>
  <div class="min-h-screen bg-[var(--color-bg)] transition-colors duration-300">
    <div class="max-w-[430px] mx-auto relative min-h-screen flex flex-col">
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-[var(--color-bg)]/95 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div class="flex items-center justify-between px-4 py-3">
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark
                        flex items-center justify-center shadow-lg shadow-primary/20">
              <span class="text-white font-bold text-xl">W</span>
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-sm text-[var(--color-text)]">{{ $t('app.title') }}</span>
              <span class="text-[10px] text-primary font-semibold">2026</span>
            </div>
          </div>

          <!-- Right Side -->
          <div class="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 pb-24 overflow-x-hidden">
        <router-view v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>

      <!-- Bottom Navigation -->
      <BottomNav />

      <!-- Overlays -->
      <BetslipDrawer />
      <ConfirmBetModal />
      <ChatRoom />
      <MatchDetailPanel />
      <BettingOptionsModal />
    </div>
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
