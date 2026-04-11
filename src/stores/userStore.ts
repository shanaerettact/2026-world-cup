import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo } from '@/services/api/userApi'
import { bootstrapWorldcupAuth } from '@/utils/request'

const loginUserForRelogin = () =>
  import.meta.env.VITE_LOGIN_USER || 'user01'

export const useUserStore = defineStore('user', () => {
  const balance = ref(8000)
  const isDepositing = ref(false)
  const username = ref('')

  const userAccount = ref<any>(null)
  const userId = ref<number>(0)
  const fetchUserInfo = async () => {
    const applyUser = (res: any) => {
      const user = res?.user
      if (user?.id != null) userId.value = Number(user.id)
      if (user?.account != null) userAccount.value = user.account
      if (user?.balance != null) {
        balance.value = Number(user.balance)
      }
      if (user?.name != null) username.value = user.name
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
    formattedBalance,
    deposit,
    deductBalance,
    fetchUserInfo,
  }
})
