<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import { markFor } from '@/lib/marks'
import DsButton from '@/components/ds/DsButton.vue'
import DsEmpty from '@/components/ds/DsEmpty.vue'
import DsNote from '@/components/ds/DsNote.vue'
import DsSkeleton from '@/components/ds/DsSkeleton.vue'
import { catalogApi, hasMultipleStores, type Category, type Product } from '@/modules/catalog/catalog.api'
import { useCartStore } from '@/modules/cart/cart.store'
import { useAuthStore } from '@/stores/auth'

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const addingId = ref('')
const cartError = ref('')
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const selectedCategory = ref(typeof route.query.category === 'string' ? route.query.category : '')
const loading = ref(false)
const loadError = ref('')
const multiStore = computed(() => hasMultipleStores(products.value))
const categoryTabs = computed(() => [{ slug: '', name: 'Tất cả' }, ...categories.value])
let requestId = 0

async function loadProducts() {
  const id = ++requestId
  loading.value = true
  loadError.value = ''
  try {
    const next = await catalogApi.products({
      ...(search.value ? { search: search.value } : {}),
      ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
    })
    if (id !== requestId) return
    products.value = next
  } catch {
    if (id !== requestId) return
    products.value = []
    loadError.value = 'Không tải được sản phẩm. Vui lòng thử lại.'
  } finally {
    if (id === requestId) loading.value = false
  }
}

onMounted(async () => {
  try { categories.value = await catalogApi.categories() }
  catch { loadError.value = 'Không tải được danh mục. Vui lòng thử lại.' }
})

watch(() => [route.query.search, route.query.category], () => {
  search.value = typeof route.query.search === 'string' ? route.query.search : ''
  selectedCategory.value = typeof route.query.category === 'string' ? route.query.category : ''
  void loadProducts()
}, { immediate: true })

async function addToCart(product: Product) {
  if (!auth.isAuthenticated) {
    void router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  addingId.value = product.id
  cartError.value = ''
  try {
    await cart.add(product.id)
  } catch {
    cartError.value = 'Không thêm được vào giỏ. Vui lòng thử lại.'
  } finally {
    addingId.value = ''
  }
}

watch(selectedCategory, (value) => {
  const current = typeof route.query.category === 'string' ? route.query.category : ''
  if (value === current) return
  const query = { ...route.query }
  if (value) query.category = value
  else delete query.category
  void router.replace({ query })
})
</script>

<template>
  <section class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-5">
    <header class="slip mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-4 py-5 sm:px-5">
      <div>
        <p class="label-xs text-primary">Toàn bộ kệ</p>
        <h1 class="mt-2 text-[32px] leading-[1.02] break-words sm:text-[40px]">Sản phẩm</h1>
      </div>
      <p class="label-xs num text-muted-foreground">{{ products.length }} món</p>
    </header>

    <div class="border-rule mb-6 flex gap-1 overflow-x-auto border-b [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-sm:[mask-image:linear-gradient(to_right,#000_0,#000_calc(100%-28px),transparent_100%)]" role="tablist" aria-label="Danh mục">
      <button
        v-for="tab in categoryTabs"
        :key="tab.slug || 'all'"
        type="button"
        role="tab"
        :aria-selected="selectedCategory === tab.slug"
        class="-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap transition"
        :class="selectedCategory === tab.slug ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="selectedCategory = tab.slug"
      >
        <component :is="markFor(tab.slug, tab.name).icon" class="size-3.5" aria-hidden="true" />
        {{ tab.name }}
      </button>
    </div>

    <DsNote v-if="loadError" tone="bad" class="mb-5">{{ loadError }}</DsNote>
    <DsNote v-if="cartError" tone="bad" class="mb-5">{{ cartError }}</DsNote>

    <div v-if="loading" class="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      <DsSkeleton v-for="index in 8" :key="index" class="h-80" />
    </div>
    <div v-else-if="products.length" class="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :show-store="multiStore"
        :adding="addingId === product.id"
        @add="addToCart(product)"
      />
    </div>
    <DsEmpty v-else class="bg-paper">
      <p class="text-[20px]">Chưa có sản phẩm phù hợp</p>
      <p class="text-muted-foreground max-w-80 text-sm leading-6">Thử từ khoá khác hoặc chọn danh mục khác.</p>
      <DsButton to="/products" variant="outline" size="sm">Xoá bộ lọc</DsButton>
    </DsEmpty>
  </section>
</template>
