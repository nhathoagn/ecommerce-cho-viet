<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const mobileOpen = ref(false)
const search = ref('')

function submitSearch() {
  if (search.value.trim()) router.push({ path: '/', query: { q: search.value.trim() } })
}
async function signOut() { await auth.logout(); router.push('/') }
</script>

<template>
  <header class="site-header">
    <div class="header-top">
      <div class="container header-row">
        <RouterLink to="/" class="brand" aria-label="Chợ Việt trang chủ">
          <span class="brand-mark">V</span><span>Chợ Việt</span>
        </RouterLink>
        <form class="search" @submit.prevent="submitSearch">
          <input v-model="search" aria-label="Tìm kiếm" placeholder="Tìm sản phẩm, cửa hàng..." />
          <button aria-label="Tìm kiếm">⌕</button>
        </form>
        <button class="mobile-toggle" aria-label="Mở menu" @click="mobileOpen = !mobileOpen">☰</button>
        <nav :class="['header-actions', { open: mobileOpen }]">
          <RouterLink to="/" class="nav-icon">🛒 <span>Giỏ hàng</span></RouterLink>
          <template v-if="auth.isAuthenticated">
            <RouterLink v-if="auth.isSeller" to="/seller" class="nav-icon">🏪 <span>Kênh bán</span></RouterLink>
            <RouterLink to="/profile" class="user-link">
              <span class="avatar">{{ auth.user?.fullName?.charAt(0).toUpperCase() || 'U' }}</span>
              <span>{{ auth.user?.fullName || 'Tài khoản' }}</span>
            </RouterLink>
            <button class="link-button" @click="signOut">Đăng xuất</button>
          </template>
          <template v-else>
            <RouterLink to="/login">Đăng nhập</RouterLink>
            <RouterLink to="/register" class="header-register">Đăng ký</RouterLink>
          </template>
        </nav>
      </div>
    </div>
    <div class="category-bar">
      <div class="container categories">
        <span>☷ Danh mục</span><a href="#noi-bat">Hàng Việt nổi bật</a><a href="#san-pham">Sản phẩm mới</a><a href="#uu-dai">Ưu đãi hôm nay</a><a href="#stores">Gian hàng uy tín</a>
      </div>
    </div>
  </header>
</template>
