<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { X, Send, Users, AlertTriangle } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chatStore'
import { useChatSocket } from '@/composables/useChatSocket'

const router = useRouter()
const chatStore = useChatStore()
const {
  wsConnected,
  sendChatMessage,
  warningMessage,
  warningRoutesToSessionExpired,
  clearWarningMessage,
  connect,
  disconnect,
} = useChatSocket()

const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const sendMessage = () => {
  const text = messageInput.value.trim()
  if (!text) return
  chatStore.sendMessage(text)
  sendChatMessage(text)
  messageInput.value = ''
}

const handleWarningAcknowledge = () => {
  const goSessionExpired = warningRoutesToSessionExpired.value
  clearWarningMessage()
  disconnect()
  if (goSessionExpired) {
    chatStore.closeChat()
    void router.replace({ name: 'login-failed' })
    return
  }
  connect()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => chatStore.messages.length, () => {
  scrollToBottom()
})

watch(() => chatStore.isChatOpen, (open) => {
  if (open) {
    scrollToBottom()
  }
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="warningMessage"
        class="fixed inset-0 z-[90] bg-black/45 backdrop-blur-md flex items-center justify-center p-4"
        @click="handleWarningAcknowledge"
      >
        <div
          class="w-full max-w-xs rounded-2xl border border-warning/30 bg-white/10 backdrop-blur-xl
                 shadow-2xl shadow-black/30 p-4"
          @click.stop
        >
          <div class="flex items-center gap-2 text-warning mb-2">
            <AlertTriangle class="w-5 h-5" />
            <p class="font-semibold">警告</p>
          </div>
          <p class="text-sm text-white/95 leading-relaxed">{{ warningMessage }}</p>
          <button
            class="mt-4 w-full py-2 rounded-xl font-medium bg-warning/80 text-black
                   hover:bg-warning transition-colors"
            @click="handleWarningAcknowledge"
          >
            知道了
          </button>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="chatStore.isChatOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        @click="chatStore.closeChat"
      />
    </Transition>

    <!-- Chat Panel -->
    <Transition name="slide-up">
      <div
        v-if="chatStore.isChatOpen"
        class="fixed bottom-0 left-0 right-0 z-[60] max-w-[430px] mx-auto"
      >
        <div class="bg-[var(--color-card)] rounded-t-3xl shadow-2xl shadow-black/20
                    h-[70vh] flex flex-col">
          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-2">
            <div class="w-10 h-1 rounded-full bg-[var(--color-border)]" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-4 pb-3 border-b border-[var(--color-border)]">
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-bold text-[var(--color-text)]">{{ $t('chat.title') }}</h2>
              <div
                class="flex items-center gap-1.5 px-2 py-1 rounded-full"
                :class="wsConnected ? 'bg-success/10' : 'bg-[var(--color-border)]/30'"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  :class="wsConnected ? 'bg-success animate-pulse' : 'bg-[var(--color-muted)]'"
                />
                <Users class="w-3 h-3 text-success" />
                <span class="text-xs font-medium text-success">
                  {{ chatStore.onlineUsers.toLocaleString() }}
                </span>
              </div>
            </div>
            <button
              @click="chatStore.closeChat"
              class="p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
            >
              <X class="w-5 h-5 text-[var(--color-muted)]" />
            </button>
          </div>

          <!-- Messages -->
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            <div
              v-for="message in chatStore.messages"
              :key="message.id"
              class="flex animate-fade-scale"
              :class="message.user === 'You' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="flex items-end gap-2 max-w-[84%]"
                :class="message.user === 'You' ? 'justify-end' : ''"
              >
                <!-- Avatar -->
                <div
                  class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  :style="{ backgroundColor: message.avatar }"
                >
                  {{ message.user.charAt(0).toUpperCase() }}
                </div>

                <!-- Content -->
                <div class="min-w-0" :class="message.user === 'You' ? 'text-right' : ''">
                  <div
                    class="flex items-baseline gap-2 mb-1"
                    :class="message.user === 'You' ? 'justify-end' : ''"
                  >
                    <span
                      class="text-xs font-semibold"
                      :class="message.user === 'You' ? 'text-primary-light' : 'text-[var(--color-text)]'"
                    >
                      {{ message.user === 'You' ? $t('chat.you') : message.user }}
                    </span>
                    <span class="text-[10px] text-[var(--color-muted)]">{{ message.time }}</span>
                  </div>

                  <div
                    class="px-3 py-2 rounded-2xl text-sm break-words shadow-sm"
                    :class="
                      message.user === 'You'
                        ? 'bg-gradient-to-r from-primary to-primary-light text-white'
                        : 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]'
                    "
                  >
                    {{ message.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="p-4 border-t border-[var(--color-border)]">
            <form @submit.prevent="sendMessage" class="flex gap-2">
              <input
                v-model="messageInput"
                type="text"
                :placeholder="$t('chat.placeholder')"
                class="flex-1 py-3 px-4 rounded-xl bg-[var(--color-bg)]
                       border border-[var(--color-border)]
                       text-[var(--color-text)] placeholder-[var(--color-muted)]
                       focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                :disabled="!messageInput.trim()"
                class="w-12 h-12 rounded-xl flex items-center justify-center
                       bg-gradient-to-r from-primary to-primary-light
                       text-white shadow-lg shadow-primary/20
                       transition-all active:scale-90
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send class="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
