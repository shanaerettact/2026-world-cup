import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

const avatarColors = [
  '#4e80ee', '#6aa1ff', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
]

type WsMessage = {
  type?: string
  data?: unknown
  code?: number
  success?: boolean
  loginSuccess?: boolean
}

const getChatWsUrl = () => 'wss://worldcup.jfshield.com/ws/'

function sendWs(socket: WebSocket | null, type: string, data: unknown) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify({ type, data }))
}

/** 後端登入成功判斷（可依實際回傳欄位微調） */
function isLoginSuccessResponse(r: WsMessage): boolean {
  if (r.type === 'error') return false
  if (r.type === 'connected') return true
  if (r.success === true || r.loginSuccess === true) return true
  if (r.type === 'system' && (r.code === 0 || r.code === 200)) return true
  if (
    r.type === 'system' &&
    typeof r.data === 'string' &&
    (
      r.data.includes('登入成功') ||
      r.data.includes('加入聊天室') ||
      /login\s*success/i.test(r.data)
    )
  ) {
    return true
  }
  return false
}

function isHeartbeatResponse(r: WsMessage): boolean {
  return r.type === 'heartbeat' || r.data === 'PONG'
}

function isServerPing(r: WsMessage): boolean {
  return r.type === 'ping' || r.data === 'PING'
}

function isElsewhereLoginMessage(text: string): boolean {
  return /其他地方登入/.test(text)
}

function speakText(data: unknown): string {
  if (data == null) return ''
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const candidates = [obj.message, obj.text, obj.content, obj.msg, obj.data]
    for (const item of candidates) {
      const text = speakText(item)
      if (text) return text
    }
    try {
      return JSON.stringify(data)
    } catch {
      return ''
    }
  }
  return String(data)
}

export function useChatSocket() {
  const chatStore = useChatStore()
  const userStore = useUserStore()
  const wsConnected = ref(false)
  const loginAcknowledged = ref(false)
  const messages = ref<WsMessage[]>([])
  const warningMessage = ref('')
  const warningRoutesToSessionExpired = ref(false)

  const connect = () => initWebSocket()

  const disconnect = () => closeSocket()

  onMounted(() => {
    if (userStore.session) {
      initWebSocket()
    }
  })

  watch(() => userStore.session, (newSession) => {
    if (newSession && !socket.value) {
      initWebSocket()
    }
  })

  onUnmounted(() => {
    disconnect()
  })

  const socket = ref<WebSocket | null>(null)

  const closeSocket = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    wsConnected.value = false
    loginAcknowledged.value = false
  }

  const initWebSocket = () => {
    const sessionToken = userStore.session
    if (!sessionToken) {
      console.warn('尚未取得 session token，無法連線聊天室')
      return
    }
    if (
      socket.value &&
      (socket.value.readyState === WebSocket.OPEN ||
        socket.value.readyState === WebSocket.CONNECTING)
    ) {
      return
    }
    const wsUrl = getChatWsUrl()
    const ws = new WebSocket(wsUrl)
    socket.value = ws
    ws.onopen = () => {
      if (socket.value !== ws) return
      wsConnected.value = true
      loginAcknowledged.value = false
      sendWs(ws, 'login', sessionToken)
      console.log('WebSocket 已連線，已送出 login');
    };

    ws.onmessage = (event) => {
      if (socket.value !== ws) return
      const response = JSON.parse(event.data) as WsMessage
      if (isServerPing(response)) {
        sendWs(ws, 'pong', 'PONG')
        return
      }
      if (isHeartbeatResponse(response)) {
        return
      }
      if (response.type === 'error') {
        loginAcknowledged.value = false
        const text = speakText(response.data) || '聊天室暫時無法發言'
        warningMessage.value = text
        warningRoutesToSessionExpired.value = isElsewhereLoginMessage(text)
      } else if (isLoginSuccessResponse(response)) {
        loginAcknowledged.value = true
        console.log('登入成功，已允許發言')
      }
      console.log('收到伺服器訊息:', response);
      messages.value.push(response);
      if (response.type === 'speak') {
        const message = speakText(response.data)
        if (message) {
          chatStore.addMessage({
            id: Date.now() + Math.random(),
            user: 'Chat',
            avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
            message,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          })
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 錯誤:', error);
    };

    ws.onclose = (ev) => {
      wsConnected.value = false
      loginAcknowledged.value = false
      if (socket.value === ws) {
        socket.value = null
      }
      console.log('WebSocket 已斷開', { code: ev.code, reason: ev.reason, wasClean: ev.wasClean })
    };
  };

  const sendChatMessage = (text: string) => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      initWebSocket()
      console.warn('WebSocket 尚未連線，已嘗試重新連線')
      return
    }
    if (!loginAcknowledged.value) {
      console.warn('尚未收到登入成功回覆，已阻擋送出')
      return
    }
    sendWs(socket.value, 'speak', text)
  }

  const clearWarningMessage = () => {
    warningMessage.value = ''
    warningRoutesToSessionExpired.value = false
  }

  return {
    wsConnected,
    loginAcknowledged,
    connect,
    disconnect,
    messages,
    sendChatMessage,
    warningMessage,
    warningRoutesToSessionExpired,
    clearWarningMessage
  }
}
