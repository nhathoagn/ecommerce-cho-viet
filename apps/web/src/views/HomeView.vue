<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BasePill from '@/components/base/BasePill.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import { productImageUrl, productInitials } from '@/media'
import { money, pastelWell, salePercent } from '@/money'
import { Gift, Ticket, Truck } from '@lucide/vue'
import { markFor, markStyle } from '@/lib/marks'
import { catalogApi, type Category, type Product } from '@/modules/catalog/catalog.api'
import { useCartStore } from '@/modules/cart/cart.store'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const cart = useCartStore()
const route = useRoute()
const router = useRouter()
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const loading = ref(true)
const loadError = ref('')
const sort = ref<'stock' | 'new' | 'deals'>('stock')
const addingId = ref('')
const cartError = ref('')
const copied = ref(false)
let copiedTimer: number | undefined
onBeforeUnmount(() => window.clearTimeout(copiedTimer))

const sorts = [
  { key: 'stock', label: 'Sẵn nhiều' },
  { key: 'new', label: 'Mới nhất' },
  { key: 'deals', label: 'Đang giảm' },
] as const

onMounted(async () => {
  try {
    ;[categories.value, products.value] = await Promise.all([catalogApi.categories(), catalogApi.products()])
  } catch {
    loadError.value = 'Không tải được sản phẩm. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
})

const deals = computed(() => products.value.filter((item) => salePercent(item.price, item.compareAtPrice) > 0))
const hang = computed(() => {
  const picks = [...deals.value, ...products.value].filter((item, index, list) => list.findIndex((x) => x.id === item.id) === index)
  return picks.slice(0, 3)
})

const sorted = computed(() => {
  const list = [...products.value]
  if (sort.value === 'deals') {
    list.sort((a, b) => {
      const discount = salePercent(b.price, b.compareAtPrice) - salePercent(a.price, a.compareAtPrice)
      return discount || Number(a.price) - Number(b.price)
    })
  } else if (sort.value === 'new') {
    list.sort((a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0))
  } else {
    list.sort((a, b) => b.stock - a.stock)
  }
  return list
})

const shelf = computed(() => sorted.value.slice(0, 8))
const stores = computed(() => {
  const map = new Map<string, { name: string; slug: string; items: Product[] }>()
  for (const product of products.value) {
    const name = product.store?.name
    const slug = product.store?.slug
    if (!name || !slug) continue
    const bucket = map.get(slug) ?? { name, slug, items: [] }
    bucket.items.push(product)
    map.set(slug, bucket)
  }
  return [...map.values()].sort((a, b) => b.items.length - a.items.length).slice(0, 2)
})

function countIn(categoryId: string) {
  return products.value.filter((product) => product.categoryId === categoryId).length
}

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

async function copyCoupon() {
  try {
    await navigator.clipboard.writeText('CHOVIET10')
    copied.value = true
    window.clearTimeout(copiedTimer)
    copiedTimer = window.setTimeout(() => (copied.value = false), 1800)
  } catch {
    copied.value = false
  }
}

const wellOf = (name: string) => ({
  '--well': pastelWell(name),
})
</script>

<template>
  <section class="band relative overflow-hidden">
    <div class="ribs absolute inset-0" aria-hidden="true" />
    <div class="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pt-10 pb-12 sm:px-5 lg:grid-cols-[1fr_640px] lg:pt-14 lg:pb-0">
      <div class="lg:pb-14">
        <h1 class="text-[44px] leading-[0.94] sm:text-[64px] lg:text-[64px]">
          Đồ Việt<br>
          <span class="text-accent">sáng đèn</span><br>
          mỗi ngày.
        </h1>
        <p class="mt-5 max-w-96 text-[15px] leading-relaxed opacity-75">
          Tuyển chọn từ làng nghề và vườn nhà — gạo, mắm, trà, lụa. Đặt hôm nay, giao trong 2 giờ ở Hà Nội và TP.HCM.
        </p>
        <div class="mt-7 flex flex-wrap gap-2.5">
          <BaseButton to="#sang-den" variant="lamp" size="lg">Xem hôm nay có gì</BaseButton>
          <BaseButton variant="on-band" size="lg" @click="copyCoupon">
            {{ copied ? 'Đã chép CHOVIET10' : 'Nhập mã CHOVIET10' }}
          </BaseButton>
        </div>
        <div class="mt-7 flex flex-wrap gap-x-6 gap-y-2 opacity-70">
          <span class="label-xs">140 món tuyển chọn</span>
          <span class="label-xs">Giao 2 giờ nội thành</span>
          <span class="label-xs">Freeship từ 500k</span>
        </div>
      </div>

      <div class="relative hidden lg:block">
        <div class="absolute inset-x-0 top-0 h-px bg-[var(--band-rule)]" />
        <div class="flex h-full items-start justify-between gap-6">
          <div
            v-for="(product, index) in hang"
            :key="product.id"
            class="w-[190px]"
            :class="index === 1 ? 'mt-28' : index === 2 ? 'mt-10' : 'mt-14'"
          >
            <div class="mx-auto w-px bg-[var(--band-rule)]" :class="index === 1 ? 'h-16' : index === 2 ? 'h-8' : 'h-12'" />
            <RouterLink :to="`/products/${product.slug}`" class="slip relative block p-2.5 transition hover:-translate-y-0.5">
              <span v-if="salePercent(product.price, product.compareAtPrice)" class="bg-primary text-primary-foreground absolute -top-2 -right-2 z-10 rotate-3 rounded-[3px] px-1.5 py-1 text-[11px] font-extrabold">−{{ salePercent(product.price, product.compareAtPrice) }}%</span>
              <span class="well-surface relative grid h-[150px] place-items-center overflow-hidden rounded-[3px] text-3xl font-extrabold" :style="wellOf(product.name)">
                <img v-if="productImageUrl(product)" :src="productImageUrl(product)" :alt="product.name" class="size-full object-cover" />
                <template v-else>{{ productInitials(product.name) }}</template>
                <span class="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,var(--lamp-soft),transparent_72%)]" />
              </span>
              <p class="mt-2 line-clamp-1 text-[13px] font-bold">{{ product.name }}</p>
              <div class="border-rule mt-2 flex items-baseline justify-between border-t pt-2">
                <strong class="num text-[15px]">{{ money(product.price) }}</strong>
                <span class="label-xs text-muted-foreground">{{ product.store?.name ?? 'Chợ Việt' }}</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="sang-den" class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-5">
    <BaseNote v-if="loadError" tone="bad" class="mb-6">{{ loadError }}</BaseNote>
    <BaseNote v-if="cartError" tone="bad" class="mb-6">{{ cartError }}</BaseNote>

    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="label-xs text-primary flex items-center gap-1.5"><span class="bg-fresh inline-block size-2 rounded-full" aria-hidden="true" />Đang sáng đèn</p>
        <h2 class="mt-2 text-[28px] sm:text-[32px]">Hôm nay có gì</h2>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="option in sorts"
          :key="option.key"
          type="button"
          class="rounded-[var(--radius)] border px-3 py-2 text-[13px] font-semibold transition"
          :class="sort === option.key ? 'border-accent bg-accent text-accent-foreground' : 'border-rule-strong text-muted-foreground hover:text-foreground'"
          @click="sort = option.key"
        >{{ option.label }}</button>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <BaseSkeleton v-for="index in 8" :key="index" class="h-80" />
    </div>
    <div v-else>
      <div class="grid grid-cols-2 items-start gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        <ProductCard
          v-for="(product, index) in shelf"
          :key="product.id"
          :product="product"
          :feature="index === 0"
          :adding="addingId === product.id"
          :class="[
            index === 0 && 'col-span-2',
            index === 3 && 'md:mt-8',
            index === 5 && 'lg:mt-10',
          ]"
          @add="addToCart(product)"
        />
      </div>
    </div>

    <div class="mt-6 flex justify-center">
      <BaseButton to="/products" variant="outline" size="md">Xem tất cả sản phẩm →</BaseButton>
    </div>
  </section>

  <section v-if="loading || categories.length" class="border-rule bg-paper-sunk border-y">
    <div class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-5">
      <p class="label-xs text-primary">Khám phá theo</p>
      <h2 class="mt-2 mb-6 text-[28px] sm:text-[32px]">Danh mục</h2>
      <div v-if="loading" class="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <BaseSkeleton v-for="index in 4" :key="index" class="h-24" />
      </div>
      <div v-else class="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <RouterLink
          v-for="category in categories"
          :key="category.id"
          :to="{ path: '/products', query: { category: category.slug } }"
          class="slip group flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5"
        >
          <span class="well-surface grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)]" :style="markStyle(category.name)">
            <component :is="markFor(category.slug, category.name).icon" class="size-5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[15px] font-bold">{{ category.name }}</span>
            <span class="num text-muted-foreground mt-1 block text-xs">{{ countIn(category.id) }} món</span>
          </span>
          <span class="text-muted-foreground group-hover:text-primary transition">→</span>
        </RouterLink>
      </div>
    </div>
  </section>

  <section v-if="stores.length" class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-5">
    <p class="label-xs text-primary">Nhà bán</p>
    <h2 class="mt-2 mb-6 text-[28px] sm:text-[32px]">Người đứng sau món hàng</h2>
    <div class="grid gap-4 lg:grid-cols-2">
      <article v-for="store in stores" :key="store.slug" class="slip flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div class="well-surface grid size-16 shrink-0 place-items-center rounded-full border-2 border-primary/40 text-lg font-extrabold" :style="wellOf(store.name)">
          {{ store.name.charAt(0) }}
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg">{{ store.name }}</h3>
          <p class="text-muted-foreground mt-1 text-sm">{{ store.items.length }} món đang bán · {{ money(Math.min(...store.items.map((item) => Number(item.price)))) }} trở lên</p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <BasePill v-for="item in store.items.slice(0, 3)" :key="item.id">{{ item.name }}</BasePill>
          </div>
        </div>
        <BaseButton :to="`/products?search=${encodeURIComponent(store.name)}`" variant="outline" size="sm">Xem món</BaseButton>
      </article>
    </div>
  </section>

  <section class="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-5">
    <div class="grid gap-3 sm:grid-cols-3">
      <div class="slip flex items-start gap-3 p-5">
        <span class="well-surface grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)]" :style="markStyle('Giao 2 giờ')">
          <Truck class="size-5" aria-hidden="true" />
        </span>
        <span>
          <p class="label-xs text-primary">Giao 2 giờ</p>
          <p class="mt-1.5 text-[15px] font-bold">Nội thành Hà Nội &amp; TP.HCM</p>
          <p class="text-muted-foreground mt-1 text-xs">Đóng gói trong ngày, giao trong 2 giờ.</p>
        </span>
      </div>
      <div class="slip flex items-start gap-3 p-5">
        <span class="well-surface grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)]" :style="markStyle('Freeship')">
          <Ticket class="size-5" aria-hidden="true" />
        </span>
        <span>
          <p class="label-xs text-primary">Freeship</p>
          <p class="mt-1.5 text-[15px] font-bold">Đơn từ 500.000₫</p>
          <p class="text-muted-foreground mt-1 text-xs">Áp tự động khi thanh toán, không cần mã.</p>
        </span>
      </div>
      <div class="slip flex items-start gap-3 p-5">
        <span class="well-surface grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)]" :style="markStyle('Mã đầu tiên')">
          <Gift class="size-5" aria-hidden="true" />
        </span>
        <span>
          <p class="label-xs text-primary">Mã đầu tiên</p>
          <p class="mt-1.5 text-[15px] font-bold">CHOVIET10 · giảm 10%</p>
          <p class="text-muted-foreground mt-1 text-xs">Nhập ở bước thanh toán.</p>
        </span>
      </div>
    </div>
  </section>
</template>
