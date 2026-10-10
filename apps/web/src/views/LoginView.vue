<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({ email: '', password: '' })

async function submit() {
  try {
    await auth.login(form)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : (auth.isSeller ? '/seller' : '/')
    router.replace(redirect)
  } catch { /* Error is rendered by the store. */ }
}
</script>
<template>
  <div class="auth-page">
    <section class="auth-promo"><RouterLink to="/" class="brand brand-light"><span class="brand-mark">V</span><span>Chợ Việt</span></RouterLink><div><span class="eyebrow-light">Chào mừng trở lại</span><h1>Mua sắm hàng Việt<br />thật dễ dàng.</h1><p>Khám phá hàng nghìn sản phẩm chất lượng từ các nhà bán uy tín trên khắp Việt Nam.</p></div><div class="trust-row"><span>✓ Thanh toán an toàn</span><span>✓ Giao hàng toàn quốc</span></div></section>
    <section class="auth-panel"><form class="auth-card" @submit.prevent="submit"><div><span class="eyebrow">TÀI KHOẢN CỦA BẠN</span><h2>Đăng nhập</h2><p>Chưa có tài khoản? <RouterLink to="/register">Đăng ký miễn phí</RouterLink></p></div><p v-if="auth.error" class="form-error">{{ auth.error }}</p><label>Email<input v-model.trim="form.email" type="email" required autocomplete="email" placeholder="ban@email.com" /></label><label>Mật khẩu<input v-model="form.password" type="password" minlength="6" required autocomplete="current-password" placeholder="Nhập mật khẩu" /></label><div class="form-meta"><label class="check"><input type="checkbox" /> Ghi nhớ đăng nhập</label><a href="#">Quên mật khẩu?</a></div><button class="primary-button" :disabled="auth.loading">{{ auth.loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</button><div class="divider"><span>hoặc</span></div><div class="social-buttons"><button type="button">G Google</button><button type="button">f Facebook</button></div></form></section>
  </div>
</template>
