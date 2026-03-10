import { ref, onMounted, onUnmounted } from 'vue'
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

const messages = [
  "Italy looking strong today!",
  "Netherlands defense is solid",
  "Going big on the draw here",
  "Anyone else feeling the over 2.5?",
  "Just locked in my parlay!",
  "This match is going to be fire!",
  "Home team always has advantage",
  "Live betting is where it's at",
  "My lucky streak continues!",
  "World Cup vibes are unreal",
  "Who else is watching the stream?",
  "That odds shift was crazy",
  "Trust the process, boys",
  "Let's go! Big win incoming",
  "First goal scorer bet locked",
  "This is the match of the day!",
  "Corner bets are underrated",
  "Late goals happen, stay patient",
  "What a time to be alive!",
  "Cashout or let it ride?"
]

const avatarColors = [
  '#4e80ee', '#6aa1ff', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
]

export function useChatSocket() {
  const chatStore = useChatStore()
  const isConnected = ref(false)
  let intervalId: ReturnType<typeof setInterval> | null = null

  const generateMessage = (): ChatMessage => {
    const user = usernames[Math.floor(Math.random() * usernames.length)]
    const message = messages[Math.floor(Math.random() * messages.length)]
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
    isConnected.value = true
    
    // Generate initial messages
    for (let i = 0; i < 5; i++) {
      chatStore.addMessage(generateMessage())
    }

    // Simulate new messages every 2-4 seconds
    intervalId = setInterval(() => {
      chatStore.addMessage(generateMessage())
    }, 2000 + Math.random() * 2000)
  }

  const disconnect = () => {
    isConnected.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    connect,
    disconnect
  }
}
