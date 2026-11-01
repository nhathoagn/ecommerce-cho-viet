<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const clock = ref('00:00:00')
let timer = 0

function tick() {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const ms = Math.max(0, end.getTime() - Date.now())
  const pad = (value: number) => String(Math.floor(value)).padStart(2, '0')
  clock.value = `${pad(ms / 3_600_000)}:${pad((ms % 3_600_000) / 60_000)}:${pad((ms % 60_000) / 1000)}`
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 1000)
})
onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <div class="band relative z-40 overflow-hidden">
      <div class="ribs absolute inset-0 opacity-70" aria-hidden="true" />
      <div class="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2 text-[12px] sm:px-5">
        <p class="flex min-w-0 items-center gap-2 truncate">
          <span class="bg-primary text-primary-foreground label-xs rounded-[3px] px-1.5 py-1">Flash</span>
          <span class="truncate">Freeship đơn 500k · mã <b class="text-accent">CHOVIET10</b> giảm 10%</span>
        </p>
        <p class="hidden shrink-0 items-center gap-1.5 sm:flex">
          <span class="label-xs opacity-60">Còn</span>
          <span v-for="(part, index) in clock.split(':')" :key="index" class="bg-background text-foreground num rounded-[3px] px-1.5 py-0.5 text-[11px] font-extrabold">{{ part }}</span>
        </p>
      </div>
    </div>

    <AppHeader />

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="band relative mt-16 overflow-hidden">
      <div class="ribs absolute inset-0" aria-hidden="true" />
      <div class="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-5">
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div class="grid gap-3">
            <RouterLink to="/" class="flex items-center gap-2.5">
              <span class="border-primary relative grid size-9 place-items-center rounded-full border-2 bg-[var(--band)]">
                <span class="border-primary/50 absolute inset-y-[4px] left-[11px] border-l" />
                <span class="border-primary/50 absolute inset-y-[4px] right-[11px] border-r" />
                <span class="text-sm leading-none font-extrabold">V</span>
              </span>
              <span class="font-display text-lg">Chợ Việt</span>
            </RouterLink>
            <p class="max-w-64 text-sm leading-relaxed opacity-70">Đồ Việt tuyển chọn từ làng nghề và vườn nhà. Giao 2 giờ ở Hà Nội và TP.HCM.</p>
          </div>
          <nav class="grid content-start gap-2 text-sm" aria-label="Khám phá">
            <strong class="label-xs opacity-55">Khám phá</strong>
            <RouterLink to="/products" class="opacity-80 hover:opacity-100">Tất cả sản phẩm</RouterLink>
            <RouterLink to="/cart" class="opacity-80 hover:opacity-100">Giỏ hàng</RouterLink>
            <RouterLink v-if="auth.isAuthenticated" to="/orders" class="opacity-80 hover:opacity-100">Đơn mua</RouterLink>
          </nav>
          <nav class="grid content-start gap-2 text-sm" aria-label="Nhà bán">
            <strong class="label-xs opacity-55">Nhà bán</strong>
            <RouterLink v-if="!auth.isAuthenticated" to="/register?role=seller" class="opacity-80 hover:opacity-100">Mở gian hàng</RouterLink>
            <RouterLink v-if="auth.isSeller" to="/seller" class="opacity-80 hover:opacity-100">Kênh bán</RouterLink>
            <RouterLink v-if="auth.isSeller" to="/seller/products" class="opacity-80 hover:opacity-100">Quản lý sản phẩm</RouterLink>
            <RouterLink v-if="auth.isSeller" to="/seller/orders" class="opacity-80 hover:opacity-100">Đơn bán</RouterLink>
          </nav>
          <nav class="grid content-start gap-2 text-sm" aria-label="Tài khoản">
            <strong class="label-xs opacity-55">Tài khoản</strong>
            <RouterLink v-if="auth.isAuthenticated" to="/profile" class="opacity-80 hover:opacity-100">Hồ sơ</RouterLink>
            <RouterLink v-if="!auth.isAuthenticated" to="/login" class="opacity-80 hover:opacity-100">Đăng nhập</RouterLink>
            <RouterLink v-if="!auth.isAuthenticated" to="/register" class="opacity-80 hover:opacity-100">Đăng ký</RouterLink>
          </nav>
        </div>
        <div class="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs opacity-60" style="border-color: var(--band-rule)">
          <span>© 2026 Chợ Việt · Đồ Việt, sáng đèn mỗi ngày</span>
          <BaseButton variant="on-band" size="sm" @click="scrollTop">Về đầu trang ↑</BaseButton>
        </div>
      </div>
    </footer>
  </div>
</template>
