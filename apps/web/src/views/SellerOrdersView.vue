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
const filter = ref('WAITING')
const openId = ref('')
const busy = ref('')
const error = ref('')

const filters = [
  { key: 'WAITING', label: 'Cần xử lý', match: ['PAID', 'CONFIRMED', 'PACKING', 'REFUND_REQUESTED'] },
  { key: 'SHIPPING', label: 'Đang giao', match: ['SHIPPING', 'DELIVERED'] },
  { key: 'COMPLETED', label: 'Hoàn tất', match: ['COMPLETED'] },
  { key: 'CANCELLED', label: 'Đã huỷ', match: ['CANCELLED', 'REFUNDED'] },
  { key: 'ALL', label: 'Tất cả', match: null },
]

const rows = computed(() => {
  const active = filters.find((item) => item.key === filter.value)
  if (!active?.match) return seller.orders
  return seller.orders.filter((order) => active.match!.includes(order.status))
})

const addressOf = (order: Order) => {
  const address = order.shippingAddress
  if (!address) return 'Không có địa chỉ'
  return [address.line1, address.ward, address.district, address.city, address.phone].filter(Boolean).join(', ')
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
  <div class="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5">
    <BasePaper class="overflow-hidden">
      <header class="border-rule flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <h2 class="text-lg">Đơn bán</h2>
        <nav class="flex flex-wrap gap-1.5" aria-label="Lọc đơn">
          <button
            v-for="item in filters"
            :key="item.key"
            type="button"
            class="rounded-[var(--radius)] border px-2.5 py-1.5 text-[12px] font-semibold transition"
            :class="filter === item.key ? 'border-accent bg-accent text-accent-foreground' : 'border-rule-strong text-muted-foreground hover:text-foreground'"
            @click="filter = item.key"
          >{{ item.label }}</button>
        </nav>
      </header>

      <div class="px-4 py-3">
        <BaseNote v-if="error" tone="bad" class="mb-3">{{ error }}</BaseNote>

        <BaseEmpty v-if="!rows.length" class="border-0">
          <p class="text-[15px] font-bold">Không có đơn trong nhóm này</p>
          <p class="text-muted-foreground max-w-xs text-xs leading-relaxed">Đổi bộ lọc hoặc chờ đơn mới từ người mua.</p>
        </BaseEmpty>

        <ul v-else>
          <li v-for="order in rows" :key="order.id" class="border-rule border-b py-3 last:border-0">
            <div class="flex flex-wrap items-center gap-3">
              <div class="min-w-0 flex-1">
                <p class="num text-sm font-bold">{{ order.code }}</p>
                <p class="text-muted-foreground truncate text-xs">{{ order.shippingAddress?.recipientName || 'Khách lẻ' }} · {{ addressOf(order) }}</p>
                <p class="num text-muted-foreground mt-1 text-[11px]">{{ new Date(order.createdAt).toLocaleString('vi-VN') }}</p>
              </div>
              <StatusPill :status="order.status" />
              <p class="num text-sm font-bold">{{ money(order.totalAmount) }}</p>
              <BaseButton v-if="nextStatus[order.status]" variant="outline" size="sm" :disabled="busy === order.id" @click="advance(order)">
                {{ busy === order.id ? 'Đang cập nhật…' : nextStatus[order.status]!.label }}
              </BaseButton>
              <BaseButton variant="quiet" size="sm" @click="openId = openId === order.id ? '' : order.id">
                {{ openId === order.id ? 'Thu gọn' : 'Chi tiết' }}
              </BaseButton>
            </div>

            <div v-if="openId === order.id" class="bg-secondary mt-3 grid gap-4 rounded-[var(--radius)] p-4 sm:grid-cols-2">
              <div>
                <p class="label-xs text-muted-foreground">Món trong đơn</p>
                <ul class="mt-1.5">
                  <li v-for="item in order.items" :key="item.id" class="flex items-center justify-between gap-3 py-1 text-sm">
                    <span class="min-w-0 truncate">{{ item.productName }} × {{ item.quantity }}</span>
                    <span class="num shrink-0">{{ money(Number(item.unitPrice) * item.quantity) }}</span>
                  </li>
                </ul>
                <div class="border-rule mt-2 grid gap-1 border-t pt-2 text-sm">
                  <p class="flex justify-between gap-3"><span class="text-muted-foreground">Tạm tính</span><span class="num">{{ money(order.subtotal) }}</span></p>
                  <p v-if="Number(order.discountAmount) > 0" class="flex justify-between gap-3"><span class="text-muted-foreground">Giảm giá</span><span class="num">−{{ money(order.discountAmount) }}</span></p>
                  <p class="flex justify-between gap-3"><span class="text-muted-foreground">Phí giao</span><span class="num">{{ money(order.shippingAmount) }}</span></p>
                  <p class="flex justify-between gap-3 font-bold"><span>Tổng</span><span class="num">{{ money(order.totalAmount) }}</span></p>
                </div>
              </div>
              <div>
                <p class="label-xs text-muted-foreground">Giao đến</p>
                <p class="mt-1.5 text-sm leading-relaxed">{{ addressOf(order) }}</p>
                <p v-if="order.couponCode" class="text-muted-foreground mt-1 text-xs">Mã: {{ order.couponCode }}</p>
                <p class="label-xs text-muted-foreground mt-4">Lịch sử trạng thái</p>
                <ul class="mt-1.5 grid gap-1.5 text-xs">
                  <li v-for="entry in order.statusHistory" :key="entry.id" class="flex items-center justify-between gap-3">
                    <StatusPill :status="entry.status" />
                    <span class="num text-muted-foreground">{{ new Date(entry.createdAt).toLocaleString('vi-VN') }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </BasePaper>
  </div>
</template>
