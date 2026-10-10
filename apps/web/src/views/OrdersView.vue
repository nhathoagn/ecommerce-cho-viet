<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ordersApi, type Order } from '../modules/orders/orders.api'
const orders=ref<Order[]>([]); onMounted(async()=>{ orders.value=await ordersApi.list() })
const money=(value:string)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(Number(value))
async function cancel(order:Order){ await ordersApi.cancel(order.id); orders.value=await ordersApi.list() }
</script>
<template><section class="market-section"><span class="eyebrow">Đơn hàng</span><h1>Lịch sử mua hàng</h1><div v-if="!orders.length" class="empty-state">Bạn chưa có đơn hàng.</div><article v-for="order in orders" :key="order.id" class="panel order-card"><div><strong>{{ order.code }}</strong><p>{{ order.store.name }} · {{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</p></div><span class="success-pill">{{ order.status }}</span><ul><li v-for="item in order.items" :key="item.id">{{ item.productName }} × {{ item.quantity }}</li></ul><strong>{{ money(order.totalAmount) }}</strong><button v-if="['PENDING_PAYMENT','PAID','CONFIRMED'].includes(order.status)" class="remove-button" @click="cancel(order)">Hủy đơn</button></article></section></template>
