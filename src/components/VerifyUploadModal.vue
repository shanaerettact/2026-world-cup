<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Upload } from 'lucide-vue-next'
import { useVerifyStore } from '@/stores/verifyStore'
import { useUserStore } from '@/stores/userStore'

const ALLOW_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const
const MAX_ORIGINAL_MB = 3
const COMPRESS_MAX_EDGE = 1920
const JPEG_QUALITY = 0.82

async function loadImageSource(file: File): Promise<CanvasImageSource> {
  if (typeof createImageBitmap !== 'undefined') {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

function releaseBitmap(source: CanvasImageSource) {
  if (source instanceof ImageBitmap && typeof source.close === 'function') {
    source.close()
  }
}

async function compressImage(file: File): Promise<File> {
  let bitmap: CanvasImageSource
  try {
    bitmap = await loadImageSource(file)
  } catch {
    throw new Error('IMAGE_COMPRESS_FAILED')
  }
  try {
    const { width, height } = bitmap as { width: number; height: number }
    let w = width
    let h = height
    const maxEdge = COMPRESS_MAX_EDGE
    if (w > maxEdge || h > maxEdge) {
      if (w >= h) {
        h = Math.round((h * maxEdge) / w)
        w = maxEdge
      } else {
        w = Math.round((w * maxEdge) / h)
        h = maxEdge
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('IMAGE_COMPRESS_FAILED')

    try {
      ctx.drawImage(bitmap, 0, 0, w, h)
    } catch {
      throw new Error('IMAGE_COMPRESS_FAILED')
    }

    const mime: 'image/jpeg' | 'image/png' =
      file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const quality = mime === 'image/jpeg' ? JPEG_QUALITY : undefined
    const ext = mime === 'image/png' ? 'png' : 'jpg'
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'avatar'

    return await new Promise<File>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('IMAGE_COMPRESS_FAILED'))
            return
          }
          resolve(new File([blob], `${baseName}.${ext}`, { type: mime }))
        },
        mime,
        quality,
      )
    })
  } catch {
    throw new Error('IMAGE_COMPRESS_FAILED')
  } finally {
    releaseBitmap(bitmap)
  }
}

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
const verifyStore = useVerifyStore()
const userStore = useUserStore()

const verifyFormId = ref('')
const originalAvatarName = ref('')
const compressedAvatarName = ref('')
const compressedAvatarFile = ref<File | null>(null)
const compressionInfo = ref('')
const avatarError = ref('')
const idFieldError = ref('')
const avatarFieldError = ref('')
const submitError = ref('')
const isCompressingAvatar = ref(false)

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
  compressedAvatarName.value = ''
  compressedAvatarFile.value = null
  compressionInfo.value = ''
  avatarError.value = ''
  idFieldError.value = ''
  avatarFieldError.value = ''
  submitError.value = ''
  isCompressingAvatar.value = false
}

watch(() => props.open, (open) => {
  if (open) {
    submitError.value = ''
    idFieldError.value = ''
    avatarFieldError.value = ''
  } else {
    resetForm()
  }
})

async function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  avatarError.value = ''
  avatarFieldError.value = ''
  compressionInfo.value = ''
  compressedAvatarFile.value = null
  originalAvatarName.value = ''
  compressedAvatarName.value = ''
  if (!file) return

  if (!ALLOW_IMAGE_TYPES.includes(file.type as (typeof ALLOW_IMAGE_TYPES)[number])) {
    avatarError.value = t('bottomNav.verify.error.invalidJpgPng', {
      mime: file.type || t('bottomNav.verify.error.unknownMime'),
    })
    input.value = ''
    return
  }

  if (file.size > MAX_ORIGINAL_MB * 1024 * 1024) {
    avatarError.value = t('bottomNav.verify.error.imageTooLarge', { maxMb: MAX_ORIGINAL_MB })
    input.value = ''
    return
  }

  isCompressingAvatar.value = true
  await nextTick()
  try {
    let compressed: File
    try {
      compressed = await compressImage(file)
    } catch (error) {
      console.error(error)
      avatarError.value = t('bottomNav.verify.error.compressFailed')
      return
    }
    compressedAvatarFile.value = compressed
    originalAvatarName.value = file.name
    compressedAvatarName.value = compressed.name
    compressionInfo.value = `${compressed.name} (${formatBytes(compressed.size)})`
  } finally {
    isCompressingAvatar.value = false
    input.value = ''
  }
}

function validateFields(): boolean {
  idFieldError.value = ''
  avatarFieldError.value = ''
  let ok = true
  if (!verifyFormId.value.trim()) {
    idFieldError.value = t('bottomNav.verify.validation.idRequired')
    ok = false
  }
  if (isCompressingAvatar.value) {
    avatarFieldError.value = t('bottomNav.verify.validation.avatarCompressing')
    ok = false
  } else if (!compressedAvatarFile.value) {
    avatarFieldError.value = t('bottomNav.verify.validation.avatarRequired')
    ok = false
  }
  return ok
}

function closeModal() {
  emit('close')
}

async function handleSubmit() {
  if (verifyStore.isSubmitting) return
  submitError.value = ''
  if (!validateFields()) return
  const file = compressedAvatarFile.value
  if (!file) return
  try {
    await verifyStore.submitVerification({
      id: verifyFormId.value.trim(),
      selfie: file,
    })
    await userStore.fetchUserInfo()
    closeModal()
  } catch (e) {
    submitError.value =
      e instanceof Error && e.message ? e.message : t('bottomNav.verify.error.submitFailed')
    console.error(e)
  }
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
                  :aria-invalid="!!idFieldError"
                  class="w-full rounded-xl border bg-[var(--color-bg)] px-3 py-2.5 text-sm
                         text-[var(--color-text)] outline-none transition-[box-shadow,border-color]"
                  :class="idFieldError
                    ? 'border-danger/45 ring-2 ring-danger/15 focus:ring-danger/25 focus:border-danger/50'
                    : 'border-[var(--color-border)] focus:ring-2 focus:ring-primary/30 focus:border-primary/40'"
                  @input="idFieldError = ''"
                >
                <p
                  v-if="idFieldError"
                  class="mt-1.5 text-xs text-danger font-medium leading-relaxed
                         rounded-lg px-2.5 py-1.5 border border-danger/20 bg-danger/5"
                  role="alert"
                >
                  {{ idFieldError }}
                </p>
              </div>

              <div class="space-y-2">
                <label class="text-xs text-[var(--color-muted)] font-medium">
                  {{ $t('bottomNav.verify.form.avatarLabel') }}
                </label>
                <label
                  class="w-full rounded-xl border border-dashed bg-[var(--color-bg)] px-3 py-4
                         flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  :class="avatarFieldError
                    ? 'border-danger/45 ring-2 ring-danger/15 hover:border-danger/55'
                    : 'border-[var(--color-border)] hover:border-primary/40'"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-[var(--color-text)] truncate">
                      {{ originalAvatarName || $t('bottomNav.verify.form.avatarUpload') }}
                    </p>
                    <p class="text-xs text-[var(--color-muted)] mt-1">
                      {{ isCompressingAvatar ? $t('bottomNav.verify.form.compressing') : (compressionInfo || $t('bottomNav.verify.form.compressHint')) }}
                    </p>
                  </div>
                  <Upload class="w-5 h-5 text-primary shrink-0" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    class="hidden"
                    @change="handleAvatarFileChange"
                  >
                </label>
                <p
                  v-if="avatarError"
                  class="text-xs text-danger font-medium leading-relaxed rounded-lg px-2.5 py-1.5
                         border border-danger/20 bg-danger/5 whitespace-pre-line"
                  role="alert"
                >
                  {{ avatarError }}
                </p>
                <p v-else-if="compressedAvatarName" class="text-xs text-success font-medium">
                  {{ $t('bottomNav.verify.form.compressedDone', { file: compressedAvatarName }) }}
                </p>
                <p
                  v-if="avatarFieldError && !avatarError"
                  class="text-xs text-danger font-medium leading-relaxed rounded-lg px-2.5 py-1.5
                         border border-danger/20 bg-danger/5"
                  role="alert"
                >
                  {{ avatarFieldError }}
                </p>
              </div>

              <div
                v-if="submitError"
                class="rounded-xl px-3 py-2.5 border border-danger/25 bg-danger/10
                       text-danger text-xs font-medium"
                role="alert"
              >
                {{ submitError }}
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
                :disabled="verifyStore.isSubmitting"
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
