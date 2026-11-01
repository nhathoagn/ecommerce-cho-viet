<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DsButton from '@/components/ds/DsButton.vue'
import DsPaper from '@/components/ds/DsPaper.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsSelect, { type DsOption } from '@/components/ds/DsSelect.vue'
import DsTextarea from '@/components/ds/DsTextarea.vue'
import DsNote from '@/components/ds/DsNote.vue'
import DsEmpty from '@/components/ds/DsEmpty.vue'
import DsFieldError from '@/components/ds/DsFieldError.vue'
import DsFileField from '@/components/ds/DsFileField.vue'
import { minLength, required, validate } from '@/lib/form'
import { productImageUrl, productInitials } from '@/media'
import { money, pastelWell } from '@/money'
import { messageOf } from '@/stores/auth'
import { catalogApi, sellerCatalogApi, type Category } from '@/modules/catalog/catalog.api'
import { useSellerStore } from '@/modules/seller/seller.store'

const route = useRoute()
const router = useRouter()
const seller = useSellerStore()

const productId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const current = computed(() => seller.products.find((product) => product.id === productId.value) ?? null)
const missing = ref(false)
const categories = ref<Category[]>([])
const categoryOptions = computed<DsOption[]>(() => [
  { value: '', label: 'Chưa chọn' },
  ...categories.value.map((category) => ({ value: category.id, label: category.name })),
])
const statusOptions: DsOption[] = [
  { value: 'DRAFT', label: 'Nháp', hint: 'chưa hiện trên trang mua' },
  { value: 'ACTIVE', label: 'Đang bán' },
  { value: 'INACTIVE', label: 'Đã ẩn' },
  { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
]
const error = ref('')
const fieldErrors = ref<Record<string, string>>({})

function clearError(field: string) {
  delete fieldErrors.value[field]
}

const saving = ref(false)
const uploading = ref(false)

const form = reactive({
  name: '',
  sku: '',
  description: '',
  price: 0,
  compareAtPrice: '' as number | string,
  stock: 0,
  status: 'DRAFT',
  categoryId: '',
  imageKey: '',
})

const preview = computed(() => (form.imageKey ? productImageUrl({ images: [{ objectKey: form.imageKey }] }) : ''))

onMounted(async () => {
  await seller.ensure()
  categories.value = await catalogApi.categories()
  if (!productId.value) return
  if (!current.value) {
    missing.value = true
    return
  }
  Object.assign(form, {
    name: current.value.name,
    sku: current.value.sku,
    description: current.value.description ?? '',
    price: Number(current.value.price),
    compareAtPrice: Number(current.value.compareAtPrice) || '',
    stock: current.value.stock,
    status: current.value.status,
    categoryId: current.value.categoryId ?? '',
    imageKey: current.value.images?.[0]?.objectKey ?? '',
  })
})

async function upload(file: File) {
  uploading.value = true
  error.value = ''
  try {
    const signed = await sellerCatalogApi.presign(file.name, file.type)
    await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'content-type': file.type }, body: file })
    form.imageKey = signed.objectKey
  } catch (reason) {
    error.value = messageOf(reason)
  } finally {
    uploading.value = false
  }
}

async function save() {
  const errors = validate({
    productName: [form.name, [required('tên sản phẩm'), minLength(2, 'Tên sản phẩm')]],
    productSku: [form.sku, [required('SKU')]],
    productPrice: [String(form.price), [required('giá bán'), (value) => (Number(value) >= 1000 ? '' : 'Giá bán tối thiểu 1.000₫.')]],
    productStock: [
      String(form.stock),
      [(value) => (!value.trim() || (Number.isInteger(Number(value)) && Number(value) >= 0) ? '' : 'Tồn kho phải là số từ 0 trở lên.')],
    ],
  })
  fieldErrors.value = errors
  const firstInvalid = Object.keys(errors)[0]
  if (firstInvalid) {
    document.getElementById(firstInvalid)?.focus()
    return
  }
  saving.value = true
  error.value = ''
  const payload = {
    name: form.name.trim(),
    sku: form.sku.trim(),
    description: form.description.trim() || undefined,
    price: Number(form.price),
    compareAtPrice: Number(form.compareAtPrice) || undefined,
    stock: Number(form.stock),
    status: form.status,
    categoryId: form.categoryId || undefined,
    images: form.imageKey ? [{ objectKey: form.imageKey, altText: form.name.trim(), position: 0 }] : [],
  }
  try {
    if (productId.value) await sellerCatalogApi.updateProduct(productId.value, payload)
    else await sellerCatalogApi.createProduct(payload)
    await Promise.all([seller.refreshProducts(), seller.refreshSummary()])
    router.push('/seller/products')
  } catch (reason) {
    error.value = messageOf(reason)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5">
    <DsPaper v-if="missing">
      <DsEmpty class="border-0 py-16">
        <p class="text-xl">Không tìm thấy sản phẩm</p>
        <p class="text-muted-foreground max-w-xs text-sm leading-relaxed">Sản phẩm có thể đã bị xoá khỏi gian hàng.</p>
        <DsButton to="/seller/products" variant="primary" size="sm">Về danh mục</DsButton>
      </DsEmpty>
    </DsPaper>

    <DsPaper v-else class="overflow-hidden">
      <header class="border-rule flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 class="text-lg">{{ productId ? 'Sửa sản phẩm' : 'Thêm sản phẩm' }}</h2>
        <DsButton to="/seller/products" variant="quiet" size="sm">← Danh mục</DsButton>
      </header>

      <form class="grid gap-4 p-4 md:grid-cols-2" novalidate @submit.prevent="save">
        <DsNote v-if="error" tone="bad" class="md:col-span-2">{{ error }}</DsNote>

        <div class="grid gap-1.5 md:col-span-2">
          <DsLabel for="productName" required>Tên sản phẩm</DsLabel>
          <DsInput
            id="productName"
            v-model="form.name"
            :invalid="!!fieldErrors.productName"
            required
            minlength="2"
            maxlength="120"
            placeholder="Ví dụ: Gạo ST25 Sóc Trăng 5kg"
            @input="clearError('productName')"
          />
          <DsFieldError :message="fieldErrors.productName" />
        </div>

        <div class="grid gap-1.5">
          <DsLabel for="productSku" required>SKU</DsLabel>
          <DsInput
            id="productSku"
            v-model="form.sku"
            :invalid="!!fieldErrors.productSku"
            required
            minlength="2"
            placeholder="ST25-5K"
            class="num"
            @input="clearError('productSku')"
          />
          <DsFieldError :message="fieldErrors.productSku" />
        </div>

        <label class="grid gap-1.5">
          <span class="label-xs text-muted-foreground">Danh mục</span>
          <DsSelect v-model="form.categoryId" :options="categoryOptions" class="w-full" />
        </label>

        <div class="grid gap-1.5 md:col-span-2">
          <DsLabel for="productDescription">Mô tả</DsLabel>
          <DsTextarea id="productDescription" v-model="form.description" :rows="3" placeholder="Xuất xứ, quy cách, cách dùng…" />
        </div>

        <div class="grid gap-1.5">
          <DsLabel for="productPrice" required>Giá bán (₫)</DsLabel>
          <DsInput
            id="productPrice"
            v-model.number="form.price"
            type="number"
            min="0"
            step="any"
            :invalid="!!fieldErrors.productPrice"
            required
            class="num"
            @input="clearError('productPrice')"
          />
          <DsFieldError :message="fieldErrors.productPrice" />
        </div>

        <div class="grid gap-1.5">
          <DsLabel for="productCompare">Giá gốc (₫)</DsLabel>
          <DsInput id="productCompare" v-model.number="form.compareAtPrice" type="number" min="0" step="any" class="num" />
        </div>

        <div class="grid gap-1.5">
          <DsLabel for="productStock">Tồn kho</DsLabel>
          <DsInput
            id="productStock"
            v-model.number="form.stock"
            type="number"
            min="0"
            :invalid="!!fieldErrors.productStock"
            class="num"
            @input="clearError('productStock')"
          />
          <DsFieldError :message="fieldErrors.productStock" />
        </div>

        <label class="grid gap-1.5">
          <span class="label-xs text-muted-foreground">Trạng thái</span>
          <DsSelect v-model="form.status" :options="statusOptions" class="w-full" />
        </label>

        <div class="border-rule flex items-end gap-4 border-t pt-4 md:col-span-2">
          <div
            class="grid size-24 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] text-2xl font-extrabold"
            :style="{
              background: pastelWell(form.name || seller.store?.name || 'Chợ Việt'),
              backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 26px, color-mix(in oklab, var(--foreground) 10%, transparent) 26px 27px)',
              boxShadow: 'inset 0 0 0 1px var(--rule-strong)',
            }"
          >
            <img v-if="preview" :src="preview" :alt="form.name" class="size-full object-cover" />
            <template v-else>{{ productInitials(form.name || seller.store?.name || 'CV') }}</template>
          </div>
          <div class="grid flex-1 gap-1.5">
            <DsLabel>Ảnh sản phẩm</DsLabel>
            <DsFileField
              :file-name="form.imageKey"
              :disabled="uploading"
              :label="uploading ? 'Đang tải…' : 'Tải ảnh lên'"
              hint="PNG, JPG hoặc WebP. Ảnh đầu tiên dùng làm ảnh bìa."
              @change="upload"
            />
          </div>
        </div>

        <!-- Sticky inside the slip: the save action never leaves the screen. -->
        <div class="border-rule bg-paper sticky bottom-0 z-10 -mx-4 -mb-4 mt-1 flex flex-wrap items-center gap-2 border-t px-4 py-3 md:col-span-2">
          <DsButton type="submit" variant="primary" :disabled="saving || uploading">{{ saving ? 'Đang lưu…' : productId ? 'Lưu thay đổi' : 'Đăng sản phẩm' }}</DsButton>
          <DsButton to="/seller/products" variant="outline">Huỷ</DsButton>
          <span v-if="form.price > 0" class="num text-muted-foreground ml-auto text-sm">Hiển thị: {{ money(form.price) }}</span>
        </div>
      </form>
    </DsPaper>
  </div>
</template>
