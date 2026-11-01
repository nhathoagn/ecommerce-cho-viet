<script setup lang="ts">
import { Minus, Plus, Receipt, ShoppingBag, Store, Trash2 } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseEmpty from '@/components/base/BaseEmpty.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { productImageUrl, productInitials } from '@/media'
import { money, pastelWell } from '@/money'
import { useCartStore } from '@/modules/cart/cart.store'
import { messageOf } from '@/stores/auth'

const cart = useCartStore()
const blocked = computed(() => cart.items.some((item) => item.quantity > item.product.stock))
const loadError = ref('')
const actionError = ref('')
const showClear = ref(false)

async function load() {
  loadError.value = ''
  try { await cart.load() }
  catch (reason) { loadError.value = messageOf(reason) }
}
onMounted(load)

async function clearAll() {
  actionError.value = ''
  try { await cart.clear(); showClear.value = false }
  catch (reason) { actionError.value = messageOf(reason) }
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
      <BaseButton v-if="cart.items.length" variant="quiet" size="sm" @click="showClear = true">Xóa tất cả</BaseButton>
    </div>

    <BaseNote v-if="loadError" tone="bad" class="mb-4">
      {{ loadError }}
      <button type="button" class="ml-2 font-semibold underline" @click="load">Thử lại</button>
    </BaseNote>
    <BaseNote v-if="actionError" tone="bad" class="mb-4">{{ actionError }}</BaseNote>

    <BaseDialog v-model:open="showClear">
      <p class="text-xl">Xoá toàn bộ giỏ hàng?</p>
      <p class="text-muted-foreground mt-2 text-sm leading-relaxed">Mọi món trong khay sẽ bị bỏ. Không khôi phục được.</p>
      <div class="border-rule mt-5 flex justify-end gap-2 border-t pt-4">
        <BaseButton variant="outline" @click="showClear = false">Giữ lại</BaseButton>
        <BaseButton variant="danger" @click="clearAll">Xoá tất cả</BaseButton>
      </div>
    </BaseDialog>

    <BaseEmpty v-if="!cart.items.length && !loadError" class="bg-paper">
      <span class="tone-well text-foreground mb-1 grid size-14 place-items-center rounded-full" :style="{ background: 'var(--fresh)' }">
        <ShoppingBag class="size-6" aria-hidden="true" />
      </span>
      <p class="font-display text-2xl">Khay đang trống</p>
      <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">Khám phá đồ Việt từ làng nghề và vườn nhà rồi thêm vào khay.</p>
      <BaseButton to="/products" variant="primary" size="md" class="mt-1">Xem sản phẩm</BaseButton>
    </BaseEmpty>

    <div v-else-if="cart.items.length" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
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
                <BaseButton
                  size="sm"
                  variant="outline"
                  class="w-9 px-0"
                  :disabled="item.quantity <= 1"
                  aria-label="Giảm số lượng"
                  @click="cart.update(item.id, item.quantity - 1)"
                >
                  <Minus class="size-4" aria-hidden="true" />
                </BaseButton>
                <BaseInput
                  :model-value="item.quantity"
                  readonly
                  class="num h-9 w-11 px-0 text-center"
                  aria-label="Số lượng"
                />
                <BaseButton
                  size="sm"
                  variant="outline"
                  class="w-9 px-0"
                  :disabled="item.quantity >= item.product.stock"
                  aria-label="Tăng số lượng"
                  @click="item.quantity < item.product.stock && cart.update(item.id, item.quantity + 1)"
                >
                  <Plus class="size-4" aria-hidden="true" />
                </BaseButton>
              </div>

              <BaseButton
                size="sm"
                variant="quiet"
                class="text-bad hover:bg-bad-soft hover:text-bad"
                @click="cart.remove(item.id)"
              >
                <Trash2 class="size-4" aria-hidden="true" /> Xóa
              </BaseButton>
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
          <BaseButton v-if="blocked" variant="outline" block disabled>Điều chỉnh số lượng để thanh toán</BaseButton>
          <BaseButton v-else to="/checkout" variant="buy" size="lg" block>Thanh toán</BaseButton>
        </div>
      </aside>
    </div>
  </section>
</template>
