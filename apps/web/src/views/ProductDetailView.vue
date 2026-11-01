<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Minus, Plus } from '@lucide/vue'
import ProductCard from '@/components/ProductCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import BasePill from '@/components/base/BasePill.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import { catalogApi, hasMultipleStores, type Category, type Product } from '@/modules/catalog/catalog.api'
import { useCartStore } from '@/modules/cart/cart.store'
import { Flame, Package, ShieldCheck, Store, Truck } from '@lucide/vue'
import { markStyle } from '@/lib/marks'
import { productImageUrl, productInitials } from '@/media'
import { money, pastelWell, salePercent } from '@/money'
import { messageOf, useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const heat = computed<'hot' | ''>(() => {
  const p = product.value
  if (!p) return ''
  const deep = Number(p.compareAtPrice || 0) > Number(p.price) * 1.25
  return deep || p.stock <= 5 ? 'hot' : ''
})

const product = ref<Product | null>(null)
const related = ref<Product[]>([])
const categories = ref<Category[]>([])
const cart = useCartStore()
const auth = useAuthStore()
const added = ref(false)
const adding = ref(false)
const addingRelatedId = ref('')
const error = ref('')
const loading = ref(true)
const quantity = ref(1)
const activeIndex = ref(0)

const category = computed(() =>
  categories.value.find((item) => item.id === product.value?.categoryId),
)
const multiStore = computed(() => hasMultipleStores(related.value.concat(product.value ? [product.value] : [])))
const compareAt = computed(() => {
  const current = product.value
  if (!current?.compareAtPrice) return 0
  const listed = Number(current.compareAtPrice)
  return listed > Number(current.price) ? listed : 0
})
const off = computed(() => (product.value ? salePercent(product.value.price, product.value.compareAtPrice) : 0))
const gallery = computed(() => (product.value?.images ?? []).map((image) => productImageUrl({ images: [image] })))
const mainSrc = computed(() => gallery.value[activeIndex.value] ?? productImageUrl(product.value))
const lit = computed(() => (product.value?.stock ?? 0) > 0)
const stockTone = computed(() => {
  const stock = product.value?.stock ?? 0
  return stock <= 0 ? 'bad' : stock <= 8 ? 'warn' : 'ok'
})
/* Long copy: split the stored description into readable paragraphs, and when the
   vendor wrote one line, add what the record actually knows (category, store,
   care) so the page never shows a lone sentence. */
const paragraphs = computed(() => {
  const text = (product.value?.description ?? '').trim()
  const chunks = text.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean)
  if (chunks.length > 1) return chunks
  const sentences = text.split(/(?<=\.)\s+(?=[A-ZÀ-Ỹ0-9])/).filter(Boolean)
  if (sentences.length > 1) return [sentences.slice(0, 2).join(' '), sentences.slice(2).join(' ')].filter(Boolean)
  const name = product.value?.name ?? ''
  const category = product.value?.category?.name
  const store = product.value?.store?.name
  return [
    text || `${name} đang bán tại Chợ Việt.`,
    [category && `Thuộc nhóm ${category.toLowerCase()}.`, store && `Gian hàng ${store} đóng gói và gửi hàng trong ngày.`]
      .filter(Boolean).join(' '),
  ]
})

const promises = computed(() => [
  { title: 'Giao 2 giờ', copy: 'Nội thành Hà Nội và TP.HCM, đóng gói trong ngày.', icon: Truck, tint: '#7bd7ff' },
  { title: 'Kiểm hàng khi nhận', copy: 'Đồng kiểm với shipper trước khi thanh toán.', icon: ShieldCheck, tint: '#c8ff3d' },
  { title: 'Bảo quản', copy: 'Nơi khô ráo, tránh nắng trực tiếp; dùng sớm sau khi mở.', icon: Package, tint: '#ffc021' },
  { title: product.value?.store?.name ?? 'Chợ Việt', copy: 'Nhà bán chịu trách nhiệm đóng gói và gửi hàng.', icon: Store, tint: '#c3a6ff' },
])

const tintOf = (color: string) => ({
  background: `color-mix(in oklab, ${color} 15%, var(--paper))`,
  borderColor: `color-mix(in oklab, ${color} 55%, var(--rule))`,
})

const specs = computed(() => {
  const item = product.value
  if (!item) return []
  return [
    { label: 'Mã hàng', value: item.sku },
    { label: 'Danh mục', value: item.category?.name ?? 'Chưa phân loại' },
    { label: 'Nhà bán', value: item.store?.name ?? 'Chợ Việt' },
    { label: 'Lên kệ', value: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—' },
    { label: 'Tồn kho', value: String(item.stock) },
  ]
})

const stockLabel = computed(() => {
  const stock = product.value?.stock ?? 0
  if (stock <= 0) return 'Hết hàng'
  return `Còn ${stock} sản phẩm`
})
const wellStyle = computed(() => ({
  '--well': pastelWell(product.value?.name ?? ''),
}))

watch(
  () => String(route.params.slug),
  async (slug) => {
    loading.value = true
    error.value = ''
    added.value = false
    quantity.value = 1
    activeIndex.value = 0
    product.value = null
    related.value = []
    try {
      const [item, catalog, categoryList] = await Promise.all([
        catalogApi.product(slug),
        catalogApi.products(),
        categories.value.length ? Promise.resolve(categories.value) : catalogApi.categories(),
      ])
      product.value = item
      categories.value = categoryList
      related.value = catalog
        .filter((entry) => entry.id !== item.id && entry.categoryId && entry.categoryId === item.categoryId)
        .slice(0, 4)
    } catch (reason: unknown) {
      const status = (reason as { response?: { status?: number } })?.response?.status
      error.value = status === 404 ? 'Không tìm thấy sản phẩm này.' : 'Không tải được sản phẩm. Vui lòng thử lại.'
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

function bump(delta: number) {
  if (!product.value) return
  quantity.value = Math.min(product.value.stock, Math.max(1, quantity.value + delta))
}

function setQuantity(value: string | number | undefined) {
  if (value === undefined) return
  if (!product.value) return
  const next = Math.round(Number(value)) || 1
  quantity.value = Math.min(product.value.stock, Math.max(1, next))
}

async function addToCart(goToCart = false) {
  if (!product.value) return
  if (!auth.isAuthenticated) {
    void router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  error.value = ''
  adding.value = true
  try {
    await cart.add(product.value.id, quantity.value)
    added.value = true
    if (goToCart) void router.push('/cart')
  } catch (reason) {
    error.value = messageOf(reason)
    if (!auth.isAuthenticated) void router.push({ name: 'login', query: { redirect: route.fullPath } })
  } finally {
    adding.value = false
  }
}

async function addRelated(item: Product) {
  if (!auth.isAuthenticated) {
    void router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  addingRelatedId.value = item.id
  error.value = ''
  try {
    await cart.add(item.id)
  } catch (reason) {
    error.value = messageOf(reason)
    if (!auth.isAuthenticated) void router.push({ name: 'login', query: { redirect: route.fullPath } })
  } finally {
    addingRelatedId.value = ''
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 sm:px-5">
    <BaseSkeleton v-if="loading" class="h-96" />
    <BaseNote v-else-if="error && !product" tone="bad">{{ error }}</BaseNote>
    <template v-else-if="product">
      <nav class="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs" aria-label="Đường dẫn">
        <RouterLink class="hover:text-foreground" to="/">Trang chủ</RouterLink>
        <span aria-hidden="true">/</span>
        <RouterLink class="hover:text-foreground" to="/products">Sản phẩm</RouterLink>
        <template v-if="category">
          <span aria-hidden="true">/</span>
          <RouterLink class="hover:text-foreground" :to="{ path: '/products', query: { category: category.slug } }">{{ category.name }}</RouterLink>
        </template>
        <span aria-hidden="true">/</span>
        <span class="text-foreground line-clamp-1">{{ product.name }}</span>
      </nav>

      <section class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-8">
        <div class="slip p-3" :class="lit && 'lit'">
          <div
            class="well-surface relative grid aspect-[4/3] max-h-[520px] w-full place-items-center overflow-hidden rounded-sm text-5xl leading-none font-extrabold sm:text-7xl"
            :style="wellStyle"
          >
            <img v-if="mainSrc" :src="mainSrc" :alt="product.name" class="size-full object-cover" :class="!lit && 'saturate-50'">
            <template v-else>{{ productInitials(product.name) }}</template>
            <span v-if="lit" class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,var(--lamp-soft),transparent_70%)]" />
            <span v-if="off" class="bg-primary text-primary-foreground absolute top-2.5 right-2.5 rotate-3 rounded-sm px-2 py-1 text-[12px] font-extrabold">−{{ off }}%</span>
          </div>

          <div v-if="gallery.length > 1" class="mt-3 flex gap-2 overflow-x-auto">
            <button
              v-for="(src, index) in gallery"
              :key="src"
              type="button"
              class="slip size-14 shrink-0 overflow-hidden p-0 transition"
              :class="index === activeIndex ? 'lit' : 'opacity-70 hover:opacity-100'"
              :aria-label="`Xem ảnh ${index + 1}`"
              :aria-pressed="index === activeIndex"
              @click="activeIndex = index"
            >
              <img :src="src" alt="" class="size-full object-cover">
            </button>
          </div>
        </div>

        <div class="slip p-4 sm:p-5 lg:sticky lg:top-6">
          <p v-if="product.store?.name" class="label-xs text-muted-foreground">{{ product.store.name }}</p>
          <h1 class="mt-2 text-[28px] leading-[1.06] break-words sm:text-[32px]">{{ product.name }}</h1>

          <div class="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong class="num text-[28px] leading-none font-extrabold">{{ money(product.price) }}</strong>
            <span v-if="compareAt" class="num text-muted-foreground text-base line-through">{{ money(compareAt) }}</span>
          </div>

          <div class="mt-3 flex flex-wrap gap-1.5">
            <BasePill :tone="stockTone">{{ stockLabel }}</BasePill>
            <BasePill v-if="product.sku" class="num">{{ product.sku }}</BasePill>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-2">
            <span class="label-xs text-muted-foreground">Số lượng</span>
            <BaseButton size="sm" variant="outline" :disabled="quantity <= 1" aria-label="Giảm số lượng" @click="bump(-1)">
              <Minus class="size-4" />
            </BaseButton>
            <BaseInput
              :model-value="quantity"
              type="number"
              min="1"
              :max="product.stock"
              class="num w-16 text-center"
              aria-label="Số lượng"
              @update:model-value="setQuantity"
            />
            <BaseButton size="sm" variant="outline" :disabled="quantity >= product.stock" aria-label="Tăng số lượng" @click="bump(1)">
              <Plus class="size-4" />
            </BaseButton>
          </div>

          <BaseNote v-if="error" tone="bad" class="mt-4">{{ error }}</BaseNote>

          <div class="mt-4 grid gap-2">
            <BaseButton :variant="'buy'" size="lg" block :disabled="product.stock < 1" :loading="adding" @click="addToCart()">
              <Flame v-if="heat === 'hot'" class="size-4" aria-hidden="true" />
              {{ added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ' }}
            </BaseButton>
            <BaseButton v-if="added" to="/cart" variant="outline" size="lg" block>Xem giỏ hàng</BaseButton>
            <BaseButton v-else variant="outline" size="lg" block :disabled="product.stock < 1 || adding" @click="addToCart(true)">
              Mua ngay
            </BaseButton>
          </div>

          <div class="border-rule mt-5 grid gap-3 border-t pt-4">
            <p v-if="product.description" class="text-muted-foreground line-clamp-3 text-sm leading-6">{{ product.description }}</p>
            <dl class="grid">
              <div class="border-rule flex items-baseline justify-between gap-3 border-b py-2">
                <dt class="label-xs text-muted-foreground">Tồn kho</dt>
                <dd class="text-[13px] font-semibold">{{ stockLabel }}</dd>
              </div>
              <div class="border-rule flex items-baseline justify-between gap-3 border-b py-2">
                <dt class="label-xs text-muted-foreground">Giao hàng</dt>
                <dd class="text-[13px] font-semibold">2 giờ nội thành</dd>
              </div>
              <div class="flex items-baseline justify-between gap-3 py-2">
                <dt class="label-xs text-muted-foreground">Vận chuyển</dt>
                <dd class="num text-[13px] font-semibold">Freeship từ {{ money(500000) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div>
          <p class="label-xs text-primary">Mô tả sản phẩm</p>
          <h2 class="mt-2 text-[28px] sm:text-[32px]">Về món hàng này</h2>
          <div class="mt-4 grid gap-3.5">
            <p v-for="chunk in paragraphs" :key="chunk" class="text-muted-foreground max-w-[68ch] text-[15px] leading-7">{{ chunk }}</p>
          </div>
          <ul class="mt-6 grid gap-3 sm:grid-cols-2">
            <li
              v-for="promise in promises"
              :key="promise.title"
              class="flex items-start gap-3 rounded-[var(--radius-md)] border p-3.5 transition hover:-translate-y-0.5"
              :style="tintOf(promise.tint)"
            >
              <span
                class="well-surface grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] text-[#141a10]"
                :style="markStyle(promise.title)"
              >
                <component :is="promise.icon" class="size-[18px]" aria-hidden="true" />
              </span>
              <span class="min-w-0">
                <strong class="block text-[15px] leading-tight font-extrabold">{{ promise.title }}</strong>
                <span class="text-muted-foreground mt-1 block text-[12.5px] leading-5">{{ promise.copy }}</span>
              </span>
            </li>
          </ul>
        </div>

        <aside class="slip h-fit p-5">
          <p class="label-xs text-muted-foreground">Thông tin</p>
          <dl class="mt-2 grid">
            <div v-for="spec in specs" :key="spec.label" class="border-rule flex items-baseline justify-between gap-3 border-b py-2.5 last:border-0">
              <dt class="text-muted-foreground text-xs">{{ spec.label }}</dt>
              <dd class="text-[13px] font-semibold">{{ spec.value }}</dd>
            </div>
          </dl>
          <BaseButton :to="`/products?search=${encodeURIComponent(product.store?.name ?? '')}`" variant="outline" size="sm" class="mt-4 w-full">Xem món của {{ product.store?.name ?? 'Chợ Việt' }}</BaseButton>
        </aside>
      </section>

      <section v-if="related.length" class="grid gap-5">
        <div>
          <p class="label-xs text-primary">Cùng kệ</p>
          <h2 class="mt-2 text-[28px] sm:text-[32px]">Sản phẩm liên quan</h2>
        </div>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <ProductCard
            v-for="item in related"
            :key="item.id"
            :product="item"
            :show-store="multiStore"
            :adding="addingRelatedId === item.id"
            @add="addRelated(item)"
          />
        </div>
      </section>
    </template>
  </div>
</template>
