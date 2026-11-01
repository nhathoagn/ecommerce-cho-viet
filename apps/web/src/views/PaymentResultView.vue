<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toDataURL } from 'qrcode'
import DsButton from '@/components/ds/DsButton.vue'
import DsNote from '@/components/ds/DsNote.vue'
import DsPill from '@/components/ds/DsPill.vue'
import { ordersApi } from '@/modules/orders/orders.api'

const route = useRoute()
const status = ref('PENDING')
const qr = ref('')
const payUrl = ref('')
const orderCode = ref('')
const demoQr = ref('')
// No MoMo keys configured: the API hands back a payUrl that points at this app.
const isDemo = computed(() => !payUrl.value || payUrl.value.startsWith(window.location.origin))
const orderId = String(route.query.orderId ?? '')
const pollingFailed = ref(false)
const retrying = ref(false)
const confirming = ref(false)
const confirmError = ref('')
const retryError = ref('')

async function buildDemoQr() {
  // A scannable stand-in for development: it opens this order's result page,
  // never a payment. Real QR only appears once MOMO_* keys are configured.
  demoQr.value = await toDataURL(window.location.href, { width: 200, margin: 1 })
}

async function loadOrderCode() {
  try {
    const order = await ordersApi.detail(orderId)
    if (order?.code) orderCode.value = order.code
  } catch {
    // The code is cosmetic here; the id stays as a fallback.
  }
}

async function loadPayUrl() {
  try {
    const payment = await ordersApi.paymentStatus(orderId)
    if (payment?.payUrl) {
      payUrl.value = payment.payUrl
      if (!qr.value) qr.value = await toDataURL(payment.payUrl, { width: 240, margin: 1 })
    }
    if (payment?.status) status.value = payment.status
  } catch {
    // A missing link is not fatal: polling below reports the real state.
  }
}

async function poll() {
  pollingFailed.value = false
  for (let i = 0; i < 10; i++) {
    try {
      const payment = await ordersApi.paymentStatus(orderId)
      status.value = payment?.status ?? 'PENDING'
      if (payment?.payUrl && !qr.value)
        qr.value = await toDataURL(payment.payUrl, { width: 240, margin: 1 })
    } catch {
      // A dropped poll must not show a fake result: stop and offer a retry.
      pollingFailed.value = true
      return
    }
    if (['SUCCESS', 'FAILED', 'REFUNDED'].includes(status.value)) return
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
}

async function confirmPayment() {
  confirming.value = true
  confirmError.value = ''
  try {
    await ordersApi.confirmDemoPayment(orderId)
    await poll()
  } catch {
    confirmError.value = 'Chưa xác nhận được thanh toán. Kiểm tra kết nối rồi thử lại.'
  } finally {
    confirming.value = false
  }
}

async function retryPayment() {
  retrying.value = true
  retryError.value = ''
  try {
    const { payUrl } = await ordersApi.createMomoPayment(orderId)
    if (/^https?:\/\//i.test(payUrl ?? '')) return window.location.assign(payUrl)
    retryError.value = 'Chưa có liên kết MoMo cho đơn này. Thử lại sau ít phút.'
  } catch {
    retryError.value = 'Không tạo lại được thanh toán MoMo. Kiểm tra kết nối rồi thử lại.'
  } finally {
    retrying.value = false
  }
}

onMounted(async () => {
  if (!orderId) return
  void loadOrderCode()
  await loadPayUrl()
  if (isDemo.value) await buildDemoQr()
  await poll()
})
</script>

<template>
  <section class="band relative overflow-hidden">
    <div class="ribs absolute inset-0" aria-hidden="true" />
    <div class="relative mx-auto w-full max-w-xl px-4 py-14 sm:px-5 sm:py-20">
      <div class="mb-6 text-center">
        <p class="label-xs text-accent">MoMo</p>
        <h1 class="mt-2 text-[32px] sm:text-[40px]">Kết quả thanh toán</h1>
      </div>

      <div class="slip p-6 sm:p-8" :class="[status === 'SUCCESS' && 'lit', (!orderId || status === 'FAILED') && 'border-bad/40!']">
        <div v-if="!orderId" class="grid justify-items-center gap-3 text-center">
          <DsPill tone="bad">Thiếu mã đơn</DsPill>
          <p class="font-display text-2xl">Không có mã đơn</p>
          <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">Quay lại đơn hàng để kiểm tra trạng thái.</p>
        </div>

        <div v-else-if="status === 'FAILED'" class="grid justify-items-center gap-3 text-center">
          <DsPill tone="bad">Thất bại</DsPill>
          <p class="font-display text-2xl text-bad">Thanh toán thất bại</p>
          <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">Đơn vẫn được giữ. Thử thanh toán lại bằng MoMo.</p>
          <p class="num text-sm font-semibold">Đơn {{ orderCode || orderId }}</p>
          <DsNote v-if="retryError" tone="bad" class="w-full">{{ retryError }}</DsNote>
          <DsButton size="md" variant="buy" :loading="retrying" @click="retryPayment">Thanh toán lại</DsButton>
        </div>

        <div v-else-if="status === 'SUCCESS'" class="grid justify-items-center gap-3 text-center">
          <DsPill tone="lamp">Đã thanh toán</DsPill>
          <p class="font-display text-2xl text-primary">Thanh toán thành công</p>
          <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">Đơn đã thanh toán và đang chờ nhà bán xác nhận. Theo dõi ở mục Đơn mua.</p>
          <p v-if="isDemo" class="label-xs text-warn">Thanh toán mô phỏng · chưa cấu hình MoMo</p>
          <p class="num text-sm font-semibold">Đơn {{ orderCode || orderId }}</p>
        </div>

        <div v-else-if="qr && !isDemo" class="grid justify-items-center gap-3 text-center">
          <img :src="qr" :alt="`Mã QR thanh toán MoMo cho đơn ${orderId}`" class="size-60 rounded-[3px] border border-rule-strong">
          <p class="font-display text-xl">Mã QR thanh toán MoMo</p>
          <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">Mở app MoMo và quét mã, hoặc mở thẳng bằng nút bên dưới.</p>
          <p class="num text-sm font-semibold">Đơn {{ orderCode || orderId }}</p>
          <DsButton v-if="payUrl" :href="payUrl" variant="buy" size="md">Mở app MoMo</DsButton>
        </div>

        <div v-else class="grid justify-items-center gap-3 text-center">
          <DsPill :tone="pollingFailed ? 'bad' : 'warn'">{{ pollingFailed ? 'Mất kết nối' : isDemo ? 'Chờ thanh toán' : 'Đang xác minh' }}</DsPill>
          <p class="font-display text-2xl">
            {{ pollingFailed ? 'Chưa kiểm tra được thanh toán' : isDemo ? 'Đơn đang chờ thanh toán' : 'Đang xác minh giao dịch' }}
          </p>
          <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">
            {{ pollingFailed
              ? 'Kết nối bị ngắt giữa lúc kiểm tra. Đơn của bạn vẫn an toàn — thử lại bên dưới.'
              : isDemo
                ? 'Chưa cấu hình MoMo, nên đơn chỉ chuyển sang đã thanh toán khi bạn xác nhận.'
                : 'Đang xác minh giao dịch với MoMo…' }}
          </p>
          <DsNote v-if="confirmError" tone="bad" class="w-full">{{ confirmError }}</DsNote>
          <DsButton v-if="isDemo" variant="buy" size="md" :loading="confirming" @click="confirmPayment">
            Xác nhận đã thanh toán (demo)
          </DsButton>
          <p class="num text-sm font-semibold">Đơn {{ orderCode || orderId }}</p>
          <DsButton v-if="pollingFailed" size="md" variant="outline" @click="poll">Kiểm tra lại</DsButton>
        </div>

        <details v-if="isDemo && demoQr && status !== 'SUCCESS'" class="border-rule mt-6 rounded-[var(--radius-md)] border">
          <summary class="text-muted-foreground cursor-pointer px-3 py-2.5 text-[13px] font-semibold [&::-webkit-details-marker]:hidden">
            Mã QR demo · chưa cấu hình MoMo
          </summary>
          <div class="grid justify-items-center gap-2 px-3 pb-4 text-center">
            <img :src="demoQr" :alt="`Mã QR demo mở đơn ${orderCode || orderId}`" class="size-[200px] rounded-[3px] border border-rule-strong">
            <p class="text-muted-foreground max-w-sm text-xs leading-5">
              Môi trường phát triển chưa có khoá MoMo, nên mã này chỉ mở trang đơn trên thiết bị khác — không phải giao dịch thật.
            </p>
          </div>
        </details>

        <div class="bg-rule my-6 h-px" role="separator" />
        <div class="flex flex-wrap justify-center gap-2.5">
          <DsButton to="/orders" variant="primary" size="md">Xem đơn</DsButton>
          <DsButton to="/" variant="outline" size="md">Về trang chủ</DsButton>
        </div>
      </div>
    </div>
  </section>
</template>
