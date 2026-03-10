import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue')
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
