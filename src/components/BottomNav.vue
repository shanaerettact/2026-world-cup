<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, Zap, Wallet, MessageCircle, Star } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chatStore'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { useBettingModalStore } from '@/stores/bettingModalStore'
import { useChampionListStore } from '@/stores/championListStore'
import { useUserStore } from '@/stores/userStore'
import VerifyUploadModal from '@/components/VerifyUploadModal.vue'

const route = useRoute()
const { t } = useI18n()
const chatStore = useChatStore()
const betSlipStore = useBetSlipStore()
const bettingModalStore = useBettingModalStore()
const championListStore = useChampionListStore()
const userStore = useUserStore()

const isCheckingVerify = ref(false)
const verifyError = ref('')
const isVerifyModalOpen = ref(false)
const verifyModalMode = ref<'form' | 'message'>('form')
const verifyModalTitleKey = ref('bottomNav.verify.modal.title.form')
const verifyModalMessageKey = ref('')

function openBettingMarkets() {
  bettingModalStore.open()
  void championListStore.fetchChampionList()
}

function closeVerifyModal() {
  isVerifyModalOpen.value = false
  verifyModalMode.value = 'form'
  verifyModalTitleKey.value = 'bottomNav.verify.modal.title.form'
  verifyModalMessageKey.value = ''
}

function openVerifyModal(mode: 'form' | 'message', titleKey: string, messageKey = '') {
  verifyModalMode.value = mode
  verifyModalTitleKey.value = titleKey
  verifyModalMessageKey.value = messageKey
  isVerifyModalOpen.value = true
}

async function handleChatClick() {
  if (isCheckingVerify.value) return
  verifyError.value = ''
  isCheckingVerify.value = true
  try {
    await userStore.fetchUserInfo()
    const verify = userStore.verify

    if (verify === 1) {
      openVerifyModal('form', 'bottomNav.verify.modal.title.form')
      return
    }
    if (verify === 2) {
      openVerifyModal('message', 'bottomNav.verify.modal.title.status', 'bottomNav.verify.modal.message.pending')
      return
    }
    if (verify === 3) {
      chatStore.toggleChat()
      return
    }
    if (verify === 4) {
      openVerifyModal('message', 'bottomNav.verify.modal.title.status', 'bottomNav.verify.modal.message.rejected')
      return
    }
    verifyError.value = t('bottomNav.verify.error.statusInvalid')
  } catch (error) {
    verifyError.value = t('bottomNav.verify.error.statusFetchFailed')
    console.error(error)
  } finally {
    isCheckingVerify.value = false
  }
}

const navItems = [
  { labelKey: 'nav.home', path: '/', icon: Home },
  { labelKey: 'nav.live', path: '/live', icon: Zap },
  { labelKey: 'nav.account', path: '/account', icon: Wallet },
]

const isActive = (path: string) => route.path === path

watch(isVerifyModalOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40">
    <div class="max-w-[430px] mx-auto">
      <div class="bg-[var(--color-card)]/95 backdrop-blur-xl border-t border-[var(--color-border)]
                  px-2 py-2 flex items-center justify-around relative">

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
          <span class="text-xs font-medium mt-1 relative z-10">{{ $t(item.labelKey) }}</span>
          <div
            v-if="isActive(item.path)"
            class="absolute -bottom-2 w-8 h-1 rounded-full bg-primary"
          />
        </router-link>

        <div class="relative flex h-14 w-16 flex-col items-center justify-end pb-0.5">
          <button
            type="button"
            @click="openBettingMarkets"
            class="markets-fab-nav absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full
                   flex flex-col items-center justify-center gap-0.5
                   transition-all duration-200 active:scale-90 select-none"
            :aria-label="$t('bottomNav.openBettingMarketsAria')"
          >
            <Star class="w-6 h-6 text-white" />
          </button>
          <span
            class="relative z-10 mt-1 max-w-[4.25rem] text-center text-xs font-semibold leading-tight text-amber-400"
          >
            {{ $t('bottomNav.specialMarkets') }}
          </span>
        </div>

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
          <span class="text-xs font-medium mt-1 relative z-10">{{ $t(navItems[2].labelKey) }}</span>
          <div
            v-if="isActive(navItems[2].path)"
            class="absolute -bottom-2 w-8 h-1 rounded-full bg-primary"
          />
        </router-link>

        <button
          @click="handleChatClick"
          class="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl
                 text-[var(--color-muted)] hover:text-[var(--color-text)]
                 transition-all duration-300 active:scale-90 disabled:opacity-60"
          :disabled="isCheckingVerify"
        >
          <MessageCircle class="w-6 h-6" />
          <span class="text-xs font-medium mt-1">{{ $t('nav.chat') }}</span>
          <span
            v-if="isCheckingVerify"
            class="absolute top-1 right-2 w-3.5 h-3.5 border border-[var(--color-text)]/30 border-t-[var(--color-text)] rounded-full animate-spin"
          />
          <span class="absolute top-2 right-3 w-2 h-2 bg-success rounded-full animate-pulse" />
        </button>

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

  <Transition name="fade">
    <div
      v-if="verifyError"
      class="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] max-w-[90vw]
             px-4 py-2 rounded-xl border border-danger/25 bg-danger/10
             text-danger text-xs font-medium backdrop-blur-sm"
      role="alert"
    >
      {{ verifyError }}
    </div>
  </Transition>

  <VerifyUploadModal
    :open="isVerifyModalOpen"
    :mode="verifyModalMode"
    :title-key="verifyModalTitleKey"
    :message-key="verifyModalMessageKey"
    @close="closeVerifyModal"
  />
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
