<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    @click="toggleTheme"
    class="relative w-10 h-10 rounded-xl flex items-center justify-center
           bg-[var(--color-card)] border border-[var(--color-border)]
           transition-all duration-300 active:scale-90
           hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
    :aria-label="$t('theme.toggleAriaLabel')"
  >
    <Transition name="theme-icon" mode="out-in">
      <Sun
        v-if="theme === 'dark'"
        class="w-5 h-5 text-amber-400"
      />
      <Moon
        v-else
        class="w-5 h-5 text-primary"
      />
    </Transition>
  </button>
</template>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.2s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>
