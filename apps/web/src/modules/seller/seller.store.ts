import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { sellerCatalogApi, type Product, type Store } from '../catalog/catalog.api'
import { sellerOrdersApi, type Order } from '../orders/orders.api'
import { sellerFinanceApi, type SellerSummary, type SellerWallet } from '../seller-finance/seller-finance.api'

/** API counts an order as waiting from PAID through PACKING (seller-finance summary). */
const WAITING = ['PAID', 'CONFIRMED', 'PACKING']
const LOW_STOCK = 5

export const useSellerStore = defineStore('seller', () => {
  const store = ref<Store | null>(null)
  const products = ref<Product[]>([])
  const orders = ref<Order[]>([])
  const summary = ref<SellerSummary | null>(null)
  const wallet = ref<SellerWallet | null>(null)
  const loaded = ref(false)
  const failure = ref('')

  const waitingOrders = computed(() => orders.value.filter((order) => WAITING.includes(order.status)))
  const lowStock = computed(() => products.value.filter((product) => product.status !== 'DRAFT' && product.stock <= LOW_STOCK))
  const liveProducts = computed(() => products.value.filter((product) => product.status === 'ACTIVE' || product.status === 'OUT_OF_STOCK'))

  async function refreshProducts() { products.value = await sellerCatalogApi.products() }
  async function refreshOrders() { orders.value = await sellerOrdersApi.list() }
  async function refreshSummary() { summary.value = await sellerFinanceApi.summary() }
  async function refreshWallet() { wallet.value = await sellerFinanceApi.wallet() }

  async function bootstrap() {
    failure.value = ''
    store.value = await sellerCatalogApi.store()
    if (store.value) {
      await Promise.all([refreshProducts(), refreshSummary(), refreshOrders(), refreshWallet()])
    }
    loaded.value = true
  }

  async function ensure() {
    if (!loaded.value) await bootstrap()
  }

  return {
    store, products, orders, summary, wallet, loaded, failure,
    waitingOrders, lowStock, liveProducts,
    bootstrap, ensure, refreshProducts, refreshOrders, refreshSummary, refreshWallet,
  }
})
