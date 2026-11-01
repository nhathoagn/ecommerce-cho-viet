import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import SellerLayout from '../layouts/SellerLayout.vue'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guestOnly: true, title: 'Đăng nhập · Chợ Việt' } },
    { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue'), meta: { guestOnly: true, title: 'Đăng ký · Chợ Việt' } },
    // The seller channel is its own shell: no promo band, no category rail, no buyer footer.
    { path: '/seller', component: SellerLayout, meta: { requiresAuth: true, role: 'SELLER' }, children: [
      { path: '', name: 'seller-overview', component: () => import('../views/SellerOverviewView.vue'), meta: { title: 'Tổng quan · Kênh bán · Chợ Việt' } },
      { path: 'products', name: 'seller-products', component: () => import('../views/SellerProductsView.vue'), meta: { title: 'Sản phẩm · Kênh bán · Chợ Việt' } },
      { path: 'products/new', name: 'seller-product-new', component: () => import('../views/SellerProductFormView.vue'), meta: { title: 'Thêm sản phẩm · Kênh bán · Chợ Việt' } },
      { path: 'products/:id', name: 'seller-product-edit', component: () => import('../views/SellerProductFormView.vue'), meta: { title: 'Sửa sản phẩm · Kênh bán · Chợ Việt' } },
      { path: 'orders', name: 'seller-orders', component: () => import('../views/SellerOrdersView.vue'), meta: { title: 'Đơn bán · Kênh bán · Chợ Việt' } },
      { path: 'wallet', name: 'seller-wallet', component: () => import('../views/SellerWalletView.vue'), meta: { title: 'Ví · Kênh bán · Chợ Việt' } },
      { path: 'store', name: 'seller-store', component: () => import('../views/SellerStoreView.vue'), meta: { title: 'Cửa hàng · Kênh bán · Chợ Việt' } },
    ]},
    { path: '/', component: DefaultLayout, children: [
      { path: '', name: 'home', component: HomeView, meta: { title: 'Chợ Việt' } },
      { path: 'products', name: 'catalog', component: () => import('../views/CatalogView.vue'), meta: { title: 'Sản phẩm · Chợ Việt' } },
      { path: 'products/:slug', name: 'product-detail', component: () => import('../views/ProductDetailView.vue'), meta: { title: 'Sản phẩm · Chợ Việt' } },
      { path: 'cart', name: 'cart', component: () => import('../views/CartView.vue'), meta: { requiresAuth: true, title: 'Giỏ hàng · Chợ Việt' } },
      { path: 'checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue'), meta: { requiresAuth: true, title: 'Thanh toán · Chợ Việt' } },
      { path: 'orders', name: 'orders', component: () => import('../views/OrdersView.vue'), meta: { requiresAuth: true, title: 'Đơn hàng · Chợ Việt' } },
      { path: 'profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true, title: 'Hồ sơ · Chợ Việt' } },
      { path: 'payment/result', name: 'payment-result', component: () => import('../views/PaymentResultView.vue'), meta: { title: 'Kết quả thanh toán · Chợ Việt' } },
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

router.afterEach((to) => {
  document.title = typeof to.meta.title === 'string' ? to.meta.title : 'Chợ Việt'
})
export default router
