<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Upload } from 'lucide-vue-next'
import JSZip from 'jszip'

const props = defineProps<{
  open: boolean
  mode: 'form' | 'message'
  titleKey: string
  messageKey: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()

const verifyFormId = ref('')
const originalAvatarName = ref('')
const zippedAvatarName = ref('')
const zippedAvatarFile = ref<File | null>(null)
const zipInfo = ref('')
const avatarError = ref('')
const isZippingAvatar = ref(false)

const UNITS = ['B', 'KB', 'MB', 'GB'] as const

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const p = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1)
  const value = bytes / 1024 ** p
  return `${value.toFixed(value >= 10 || p === 0 ? 0 : 1)} ${UNITS[p]}`
}

function resetForm() {
  verifyFormId.value = ''
  originalAvatarName.value = ''
  zippedAvatarName.value = ''
  zippedAvatarFile.value = null
  zipInfo.value = ''
  avatarError.value = ''
  isZippingAvatar.value = false
}

watch(() => props.open, (open) => {
  if (!open) resetForm()
})

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
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'avatar'
    const zipName = `${baseName}.zip`
    zippedAvatarFile.value = new File([blob], zipName, { type: 'application/zip' })
    originalAvatarName.value = file.name
    zippedAvatarName.value = zipName
    zipInfo.value = `${zipName} (${formatBytes(blob.size)})`
  } catch (error) {
    avatarError.value = t('bottomNav.verify.error.zipFailed')
    console.error(error)
  } finally {
    isZippingAvatar.value = false
    input.value = ''
  }
}

const canSubmit = computed(
  () => verifyFormId.value.trim().length > 0 && zippedAvatarFile.value != null && !isZippingAvatar.value,
)

function closeModal() {
  emit('close')
}

function handleSubmit() {
  if (!canSubmit.value) return
  // TODO: call actual submit API
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="verify-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <Transition name="verify-scale">
          <div
            class="fixed left-1/2 top-1/2 z-[1001]
                   w-[calc(100vw-2rem)] max-w-sm
                   -translate-x-1/2 -translate-y-1/2
                   rounded-3xl border border-[var(--color-border)]
                   bg-[var(--color-card)] overflow-hidden"
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <h2 class="text-lg font-bold text-[var(--color-text)]">{{ $t(titleKey) }}</h2>
              <button
                @click="closeModal"
                class="p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
                :aria-label="$t('bottomNav.verify.modal.closeAria')"
              >
                <X class="w-5 h-5 text-[var(--color-muted)]" />
              </button>
            </div>

            <!-- Body: Form -->
            <div v-if="mode === 'form'" class="p-4 space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs text-[var(--color-muted)] font-medium">
                  {{ $t('bottomNav.verify.form.idLabel') }}
                </label>
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
                <label class="text-xs text-[var(--color-muted)] font-medium">
                  {{ $t('bottomNav.verify.form.avatarLabel') }}
                </label>
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
                  <input type="file" accept="image/*" class="hidden" @change="handleAvatarFileChange">
                </label>
                <p v-if="avatarError" class="text-xs text-danger" role="alert">{{ avatarError }}</p>
                <p v-else-if="zippedAvatarName" class="text-xs text-success">
                  {{ $t('bottomNav.verify.form.zippedDone', { file: zippedAvatarName }) }}
                </p>
              </div>
            </div>

            <!-- Body: Message -->
            <div v-else class="p-5">
              <p class="text-sm text-[var(--color-text)] leading-6">{{ $t(messageKey) }}</p>
            </div>

            <!-- Footer -->
            <div class="p-4 pt-0 flex gap-3">
              <button
                @click="closeModal"
                class="flex-1 py-3 rounded-xl font-medium bg-[var(--color-bg)]
                       border border-[var(--color-border)] text-[var(--color-text)]
                       transition-all active:scale-95"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                v-if="mode === 'form'"
                @click="handleSubmit"
                :disabled="!canSubmit"
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
.verify-fade-enter-active,
.verify-fade-leave-active {
  transition: opacity 0.2s ease;
}
.verify-fade-enter-from,
.verify-fade-leave-to {
  opacity: 0;
}
.verify-scale-enter-active,
.verify-scale-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.verify-scale-enter-from,
.verify-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
