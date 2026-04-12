import { defineComponent, h } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

const SessionExpiredPage = defineComponent({
  name: 'SessionExpiredPage',
  setup() {
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
        ]
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
