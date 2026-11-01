<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseFieldError from '@/components/base/BaseFieldError.vue'
import BaseFileField from '@/components/base/BaseFileField.vue'
import BasePaper from '@/components/base/BasePaper.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseLabel from '@/components/base/BaseLabel.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import { minLength, required, validate } from '@/lib/form'
import { productImageUrl } from '@/media'
import { messageOf } from '@/stores/auth'
import { sellerCatalogApi } from '@/modules/catalog/catalog.api'
import { useSellerStore } from '@/modules/seller/seller.store'

const seller = useSellerStore()
const error = ref('')
const notice = ref('')
const saving = ref(false)
const uploading = ref(false)
const form = reactive({ name: '', description: '', logoKey: '' })
const storeErrors = ref<Record<string, string>>({})

function clearError(field: string) {
  delete storeErrors.value[field]
}

const logo = computed(() => (form.logoKey ? productImageUrl({ images: [{ objectKey: form.logoKey }] }) : ''))

function fill() {
  form.name = seller.store?.name ?? ''
  form.description = seller.store?.description ?? ''
  form.logoKey = seller.store?.logoKey ?? ''
}

onMounted(async () => {
  await seller.ensure()
  fill()
})

async function upload(file: File) {
  uploading.value = true
  error.value = ''
  try {
    const signed = await sellerCatalogApi.presign(file.name, file.type)
    await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'content-type': file.type }, body: file })
    form.logoKey = signed.objectKey
  } catch (reason) {
    error.value = messageOf(reason)
  } finally {
    uploading.value = false
  }
}

async function save() {
  const errors = validate({
    storeName: [form.name, [required('tên cửa hàng'), minLength(2, 'Tên cửa hàng')]],
  })
  storeErrors.value = errors
  if (errors.storeName) {
    document.getElementById('storeName')?.focus()
    return
  }
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const input = { name: form.name.trim(), description: form.description.trim() || undefined, logoKey: form.logoKey || undefined }
    seller.store = seller.store
      ? await sellerCatalogApi.updateStore(input)
      : await sellerCatalogApi.createStore(input)
    await seller.bootstrap()
    fill()
    notice.value = 'Đã lưu thông tin cửa hàng'
  } catch (reason) {
    error.value = messageOf(reason)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto grid w-full max-w-6xl gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[1fr_428px]">
    <BasePaper class="overflow-hidden">
      <header class="border-rule border-b px-4 py-3">
        <h2 class="text-lg">{{ seller.store ? 'Thông tin cửa hàng' : 'Mở cửa hàng' }}</h2>
        <p class="text-muted-foreground mt-1 text-sm leading-relaxed">
          {{ seller.store ? 'Tên và mô tả này hiện trên trang mua của mọi sản phẩm bạn đăng.' : 'Đặt tên gian hàng rồi bắt đầu đăng sản phẩm. Bạn có thể đổi sau.' }}
        </p>
      </header>

      <div class="p-4">
        <BaseNote v-if="error" tone="bad" class="mb-4">{{ error }}</BaseNote>
        <BaseNote v-if="notice" tone="ok" class="mb-4">{{ notice }}</BaseNote>

        <form class="grid gap-4" novalidate @submit.prevent="save">
          <div class="grid gap-1.5">
            <BaseLabel for="storeName" required>Tên cửa hàng</BaseLabel>
            <BaseInput
              id="storeName"
              v-model="form.name"
              :invalid="!!storeErrors.storeName"
              required
              minlength="2"
              maxlength="120"
              placeholder="Đất Việt"
              @input="clearError('storeName')"
            />
            <BaseFieldError :message="storeErrors.storeName" />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="storeDescription">Mô tả</BaseLabel>
            <BaseTextarea id="storeDescription" v-model="form.description" :rows="4" placeholder="Bạn bán gì, làm ở đâu, vì sao nên chọn bạn." />
          </div>
          <div class="flex items-end gap-4">
            <div class="bg-secondary border-rule grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border text-xl font-extrabold">
              <img v-if="logo" :src="logo" alt="" class="size-full object-cover" />
              <template v-else>{{ form.name.trim().charAt(0).toUpperCase() || 'V' }}</template>
            </div>
            <div class="grid flex-1 gap-1.5">
              <BaseLabel>Logo</BaseLabel>
              <BaseFileField
                :file-name="form.logoKey"
                :disabled="uploading"
                :label="uploading ? 'Đang tải…' : 'Tải ảnh lên'"
                hint="Không bắt buộc. Ảnh vuông là đẹp nhất."
                @change="upload"
              />
            </div>
          </div>
          <div class="border-rule flex flex-wrap items-center gap-2 border-t pt-4">
            <BaseButton type="submit" variant="primary" :disabled="saving || uploading">{{ saving ? 'Đang lưu…' : seller.store ? 'Lưu thay đổi' : 'Mở cửa hàng' }}</BaseButton>
            <BaseButton :to="seller.store ? '/seller' : '/'" variant="outline">{{ seller.store ? 'Về tổng quan' : 'Về trang mua' }}</BaseButton>
          </div>
        </form>
      </div>
    </BasePaper>

    <BasePaper v-if="seller.store" class="h-fit overflow-hidden">
      <header class="border-rule border-b px-4 py-3">
        <h2 class="text-lg">Gian hàng</h2>
      </header>
      <div class="grid gap-3 p-4 text-sm">
        <div class="border-rule flex items-center justify-between gap-3 border-b pb-3">
          <span class="text-muted-foreground">Đường dẫn</span>
          <span class="font-semibold">{{ seller.store.slug }}</span>
        </div>
        <div class="border-rule flex items-center justify-between gap-3 border-b pb-3">
          <span class="text-muted-foreground">Trạng thái</span>
          <span class="font-semibold">{{ seller.store.status === 'SUSPENDED' ? 'Tạm dừng' : 'Đang hoạt động' }}</span>
        </div>
        <div class="border-rule flex items-center justify-between gap-3 border-b pb-3">
          <span class="text-muted-foreground">Sản phẩm đang bán</span>
          <span class="num font-semibold">{{ seller.liveProducts.length }}/{{ seller.products.length }}</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-muted-foreground">Đơn cần xử lý</span>
          <span class="num font-semibold">{{ seller.waitingOrders.length }}</span>
        </div>
      </div>
    </BasePaper>
  </div>
</template>
