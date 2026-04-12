import { defineComponent, h, ref } from 'vue'
import { createRouter, createWebHashHistory, useRouter } from 'vue-router'
import { bootstrapWorldcupAuth } from '@/utils/request'

const loginUserForBootstrap = () => import.meta.env.VITE_LOGIN_USER || 'user01'

const SessionExpiredPage = defineComponent({
  name: 'SessionExpiredPage',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const err = ref('')
    async function relogin() {
      loading.value = true
      err.value = ''
      try {
        await bootstrapWorldcupAuth(loginUserForBootstrap())
        await router.replace({ name: 'home' })
      } catch (e) {
        err.value = e instanceof Error ? e.message : '登入失敗'
      } finally {
        loading.value = false
      }
    }
    return () =>
      h(
        'div',
        {
          class:
            'min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-[var(--color-bg)] text-[var(--color-text)]',
        },
        [
          h('h1', { class: 'text-xl font-semibold' }, '登入已失效'),
          h(
            'p',
            { class: 'text-sm text-[var(--color-muted)] text-center max-w-sm' },
            '登入狀態已過期或無效，請重新登入以繼續使用。'
          ),
          // h(
          //   'button',
          //   {
          //     type: 'button',
          //     class:
          //       'px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 active:scale-[0.98]',
          //     disabled: loading.value,
          //     onClick: () => {
          //       void relogin()
          //     },
          //   },
          //   loading.value ? '登入中…' : '重新登入'
          // ),
          err.value ? h('p', { class: 'text-sm text-danger' }, err.value) : null,
        ].filter(Boolean)
      )
  },
})

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue')
    },
    {
      path: '/session-expired',
      name: 'session-expired',
      component: SessionExpiredPage,
    },
    {
      path: '/live',
      name: 'live',
      component: () => import('@/pages/BetHistoryPage.vue')
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/pages/AccountPage.vue')
    }
  ]
})

export default router
