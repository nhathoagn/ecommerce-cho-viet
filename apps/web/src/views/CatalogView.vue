<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { catalogApi, type Category, type Product } from '../modules/catalog/catalog.api'

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const search = ref('')
const selectedCategory = ref('')
const loading = ref(false)

async function loadProducts() {
  loading.value = true
  products.value = await catalogApi.products({
    ...(search.value ? { search: search.value } : {}),
    ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
  })
  loading.value = false
}

onMounted(async () => {
  categories.value = await catalogApi.categories()
  await loadProducts()
})

const money = (value: string) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
</script>

<template>
  <section class="market-section">
    <div class="section-heading"><div><span class="eyebrow">Chợ Việt</span><h1>Khám phá sản phẩm</h1></div></div>
    <form class="catalog-toolbar" @submit.prevent="loadProducts">
      <input v-model="search" placeholder="Tìm sản phẩm Việt..." />
      <select v-model="selectedCategory"><option value="">Tất cả danh mục</option><option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.name }}</option></select>
      <button class="primary-button">Tìm kiếm</button>
    </form>
    <p v-if="loading">Đang tải sản phẩm...</p>
    <div v-else class="product-grid">
      <RouterLink v-for="product in products" :key="product.id" :to="`/products/${product.slug}`" class="product-card">
        <div class="product-image">{{ product.images[0] ? 'Ảnh sản phẩm' : 'Chợ Việt' }}</div>
        <div class="product-content"><small>{{ product.store?.name }}</small><h3>{{ product.name }}</h3><strong>{{ money(product.price) }}</strong><span>Còn {{ product.stock }} sản phẩm</span></div>
      </RouterLink>
    </div>
    <div v-if="!loading && !products.length" class="empty-state">Chưa có sản phẩm phù hợp.</div>
  </section>
</template>
