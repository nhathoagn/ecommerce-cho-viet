<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usersApi, type Address, type AddressPayload } from '@/api/users'
import DsAvatar from '@/components/ds/DsAvatar.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsCheckbox from '@/components/ds/DsCheckbox.vue'
import DsDialog from '@/components/ds/DsDialog.vue'
import DsEmpty from '@/components/ds/DsEmpty.vue'
import DsFieldError from '@/components/ds/DsFieldError.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsNote from '@/components/ds/DsNote.vue'
import DsPill from '@/components/ds/DsPill.vue'
import DsSkeleton from '@/components/ds/DsSkeleton.vue'
import { phoneVN, required, validate } from '@/lib/form'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const addresses = ref<Address[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const notice = ref('')
const profileErrors = ref<Record<string, string>>({})
const hash = computed(() => route.hash || '#account')
const profile = reactive({ fullName: auth.user?.fullName ?? '', phone: auth.user?.phone ?? '' })
const emptyAddress = (): AddressPayload => ({
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  street: '',
  label: 'Nhà riêng',
  isDefault: false,
})
const addressForm = reactive<AddressPayload>(emptyAddress())
const addressErrors = ref<Record<string, string>>({})

function clearAddressError(field: string) {
  delete addressErrors.value[field]
}

onMounted(async () => {
  try { addresses.value = await usersApi.getAddresses() }
  finally { loading.value = false }
})

function clearProfileError(field: string) {
  delete profileErrors.value[field]
}

async function saveProfile() {
  profileErrors.value = validate({
    fullName: [profile.fullName ?? '', [required('họ và tên')]],
    phone: [profile.phone ?? '', [phoneVN()]],
  })
  if (Object.keys(profileErrors.value).length) {
    document.getElementById(Object.keys(profileErrors.value)[0]!)?.focus()
    return
  }
  const user = await usersApi.updateProfile(profile)
  auth.setUser({ ...auth.user!, ...user })
  notice.value = 'Đã cập nhật hồ sơ.'
}

function openAddress(item?: Address) {
  Object.assign(addressForm, item ?? emptyAddress())
  addressErrors.value = {}
  editingId.value = item?.id ?? null
  showForm.value = true
}

async function saveAddress() {
  const errors = validate({
    recipientName: [addressForm.recipientName ?? '', [required('tên người nhận')]],
    addressPhone: [addressForm.phone ?? '', [required('số điện thoại'), phoneVN()]],
    street: [addressForm.street ?? '', [required('địa chỉ')]],
    district: [addressForm.district ?? '', [required('quận/huyện')]],
    province: [addressForm.province ?? '', [required('tỉnh/thành')]],
  })
  addressErrors.value = errors
  const firstInvalid = Object.keys(errors)[0]
  if (firstInvalid) {
    document.getElementById(firstInvalid)?.focus()
    return
  }
  const item = editingId.value
    ? await usersApi.updateAddress(editingId.value, addressForm)
    : await usersApi.createAddress(addressForm)
  const index = addresses.value.findIndex((address) => address.id === item.id)
  if (index >= 0) addresses.value[index] = item
  else addresses.value.push(item)
  showForm.value = false
}

async function removeAddress(id: string) {
  if (!confirm('Xóa địa chỉ này?')) return
  await usersApi.deleteAddress(id)
  addresses.value = addresses.value.filter((address) => address.id !== id)
}

async function setDefault(id: string) {
  await usersApi.setDefaultAddress(id)
  addresses.value = addresses.value.map((address) => ({ ...address, isDefault: address.id === id }))
}
</script>

<template>
  <div class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-5 lg:grid-cols-[220px_1fr] lg:items-start">
    <aside class="lg:sticky lg:top-24">
      <div class="flex items-center gap-3 pb-4">
        <DsAvatar size="lg" :name="auth.user?.fullName" />
        <div class="min-w-0">
          <strong class="block truncate text-[15px]">{{ auth.user?.fullName }}</strong>
          <small class="text-muted-foreground block truncate text-xs">{{ auth.user?.email }}</small>
        </div>
      </div>

      <nav class="grid text-sm" aria-label="Mục hồ sơ">
        <a
          href="#account"
          class="border-rule border-t border-b-2 border-b-transparent px-3 py-2.5 transition"
          :class="hash === '#account' ? 'text-primary border-b-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
        >Tài khoản</a>
        <a
          href="#addresses"
          class="border-rule border-t border-b-2 border-b-transparent px-3 py-2.5 transition"
          :class="hash === '#addresses' ? 'text-primary border-b-primary font-bold' : 'text-muted-foreground hover:text-foreground'"
        >Địa chỉ</a>
        <RouterLink class="border-rule text-muted-foreground hover:text-foreground border-t border-b-2 border-b-transparent px-3 py-2.5" to="/orders">Đơn mua</RouterLink>
      </nav>
    </aside>

    <div class="grid gap-6">
      <section id="account" class="slip p-5 scroll-mt-24 sm:p-6">
        <p class="label-xs text-primary">Tài khoản</p>
        <h2 class="mt-2 text-[24px] sm:text-[28px]">Hồ sơ cá nhân</h2>
        <p class="text-muted-foreground mt-1 text-sm">Quản lý thông tin liên hệ của bạn.</p>

        <DsNote v-if="notice" tone="ok" class="mt-4">{{ notice }}</DsNote>

        <form class="mt-5 grid max-w-xl gap-4" novalidate @submit.prevent="saveProfile">
          <div class="grid gap-1.5">
            <DsLabel for="fullName" required>Họ và tên</DsLabel>
            <DsInput id="fullName" v-model="profile.fullName" autocomplete="name" :invalid="!!profileErrors.fullName" @input="clearProfileError('fullName')" />
            <DsFieldError :message="profileErrors.fullName" />
          </div>
          <div class="grid gap-1.5">
            <DsLabel for="phone">Số điện thoại</DsLabel>
            <DsInput id="phone" v-model="profile.phone" type="tel" autocomplete="tel" :invalid="!!profileErrors.phone" @input="clearProfileError('phone')" />
            <DsFieldError :message="profileErrors.phone" />
          </div>
          <div class="grid gap-1.5">
            <DsLabel for="email">Email</DsLabel>
            <DsInput id="email" :model-value="auth.user?.email" disabled class="opacity-70" />
            <small class="text-muted-foreground text-xs">Email không thể thay đổi</small>
          </div>
          <DsButton type="submit" variant="primary" class="w-fit">Lưu thay đổi</DsButton>
        </form>
      </section>

      <section id="addresses" class="slip p-5 scroll-mt-24 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="label-xs text-primary">Giao hàng</p>
            <h2 class="mt-2 text-[24px] sm:text-[28px]">Địa chỉ của tôi</h2>
            <p class="text-muted-foreground mt-1 text-sm">Địa chỉ dùng để nhận hàng.</p>
          </div>
          <DsButton variant="outline" size="sm" @click="openAddress()">Thêm địa chỉ</DsButton>
        </div>

        <div class="mt-5 grid gap-3">
          <DsSkeleton v-if="loading" class="h-24" />
          <DsEmpty v-else-if="!addresses.length">
            <p class="text-lg font-bold">Chưa có địa chỉ</p>
            <p class="text-muted-foreground text-sm">Thêm địa chỉ để đặt hàng nhanh hơn.</p>
          </DsEmpty>

          <template v-else>
          <article
            v-for="address in addresses"
            :key="address.id"
            class="border-rule bg-paper flex flex-col justify-between gap-3 rounded-[var(--radius)] border p-4 sm:flex-row sm:items-start"
            :class="address.isDefault && 'lit'"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <strong class="text-[15px]">{{ address.recipientName }}</strong>
                <span class="num text-muted-foreground text-[13px]">{{ address.phone }}</span>
                <DsPill v-if="address.isDefault" tone="ok">Mặc định</DsPill>
              </div>
              <p class="text-muted-foreground mt-1 text-sm leading-relaxed">
                {{ address.street }}, {{ address.ward }}, {{ address.district }}, {{ address.province }}
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-1">
              <DsButton type="button" variant="quiet" size="sm" @click="openAddress(address)">Sửa</DsButton>
              <DsButton v-if="!address.isDefault" type="button" variant="quiet" size="sm" @click="setDefault(address.id)">Đặt mặc định</DsButton>
              <DsButton type="button" variant="quiet" size="sm" class="hover:text-bad" @click="removeAddress(address.id)">Xóa</DsButton>
            </div>
          </article>
          </template>
        </div>
      </section>
    </div>

    <DsDialog v-model:open="showForm">
      <form class="grid gap-4" novalidate @submit.prevent="saveAddress">
        <div>
          <p class="label-xs text-primary">Địa chỉ nhận hàng</p>
          <h2 class="mt-2 text-[20px]">{{ editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ' }}</h2>
          <p class="text-muted-foreground mt-1 text-sm">Nhập thông tin người nhận và nơi giao hàng.</p>
        </div>
        <div class="grid gap-1.5">
          <DsLabel for="recipientName" required>Người nhận</DsLabel>
          <DsInput
            id="recipientName"
            v-model="addressForm.recipientName"
            :invalid="!!addressErrors.recipientName"
            required
            @input="clearAddressError('recipientName')"
          />
          <DsFieldError :message="addressErrors.recipientName" />
        </div>
        <div class="grid gap-1.5">
          <DsLabel for="addressPhone" required>Số điện thoại</DsLabel>
          <DsInput
            id="addressPhone"
            v-model="addressForm.phone"
            type="tel"
            :invalid="!!addressErrors.addressPhone"
            required
            @input="clearAddressError('addressPhone')"
          />
          <DsFieldError :message="addressErrors.addressPhone" />
        </div>
        <div class="grid gap-1.5">
          <DsLabel for="street" required>Địa chỉ cụ thể</DsLabel>
          <DsInput id="street" v-model="addressForm.street" :invalid="!!addressErrors.street" required @input="clearAddressError('street')" />
          <DsFieldError :message="addressErrors.street" />
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="grid gap-1.5">
            <DsLabel for="ward">Phường / Xã</DsLabel>
            <DsInput id="ward" v-model="addressForm.ward" required />
          </div>
          <div class="grid gap-1.5">
            <DsLabel for="district" required>Quận / Huyện</DsLabel>
            <DsInput id="district" v-model="addressForm.district" :invalid="!!addressErrors.district" required @input="clearAddressError('district')" />
            <DsFieldError :message="addressErrors.district" />
          </div>
          <div class="grid gap-1.5">
            <DsLabel for="province" required>Tỉnh / Thành phố</DsLabel>
            <DsInput id="province" v-model="addressForm.province" :invalid="!!addressErrors.province" required @input="clearAddressError('province')" />
            <DsFieldError :message="addressErrors.province" />
          </div>
        </div>
        <div class="grid gap-1.5">
          <DsLabel for="label">Nhãn địa chỉ</DsLabel>
          <DsInput id="label" v-model="addressForm.label" placeholder="Nhà riêng, Văn phòng…" />
        </div>
        <DsCheckbox id="isDefault" v-model="addressForm.isDefault" label="Đặt làm địa chỉ mặc định" />
        <div class="border-rule flex justify-end gap-2 border-t pt-4">
          <DsButton type="button" variant="outline" @click="showForm = false">Hủy</DsButton>
          <DsButton type="submit" variant="primary">Lưu địa chỉ</DsButton>
        </div>
      </form>
    </DsDialog>
  </div>
</template>
