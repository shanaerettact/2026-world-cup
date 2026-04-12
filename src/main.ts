import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { i18n } from './i18n'
import { bootstrapWorldcupAuth } from './utils/request'
import './styles/main.css'
import 'remixicon/fonts/remixicon.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

const loginUser = import.meta.env.VITE_LOGIN_USER || 'user01'

window.addEventListener('worldcup:session-expired', () => {
  void router.replace({ name: 'session-expired' })
})

;(async () => {
  try {
    await bootstrapWorldcupAuth(loginUser)
    // await useUserStore(pinia).fetchUserInfo()
  } catch (e) {
    console.error(e)
  }
  await router.isReady()
  app.mount('#app')
  await router.replace({ name: 'home' })
})()
