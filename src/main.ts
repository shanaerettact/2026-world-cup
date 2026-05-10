import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router, { setAuthBootstrapFailed } from './router'
import App from './App.vue'
import { i18n } from './i18n'
// import { bootstrapTempTestLogin } from './services/api/tempLoginApi'
import {bootstrapWorldcupAuth} from './utils/request'
import { useUserStore } from './stores/userStore'
import './styles/main.css'
import 'remixicon/fonts/remixicon.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

const loginUser = import.meta.env.VITE_LOGIN_USER || 'user01'

function userProfileLooksLoaded(store: ReturnType<typeof useUserStore>): boolean {
  return (
    store.userId !== 0 ||
    Boolean(store.userAccount?.trim()) ||
    Boolean(store.username?.trim())
  )
}

window.addEventListener('worldcup:session-expired', () => {
  void router.replace({ name: 'login-failed' })
})

;(async () => {
  await router.isReady()
  try {
    // const { indexPayload } = await bootstrapTempTestLogin(loginUser)
    const indexPayload = await bootstrapWorldcupAuth(loginUser)
    const userStore = useUserStore(pinia)
    await userStore.fetchUserInfo(indexPayload)
    if (!userProfileLooksLoaded(userStore)) {
      throw new Error('user profile not loaded after bootstrap')
    }
  } catch (e) {
    console.error(e)
    setAuthBootstrapFailed(true)
    await router.replace({ name: 'login-failed' })
    app.mount('#app')
    return
  }
  setAuthBootstrapFailed(false)
  await router.replace({ name: 'home' })
  app.mount('#app')
})()
