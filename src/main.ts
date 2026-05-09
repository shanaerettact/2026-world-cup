import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
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

window.addEventListener('worldcup:session-expired', () => {
  void router.replace({ name: 'login-failed' })
})

;(async () => {
  await router.isReady()
  try {
    // const { indexPayload } = await bootstrapTempTestLogin(loginUser)
    const indexPayload = await bootstrapWorldcupAuth(loginUser)
    await useUserStore(pinia).fetchUserInfo(indexPayload)
  } catch (e) {
    console.error(e)
    app.mount('#app')
    void router.replace({ name: 'login-failed' })
    return
  }
  app.mount('#app')
  await router.replace({ name: 'home' })
})()
