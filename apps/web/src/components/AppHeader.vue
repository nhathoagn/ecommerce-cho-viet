<script setup lang="ts">
import { LayoutGrid, Menu, Moon, Search, ShoppingCart, Store, Sun } from '@lucide/vue'
import { markFor } from '@/lib/marks'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { catalogApi, type Category } from '@/modules/catalog/catalog.api'
import { useCartStore } from '@/modules/cart/cart.store'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/lib/theme'
import BaseAvatar from '@/components/base/BaseAvatar.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSheet from '@/components/base/BaseSheet.vue'

const auth = useAuthStore()
const cart = useCartStore()
const route = useRoute()
const router = useRouter()
const { night, toggle } = useTheme()
const mobileOpen = ref(false)
const search = ref('')
const categories = ref<Category[]>([])
const categoryRow = ref<HTMLElement | null>(null)
const accountMenu = ref<HTMLDetailsElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const initials = computed(() => auth.user?.fullName ?? 'U')

function updateCategoryScroll() {
  const el = categoryRow.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  canScrollLeft.value = max > 0 && el.scrollLeft > 2
  canScrollRight.value = max > 0 && el.scrollLeft < max - 2
}

// Chuột không có trackpad: lăn dọc -> cuộn ngang hàng danh mục.
function onCategoryWheel(event: WheelEvent) {
  const el = categoryRow.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  if (max <= 0) return
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientWidth : 1
  const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY * unit : 0
  if (!delta) return
  if ((delta < 0 && el.scrollLeft <= 0) || (delta > 0 && el.scrollLeft >= max - 1)) return
  event.preventDefault()
  el.scrollLeft = Math.min(max, Math.max(0, el.scrollLeft + delta))
}

function onCategoryKeydown(event: KeyboardEvent) {
  const el = categoryRow.value
  if (!el) return
  const step = 120
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    el.scrollBy({ left: step, behavior: 'smooth' })
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    el.scrollBy({ left: -step, behavior: 'smooth' })
  }
}

let observer: ResizeObserver | undefined

function submitSearch() {
  const term = search.value.trim()
  mobileOpen.value = false
  void router.push(term ? { path: '/products', query: { search: term } } : { path: '/products' })
}

async function signOut() {
  await auth.logout()
  void router.push('/')
}

const isCatalog = computed(() => route.path === '/products')

function categoryLink(slug?: string) {
  return slug ? { path: '/products', query: { category: slug } } : { path: '/products' }
}

onMounted(() => {
  if (auth.isAuthenticated) void cart.load().catch(() => undefined)
  catalogApi.categories().then((list) => {
    categories.value = list
    requestAnimationFrame(updateCategoryScroll)
  }).catch(() => undefined)

  const el = categoryRow.value
  if (el) {
    updateCategoryScroll()
    observer = new ResizeObserver(updateCategoryScroll)
    observer.observe(el)
  }
  window.addEventListener('resize', updateCategoryScroll)
  void document.fonts?.ready.then(updateCategoryScroll).catch(() => undefined)
})

function closeAccountMenu(event: PointerEvent) {
  const menu = accountMenu.value
  if (menu?.open && !menu.contains(event.target as Node)) menu.open = false
}

function onAccountKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && accountMenu.value?.open) {
    accountMenu.value.open = false
    ;(accountMenu.value.querySelector('summary') as HTMLElement | null)?.focus()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', closeAccountMenu)
  document.addEventListener('keydown', onAccountKeydown)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', updateCategoryScroll)
  document.removeEventListener('pointerdown', closeAccountMenu)
  document.removeEventListener('keydown', onAccountKeydown)
})
</script>

<template>
  <header class="bg-background border-rule sticky top-0 z-30 border-b">
    <div class="mx-auto w-full max-w-6xl px-4 sm:px-5">
      <div class="flex items-center gap-3 py-3">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2.5" aria-label="Chợ Việt — trang chủ">
          <span class="border-primary relative grid size-10 place-items-center rounded-full border-2 bg-[var(--paper)]">
            <span class="border-primary/50 absolute inset-y-[5px] left-[13px] border-l" />
            <span class="border-primary/50 absolute inset-y-[5px] right-[13px] border-r" />
            <span class="text-[15px] leading-none font-extrabold">V</span>
          </span>
          <span class="hidden sm:block">
            <span class="font-display block text-lg leading-none">Chợ Việt</span>
            <span class="label-xs text-muted-foreground mt-1 block">đồ việt · sáng đèn</span>
          </span>
        </RouterLink>

        <form novalidate class="hidden min-w-0 flex-1 sm:block" role="search" @submit.prevent="submitSearch">
          <div class="border-input bg-paper focus-within:border-primary focus-within:ring-primary/25 flex items-center gap-2 rounded-[var(--radius)] border pr-1 pl-3 transition focus-within:ring-2">
            <Search class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            <input v-model="search" type="search" class="text-foreground placeholder:text-muted-foreground h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Tìm gạo ST25, mật ong, nón lá…" aria-label="Tìm sản phẩm" />
            <BaseButton type="submit" size="sm" variant="new" class="my-1">Tìm</BaseButton>
          </div>
        </form>

        <div class="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground hover:bg-secondary grid size-10 place-items-center rounded-[var(--radius)] border border-rule-strong transition sm:border-0"
            :aria-label="night ? 'Chuyển sang chế độ ngày' : 'Chuyển sang chế độ đêm'"
            @click="toggle"
          >
            <Sun v-if="night" class="size-[18px]" />
            <Moon v-else class="size-[18px]" />
          </button>

          <span class="hidden sm:block">
            <BaseButton to="/cart" variant="primary" size="md" class="relative">
              <ShoppingCart class="size-4" aria-hidden="true" />
              <span class="hidden lg:inline">Giỏ</span>
              <span v-if="cart.count" class="bg-foreground text-background num rounded-[3px] px-1.5 py-0.5 text-[11px] font-extrabold">{{ cart.count }}</span>
            </BaseButton>
          </span>

          <RouterLink to="/cart" class="relative grid size-10 place-items-center rounded-[var(--radius)] border border-rule-strong sm:hidden" aria-label="Giỏ hàng">
            <ShoppingCart class="size-[18px]" aria-hidden="true" />
            <span v-if="cart.count" class="bg-primary text-primary-foreground num absolute -top-1.5 -right-1.5 rounded-[3px] px-1 text-[10px] font-extrabold">{{ cart.count }}</span>
          </RouterLink>

          <details ref="accountMenu" v-if="auth.isAuthenticated" class="relative hidden sm:block">
            <summary class="hover:bg-secondary flex cursor-pointer items-center gap-2 rounded-[var(--radius)] p-1 pr-2 transition [&::-webkit-details-marker]:hidden">
              <BaseAvatar size="sm" :name="initials" />
              <span class="hidden text-xs font-semibold lg:inline">{{ auth.user?.fullName?.split(' ').at(-1) }}</span>
            </summary>
            <div class="slip absolute right-0 z-40 mt-2 grid w-56 gap-0.5 p-1.5">
              <p class="text-muted-foreground label-xs px-2.5 py-2">{{ auth.user?.email }}</p>
              <RouterLink to="/profile" class="hover:bg-secondary rounded-[3px] px-2.5 py-2 text-sm">Hồ sơ</RouterLink>
              <RouterLink to="/orders" class="hover:bg-secondary rounded-[3px] px-2.5 py-2 text-sm">Đơn mua</RouterLink>
              <RouterLink v-if="auth.isSeller" to="/seller" class="hover:bg-secondary rounded-[3px] px-2.5 py-2 text-sm">Kênh bán</RouterLink>
              <button type="button" class="text-bad hover:bg-bad-soft rounded-[3px] px-2.5 py-2 text-left text-sm" @click="signOut">Đăng xuất</button>
            </div>
          </details>

          <div v-else class="hidden items-center gap-1.5 sm:flex">
            <BaseButton to="/login" variant="ghost" size="sm">Đăng nhập</BaseButton>
            <BaseButton to="/register" variant="soft" size="sm">Đăng ký</BaseButton>
          </div>

          <button type="button" class="grid size-10 place-items-center rounded-[var(--radius)] border border-rule-strong sm:hidden" aria-label="Mở menu" @click="mobileOpen = true">
            <Menu class="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      <form novalidate class="pb-3 sm:hidden" role="search" @submit.prevent="submitSearch">
        <div class="border-input bg-paper focus-within:border-primary focus-within:ring-primary/25 flex items-center gap-2 rounded-[var(--radius-md)] border pr-1 pl-3 transition focus-within:ring-2">
          <Search class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          <input v-model="search" type="search" class="text-foreground placeholder:text-muted-foreground h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Tìm gạo ST25, mật ong…" aria-label="Tìm sản phẩm" />
          <BaseButton type="submit" size="sm" variant="new" class="my-1">Tìm</BaseButton>
        </div>
      </form>

      <div class="relative border-t border-rule">
        <div
          ref="categoryRow"
          role="group"
          aria-label="Danh mục sản phẩm"
          tabindex="0"
          class="flex items-center gap-5 overflow-x-auto overscroll-x-contain py-2.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
          @scroll.passive="updateCategoryScroll"
          @wheel="onCategoryWheel"
          @keydown="onCategoryKeydown"
        >
          <RouterLink
            :to="categoryLink()"
            class="flex shrink-0 items-center gap-1.5 border-b-2 pb-1 text-[13px] font-semibold whitespace-nowrap transition-colors"
            :class="isCatalog && !route.query.category ? 'border-primary text-foreground' : 'text-muted-foreground hover:text-foreground border-transparent'"
          ><LayoutGrid class="size-3.5" aria-hidden="true" />Tất cả</RouterLink>
          <RouterLink
            v-for="category in categories"
            :key="category.id"
            :to="categoryLink(category.slug)"
            class="flex shrink-0 items-center gap-1.5 border-b-2 pb-1 text-[13px] font-semibold whitespace-nowrap transition-colors"
            :class="isCatalog && route.query.category === category.slug ? 'border-primary text-foreground' : 'text-muted-foreground hover:text-foreground border-transparent'"
          >
            <component :is="markFor(category.slug, category.name).icon" class="size-3.5" aria-hidden="true" />
            {{ category.name }}
          </RouterLink>
          <RouterLink
            v-if="auth.isSeller"
            to="/seller"
            class="text-muted-foreground hover:text-foreground ml-auto flex shrink-0 items-center gap-1.5 pb-0.5 text-[13px] font-semibold whitespace-nowrap"
          ><Store class="size-3.5" aria-hidden="true" />Kênh bán</RouterLink>
        </div>
        <div v-if="canScrollLeft" class="from-background pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r to-transparent" />
        <div v-if="canScrollRight" class="from-background pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l to-transparent" />
      </div>
    </div>

    <BaseSheet v-model:open="mobileOpen">
      <div class="flex items-center justify-between">
        <p class="font-display text-lg">Chợ Việt</p>
        <button type="button" class="text-muted-foreground hover:text-foreground text-sm" @click="mobileOpen = false">Đóng</button>
      </div>
      <div class="mt-4 flex items-center gap-2">
        <BaseAvatar :name="initials" />
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">{{ auth.user?.fullName ?? 'Khách' }}</p>
          <p class="text-muted-foreground truncate text-xs">{{ auth.user?.email ?? 'Chưa đăng nhập' }}</p>
        </div>
      </div>
      <nav class="mt-5 grid gap-1 text-sm" aria-label="Menu di động">
        <RouterLink to="/products" class="hover:bg-secondary rounded-[3px] px-2 py-2.5" @click="mobileOpen = false">Sản phẩm</RouterLink>
        <RouterLink to="/cart" class="hover:bg-secondary rounded-[3px] px-2 py-2.5" @click="mobileOpen = false">Giỏ hàng</RouterLink>
        <RouterLink v-if="auth.isAuthenticated" to="/orders" class="hover:bg-secondary rounded-[3px] px-2 py-2.5" @click="mobileOpen = false">Đơn mua</RouterLink>
        <RouterLink v-if="auth.isAuthenticated" to="/profile" class="hover:bg-secondary rounded-[3px] px-2 py-2.5" @click="mobileOpen = false">Hồ sơ</RouterLink>
        <RouterLink v-if="auth.isSeller" to="/seller" class="hover:bg-secondary rounded-[3px] px-2 py-2.5" @click="mobileOpen = false">Kênh bán</RouterLink>
        <RouterLink v-if="!auth.isAuthenticated" to="/login" class="hover:bg-secondary rounded-[3px] px-2 py-2.5" @click="mobileOpen = false">Đăng nhập</RouterLink>
        <RouterLink v-if="!auth.isAuthenticated" to="/register" class="hover:bg-secondary rounded-[3px] px-2 py-2.5" @click="mobileOpen = false">Đăng ký</RouterLink>
      </nav>
      <button v-if="auth.isAuthenticated" type="button" class="text-bad border-rule mt-auto border-t pt-3 text-left text-sm" @click="signOut">Đăng xuất</button>
    </BaseSheet>
  </header>
</template>
