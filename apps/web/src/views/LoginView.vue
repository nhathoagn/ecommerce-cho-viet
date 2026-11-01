<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DsButton from '@/components/ds/DsButton.vue'
import DsFieldError from '@/components/ds/DsFieldError.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsNote from '@/components/ds/DsNote.vue'
import { email as emailRule, required, validate } from '@/lib/form'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({ email: '', password: '' })
const errors = ref<Record<string, string>>({})

function clear(field: string) {
  delete errors.value[field]
}

async function submit() {
  errors.value = validate({
    email: [form.email, [required('email'), emailRule()]],
    password: [form.password, [required('mật khẩu')]],
  })
  const first = Object.keys(errors.value)[0]
  if (first) {
    document.getElementById(first)?.focus()
    return
  }
  try {
    await auth.login(form)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : (auth.isSeller ? '/seller' : '/')
    router.replace(redirect)
  } catch { /* Error is rendered by the store. */ }
}
</script>

<template>
  <div class="band relative grid min-h-svh place-items-center overflow-hidden px-4 py-12">
    <div class="ribs absolute inset-0" aria-hidden="true" />
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,var(--lamp-soft),transparent_62%)]" aria-hidden="true" />

    <div class="relative w-full max-w-md">
      <RouterLink to="/" class="mb-6 flex items-center justify-center gap-2.5">
        <span class="border-primary relative grid size-9 place-items-center rounded-full border-2 bg-band">
          <span class="border-primary/50 absolute inset-y-[4px] left-[11px] border-l" />
          <span class="border-primary/50 absolute inset-y-[4px] right-[11px] border-r" />
          <span class="text-sm leading-none font-extrabold">V</span>
        </span>
        <span class="font-display text-lg">Chợ Việt</span>
      </RouterLink>

      <div class="slip lit p-6 sm:p-7">
        <p class="label-xs text-primary">Chào mừng trở lại</p>
        <h1 class="font-display mt-2 text-[32px] sm:text-[40px]">Đăng nhập</h1>
        <p class="text-muted-foreground mt-2 text-sm">
          Chưa có tài khoản?
          <RouterLink class="text-primary font-semibold underline underline-offset-4" to="/register">Đăng ký miễn phí</RouterLink>
        </p>
        <p v-if="route.query.redirect" class="text-muted-foreground mt-1 text-xs">Đăng nhập để tiếp tục.</p>

        <form class="mt-6 grid gap-4" novalidate @submit.prevent="submit">
          <DsNote v-if="auth.error" tone="bad">{{ auth.error }}</DsNote>
          <div class="grid gap-1.5">
            <DsLabel for="email" required>Email</DsLabel>
            <DsInput
              id="email"
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              placeholder="ban@email.com"
              :invalid="!!errors.email"
              required
              @input="clear('email')"
            />
            <DsFieldError :message="errors.email" />
          </div>
          <div class="grid gap-1.5">
            <DsLabel for="password" required>Mật khẩu</DsLabel>
            <DsInput
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              placeholder="Nhập mật khẩu"
              :invalid="!!errors.password"
              required
              @input="clear('password')"
            />
            <DsFieldError :message="errors.password" />
          </div>
          <DsButton type="submit" variant="primary" size="lg" block :loading="auth.loading">Đăng nhập</DsButton>
        </form>
      </div>

      <p class="label-xs mt-6 text-center opacity-55">Hàng Việt · giao tươi 2 giờ · freeship 500k</p>
    </div>
  </div>
</template>
