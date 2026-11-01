<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { money } from '@/money'
import { messageOf } from '@/stores/auth'
import { ordersApi, type Order } from '@/modules/orders/orders.api'
import DsButton from '@/components/ds/DsButton.vue'
import { PackageOpen } from '@lucide/vue'
import DsEmpty from '@/components/ds/DsEmpty.vue'
import DsNote from '@/components/ds/DsNote.vue'
import DsPill from '@/components/ds/DsPill.vue'

const orders = ref<Order[]>([])
const payingId = ref('')
const actionError = ref('')
onMounted(async () => { orders.value = await ordersApi.list() })

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao hàng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}
const statusTone: Record<string, 'ok' | 'warn' | 'bad'> = {
  PENDING_PAYMENT: 'warn',
  PAID: 'ok',
  CONFIRMED: 'ok',
  SHIPPING: 'warn',
  COMPLETED: 'ok',
  CANCELLED: 'bad',
}
const cancellable = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED']

async function cancel(order: Order) {
  await ordersApi.cancel(order.id)
  orders.value = await ordersApi.list()
}

async function payAgain(order: Order) {
  payingId.value = order.id
  actionError.value = ''
  try {
    const { payUrl } = await ordersApi.createMomoPayment(order.id)
    if (/^https?:\/\//i.test(payUrl ?? '')) return window.location.assign(payUrl)
    actionError.value = `Chưa có link MoMo cho ${order.code}. Thử lại sau.`
  } catch (reason) {
    actionError.value = `Không thanh toán được ${order.code}. ${messageOf(reason)}`
  }
  payingId.value = ''
}
</script>

<template>
  <section class="mx-auto w-full max-w-4xl px-4 py-10 sm:px-5">
    <p class="label-xs text-primary">Đơn hàng</p>
    <div class="mt-2 mb-7 flex flex-wrap items-end justify-between gap-3">
      <h1 class="text-[32px] sm:text-[40px]">Lịch sử mua hàng</h1>
      <p v-if="orders.length" class="label-xs text-muted-foreground">{{ orders.length }} đơn</p>
    </div>

    <DsNote v-if="actionError" tone="bad" class="mb-5">{{ actionError }}</DsNote>

    <DsEmpty v-if="!orders.length">
      <span class="tone-well text-foreground mb-1 grid size-14 place-items-center rounded-full" style="background: var(--fresh)">
        <PackageOpen class="size-6" aria-hidden="true" />
      </span>
      <p class="text-lg font-bold">Bạn chưa có đơn hàng</p>
      <p class="text-muted-foreground max-w-sm text-sm">Khám phá sản phẩm và đặt đơn đầu tiên.</p>
      <DsButton to="/products" variant="primary" class="mt-1">Khám phá sản phẩm</DsButton>
    </DsEmpty>

    <div v-else class="grid gap-4">
      <article v-for="order in orders" :key="order.id" class="slip" :class="order.status === 'PENDING_PAYMENT' && 'lit'">
        <header class="border-rule flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
          <div class="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong class="num text-[15px] font-extrabold">{{ order.code }}</strong>
            <span class="text-muted-foreground truncate text-sm">{{ order.store.name }}</span>
            <span class="label-xs text-muted-foreground">{{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</span>
          </div>
          <DsPill :tone="statusTone[order.status] ?? 'neutral'">{{ statusLabel[order.status] ?? order.status }}</DsPill>
        </header>

        <ul class="divide-rule divide-y">
          <li v-for="item in order.items" :key="item.id" class="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm">
            <span class="min-w-0 truncate">{{ item.productName }}</span>
            <span class="num text-muted-foreground shrink-0 text-[13px]">× {{ item.quantity }}</span>
          </li>
        </ul>

        <div class="border-rule flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <p class="flex items-baseline gap-2">
            <span class="label-xs text-muted-foreground">Tổng</span>
            <strong class="num text-[20px] font-extrabold">{{ money(order.totalAmount) }}</strong>
          </p>
          <div class="flex flex-wrap gap-2">
            <DsButton
              v-if="order.status === 'PENDING_PAYMENT'"
              variant="primary"
              size="sm"
              :loading="payingId === order.id"
              @click="payAgain(order)"
            >
              Thanh toán lại
            </DsButton>
            <DsButton v-if="cancellable.includes(order.status)" variant="danger" size="sm" @click="cancel(order)">Hủy đơn</DsButton>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
