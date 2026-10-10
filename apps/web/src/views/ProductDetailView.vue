<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { catalogApi, type Product } from '../modules/catalog/catalog.api'
import { useCartStore } from '../modules/cart/cart.store'
const route = useRoute()
const product = ref<Product | null>(null)
const cart = useCartStore()
const added = ref(false)
onMounted(async () => { product.value = await catalogApi.product(String(route.params.slug)) })
async function addToCart() { if (!product.value) return; await cart.add(product.value.id); added.value = true }
const money = (value: string) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
</script>
<template>
  <section v-if="product" class="product-detail">
    <div class="product-detail-image">Chợ Việt Marketplace</div>
    <div><span class="eyebrow">{{ product.store?.name }}</span><h1>{{ product.name }}</h1><p>{{ product.description }}</p><div class="detail-price">{{ money(product.price) }}</div><p>Tồn kho: {{ product.stock }}</p><button class="primary-button" @click="addToCart">{{ added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng' }}</button></div>
  </section>
</template>
