<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BasePaper from '@/components/base/BasePaper.vue'
import BaseEmpty from '@/components/base/BaseEmpty.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import StatusPill from '@/components/StatusPill.vue'
import { money } from '@/money'
import { messageOf } from '@/stores/auth'
import { nextStatus, sellerOrdersApi, type Order } from '@/modules/orders/orders.api'
import { useSellerStore } from '@/modules/seller/seller.store'

const seller = useSellerStore()
const busy = ref('')
const error = ref('')

const queue = computed(() => seller.waitingOrders)
const shortage = computed(() => seller.lowStock.slice(0, 5))
const movement = computed(() => (seller.wallet?.transactions ?? []).slice(0, 4))

function recipient(order: Order) {
  const address = order.shippingAddress
  if (!address?.recipientName) return 'Khách lẻ'
  return [address.recipientName, address.district, address.city].filter(Boolean).join(' · ')
}

async function advance(order: Order) {
  const step = nextStatus[order.status]
  if (!step) return
  busy.value = order.id
  error.value = ''
  try {
    await sellerOrdersApi.updateStatus(order.id, step.status, 'Cập nhật từ kênh bán')
    await Promise.all([seller.refreshOrders(), seller.refreshSummary(), seller.refreshWallet()])
  } catch (reason) {
    error.value = messageOf(reason)
  } finally {
    busy.value = ''
  }
}

onMounted(() => seller.ensure())
</script>

<template>
  <div class="mx-auto grid w-full max-w-6xl gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[1fr_428px]">
    <BasePaper v-if="seller.loaded && !seller.store" class="lg:col-span-2">
      <BaseEmpty class="border-0 py-16">
        <p class="text-xl">Chưa có cửa hàng</p>
        <p class="text-muted-foreground max-w-xs text-sm leading-relaxed">Mở gian hàng để đăng sản phẩm và nhận đơn đầu tiên.</p>
        <BaseButton to="/seller/store" variant="primary" size="sm">Mở cửa hàng</BaseButton>
      </BaseEmpty>
    </BasePaper>

    <template v-else>
      <BasePaper class="overflow-hidden">
        <header class="border-rule flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 class="text-lg">Đơn cần xử lý</h2>
          <span class="label-xs num text-muted-foreground">{{ queue.length }} đơn</span>
        </header>
        <div class="px-4 py-2">
          <BaseNote v-if="error" tone="bad" class="mt-2">{{ error }}</BaseNote>
          <BaseEmpty v-if="!queue.length" class="mt-2 mb-1 border-0 py-10">
            <p class="text-[15px] font-bold">Không còn đơn chờ</p>
            <p class="text-muted-foreground max-w-xs text-xs leading-relaxed">Đơn mới thanh toán sẽ hiện ở đây để bạn xác nhận.</p>
          </BaseEmpty>
          <ul v-else>
            <li v-for="order in queue" :key="order.id" class="border-rule flex flex-wrap items-center gap-3 border-b py-3 last:border-0">
              <div class="min-w-0 flex-1">
                <p class="num text-sm font-bold">{{ order.code }}</p>
                <p class="text-muted-foreground truncate text-xs">{{ recipient(order) }}</p>
                <p class="num text-muted-foreground mt-1 text-[11px]">
                  {{ new Date(order.createdAt).toLocaleString('vi-VN') }} · {{ order.items.length }} món
                </p>
              </div>
              <StatusPill :status="order.status" />
              <p class="num text-sm font-bold">{{ money(order.totalAmount) }}</p>
              <BaseButton v-if="nextStatus[order.status]" variant="outline" size="sm" :disabled="busy === order.id" @click="advance(order)">
                {{ busy === order.id ? 'Đang cập nhật…' : nextStatus[order.status]!.label }}
              </BaseButton>
            </li>
          </ul>
          <BaseButton to="/seller/orders" variant="quiet" size="sm" class="-ml-2 mt-1">Xem tất cả đơn bán →</BaseButton>
        </div>
      </BasePaper>

      <div class="grid content-start gap-4">
        <BasePaper class="overflow-hidden">
          <header class="border-rule flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <h2 class="text-lg">Sắp hết hàng</h2>
            <span class="label-xs text-muted-foreground">Ngưỡng 5</span>
          </header>
          <div class="px-4 py-2">
            <p v-if="!shortage.length" class="text-muted-foreground py-2 text-sm">Tồn kho đang ổn.</p>
            <ul v-else>
              <li v-for="product in shortage" :key="product.id" class="border-rule flex items-center justify-between gap-3 border-b py-2.5 last:border-0">
                <span class="min-w-0 truncate text-sm">{{ product.name }}</span>
                <StatusPill :stock="product.stock" />
              </li>
            </ul>
            <BaseButton to="/seller/products" variant="quiet" size="sm" class="-ml-2 mt-1">Quản lý sản phẩm →</BaseButton>
          </div>
        </BasePaper>

        <BasePaper class="overflow-hidden">
          <header class="border-rule flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <h2 class="text-lg">Biến động số dư</h2>
          </header>
          <div class="px-4 py-2">
            <p v-if="!movement.length" class="text-muted-foreground py-2 text-sm">Chưa có giao dịch.</p>
            <ul v-else>
              <li v-for="item in movement" :key="item.id" class="border-rule flex items-center justify-between gap-3 border-b py-2.5 last:border-0">
                <span class="min-w-0">
                  <span class="block truncate text-sm">{{ item.description }}</span>
                  <span class="num text-muted-foreground block text-[11px]">{{ new Date(item.createdAt).toLocaleDateString('vi-VN') }}</span>
                </span>
                <span class="num shrink-0 text-sm font-bold" :class="Number(item.amount) >= 0 ? 'text-ok' : 'text-bad'">
                  {{ money(item.amount) }}
                </span>
              </li>
            </ul>
            <BaseButton to="/seller/wallet" variant="quiet" size="sm" class="-ml-2 mt-1">Mở ví →</BaseButton>
          </div>
        </BasePaper>
      </div>
    </template>
  </div>
</template>
