import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ChatMessage {
  id: number
  user: string
  avatar: string
  message: string
  time: string
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const onlineUsers = ref(1247)
  const isChatOpen = ref(false)

  const messageCount = computed(() => messages.value.length)

  function addMessage(message: ChatMessage) {
    messages.value.push(message)
    // Keep only last 50 messages
    if (messages.value.length > 50) {
      messages.value = messages.value.slice(-50)
    }
  }

  function sendMessage(text: string) {
    const message: ChatMessage = {
      id: Date.now(),
      user: 'You',
      avatar: '#4e80ee',
      message: text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    addMessage(message)
  }

  function clearMessages() {
    messages.value = []
  }

  function openChat() {
    isChatOpen.value = true
  }

  function closeChat() {
    isChatOpen.value = false
  }

  function toggleChat() {
    isChatOpen.value = !isChatOpen.value
  }

  // Simulate fluctuating online users
  setInterval(() => {
    const change = Math.floor(Math.random() * 20) - 10
    onlineUsers.value = Math.max(1000, onlineUsers.value + change)
  }, 5000)

  return {
    messages,
    onlineUsers,
    isChatOpen,
    messageCount,
    addMessage,
    sendMessage,
    clearMessages,
    openChat,
    closeChat,
    toggleChat
  }
})
