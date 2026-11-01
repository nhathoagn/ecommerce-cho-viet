<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, Moon, Package, Receipt, Store, Sun, Wallet, type LucideIcon } from '@lucide/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useTheme } from '@/lib/theme'
import { money } from '@/money'
import { useSellerStore } from '@/modules/seller/seller.store'

const route = useRoute()
const seller = useSellerStore()
const { night, toggle } = useTheme()

const links: { to: string; label: string; match: string[]; icon: LucideIcon }[] = [
  { to: '/seller', label: 'Tổng quan', match: ['/seller'], icon: LayoutDashboard },
  { to: '/seller/products', label: 'Sản phẩm', match: ['/seller/products'], icon: Package },
  { to: '/seller/orders', label: 'Đơn bán', match: ['/seller/orders'], icon: Receipt },
  { to: '/seller/wallet', label: 'Ví', match: ['/seller/wallet'], icon: Wallet },
  { to: '/seller/store', label: 'Cửa hàng', match: ['/seller/store'], icon: Store },
]

// '/seller' is a prefix of every other route, so it only matches exactly.
const isActive = (link: { to: string; match: string[] }) =>
  link.to === '/seller' ? route.path === '/seller' : link.match.some((prefix) => route.path.startsWith(prefix))

const mark = computed(() => seller.store?.name.trim().charAt(0).toUpperCase() ?? 'V')
const figures = computed(() => [
  { label: 'Số dư khả dụng', value: money(seller.summary?.availableBalance ?? 0) },
  { label: 'Doanh thu', value: money(seller.summary?.grossRevenue ?? 0) },
  { label: 'Đơn cần xử lý', value: String(seller.summary?.pendingOrderCount ?? 0) },
])

onMounted(() => seller.ensure())
</script>

<template>
  <div class="bg-background flex min-h-svh flex-col">
    <header class="band relative overflow-hidden">
      <div class="ribs absolute inset-0" aria-hidden="true" />
      <div class="relative mx-auto w-full max-w-6xl px-4 pt-5 sm:px-5">
        <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div class="flex min-w-0 items-center gap-3">
            <span class="border-primary relative grid size-11 shrink-0 place-items-center rounded-full border-2">
              <span class="border-primary/50 absolute inset-y-[5px] left-[14px] border-l" />
              <span class="border-primary/50 absolute inset-y-[5px] right-[14px] border-r" />
              <span class="text-base leading-none font-extrabold">{{ mark }}</span>
            </span>
            <div class="min-w-0">
              <p class="font-display truncate text-2xl leading-none sm:text-3xl">{{ seller.store?.name ?? 'Kênh bán' }}</p>
              <p class="label-xs mt-2 opacity-60">
                {{ seller.store ? `${seller.store.slug} · ${seller.products.length} sản phẩm` : 'Chưa mở cửa hàng' }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-7 gap-y-3">
            <div v-for="figure in figures" :key="figure.label" class="flex flex-col gap-1">
              <span class="label-xs opacity-55">{{ figure.label }}</span>
              <span class="num text-xl font-bold">{{ figure.value }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="grid size-10 place-items-center rounded-[var(--radius)] border border-[var(--band-rule)] transition hover:bg-white/10"
                :aria-label="night ? 'Chuyển sang chế độ ngày' : 'Chuyển sang chế độ đêm'"
                @click="toggle"
              >
                <Sun v-if="night" class="size-[18px]" />
                <Moon v-else class="size-[18px]" />
              </button>
              <BaseButton :to="seller.store ? '/seller/products/new' : '/seller/store'" variant="lamp" size="lg">
                {{ seller.store ? '+ Thêm sản phẩm' : 'Mở cửa hàng' }}
              </BaseButton>
            </div>
          </div>
        </div>

        <nav class="mt-4 flex items-end gap-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Kênh bán">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 text-sm whitespace-nowrap transition-colors"
            :class="isActive(link) ? 'border-accent font-semibold' : 'border-transparent opacity-60 hover:opacity-100'"
          >
            <component :is="link.icon" class="size-4" aria-hidden="true" />
            {{ link.label }}
          </RouterLink>
          <RouterLink to="/" class="ml-auto hidden shrink-0 pb-2.5 text-xs whitespace-nowrap opacity-55 hover:opacity-100 sm:block">← Về trang mua</RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
