<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usersApi, type Address, type AddressPayload } from '@/api/users'
import BaseAvatar from '@/components/base/BaseAvatar.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseEmpty from '@/components/base/BaseEmpty.vue'
import BaseFieldError from '@/components/base/BaseFieldError.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseLabel from '@/components/base/BaseLabel.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import BasePill from '@/components/base/BasePill.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import { phoneVN, required, validate } from '@/lib/form'
import { messageOf, useAuthStore } from '@/stores/auth'

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

const addressesError = ref('')
const addressError = ref('')
const removingId = ref('')
const showRemove = ref(false)

async function loadAddresses() {
  addressesError.value = ''
  try { addresses.value = await usersApi.getAddresses() }
  catch (reason) { addressesError.value = messageOf(reason) }
  finally { loading.value = false }
}
onMounted(loadAddresses)

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
  addressError.value = ''
  try {
    const item = editingId.value
      ? await usersApi.updateAddress(editingId.value, addressForm)
      : await usersApi.createAddress(addressForm)
    const index = addresses.value.findIndex((address) => address.id === item.id)
    if (index >= 0) addresses.value[index] = item
    else addresses.value.push(item)
    showForm.value = false
  } catch (reason) {
    addressError.value = messageOf(reason)
  }
}

function askRemove(id: string) {
  removingId.value = id
  showRemove.value = true
}

async function confirmRemove() {
  addressError.value = ''
  try {
    await usersApi.deleteAddress(removingId.value)
    addresses.value = addresses.value.filter((address) => address.id !== removingId.value)
    showRemove.value = false
  } catch (reason) {
    addressError.value = messageOf(reason)
  }
}

async function setDefault(id: string) {
  addressError.value = ''
  try {
    await usersApi.setDefaultAddress(id)
    addresses.value = addresses.value.map((address) => ({ ...address, isDefault: address.id === id }))
  } catch (reason) {
    addressError.value = messageOf(reason)
  }
}
</script>

<template>
  <div class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-5 lg:grid-cols-[220px_1fr] lg:items-start">
    <aside class="lg:sticky lg:top-24">
      <div class="flex items-center gap-3 pb-4">
        <BaseAvatar size="lg" :name="auth.user?.fullName" />
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

        <BaseNote v-if="notice" tone="ok" class="mt-4">{{ notice }}</BaseNote>

        <form class="mt-5 grid max-w-xl gap-4" novalidate @submit.prevent="saveProfile">
          <div class="grid gap-1.5">
            <BaseLabel for="fullName" required>Họ và tên</BaseLabel>
            <BaseInput id="fullName" v-model="profile.fullName" autocomplete="name" :invalid="!!profileErrors.fullName" @input="clearProfileError('fullName')" />
            <BaseFieldError :message="profileErrors.fullName" />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="phone">Số điện thoại</BaseLabel>
            <BaseInput id="phone" v-model="profile.phone" type="tel" autocomplete="tel" :invalid="!!profileErrors.phone" @input="clearProfileError('phone')" />
            <BaseFieldError :message="profileErrors.phone" />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="email">Email</BaseLabel>
            <BaseInput id="email" :model-value="auth.user?.email" disabled class="opacity-70" />
            <small class="text-muted-foreground text-xs">Email không thể thay đổi</small>
          </div>
          <BaseButton type="submit" variant="primary" class="w-fit">Lưu thay đổi</BaseButton>
        </form>
      </section>

      <section id="addresses" class="slip p-5 scroll-mt-24 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="label-xs text-primary">Giao hàng</p>
            <h2 class="mt-2 text-[24px] sm:text-[28px]">Địa chỉ của tôi</h2>
            <p class="text-muted-foreground mt-1 text-sm">Địa chỉ dùng để nhận hàng.</p>
          </div>
          <BaseButton variant="outline" size="sm" @click="openAddress()">Thêm địa chỉ</BaseButton>
        </div>

        <div class="mt-5 grid gap-3">
          <BaseSkeleton v-if="loading" class="h-24" />
          <BaseNote v-else-if="addressesError" tone="bad">
            {{ addressesError }}
            <button type="button" class="ml-2 font-semibold underline" @click="loadAddresses">Thử lại</button>
          </BaseNote>
          <BaseNote v-if="addressError" tone="bad">{{ addressError }}</BaseNote>
          <BaseEmpty v-else-if="!addresses.length && !addressesError">
            <p class="text-lg font-bold">Chưa có địa chỉ</p>
            <p class="text-muted-foreground text-sm">Thêm địa chỉ để đặt hàng nhanh hơn.</p>
          </BaseEmpty>

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
                <BasePill v-if="address.isDefault" tone="ok">Mặc định</BasePill>
              </div>
              <p class="text-muted-foreground mt-1 text-sm leading-relaxed">
                {{ address.street }}, {{ address.ward }}, {{ address.district }}, {{ address.province }}
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-1">
              <BaseButton type="button" variant="quiet" size="sm" @click="openAddress(address)">Sửa</BaseButton>
              <BaseButton v-if="!address.isDefault" type="button" variant="quiet" size="sm" @click="setDefault(address.id)">Đặt mặc định</BaseButton>
              <BaseButton type="button" variant="quiet" size="sm" class="hover:text-bad" @click="askRemove(address.id)">Xóa</BaseButton>
            </div>
          </article>
          </template>
        </div>
      </section>
    </div>

    <BaseDialog v-model:open="showRemove">
      <p class="text-xl">Xoá địa chỉ này?</p>
      <p class="text-muted-foreground mt-2 text-sm leading-relaxed">Địa chỉ sẽ biến mất khỏi danh sách nhận hàng.</p>
      <div class="border-rule mt-5 flex justify-end gap-2 border-t pt-4">
        <BaseButton variant="outline" @click="showRemove = false">Giữ lại</BaseButton>
        <BaseButton variant="danger" @click="confirmRemove">Xoá địa chỉ</BaseButton>
      </div>
    </BaseDialog>

    <BaseDialog v-model:open="showForm">
      <form class="grid gap-4" novalidate @submit.prevent="saveAddress">
        <div>
          <p class="label-xs text-primary">Địa chỉ nhận hàng</p>
          <h2 class="mt-2 text-[20px]">{{ editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ' }}</h2>
          <p class="text-muted-foreground mt-1 text-sm">Nhập thông tin người nhận và nơi giao hàng.</p>
        </div>
        <div class="grid gap-1.5">
          <BaseLabel for="recipientName" required>Người nhận</BaseLabel>
          <BaseInput
            id="recipientName"
            v-model="addressForm.recipientName"
            :invalid="!!addressErrors.recipientName"
            required
            @input="clearAddressError('recipientName')"
          />
          <BaseFieldError :message="addressErrors.recipientName" />
        </div>
        <div class="grid gap-1.5">
          <BaseLabel for="addressPhone" required>Số điện thoại</BaseLabel>
          <BaseInput
            id="addressPhone"
            v-model="addressForm.phone"
            type="tel"
            :invalid="!!addressErrors.addressPhone"
            required
            @input="clearAddressError('addressPhone')"
          />
          <BaseFieldError :message="addressErrors.addressPhone" />
        </div>
        <div class="grid gap-1.5">
          <BaseLabel for="street" required>Địa chỉ cụ thể</BaseLabel>
          <BaseInput id="street" v-model="addressForm.street" :invalid="!!addressErrors.street" required @input="clearAddressError('street')" />
          <BaseFieldError :message="addressErrors.street" />
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="grid gap-1.5">
            <BaseLabel for="ward">Phường / Xã</BaseLabel>
            <BaseInput id="ward" v-model="addressForm.ward" required />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="district" required>Quận / Huyện</BaseLabel>
            <BaseInput id="district" v-model="addressForm.district" :invalid="!!addressErrors.district" required @input="clearAddressError('district')" />
            <BaseFieldError :message="addressErrors.district" />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="province" required>Tỉnh / Thành phố</BaseLabel>
            <BaseInput id="province" v-model="addressForm.province" :invalid="!!addressErrors.province" required @input="clearAddressError('province')" />
            <BaseFieldError :message="addressErrors.province" />
          </div>
        </div>
        <div class="grid gap-1.5">
          <BaseLabel for="label">Nhãn địa chỉ</BaseLabel>
          <BaseInput id="label" v-model="addressForm.label" placeholder="Nhà riêng, Văn phòng…" />
        </div>
        <BaseCheckbox id="isDefault" v-model="addressForm.isDefault" label="Đặt làm địa chỉ mặc định" />
        <div class="border-rule flex justify-end gap-2 border-t pt-4">
          <BaseButton type="button" variant="outline" @click="showForm = false">Hủy</BaseButton>
          <BaseButton type="submit" variant="primary">Lưu địa chỉ</BaseButton>
        </div>
      </form>
    </BaseDialog>
  </div>
</template>
