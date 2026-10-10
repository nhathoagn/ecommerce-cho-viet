<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { sellerCatalogApi, type Product, type Store } from '../modules/catalog/catalog.api'

const store = ref<Store | null>(null)
const products = ref<Product[]>([])
const message = ref('')
const storeForm = reactive({ name: '', description: '' })
const productForm = reactive({ name: '', sku: '', description: '', price: 0, stock: 0, status: 'ACTIVE', categoryId: '', imageKey: '' })

async function load() { store.value = await sellerCatalogApi.store(); if (store.value) products.value = await sellerCatalogApi.products() }
async function saveStore() { store.value = await sellerCatalogApi.createStore(storeForm); message.value = 'Đã tạo cửa hàng' }
async function createProduct() {
  const images = productForm.imageKey ? [{ objectKey: productForm.imageKey, altText: productForm.name, position: 0 }] : []
  await sellerCatalogApi.createProduct({ ...productForm, images, categoryId: productForm.categoryId || undefined })
  Object.assign(productForm, { name: '', sku: '', description: '', price: 0, stock: 0, status: 'ACTIVE', categoryId: '', imageKey: '' })
  products.value = await sellerCatalogApi.products(); message.value = 'Đã thêm sản phẩm'
}
async function adjust(product: Product, quantity: number) { await sellerCatalogApi.adjustInventory(product.id, quantity, 'Điều chỉnh từ dashboard'); products.value = await sellerCatalogApi.products() }
async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return
  const signed = await sellerCatalogApi.presign(file.name, file.type)
  await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'content-type': file.type }, body: file })
  productForm.imageKey = signed.objectKey; message.value = 'Đã tải ảnh lên R2'
}
onMounted(load)
</script>

<template>
  <section class="seller-shell">
    <div class="seller-hero"><div><span class="eyebrow">Kênh người bán</span><h1>Quản lý gian hàng</h1></div><span v-if="message" class="success-pill">{{ message }}</span></div>
    <form v-if="!store" class="panel form-grid" @submit.prevent="saveStore"><h2>Tạo cửa hàng</h2><input v-model="storeForm.name" required placeholder="Tên cửa hàng" /><textarea v-model="storeForm.description" placeholder="Mô tả cửa hàng" /><button class="primary-button">Bắt đầu bán hàng</button></form>
    <template v-else>
      <div class="stats-grid"><article><span>Cửa hàng</span><strong>{{ store.name }}</strong></article><article><span>Sản phẩm</span><strong>{{ products.length }}</strong></article><article><span>Tổng tồn kho</span><strong>{{ products.reduce((sum, item) => sum + item.stock, 0) }}</strong></article></div>
      <form class="panel form-grid" @submit.prevent="createProduct"><h2>Thêm sản phẩm</h2><input v-model="productForm.name" required placeholder="Tên sản phẩm" /><input v-model="productForm.sku" required placeholder="SKU" /><textarea v-model="productForm.description" placeholder="Mô tả" /><input v-model.number="productForm.price" required min="0" type="number" placeholder="Giá" /><input v-model.number="productForm.stock" min="0" type="number" placeholder="Tồn kho" /><input type="file" accept="image/png,image/jpeg,image/webp" @change="upload" /><button class="primary-button">Đăng sản phẩm</button></form>
      <div class="panel"><h2>Sản phẩm của bạn</h2><div class="seller-product" v-for="product in products" :key="product.id"><div><strong>{{ product.name }}</strong><span>{{ product.sku }} · {{ product.status }}</span></div><div class="stock-actions"><button @click="adjust(product, -1)">−</button><b>{{ product.stock }}</b><button @click="adjust(product, 1)">+</button></div></div></div>
    </template>
  </section>
</template>
