import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/seller',
      name: 'seller-dashboard',
      component: () => import('../views/SellerDashboardView.vue'),
      meta: { requiresAuth: true, role: 'SELLER' },
    },
    {
      path: '/payment/result',
      name: 'payment-result',
      component: () => import('../views/PaymentResultView.vue'),
    },
  ],
})

export default router
