<script setup lang="ts">
import { Minus, Plus, Receipt, ShoppingBag, Store, Trash2 } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsEmpty from '@/components/ds/DsEmpty.vue'
import DsInput from '@/components/ds/DsInput.vue'
import { productImageUrl, productInitials } from '@/media'
import { money, pastelWell } from '@/money'
import { useCartStore } from '@/modules/cart/cart.store'

const cart = useCartStore()
const blocked = computed(() => cart.items.some((item) => item.quantity > item.product.stock))
onMounted(() => { void cart.load() })

function clearAll() {
  if (confirm('Xóa toàn bộ giỏ hàng?')) void cart.clear()
}

const groups = computed(() => {
  const map = new Map<string, { name: string; items: typeof cart.items }>()
  for (const item of cart.items) {
    const key = item.product.store?.slug || item.product.store?.name || 'other'
    const entry = map.get(key)
    if (entry) entry.items.push(item)
    else map.set(key, { name: item.product.store?.name ?? 'Cửa hàng khác', items: [item] })
  }
  return [...map.values()]
})
</script>

<template>
  <section class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-5">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="label-xs text-primary">Giỏ hàng</p>
        <h1 class="mt-2 text-[32px] sm:text-[40px]">Khay của bạn</h1>
        <p v-if="cart.items.length" class="text-muted-foreground mt-1.5 text-sm">
          {{ cart.count }} món · {{ groups.length }} nhà bán
        </p>
      </div>
      <DsButton v-if="cart.items.length" variant="quiet" size="sm" @click="clearAll">Xóa tất cả</DsButton>
    </div>

    <DsEmpty v-if="!cart.items.length" class="bg-paper">
      <span class="tone-well text-foreground mb-1 grid size-14 place-items-center rounded-full" :style="{ background: 'var(--fresh)' }">
        <ShoppingBag class="size-6" aria-hidden="true" />
      </span>
      <p class="font-display text-2xl">Khay đang trống</p>
      <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">Khám phá đồ Việt từ làng nghề và vườn nhà rồi thêm vào khay.</p>
      <DsButton to="/products" variant="primary" size="md" class="mt-1">Xem sản phẩm</DsButton>
    </DsEmpty>

    <div v-else class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
      <div class="slip px-4 sm:px-5">
        <section v-for="group in groups" :key="group.name" class="border-rule border-b last:border-b-0">
          <h2 class="text-muted-foreground flex items-center gap-1.5 pt-4 pb-1">
            <Store class="size-3.5" aria-hidden="true" />
            <span class="label-xs">{{ group.name }}</span>
          </h2>
          <ul>
            <li
              v-for="item in group.items"
              :key="item.id"
              class="border-rule grid grid-cols-[64px_1fr] gap-3 border-t py-3.5 first:border-t-0 sm:grid-cols-[64px_1fr_auto_auto] sm:items-center"
              :class="item.quantity > item.product.stock && 'opacity-90'"
            >
              <div
                class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[3px] text-sm font-extrabold"
                :style="{ background: pastelWell(item.product.name) }"
              >
                <img v-if="productImageUrl(item.product)" :src="productImageUrl(item.product)" alt="" class="size-full object-cover">
                <template v-else>{{ productInitials(item.product.name) }}</template>
              </div>

              <div class="min-w-0">
                <RouterLink :to="`/products/${item.product.slug}`" class="line-clamp-2 text-sm leading-snug font-bold hover:text-primary">
                  {{ item.product.name }}
                </RouterLink>
                <p class="label-xs text-muted-foreground mt-1.5">SKU {{ item.product.sku }}</p>
                <p class="num mt-1 text-sm font-bold">{{ money(item.product.price) }}</p>
                <p v-if="item.quantity > item.product.stock" class="text-bad mt-1 text-xs">Chỉ còn {{ item.product.stock }} sản phẩm</p>
              </div>

              <div class="flex items-center gap-1.5">
                <DsButton
                  size="sm"
                  variant="outline"
                  class="w-9 px-0"
                  :disabled="item.quantity <= 1"
                  aria-label="Giảm số lượng"
                  @click="cart.update(item.id, item.quantity - 1)"
                >
                  <Minus class="size-4" aria-hidden="true" />
                </DsButton>
                <DsInput
                  :model-value="item.quantity"
                  readonly
                  class="num h-9 w-11 px-0 text-center"
                  aria-label="Số lượng"
                />
                <DsButton
                  size="sm"
                  variant="outline"
                  class="w-9 px-0"
                  :disabled="item.quantity >= item.product.stock"
                  aria-label="Tăng số lượng"
                  @click="item.quantity < item.product.stock && cart.update(item.id, item.quantity + 1)"
                >
                  <Plus class="size-4" aria-hidden="true" />
                </DsButton>
              </div>

              <DsButton
                size="sm"
                variant="quiet"
                class="text-bad hover:bg-bad-soft hover:text-bad"
                @click="cart.remove(item.id)"
              >
                <Trash2 class="size-4" aria-hidden="true" /> Xóa
              </DsButton>
            </li>
          </ul>
        </section>
      </div>

      <aside class="slip p-4 lg:sticky lg:top-28">
        <p class="label-xs text-muted-foreground">Tóm tắt đơn hàng</p>
        <dl class="mt-3 grid gap-2 text-sm">
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-muted-foreground flex items-center gap-1.5"><ShoppingBag class="size-3.5" aria-hidden="true" />Số lượng</dt>
            <dd class="num font-semibold">{{ cart.count }}</dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-muted-foreground flex items-center gap-1.5"><Receipt class="size-3.5" aria-hidden="true" />Tạm tính</dt>
            <dd class="num font-semibold">{{ money(cart.total) }}</dd>
          </div>
        </dl>
        <div class="bg-rule my-4 h-px" role="separator" />
        <div class="flex items-baseline justify-between gap-3">
          <span class="text-sm font-semibold">Tổng cộng</span>
          <strong class="num text-primary text-2xl leading-none">{{ money(cart.total) }}</strong>
        </div>
        <p class="text-muted-foreground mt-3 text-xs leading-relaxed">Phí giao và mã giảm giá được tính ở bước thanh toán.</p>
        <div class="mt-4">
          <DsButton v-if="blocked" variant="outline" block disabled>Điều chỉnh số lượng để thanh toán</DsButton>
          <DsButton v-else to="/checkout" variant="buy" size="lg" block>Thanh toán</DsButton>
        </div>
      </aside>
    </div>
  </section>
</template>
