import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo } from '@/services/api/userApi'
import { bootstrapWorldcupAuth } from '@/utils/request'

const loginUserForRelogin = () =>
  import.meta.env.VITE_LOGIN_USER || 'user01'

function pickUserRecord(payload: unknown): Record<string, unknown> | null {
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) return null
  const o = payload as Record<string, unknown>
  const inner = o.user
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>
  }
  if ('id' in o || 'account' in o || 'balance' in o || 'name' in o) return o
  return null
}

function numFromApi(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function strFromApi(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

export const useUserStore = defineStore('user', () => {
  const balance = ref(0)
  const isDepositing = ref(false)
  const username = ref('')

  const userAccount = ref('')
  const userId = ref(0)
  const phone = ref('')
  const email = ref('')
  const memberLevel = ref('')
  const memberSinceRaw = ref('')
  const betHistoryMenuBadge = ref('')

  const fetchUserInfo = async () => {
    const applyUser = (payload: unknown) => {
      const user = pickUserRecord(payload)
      if (!user) return

      const idNum = numFromApi(user.id)
      if (idNum != null) userId.value = idNum

      const acct = strFromApi(user.account)
      if (acct) userAccount.value = acct

      const bal = numFromApi(user.balance ?? user.money ?? user.credit)
      if (bal != null) balance.value = bal

      const name =
        strFromApi(user.name) ||
        strFromApi(user.nickname) ||
        strFromApi(user.nick_name)
      if (name) username.value = name

      phone.value = strFromApi(user.phone ?? user.mobile)
      email.value = strFromApi(user.email)
      memberLevel.value =
        strFromApi(user.level ?? user.vip ?? user.grade ?? user.member_level)

      const since =
        strFromApi(user.create_time) ||
        strFromApi(user.register_time) ||
        strFromApi(user.join_time)
      memberSinceRaw.value = since

      const pending = numFromApi(
        user.bet_count ?? user.order_count ?? user.unsettled_count,
      )
      betHistoryMenuBadge.value =
        pending != null && pending > 0 ? String(pending) : ''
    }
    try {
      applyUser(await getUserInfo())
    } catch (error) {
      const msg = error instanceof Error ? error.message : ''
      if (!msg.includes('其他地方登入')) {
        console.error(error)
        return
      }
      try {
        localStorage.removeItem('token')
        await bootstrapWorldcupAuth(loginUserForRelogin())
        applyUser(await getUserInfo())
      } catch (e) {
        console.error(e)
      }
    }
  }

  const formattedBalance = computed(() => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(balance.value)
  })

  async function deposit(amount: number) {
    isDepositing.value = true
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const targetBalance = balance.value + amount
    balance.value = targetBalance
    
    // Animate balance rolling
    const startBalance = balance.value
    const duration = 1000
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      balance.value = startBalance + (targetBalance - startBalance) * easeOutQuart
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        balance.value = targetBalance
        isDepositing.value = false
      }
    }
    
    requestAnimationFrame(animate)
  }

  function deductBalance(amount: number) {
    if (balance.value >= amount) {
      balance.value -= amount
      return true
    }
    return false
  }

  return {
    balance,
    isDepositing,
    username,
    userId,
    userAccount,
    phone,
    email,
    memberLevel,
    memberSinceRaw,
    betHistoryMenuBadge,
    formattedBalance,
    deposit,
    deductBalance,
    fetchUserInfo,
  }
})
