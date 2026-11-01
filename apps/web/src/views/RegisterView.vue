<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseFieldError from '@/components/base/BaseFieldError.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseLabel from '@/components/base/BaseLabel.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import { email as emailRule, minLength, phoneVN, required, validate } from '@/lib/form'
import { sellerCatalogApi } from '@/modules/catalog/catalog.api'
import { messageOf, useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const role = ref<'BUYER' | 'SELLER'>(route.query.role === 'seller' ? 'SELLER' : 'BUYER')
const accepted = ref(false)
const form = reactive({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', storeName: '' })
const errors = ref<Record<string, string>>({})

const termsRule = () => (accepted.value ? '' : 'Đồng ý với điều khoản để tiếp tục.')
const confirmRule = (value: string) =>
  !value ? 'Nhập lại mật khẩu.' : value === form.password ? '' : 'Mật khẩu xác nhận chưa khớp.'

function clear(field: string) {
  delete errors.value[field]
}

watch(accepted, (value) => value && clear('terms'))

const roles = [
  { value: 'BUYER' as const, label: 'Tôi muốn mua hàng', hint: 'Đặt hàng, theo dõi đơn' },
  { value: 'SELLER' as const, label: 'Tôi muốn bán hàng', hint: 'Mở gian hàng riêng' },
]

watch(role, (value) => router.replace({ query: value === 'SELLER' ? { role: 'seller' } : {} }))

async function submit() {
  errors.value = validate({
    fullName: [form.fullName, [required('họ tên')]],
    phone: [form.phone, [required('số điện thoại'), phoneVN()]],
    email: [form.email, [required('email'), emailRule()]],
    storeName: [form.storeName, role.value === 'SELLER' ? [required('tên gian hàng')] : []],
    password: [form.password, [required('mật khẩu'), minLength(8)]],
    confirmPassword: [form.confirmPassword, [confirmRule]],
    terms: ['', [termsRule]],
  })
  const first = Object.keys(errors.value)[0]
  if (first) {
    document.getElementById(first)?.focus()
    return
  }
  try {
    await auth.register({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: role.value,
    })
    if (role.value === 'SELLER') {
      try {
        await sellerCatalogApi.createStore({ name: form.storeName.trim() })
      } catch (reason) {
        router.replace({ path: '/seller', query: { storeError: messageOf(reason), storeName: form.storeName.trim() } })
        return
      }
    }
    router.replace(role.value === 'SELLER' ? '/seller' : '/')
  } catch { /* Store renders API error. */ }
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
        <p class="label-xs text-primary">Gia nhập cộng đồng</p>
        <h1 class="font-display mt-2 text-[32px] sm:text-[32px]">Đăng ký Chợ Việt</h1>
        <p class="text-muted-foreground mt-2 text-sm">
          Đã có tài khoản?
          <RouterLink class="text-primary font-semibold underline underline-offset-4" to="/login">Đăng nhập</RouterLink>
        </p>

        <form class="mt-6 grid gap-4" novalidate @submit.prevent="submit">
          <fieldset class="grid gap-1.5">
            <legend class="label-xs text-muted-foreground mb-1.5">Bạn tham gia với vai trò</legend>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="option in roles"
                :key="option.value"
                class="border-rule bg-paper-sunk flex cursor-pointer flex-col gap-1 rounded-[var(--radius)] border p-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/35 has-[:focus-visible]:outline-none"
                :class="role === option.value && 'border-primary bg-paper'"
              >
                <input v-model="role" type="radio" name="role" :value="option.value" class="peer sr-only" />
                <span class="flex items-center gap-2">
                  <span
                    class="grid size-4 shrink-0 place-items-center rounded-full border transition"
                    :class="role === option.value ? 'border-primary' : 'border-rule-strong'"
                    aria-hidden="true"
                  >
                    <span v-if="role === option.value" class="bg-primary size-2 rounded-full" />
                  </span>
                  <span class="text-[13px] leading-tight font-semibold">{{ option.label }}</span>
                </span>
                <span class="text-muted-foreground pl-6 text-[11px] leading-tight">{{ option.hint }}</span>
              </label>
            </div>
          </fieldset>

          <BaseNote v-if="auth.error" tone="bad">{{ auth.error }}</BaseNote>

          <div class="grid gap-1.5">
            <BaseLabel for="fullName" required>Họ và tên</BaseLabel>
            <BaseInput
              id="fullName"
              v-model.trim="form.fullName"
              autocomplete="name"
              placeholder="Nguyễn Văn An"
              :invalid="!!errors.fullName"
              required
              @input="clear('fullName')"
            />
            <BaseFieldError :message="errors.fullName" />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="phone" required>Số điện thoại</BaseLabel>
            <BaseInput
              id="phone"
              v-model.trim="form.phone"
              type="tel"
              autocomplete="tel"
              placeholder="09xx xxx xxx"
              :invalid="!!errors.phone"
              required
              @input="clear('phone')"
            />
            <BaseFieldError :message="errors.phone" />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="email" required>Email</BaseLabel>
            <BaseInput
              id="email"
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              placeholder="ban@email.com"
              :invalid="!!errors.email"
              required
              @input="clear('email')"
            />
            <BaseFieldError :message="errors.email" />
          </div>
          <div v-if="role === 'SELLER'" class="grid gap-1.5">
            <BaseLabel for="storeName" required>Tên gian hàng</BaseLabel>
            <BaseInput
              id="storeName"
              v-model.trim="form.storeName"
              placeholder="Gian hàng của bạn"
              :invalid="!!errors.storeName"
              required
              @input="clear('storeName')"
            />
            <BaseFieldError :message="errors.storeName" />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="password" required>Mật khẩu</BaseLabel>
            <BaseInput
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
              :invalid="!!errors.password"
              required
              @input="clear('password')"
            />
            <BaseFieldError :message="errors.password" />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="confirmPassword" required>Xác nhận mật khẩu</BaseLabel>
            <BaseInput
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="Nhập lại mật khẩu"
              :invalid="!!errors.confirmPassword"
              required
              @input="clear('confirmPassword')"
            />
            <BaseFieldError :message="errors.confirmPassword" />
          </div>

          <div class="grid gap-1">
            <BaseCheckbox id="terms" v-model="accepted" label="Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật" />
            <BaseFieldError :message="errors.terms" />
          </div>

          <BaseButton type="submit" variant="primary" size="lg" block :loading="auth.loading">
            Đăng ký {{ role === 'SELLER' ? 'bán hàng' : 'mua hàng' }}
          </BaseButton>
        </form>
      </div>

      <p class="label-xs mt-6 text-center opacity-55">Hàng Việt · giao tươi 2 giờ · freeship 500k</p>
    </div>
  </div>
</template>
