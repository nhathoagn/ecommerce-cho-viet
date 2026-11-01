<script setup lang="ts">
import { computed } from 'vue'
import BasePill from '@/components/base/BasePill.vue'

const props = defineProps<{ status?: string; stock?: number }>()

type Tone = 'neutral' | 'ok' | 'warn' | 'bad'

// Paper-and-ink states: ok = live, warn = needs eyes, bad = closed, neutral = waiting.
const statuses: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Nháp', tone: 'neutral' },
  ACTIVE: { label: 'Đang bán', tone: 'ok' },
  INACTIVE: { label: 'Đã ẩn', tone: 'neutral' },
  OUT_OF_STOCK: { label: 'Hết hàng', tone: 'warn' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', tone: 'neutral' },
  PAID: { label: 'Đã thanh toán', tone: 'ok' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'neutral' },
  PACKING: { label: 'Đang đóng gói', tone: 'neutral' },
  SHIPPING: { label: 'Đang giao', tone: 'neutral' },
  DELIVERED: { label: 'Đã giao', tone: 'ok' },
  COMPLETED: { label: 'Hoàn tất', tone: 'ok' },
  CANCELLED: { label: 'Đã huỷ', tone: 'bad' },
  REFUND_REQUESTED: { label: 'Yêu cầu hoàn tiền', tone: 'warn' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'neutral' },
}

const isStock = computed(() => props.stock !== undefined)
const label = computed(() => {
  if (isStock.value) return props.stock! <= 0 ? 'Hết hàng' : `Còn ${props.stock}`
  return statuses[props.status ?? '']?.label ?? props.status ?? ''
})
const tone = computed<Tone>(() => {
  if (isStock.value) return props.stock! <= 0 ? 'bad' : props.stock! <= 5 ? 'warn' : 'neutral'
  return statuses[props.status ?? '']?.tone ?? 'neutral'
})
</script>

<template>
  <BasePill :tone="tone" class="num">{{ label }}</BasePill>
</template>
