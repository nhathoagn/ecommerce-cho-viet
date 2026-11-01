<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toDataURL } from 'qrcode'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import BasePill from '@/components/base/BasePill.vue'
import { ordersApi } from '@/modules/orders/orders.api'
import { messageOf } from '@/stores/auth'

const route = useRoute()
const status = ref('PENDING')
const qr = ref('')
const orderCode = ref('')
const confirming = ref(false)
const confirmError = ref('')
const orderId = String(route.query.orderId ?? '')

// One fixed payload for every order: this repo is a demo, the QR is a prop, not a payment.
const DEMO_QR_PAYLOAD = 'CHO-VIET-DEMO-PAYMENT'

const paid = computed(() => status.value === 'SUCCESS')

async function loadOrder() {
  if (!orderId) return
  try {
    const order = await ordersApi.detail(orderId)
    if (order?.code) orderCode.value = order.code
    const payment = await ordersApi.paymentStatus(orderId)
    if (payment?.status) status.value = payment.status
  } catch (reason) {
    confirmError.value = messageOf(reason)
  }
}

async function confirmPayment() {
  confirming.value = true
  confirmError.value = ''
  try {
    const payment = await ordersApi.confirmPayment(orderId)
    status.value = payment.status
  } catch (reason) {
    confirmError.value = messageOf(reason)
  } finally {
    confirming.value = false
  }
}

onMounted(async () => {
  qr.value = await toDataURL(DEMO_QR_PAYLOAD, { width: 240, margin: 1 })
  await loadOrder()
})
</script>

<template>
  <section class="band relative overflow-hidden">
    <div class="ribs absolute inset-0" aria-hidden="true" />
    <div class="relative mx-auto w-full max-w-xl px-4 py-14 sm:px-5 sm:py-20">
      <div class="mb-6 text-center">
        <p class="label-xs text-accent">Thanh toán</p>
        <h1 class="mt-2 text-[32px] sm:text-[40px]">Quét mã để chuyển khoản</h1>
      </div>

      <div class="slip p-6 sm:p-8" :class="paid && 'lit'">
        <div v-if="!orderId" class="grid justify-items-center gap-3 text-center">
          <BasePill tone="bad">Thiếu mã đơn</BasePill>
          <p class="font-display text-2xl">Không có mã đơn</p>
          <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">Quay lại đơn hàng để kiểm tra trạng thái.</p>
        </div>

        <div v-else-if="paid" class="grid justify-items-center gap-3 text-center">
          <BasePill tone="lamp">Đã thanh toán</BasePill>
          <p class="font-display text-2xl text-primary">Đã ghi nhận thanh toán</p>
          <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">Đơn đang chờ nhà bán xác nhận. Theo dõi ở mục Đơn mua.</p>
          <p class="num text-sm font-semibold">Đơn {{ orderCode || orderId }}</p>
        </div>

        <div v-else class="grid justify-items-center gap-4 text-center">
          <img
            v-if="qr"
            :src="qr"
            alt="Mã QR chuyển khoản cho đơn hàng"
            class="size-60 rounded-[3px] border border-rule-strong"
          >
          <p class="num text-sm font-semibold">Đơn {{ orderCode || orderId }}</p>
          <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">
            Đây là mã QR mẫu. Quét xong, bấm nút bên dưới để ghi nhận thanh toán.
          </p>
          <BaseNote v-if="confirmError" tone="bad" class="w-full">{{ confirmError }}</BaseNote>
          <BaseButton variant="buy" size="md" :loading="confirming" @click="confirmPayment">
            Tôi đã chuyển khoản
          </BaseButton>
        </div>

        <div class="bg-rule my-6 h-px" role="separator" />
        <div class="flex flex-wrap justify-center gap-2.5">
          <BaseButton to="/orders" variant="primary" size="md">Xem đơn</BaseButton>
          <BaseButton to="/" variant="outline" size="md">Về trang chủ</BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>
