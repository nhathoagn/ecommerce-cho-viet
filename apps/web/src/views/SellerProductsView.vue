<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BasePaper from '@/components/base/BasePaper.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseEmpty from '@/components/base/BaseEmpty.vue'
import BaseFieldError from '@/components/base/BaseFieldError.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseLabel from '@/components/base/BaseLabel.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import StatusPill from '@/components/StatusPill.vue'
import { productImageUrl, productInitials } from '@/media'
import { money, pastelWell } from '@/money'
import { messageOf } from '@/stores/auth'
import { sellerCatalogApi, type InventoryEntry, type Product } from '@/modules/catalog/catalog.api'
import { useSellerStore } from '@/modules/seller/seller.store'

const seller = useSellerStore()

const filters = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang bán' },
  { key: 'DRAFT', label: 'Nháp' },
  { key: 'OUT_OF_STOCK', label: 'Hết hàng' },
]
const filter = ref('ALL')
const term = ref('')
const selectedId = ref('')
const history = ref<InventoryEntry[]>([])
const quick = ref({ price: 0, stock: 0 })
const quickErrors = ref({ price: '', stock: '' })
const error = ref('')
const notice = ref('')
const saving = ref(false)
const removing = ref(false)

const rows = computed(() => seller.products.filter((product) => {
  if (filter.value !== 'ALL' && product.status !== filter.value) return false
  const needle = term.value.trim().toLowerCase()
  return !needle || product.name.toLowerCase().includes(needle) || product.sku.toLowerCase().includes(needle)
}))
const selected = computed(() => seller.products.find((product) => product.id === selectedId.value) ?? null)
const reasons: Record<string, string> = { 'Initial stock': 'Tồn kho ban đầu' }
const reasonOf = (entry: InventoryEntry) => reasons[entry.reason ?? ''] ?? entry.reason ?? 'Điều chỉnh tồn kho'

function select(product: Product) {
  selectedId.value = product.id
}

watch(selected, async (product) => {
  error.value = ''
  notice.value = ''
  if (!product) return
  quick.value = { price: Number(product.price), stock: product.stock }
  try {
    history.value = (await sellerCatalogApi.inventoryHistory(product.id)).slice(0, 3)
  } catch {
    history.value = []
  }
})

onMounted(async () => {
  await seller.ensure()
  if (!selectedId.value) selectedId.value = (seller.liveProducts[0] ?? seller.products[0])?.id ?? ''
})

async function saveQuick() {
  if (!selected.value) return
  quickErrors.value = { price: '', stock: '' }
  if (!Number.isFinite(Number(quick.value.price)) || Number(quick.value.price) < 1000) {
    quickErrors.value.price = 'Giá bán tối thiểu 1.000₫.'
  }
  if (!Number.isInteger(Number(quick.value.stock)) || Number(quick.value.stock) < 0) {
    quickErrors.value.stock = 'Tồn kho phải là số nguyên từ 0.'
  }
  if (quickErrors.value.price || quickErrors.value.stock) {
    document.getElementById(quickErrors.value.price ? 'quickPrice' : 'quickStock')?.focus()
    return
  }
  saving.value = true
  error.value = ''
  const product = selected.value
  try {
    if (quick.value.price !== Number(product.price)) {
      await sellerCatalogApi.updateProduct(product.id, { price: Number(quick.value.price) })
    }
    const delta = quick.value.stock - product.stock
    if (delta !== 0) await sellerCatalogApi.adjustInventory(product.id, delta, 'Sửa nhanh từ kênh bán')
    await Promise.all([seller.refreshProducts(), seller.refreshSummary()])
    notice.value = 'Đã lưu thay đổi'
  } catch (reason) {
    error.value = messageOf(reason)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!selected.value) return
  removing.value = false
  error.value = ''
  try {
    await sellerCatalogApi.removeProduct(selected.value.id)
    selectedId.value = ''
    await Promise.all([seller.refreshProducts(), seller.refreshSummary()])
    notice.value = 'Đã xoá sản phẩm'
  } catch (reason) {
    error.value = messageOf(reason)
  }
}

const wellOf = (name: string) => ({
  background: pastelWell(name),
  backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 26px, color-mix(in oklab, var(--foreground) 10%, transparent) 26px 27px)',
  boxShadow: 'inset 0 0 0 1px var(--rule-strong)',
})
</script>

<template>
  <div class="mx-auto grid w-full max-w-6xl gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[1fr_428px]">
    <BasePaper class="overflow-hidden">
      <header class="border-rule flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <h2 class="text-lg">Danh mục</h2>
        <span class="label-xs num text-muted-foreground">{{ seller.products.length }} sản phẩm</span>
      </header>

      <div class="border-rule flex flex-wrap items-center gap-1.5 border-b px-4 py-2.5">
        <BaseInput v-model="term" class="h-9 min-w-0 basis-full px-2.5 text-[13px] sm:basis-0 sm:flex-1" placeholder="Tìm theo tên hoặc SKU…" aria-label="Tìm sản phẩm" />
        <button
          v-for="item in filters"
          :key="item.key"
          type="button"
          class="rounded-[var(--radius)] border px-2.5 py-1.5 text-[12px] font-semibold transition"
          :class="filter === item.key ? 'border-accent bg-accent text-accent-foreground' : 'border-rule-strong text-muted-foreground hover:text-foreground'"
          @click="filter = item.key"
        >{{ item.label }}</button>
      </div>

      <BaseEmpty v-if="!rows.length" class="border-0">
        <p class="text-[15px] font-bold">{{ seller.products.length ? 'Không có sản phẩm khớp' : 'Chưa có sản phẩm' }}</p>
        <p class="text-muted-foreground max-w-xs text-xs leading-relaxed">{{ seller.products.length ? 'Thử từ khoá khác hoặc bỏ bộ lọc.' : 'Đăng món đầu tiên để gian hàng mở cửa.' }}</p>
        <BaseButton to="/seller/products/new" variant="outline" size="sm">Thêm sản phẩm</BaseButton>
      </BaseEmpty>

      <ul v-else>
        <li v-for="product in rows" :key="product.id">
          <button
            type="button"
            class="border-rule hover:bg-secondary/60 grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-0"
            :class="product.id === selectedId ? 'bg-secondary' : ''"
            @click="select(product)"
          >
            <span class="grid size-10 place-items-center overflow-hidden rounded-[var(--radius-sm)] text-sm font-extrabold" :style="wellOf(product.name)">
              <img v-if="productImageUrl(product)" :src="productImageUrl(product)" :alt="product.name" class="size-full object-cover" />
              <template v-else>{{ productInitials(product.name) }}</template>
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-bold">{{ product.name }}</span>
              <span class="num text-muted-foreground block truncate text-[11px]">{{ product.sku }}</span>
            </span>
            <span class="flex items-center gap-2.5">
              <span class="num text-sm font-bold">{{ money(product.price) }}</span>
              <span v-if="product.status !== 'DRAFT'" class="hidden sm:inline-flex"><StatusPill :stock="product.stock" /></span>
              <span class="hidden md:inline-flex"><StatusPill :status="product.status" /></span>
            </span>
          </button>
        </li>
      </ul>
    </BasePaper>

    <BasePaper v-if="selected" class="hidden h-fit overflow-hidden lg:block">
      <div class="flex flex-col gap-3 p-4">
        <div class="grid h-40 place-items-center overflow-hidden rounded-[var(--radius-sm)] text-4xl font-extrabold" :style="wellOf(selected.name)">
          <img v-if="productImageUrl(selected)" :src="productImageUrl(selected)" :alt="selected.name" class="size-full object-cover" />
          <template v-else>{{ productInitials(selected.name) }}</template>
        </div>

        <div>
          <h2 class="text-xl leading-tight">{{ selected.name }}</h2>
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusPill v-if="selected.status !== 'DRAFT'" :stock="selected.stock" />
            <StatusPill :status="selected.status" />
          </div>
        </div>

        <div class="border-rule border-b pb-3">
          <p class="num text-lg font-extrabold">{{ money(selected.price) }}</p>
          <p v-if="Number(selected.compareAtPrice || 0) > Number(selected.price)" class="num text-muted-foreground text-xs">
            Giá gốc {{ money(selected.compareAtPrice!) }}
          </p>
        </div>

        <BaseNote v-if="error" tone="bad">{{ error }}</BaseNote>
        <p v-if="notice" class="text-muted-foreground text-xs">{{ notice }}</p>

        <div>
          <p class="label-xs text-muted-foreground">Biến động tồn kho</p>
          <p v-if="!history.length" class="text-muted-foreground mt-2 text-xs">Chưa có điều chỉnh nào.</p>
          <ul v-else class="mt-1">
            <li v-for="entry in history" :key="entry.id" class="border-rule flex items-center justify-between gap-2 border-b py-2 text-xs last:border-0">
              <span class="truncate">{{ reasonOf(entry) }}</span>
              <span class="num text-muted-foreground shrink-0">{{ new Date(entry.createdAt).toLocaleDateString('vi-VN') }} · {{ entry.quantity > 0 ? '+' : '' }}{{ entry.quantity }}</span>
            </li>
          </ul>
        </div>

        <form class="grid grid-cols-2 gap-2" novalidate @submit.prevent="saveQuick">
          <div class="grid gap-1.5">
            <BaseLabel for="quickPrice">Giá bán</BaseLabel>
            <BaseInput id="quickPrice" v-model.number="quick.price" type="number" min="0" step="any" class="num h-9 text-[13px]" :invalid="!!quickErrors.price" @input="quickErrors.price = ''" />
          </div>
          <div class="grid gap-1.5">
            <BaseLabel for="quickStock">Tồn kho</BaseLabel>
            <BaseInput id="quickStock" v-model.number="quick.stock" type="number" min="0" step="any" class="num h-9 text-[13px]" :invalid="!!quickErrors.stock" @input="quickErrors.stock = ''" />
            <BaseFieldError :message="quickErrors.stock" class="col-span-1" />
          </div>
          <BaseFieldError :message="quickErrors.price" class="col-span-2 -mt-1" />
          <BaseButton type="submit" variant="primary" size="sm" class="col-span-2" :disabled="saving">
            {{ saving ? 'Đang lưu…' : 'Lưu thay đổi' }}
          </BaseButton>
        </form>

        <div class="border-rule flex flex-wrap items-center gap-2 border-t pt-3">
          <BaseButton :to="`/seller/products/${selected.id}`" variant="outline" size="sm" class="flex-1">Sửa sản phẩm</BaseButton>
          <BaseButton variant="danger" size="sm" @click="removing = true">Xoá</BaseButton>
        </div>
      </div>
    </BasePaper>

    <BasePaper v-else class="hidden h-fit lg:block">
      <p class="text-muted-foreground p-5 text-sm leading-relaxed">Chọn một sản phẩm bên trái để sửa nhanh giá và tồn kho.</p>
    </BasePaper>

    <BaseDialog v-model:open="removing">
      <p class="text-xl">Xoá sản phẩm?</p>
      <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
        “{{ selected?.name }}” sẽ bị xoá khỏi gian hàng. Không khôi phục được.
      </p>
      <div class="border-rule mt-5 flex justify-end gap-2 border-t pt-4">
        <BaseButton variant="outline" @click="removing = false">Giữ lại</BaseButton>
        <BaseButton variant="danger" @click="remove">Xoá sản phẩm</BaseButton>
      </div>
    </BaseDialog>
  </div>
</template>
