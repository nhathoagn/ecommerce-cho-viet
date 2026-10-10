import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiClient } from '../../api/client'
import type { Product } from '../catalog/catalog.api'

export interface CartItem { id: string; quantity: number; product: Product }
interface Cart { id: string; items: CartItem[] }
const unwrap = <T>(response: { data: { data: T } }) => response.data.data

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const items = computed(() => cart.value?.items ?? [])
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const total = computed(() => items.value.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0))
  async function load() { cart.value = await apiClient.get('/cart').then(unwrap<Cart>) }
  async function add(productId: string, quantity = 1) { cart.value = await apiClient.post('/cart/items', { productId, quantity }).then(unwrap<Cart>) }
  async function update(id: string, quantity: number) { cart.value = await apiClient.patch(`/cart/items/${id}`, { quantity }).then(unwrap<Cart>) }
  async function remove(id: string) { cart.value = await apiClient.delete(`/cart/items/${id}`).then(unwrap<Cart>) }
  async function clear() { cart.value = await apiClient.delete('/cart').then(unwrap<Cart>) }
  return { cart, items, count, total, load, add, update, remove, clear }
})
