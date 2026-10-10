<script setup lang="ts">
import { onMounted } from 'vue'
import { useCartStore } from '../modules/cart/cart.store'
const cart = useCartStore()
onMounted(cart.load)
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
</script>
<template>
  <section class="market-section cart-page">
    <div class="section-heading"><div><span class="eyebrow">Giỏ hàng</span><h1>Sản phẩm đã chọn</h1></div><button v-if="cart.items.length" class="link-button" @click="cart.clear">Xóa tất cả</button></div>
    <div v-if="!cart.items.length" class="empty-state">Giỏ hàng của bạn đang trống. <RouterLink to="/products">Khám phá sản phẩm</RouterLink></div>
    <div v-else class="cart-layout"><div class="panel"><article v-for="item in cart.items" :key="item.id" class="cart-item"><div class="cart-thumb">Chợ Việt</div><div><h3>{{ item.product.name }}</h3><p>{{ item.product.store?.name }}</p><strong>{{ money(Number(item.product.price)) }}</strong></div><div class="stock-actions"><button :disabled="item.quantity <= 1" @click="cart.update(item.id, item.quantity - 1)">−</button><b>{{ item.quantity }}</b><button :disabled="item.quantity >= item.product.stock" @click="cart.update(item.id, item.quantity + 1)">+</button></div><button class="remove-button" @click="cart.remove(item.id)">Xóa</button></article></div><aside class="panel cart-summary"><h2>Tóm tắt đơn hàng</h2><p><span>Số lượng</span><b>{{ cart.count }}</b></p><p><span>Tổng cộng</span><strong>{{ money(cart.total) }}</strong></p><RouterLink to="/checkout" class="primary-button">Tiến hành thanh toán</RouterLink></aside></div>
  </section>
</template>
