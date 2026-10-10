import { apiClient } from '../../api/client'
const unwrap = <T>(response: { data: { data: T } }) => response.data.data
export interface Order { id: string; code: string; status: string; subtotal: string; discountAmount: string; shippingAmount: string; totalAmount: string; items: { id: string; productName: string; quantity: number; unitPrice: string }[]; store: { name: string }; createdAt: string }
export const ordersApi = {
  list: () => apiClient.get('/orders').then(unwrap<Order[]>),
  checkout: (addressId: string, couponCode?: string) => apiClient.post('/orders', { addressId, couponCode: couponCode || undefined }).then(unwrap<Order>),
  cancel: (id: string) => apiClient.post(`/orders/${id}/cancel`).then(unwrap<Order>),
}
