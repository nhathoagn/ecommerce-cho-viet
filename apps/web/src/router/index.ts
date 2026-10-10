import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue'), meta: { guestOnly: true } },
    { path: '/', component: DefaultLayout, children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'products', name: 'catalog', component: () => import('../views/CatalogView.vue') },
      { path: 'products/:slug', name: 'product-detail', component: () => import('../views/ProductDetailView.vue') },
      { path: 'profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
      { path: 'seller', name: 'seller-dashboard', component: () => import('../views/SellerDashboardView.vue'), meta: { requiresAuth: true, role: 'SELLER' } },
      { path: 'payment/result', name: 'payment-result', component: () => import('../views/PaymentResultView.vue') },
    ]},
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'home' }
  if (to.meta.role && auth.user?.role !== to.meta.role) return { name: 'home' }
})

export default router
