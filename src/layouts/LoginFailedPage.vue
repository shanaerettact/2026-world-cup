<script setup lang="ts">
import ThemeToggle from '@/components/ThemeToggle.vue'

</script>

<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
    <div class="max-w-[430px] mx-auto relative min-h-screen flex flex-col px-6">
      <div class="absolute top-3 right-4 z-10">
        <ThemeToggle />
      </div>
      <div class="flex flex-1 flex-col items-center justify-center gap-4 py-12">
        <h1 class="text-xl font-semibold text-center">無法登入</h1>
        <p class="text-sm text-[var(--color-muted)] text-center max-w-sm leading-relaxed">
          登入失敗、連線異常，或登入狀態已過期／無效時會顯示此頁。
        </p>

      </div>
    </div>
  </div>
</template>
