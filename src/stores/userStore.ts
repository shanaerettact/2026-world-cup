import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const balance = ref(8000)
  const displayBalance = ref(8000)
  const isDepositing = ref(false)
  const username = ref('JohnDoe')
  const avatar = ref('#4e80ee')
  const memberSince = ref('Jan 2024')
  const totalBets = ref(147)
  const winRate = ref(62)

  const formattedBalance = computed(() => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(displayBalance.value)
  })

  async function deposit(amount: number) {
    isDepositing.value = true
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const targetBalance = balance.value + amount
    balance.value = targetBalance
    
    // Animate balance rolling
    const startBalance = displayBalance.value
    const duration = 1000
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      displayBalance.value = startBalance + (targetBalance - startBalance) * easeOutQuart
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        displayBalance.value = targetBalance
        isDepositing.value = false
      }
    }
    
    requestAnimationFrame(animate)
  }

  function deductBalance(amount: number) {
    if (balance.value >= amount) {
      balance.value -= amount
      displayBalance.value = balance.value
      return true
    }
    return false
  }

  return {
    balance,
    displayBalance,
    isDepositing,
    username,
    avatar,
    memberSince,
    totalBets,
    winRate,
    formattedBalance,
    deposit,
    deductBalance
  }
})
