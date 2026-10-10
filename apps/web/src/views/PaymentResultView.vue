<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ordersApi } from '../modules/orders/orders.api'
const route=useRoute(); const status=ref('PENDING'); const orderId=String(route.query.orderId ?? '')
onMounted(async()=>{ if(!orderId) return; for(let i=0;i<10;i++){ const payment=await ordersApi.paymentStatus(orderId); status.value=payment?.status ?? 'PENDING'; if(['SUCCESS','FAILED','REFUNDED'].includes(status.value)) break; await new Promise(resolve=>setTimeout(resolve,1500)) } })
</script>
<template><main class="page-shell"><section class="hero"><span class="eyebrow">MoMo</span><h1>Kết quả thanh toán</h1><p v-if="status==='SUCCESS'">Thanh toán thành công. Đơn hàng đang được xử lý.</p><p v-else-if="status==='FAILED'">Thanh toán thất bại. Bạn có thể thử thanh toán lại.</p><p v-else>Đang xác minh giao dịch với MoMo...</p><RouterLink to="/orders" class="primary-button">Xem đơn hàng</RouterLink></section></main></template>
