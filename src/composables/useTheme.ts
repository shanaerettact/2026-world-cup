import { ref, watch, onMounted } from 'vue'

type Theme = 'light' | 'dark'

const theme = ref<Theme>('dark')

export function useTheme() {
  const initTheme = () => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      theme.value = stored
    } else {
      theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    applyTheme()
  }

  const applyTheme = () => {
    const root = document.documentElement
    if (theme.value === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', theme.value)
    applyTheme()
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme()
  }

  onMounted(() => {
    initTheme()
  })

  watch(theme, applyTheme)

  return {
    theme,
    toggleTheme,
    setTheme,
    initTheme
  }
}
