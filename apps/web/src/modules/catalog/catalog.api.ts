import { apiClient } from '../../api/client'

export interface ProductImage { objectKey: string; altText?: string; position?: number }
export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  description?: string
  price: string
  compareAtPrice?: string
  stock: number
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
  categoryId?: string
  images: ProductImage[]
  category?: { name: string; slug: string }
  store?: { name: string; slug: string; logoKey?: string }
  createdAt?: string
}
export interface Category { id: string; name: string; slug: string; children?: Category[] }
export interface Store { id: string; name: string; slug: string; description?: string; logoKey?: string; bannerKey?: string; status?: string }
export interface InventoryEntry { id: string; type: string; quantity: number; before: number; after: number; reason?: string; createdAt: string }

export function hasMultipleStores(products: Product[]) {
  return new Set(products.map((product) => product.store?.slug).filter(Boolean)).size > 1
}

const unwrap = <T>(response: { data: { data: T } }) => response.data.data

export const catalogApi = {
  categories: () => apiClient.get('/categories').then(unwrap<Category[]>),
  products: (params?: Record<string, string>) => apiClient.get('/products', { params }).then(unwrap<Product[]>),
  product: (slug: string) => apiClient.get(`/products/${slug}`).then(unwrap<Product>),
}

export const sellerCatalogApi = {
  store: () => apiClient.get('/seller/store').then(unwrap<Store | null>),
  createStore: (input: { name: string; description?: string }) => apiClient.post('/seller/store', input).then(unwrap<Store>),
  updateStore: (input: { name?: string; description?: string; logoKey?: string }) => apiClient.patch('/seller/store', input).then(unwrap<Store>),
  products: (params?: Record<string, string>) => apiClient.get('/seller/products', { params }).then(unwrap<Product[]>),
  createProduct: (input: Record<string, unknown>) => apiClient.post('/seller/products', input).then(unwrap<Product>),
  updateProduct: (id: string, input: Record<string, unknown>) => apiClient.patch(`/seller/products/${id}`, input).then(unwrap<Product>),
  removeProduct: (id: string) => apiClient.delete(`/seller/products/${id}`),
  adjustInventory: (id: string, quantity: number, reason?: string) => apiClient.post(`/seller/products/${id}/inventory`, { quantity, reason }).then(unwrap<Product>),
  inventoryHistory: (id: string) => apiClient.get(`/seller/products/${id}/inventory`).then(unwrap<InventoryEntry[]>),
  createCategory: (name: string) => apiClient.post('/seller/categories', { name }).then(unwrap<Category>),
  presign: (fileName: string, contentType: string) => apiClient.post('/uploads/presign', { fileName, contentType }).then(unwrap<{ uploadUrl: string; objectKey: string; publicUrl?: string }>),
}
