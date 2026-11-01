<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { money } from '@/money'
import { messageOf } from '@/stores/auth'
import { ordersApi, type Order } from '@/modules/orders/orders.api'
import BaseButton from '@/components/base/BaseButton.vue'
import { PackageOpen } from '@lucide/vue'
import BaseEmpty from '@/components/base/BaseEmpty.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import BasePill from '@/components/base/BasePill.vue'

const orders = ref<Order[]>([])
const router = useRouter()
const payingId = ref('')
const actionError = ref('')
const loadError = ref('')

async function load() {
  loadError.value = ''
  try { orders.value = await ordersApi.list() }
  catch (reason) { loadError.value = messageOf(reason) }
}
onMounted(load)

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
  actionError.value = ''
  try {
    await ordersApi.cancel(order.id)
    await load()
  } catch (reason) {
    actionError.value = `Không huỷ được ${order.code}. ${messageOf(reason)}`
  }
}

async function payAgain(order: Order) {
  payingId.value = order.id
  actionError.value = ''
  try {
    await ordersApi.createPayment(order.id)
    await router.push({ name: 'payment-result', query: { orderId: order.id } })
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

    <BaseNote v-if="actionError" tone="bad" class="mb-5">{{ actionError }}</BaseNote>
    <BaseNote v-if="loadError" tone="bad" class="mb-5">
      {{ loadError }}
      <button type="button" class="ml-2 font-semibold underline" @click="load">Thử lại</button>
    </BaseNote>

    <BaseEmpty v-if="!orders.length && !loadError">
      <span class="tone-well text-foreground mb-1 grid size-14 place-items-center rounded-full" style="background: var(--fresh)">
        <PackageOpen class="size-6" aria-hidden="true" />
      </span>
      <p class="text-lg font-bold">Bạn chưa có đơn hàng</p>
      <p class="text-muted-foreground max-w-sm text-sm">Khám phá sản phẩm và đặt đơn đầu tiên.</p>
      <BaseButton to="/products" variant="primary" class="mt-1">Khám phá sản phẩm</BaseButton>
    </BaseEmpty>

    <div v-else-if="orders.length" class="grid gap-4">
      <article v-for="order in orders" :key="order.id" class="slip" :class="order.status === 'PENDING_PAYMENT' && 'lit'">
        <header class="border-rule flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
          <div class="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong class="num text-[15px] font-extrabold">{{ order.code }}</strong>
            <span class="text-muted-foreground truncate text-sm">{{ order.store.name }}</span>
            <span class="label-xs text-muted-foreground">{{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</span>
          </div>
          <BasePill :tone="statusTone[order.status] ?? 'neutral'">{{ statusLabel[order.status] ?? order.status }}</BasePill>
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
            <BaseButton
              v-if="order.status === 'PENDING_PAYMENT'"
              variant="primary"
              size="sm"
              :loading="payingId === order.id"
              @click="payAgain(order)"
            >
              Thanh toán lại
            </BaseButton>
            <BaseButton v-if="cancellable.includes(order.status)" variant="danger" size="sm" @click="cancel(order)">Hủy đơn</BaseButton>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
