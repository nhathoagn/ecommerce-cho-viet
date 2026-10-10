<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { sellerCatalogApi, type Product, type Store } from '../modules/catalog/catalog.api'
import { sellerFinanceApi, type SellerSummary, type SellerWallet } from '../modules/seller-finance/seller-finance.api'

const store = ref<Store | null>(null)
const products = ref<Product[]>([])
const message = ref('')
const summary = ref<SellerSummary | null>(null)
const wallet = ref<SellerWallet | null>(null)
const storeForm = reactive({ name: '', description: '' })
const productForm = reactive({ name: '', sku: '', description: '', price: 0, stock: 0, status: 'ACTIVE', categoryId: '', imageKey: '' })
const withdrawalForm = reactive({ amount: 0, bankName: '', accountNumber: '', accountName: '' })
const money = (value: number | string) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))

async function load() {
  store.value = await sellerCatalogApi.store()
  if (store.value) {
    ;[products.value, summary.value, wallet.value] = await Promise.all([sellerCatalogApi.products(), sellerFinanceApi.summary(), sellerFinanceApi.wallet()])
  }
}
async function saveStore() { store.value = await sellerCatalogApi.createStore(storeForm); message.value = 'Đã tạo cửa hàng' }
async function createProduct() {
  const images = productForm.imageKey ? [{ objectKey: productForm.imageKey, altText: productForm.name, position: 0 }] : []
  await sellerCatalogApi.createProduct({ ...productForm, images, categoryId: productForm.categoryId || undefined })
  Object.assign(productForm, { name: '', sku: '', description: '', price: 0, stock: 0, status: 'ACTIVE', categoryId: '', imageKey: '' })
  products.value = await sellerCatalogApi.products(); message.value = 'Đã thêm sản phẩm'
}
async function adjust(product: Product, quantity: number) { await sellerCatalogApi.adjustInventory(product.id, quantity, 'Điều chỉnh từ dashboard'); products.value = await sellerCatalogApi.products() }
async function withdraw() {
  await sellerFinanceApi.withdraw(withdrawalForm)
  wallet.value = await sellerFinanceApi.wallet()
  summary.value = await sellerFinanceApi.summary()
  Object.assign(withdrawalForm, { amount: 0, bankName: '', accountNumber: '', accountName: '' })
  message.value = 'Đã gửi yêu cầu rút tiền'
}
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
      <div class="stats-grid"><article><span>Số dư khả dụng</span><strong>{{ money(summary?.availableBalance || 0) }}</strong></article><article><span>Doanh thu</span><strong>{{ money(summary?.grossRevenue || 0) }}</strong></article><article><span>Đơn cần xử lý</span><strong>{{ summary?.pendingOrderCount || 0 }}</strong></article><article><span>Sắp hết hàng</span><strong>{{ summary?.lowStockCount || 0 }}</strong></article></div>
      <div class="finance-grid">
        <form class="panel form-grid" @submit.prevent="withdraw"><h2>Rút tiền về ngân hàng</h2><input v-model.number="withdrawalForm.amount" required min="10000" type="number" placeholder="Số tiền" /><input v-model="withdrawalForm.bankName" required placeholder="Ngân hàng" /><input v-model="withdrawalForm.accountNumber" required placeholder="Số tài khoản" /><input v-model="withdrawalForm.accountName" required placeholder="Tên chủ tài khoản" /><button class="primary-button">Gửi yêu cầu</button></form>
        <div class="panel"><h2>Biến động số dư</h2><div v-if="!wallet?.transactions.length" class="empty-state">Chưa có giao dịch</div><div v-for="item in wallet?.transactions" :key="item.id" class="seller-product"><div><strong>{{ item.description }}</strong><span>{{ new Date(item.createdAt).toLocaleString('vi-VN') }}</span></div><b :class="Number(item.amount) >= 0 ? 'credit' : 'debit'">{{ money(item.amount) }}</b></div></div>
      </div>
      <form class="panel form-grid" @submit.prevent="createProduct"><h2>Thêm sản phẩm</h2><input v-model="productForm.name" required placeholder="Tên sản phẩm" /><input v-model="productForm.sku" required placeholder="SKU" /><textarea v-model="productForm.description" placeholder="Mô tả" /><input v-model.number="productForm.price" required min="0" type="number" placeholder="Giá" /><input v-model.number="productForm.stock" min="0" type="number" placeholder="Tồn kho" /><input type="file" accept="image/png,image/jpeg,image/webp" @change="upload" /><button class="primary-button">Đăng sản phẩm</button></form>
      <div class="panel"><h2>Sản phẩm của bạn</h2><div class="seller-product" v-for="product in products" :key="product.id"><div><strong>{{ product.name }}</strong><span>{{ product.sku }} · {{ product.status }}</span></div><div class="stock-actions"><button @click="adjust(product, -1)">−</button><b>{{ product.stock }}</b><button @click="adjust(product, 1)">+</button></div></div></div>
    </template>
  </section>
</template>

<style scoped>
.finance-grid { display: grid; grid-template-columns: minmax(280px, .8fr) minmax(320px, 1.2fr); gap: 20px; margin: 20px 0; }
.credit { color: #00b14f; }
.debit { color: #d92d20; }
.empty-state { color: #667085; padding: 24px 0; }
@media (max-width: 800px) { .finance-grid { grid-template-columns: 1fr; } }
</style>
