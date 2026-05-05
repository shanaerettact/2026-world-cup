<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, Zap, Wallet, MessageCircle, LayoutGrid, X, Upload } from 'lucide-vue-next'
import JSZip from 'jszip'
import { useChatStore } from '@/stores/chatStore'
import { useBetSlipStore } from '@/stores/betSlipStore'
import { useBettingModalStore } from '@/stores/bettingModalStore'
import { useChampionListStore } from '@/stores/championListStore'
import { getUserInfo } from '@/services/api/userApi'

const route = useRoute()
const { t } = useI18n()
const chatStore = useChatStore()
const betSlipStore = useBetSlipStore()
const bettingModalStore = useBettingModalStore()
const championListStore = useChampionListStore()
const isCheckingVerify = ref(false)
const verifyError = ref('')
const isVerifyModalOpen = ref(false)
const verifyModalMode = ref<'form' | 'message'>('form')
const verifyModalTitleKey = ref('bottomNav.verify.modal.title.form')
const verifyModalMessageKey = ref('')
const verifyFormId = ref('')
const originalAvatarName = ref('')
const zippedAvatarName = ref('')
const zippedAvatarFile = ref<File | null>(null)
const zipInfo = ref('')
const avatarError = ref('')
const isZippingAvatar = ref(false)

function openBettingMarkets() {
  bettingModalStore.open()
  void championListStore.fetchChampionList()
}

function pickUserRecord(payload: unknown): Record<string, unknown> | null {
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) return null
  const root = payload as Record<string, unknown>
  const inner = root.user
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>
  }
  return root
}

function toNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (v == null) return null
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const p = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, p)
  return `${value.toFixed(value >= 10 || p === 0 ? 0 : 1)} ${units[p]}`
}

function resetVerifyForm() {
  verifyFormId.value = ''
  originalAvatarName.value = ''
  zippedAvatarName.value = ''
  zippedAvatarFile.value = null
  zipInfo.value = ''
  avatarError.value = ''
}

function closeVerifyModal() {
  isVerifyModalOpen.value = false
  verifyModalMode.value = 'form'
  verifyModalTitleKey.value = 'bottomNav.verify.modal.title.form'
  verifyModalMessageKey.value = ''
  resetVerifyForm()
}

async function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  avatarError.value = ''
  zipInfo.value = ''
  zippedAvatarFile.value = null
  originalAvatarName.value = ''
  zippedAvatarName.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    avatarError.value = t('bottomNav.verify.error.uploadImageOnly')
    input.value = ''
    return
  }

  isZippingAvatar.value = true
  try {
    const zip = new JSZip()
    zip.file(file.name, file)
    const zippedBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'avatar'
    const zipName = `${baseName}.zip`
    zippedAvatarFile.value = new File([zippedBlob], zipName, { type: 'application/zip' })
    originalAvatarName.value = file.name
    zippedAvatarName.value = zipName
    zipInfo.value = `${zipName} (${formatBytes(zippedBlob.size)})`
  } catch (error) {
    avatarError.value = t('bottomNav.verify.error.zipFailed')
    console.error(error)
  } finally {
    isZippingAvatar.value = false
    input.value = ''
  }
}

async function handleChatClick() {
  if (isCheckingVerify.value) return
  verifyError.value = ''
  isCheckingVerify.value = true
  try {
    const payload = await getUserInfo()
    const user = pickUserRecord(payload)
    const verify = toNum(user?.verify)
    if (verify === 1) {
      verifyModalMode.value = 'form'
      verifyModalTitleKey.value = 'bottomNav.verify.modal.title.form'
      verifyModalMessageKey.value = ''
      isVerifyModalOpen.value = true
      return
    }
    if (verify === 2) {
      verifyModalMode.value = 'message'
      verifyModalTitleKey.value = 'bottomNav.verify.modal.title.status'
      verifyModalMessageKey.value = 'bottomNav.verify.modal.message.pending'
      isVerifyModalOpen.value = true
      return
    }
    if (verify === 3) {
      chatStore.toggleChat()
      return
    }
    if (verify === 4) {
      verifyModalMode.value = 'message'
      verifyModalTitleKey.value = 'bottomNav.verify.modal.title.status'
      verifyModalMessageKey.value = 'bottomNav.verify.modal.message.rejected'
      isVerifyModalOpen.value = true
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

const canSubmitVerifyForm = computed(() => {
  return verifyFormId.value.trim().length > 0 && zippedAvatarFile.value != null && !isZippingAvatar.value
})

function handleVerifySubmit() {
  if (!canSubmitVerifyForm.value) return
  closeVerifyModal()
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
            :aria-label="$t('bottomNav.openBettingMarketsAria')"
          >
            <LayoutGrid class="w-5 h-5 text-white" />
          </button>
          <!-- Label sits in the normal flow of the nav bar -->
          <span class="text-[10px] font-semibold text-primary mt-auto pt-1">{{ $t('bottomNav.specialMarkets') }}</span>
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
          @click="handleChatClick"
          class="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl
                 text-[var(--color-muted)] hover:text-[var(--color-text)]
                 transition-all duration-300 active:scale-90 disabled:opacity-60"
          :disabled="isCheckingVerify"
        >
          <MessageCircle class="w-6 h-6" />
          <span class="text-[10px] font-medium mt-1">{{ $t('nav.chat') }}</span>
          <span
            v-if="isCheckingVerify"
            class="absolute top-1 right-2 w-3.5 h-3.5 border border-[var(--color-text)]/30 border-t-[var(--color-text)] rounded-full animate-spin"
          />
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

  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isVerifyModalOpen"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] relative"
        @click.self="closeVerifyModal"
      >
        <Transition name="scale">
          <div
            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[calc(100vw-2rem)] max-w-sm
                   bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] overflow-hidden"
          >
            <div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <h2 class="text-lg font-bold text-[var(--color-text)]">{{ $t(verifyModalTitleKey) }}</h2>
              <button
                @click="closeVerifyModal"
                class="p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
                :aria-label="$t('bottomNav.verify.modal.closeAria')"
              >
                <X class="w-5 h-5 text-[var(--color-muted)]" />
              </button>
            </div>

            <div v-if="verifyModalMode === 'form'" class="p-4 space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs text-[var(--color-muted)] font-medium">{{ $t('bottomNav.verify.form.idLabel') }}</label>
                <input
                  v-model="verifyFormId"
                  type="text"
                  :placeholder="$t('bottomNav.verify.form.idPlaceholder')"
                  class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]
                         px-3 py-2.5 text-sm text-[var(--color-text)] outline-none
                         focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                >
              </div>

              <div class="space-y-2">
                <label class="text-xs text-[var(--color-muted)] font-medium">{{ $t('bottomNav.verify.form.avatarLabel') }}</label>
                <label
                  class="w-full rounded-xl border border-dashed border-[var(--color-border)]
                         bg-[var(--color-bg)] px-3 py-4 flex items-center justify-between gap-3
                         cursor-pointer hover:border-primary/40 transition-colors"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-[var(--color-text)] truncate">
                      {{ originalAvatarName || $t('bottomNav.verify.form.avatarUpload') }}
                    </p>
                    <p class="text-xs text-[var(--color-muted)] mt-1">
                      {{ isZippingAvatar ? $t('bottomNav.verify.form.zipping') : (zipInfo || $t('bottomNav.verify.form.autoZipHint')) }}
                    </p>
                  </div>
                  <Upload class="w-5 h-5 text-primary shrink-0" />
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleAvatarFileChange"
                  >
                </label>
                <p v-if="avatarError" class="text-xs text-danger" role="alert">{{ avatarError }}</p>
                <p v-else-if="zippedAvatarName" class="text-xs text-success">
                  {{ $t('bottomNav.verify.form.zippedDone', { file: zippedAvatarName }) }}
                </p>
              </div>
            </div>
            <div v-else class="p-5">
              <p class="text-sm text-[var(--color-text)] leading-6">{{ $t(verifyModalMessageKey) }}</p>
            </div>

            <div class="p-4 pt-0 flex gap-3">
              <button
                @click="closeVerifyModal"
                class="flex-1 py-3 rounded-xl font-medium bg-[var(--color-bg)]
                       border border-[var(--color-border)] text-[var(--color-text)]
                       transition-all active:scale-95"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                v-if="verifyModalMode === 'form'"
                @click="handleVerifySubmit"
                :disabled="!canSubmitVerifyForm"
                class="flex-1 py-3 rounded-xl font-bold text-white
                       bg-gradient-to-r from-primary to-primary-light
                       shadow-lg shadow-primary/25
                       transition-all active:scale-95 disabled:opacity-60 disabled:shadow-none"
              >
                {{ $t('common.confirm') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
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

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
