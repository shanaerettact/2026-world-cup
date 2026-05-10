import { createRouter, createWebHashHistory } from 'vue-router'

let authBootstrapFailed = false

export function setAuthBootstrapFailed(value: boolean) {
  authBootstrapFailed = value
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue')
    },
    {
      path: '/login-failed',
      name: 'login-failed',
      meta: { standalone: true },
      component: () => import('@/layouts/LoginFailedPage.vue'),
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

router.beforeEach((to) => {
  if (authBootstrapFailed && to.name !== 'login-failed') {
    return { name: 'login-failed', replace: true }
  }
})

export default router
