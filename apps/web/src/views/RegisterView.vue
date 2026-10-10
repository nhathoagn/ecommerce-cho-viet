<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute(), router = useRouter(), auth = useAuthStore()
const role = ref<'BUYER' | 'SELLER'>(route.query.role === 'seller' ? 'SELLER' : 'BUYER')
const accepted = ref(false)
const form = reactive({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', storeName: '' })
const validationError = ref('')
watch(role, (value) => router.replace({ query: value === 'SELLER' ? { role: 'seller' } : {} }))
async function submit() {
  validationError.value = ''
  if (form.password !== form.confirmPassword) { validationError.value = 'Mật khẩu xác nhận chưa khớp.'; return }
  if (!accepted.value) { validationError.value = 'Vui lòng đồng ý với điều khoản sử dụng.'; return }
  try {
    await auth.register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password, role: role.value, storeName: role.value === 'SELLER' ? form.storeName : undefined })
    router.replace(role.value === 'SELLER' ? '/seller' : '/')
  } catch { /* Store renders API error. */ }
}
</script>
<template>
  <div class="auth-page register-page">
    <section class="auth-promo"><RouterLink to="/" class="brand brand-light"><span class="brand-mark">V</span><span>Chợ Việt</span></RouterLink><div><span class="eyebrow-light">GIA NHẬP CỘNG ĐỒNG</span><h1>Bắt đầu hành trình<br />cùng Chợ Việt.</h1><p>Dù bạn muốn mua sắm hay phát triển kinh doanh, Chợ Việt luôn đồng hành.</p><ul class="benefit-list"><li>✓ Tiếp cận hàng nghìn sản phẩm Việt</li><li>✓ Mở gian hàng nhanh chóng, dễ dàng</li><li>✓ Hỗ trợ tận tâm từ đội ngũ Chợ Việt</li></ul></div></section>
    <section class="auth-panel"><form class="auth-card register-card" @submit.prevent="submit"><div><span class="eyebrow">TẠO TÀI KHOẢN</span><h2>Đăng ký Chợ Việt</h2><p>Đã có tài khoản? <RouterLink to="/login">Đăng nhập</RouterLink></p></div><div class="role-tabs"><button type="button" :class="{ active: role === 'BUYER' }" @click="role = 'BUYER'">🛍️ Tôi muốn mua hàng</button><button type="button" :class="{ active: role === 'SELLER' }" @click="role = 'SELLER'">🏪 Tôi muốn bán hàng</button></div><p v-if="validationError || auth.error" class="form-error">{{ validationError || auth.error }}</p><div class="form-grid"><label>Họ và tên<input v-model.trim="form.fullName" required placeholder="Nguyễn Văn An" /></label><label>Số điện thoại<input v-model.trim="form.phone" type="tel" required placeholder="09xx xxx xxx" /></label></div><label>Email<input v-model.trim="form.email" type="email" required placeholder="ban@email.com" /></label><label v-if="role === 'SELLER'">Tên gian hàng<input v-model.trim="form.storeName" required placeholder="Gian hàng của bạn" /></label><div class="form-grid"><label>Mật khẩu<input v-model="form.password" type="password" minlength="8" required placeholder="Tối thiểu 8 ký tự" /></label><label>Xác nhận mật khẩu<input v-model="form.confirmPassword" type="password" minlength="8" required placeholder="Nhập lại mật khẩu" /></label></div><label class="check terms"><input v-model="accepted" type="checkbox" /> Tôi đồng ý với <a href="#">Điều khoản sử dụng</a> và <a href="#">Chính sách bảo mật</a></label><button class="primary-button" :disabled="auth.loading">{{ auth.loading ? 'Đang tạo tài khoản...' : `Đăng ký ${role === 'SELLER' ? 'bán hàng' : 'mua hàng'}` }}</button></form></section>
  </div>
</template>
