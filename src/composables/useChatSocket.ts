import { ref, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chatStore'




interface ChatMessage {
  id: number
  user: string
  avatar: string
  message: string
  time: string
}

const usernames = [
  'BetMaster99', 'LuckyStrike', 'GoalHunter', 'OddsFinder', 'WinnerTakes',
  'BrazilFan2026', 'FootballKing', 'ParlayPro', 'MatchDay', 'GoldenBoot',
  'ChampionBet', 'ScorePredictor', 'LiveBetter', 'TrophyHunter', 'FinalWhistle'
]

const avatarColors = [
  '#4e80ee', '#6aa1ff', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
]

const CHAT_WS_TOKEN = 'JkqxFDm7JYLP'

const getChatWsUrl = () =>
  `wss://worldcup.jfshield.com/ws/login?token=${encodeURIComponent(CHAT_WS_TOKEN)}`

const HEARTBEAT_MS = 3_000

/** 後端登入成功判斷（可依實際回傳欄位微調） */
function isLoginSuccessResponse(r: any): boolean {
  if (r.type === 'error') return false
  if (r.success === true || r.loginSuccess === true) return true
  if (r.type === 'login' && r.success === true) return true
  if (r.type === 'system' && (r.code === 0 || r.code === 200)) return true
  if (
    r.type === 'system' &&
    typeof r.data === 'string' &&
    (r.data.includes('登入成功') || /login\s*success/i.test(r.data))
  ) {
    return true
  }
  return false
}

export function useChatSocket() {
  const chatStore = useChatStore()
  const wsConnected = ref(false)
  const loginAcknowledged = ref(false)
  const wsUrl = getChatWsUrl()
  const messages = ref<any[]>([])
  let intervalId: ReturnType<typeof setInterval> | null = null

  const generateMessage = (): ChatMessage => {
    const user = usernames[Math.floor(Math.random() * usernames.length)]
    const pool = messages.value
    const raw = pool.length === 0 ? null : pool[Math.floor(Math.random() * pool.length)]
    const message =
      raw == null
        ? '…'
        : typeof raw === 'string'
          ? raw
          : (raw?.message != null ? String(raw.message) : JSON.stringify(raw))
    const color = avatarColors[Math.floor(Math.random() * avatarColors.length)]
    
    return {
      id: Date.now() + Math.random(),
      user,
      avatar: color,
      message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const connect = () => {
    for (let i = 0; i < 5; i++) {
      chatStore.addMessage(generateMessage())
    }

    intervalId = setInterval(() => {
      chatStore.addMessage(generateMessage())
    }, 2000 + Math.random() * 2000)
  }

  const disconnect = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onMounted(() => {
    connect()
    initWebSocket();

  })

  onUnmounted(() => {
    disconnect()
    stopHeartbeat()
    if (socket.value) socket.value.close()
  })

  const socket = ref<WebSocket | null>(null)
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  const startHeartbeat = () => {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      if (socket.value && socket.value.readyState === WebSocket.OPEN) {
        socket.value.send(JSON.stringify({ type: 'heartbeat', data: 'PING' }))
      }
    }, HEARTBEAT_MS)
  }

  const initWebSocket = () => {
    socket.value = new WebSocket(wsUrl);
    socket.value.onopen = () => {
      wsConnected.value = true
      loginAcknowledged.value = true
      startHeartbeat()
      console.log('WebSocket 已連線（token 透過 URL 驗證，不需額外 send）');
    };

    socket.value.onmessage = (event) => {
      const response = JSON.parse(event.data) as any
      startHeartbeat()
      // if (response.type === 'heartbeat' || response.data === 'PONG') {
      //   return
      // }
      if (response.type === 'error') {
        loginAcknowledged.value = false
      } else if (isLoginSuccessResponse(response)) {
        loginAcknowledged.value = true
        console.log('登入成功，已允許發言')
      }
      console.log('收到伺服器訊息:', response);
      messages.value.push(response);
    };

    socket.value.onerror = (error) => {
      console.error('WebSocket 錯誤:', error);
    };

    socket.value.onclose = (ev) => {
      wsConnected.value = false
      loginAcknowledged.value = false
      stopHeartbeat()
      console.log('WebSocket 已斷開', { code: ev.code, reason: ev.reason, wasClean: ev.wasClean })

    };
  };

  const sendChatMessage = (text: string) => {
    if (!loginAcknowledged.value) {
      console.warn('尚未收到登入成功回覆，已阻擋送出')
      return
    }
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) return
    const payload = JSON.stringify({ type: 'speak', data: text })
    console.log('[speak]', payload)
    socket.value.send(payload)
  }

  return {
    wsConnected,
    loginAcknowledged,
    connect,
    disconnect,
    messages,
    sendChatMessage
  }
}
