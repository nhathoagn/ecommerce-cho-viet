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
  store?: { name: string; slug: string; logoKey?: string }
}
export interface Category { id: string; name: string; slug: string; children?: Category[] }
export interface Store { id: string; name: string; slug: string; description?: string; logoKey?: string }

const unwrap = <T>(response: { data: { data: T } }) => response.data.data

export const catalogApi = {
  categories: () => apiClient.get('/categories').then(unwrap<Category[]>),
  products: (params?: Record<string, string>) => apiClient.get('/products', { params }).then(unwrap<Product[]>),
  product: (slug: string) => apiClient.get(`/products/${slug}`).then(unwrap<Product>),
}

export const sellerCatalogApi = {
  store: () => apiClient.get('/seller/store').then(unwrap<Store | null>),
  createStore: (input: { name: string; description?: string }) => apiClient.post('/seller/store', input).then(unwrap<Store>),
  products: () => apiClient.get('/seller/products').then(unwrap<Product[]>),
  createProduct: (input: Record<string, unknown>) => apiClient.post('/seller/products', input).then(unwrap<Product>),
  updateProduct: (id: string, input: Record<string, unknown>) => apiClient.patch(`/seller/products/${id}`, input).then(unwrap<Product>),
  adjustInventory: (id: string, quantity: number, reason?: string) => apiClient.post(`/seller/products/${id}/inventory`, { quantity, reason }).then(unwrap<Product>),
  createCategory: (name: string) => apiClient.post('/seller/categories', { name }).then(unwrap<Category>),
  presign: (fileName: string, contentType: string) => apiClient.post('/uploads/presign', { fileName, contentType }).then(unwrap<{ uploadUrl: string; objectKey: string; publicUrl?: string }>),
}
