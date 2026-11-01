import { apiClient } from '../../api/client'

export interface OrderItem { id: string; productName: string; quantity: number; unitPrice: string }
export interface ShippingAddress {
  recipientName?: string
  phone?: string
  line1?: string
  ward?: string
  district?: string
  city?: string
}
export interface Order {
  id: string
  code: string
  status: string
  subtotal: string
  discountAmount: string
  shippingAmount: string
  totalAmount: string
  items: OrderItem[]
  store: { name: string }
  createdAt: string
  couponCode?: string
  shippingAddress?: ShippingAddress
  statusHistory?: { id: string; status: string; note?: string; createdAt: string }[]
}

const unwrap = <T>(response: { data: { data: T } }) => response.data.data

/** Seller-side transitions the API accepts; the next step a seller can take from a status. */
export const nextStatus: Record<string, { status: string; label: string } | undefined> = {
  PAID: { status: 'CONFIRMED', label: 'Xác nhận đơn' },
  CONFIRMED: { status: 'PACKING', label: 'Bắt đầu đóng gói' },
  PACKING: { status: 'SHIPPING', label: 'Giao cho vận chuyển' },
  SHIPPING: { status: 'DELIVERED', label: 'Đã giao' },
  DELIVERED: { status: 'COMPLETED', label: 'Hoàn tất' },
  REFUND_REQUESTED: { status: 'REFUNDED', label: 'Xác nhận hoàn tiền' },
}

export const ordersApi = {
  list: () => apiClient.get('/orders').then(unwrap<Order[]>),
  checkout: (addressId: string, couponCode?: string) => apiClient.post('/orders', { addressId, couponCode: couponCode || undefined }).then(unwrap<Order>),
  detail: (id: string) => apiClient.get(`/orders/${id}`).then(unwrap<Order>),
  cancel: (id: string) => apiClient.post(`/orders/${id}/cancel`).then(unwrap<Order>),
  createMomoPayment: (id: string) => apiClient.post(`/payments/momo/create/${id}`).then(unwrap<{ payUrl: string }>),
  /** Dev only: confirms a MoMo-less payment; the API refuses once real keys exist. */
  confirmDemoPayment: (id: string) => apiClient.post(`/payments/${id}/confirm`).then(unwrap<{ id: string; status: string }>),
  paymentStatus: (id: string) => apiClient.get(`/payments/${id}/status`).then(unwrap<{ status: string; payUrl: string | null } | null>),
}

export const sellerOrdersApi = {
  list: () => apiClient.get('/seller/orders').then(unwrap<Order[]>),
  updateStatus: (id: string, status: string, note?: string) =>
    apiClient.patch(`/seller/orders/${id}/status`, { status, note }).then(unwrap<Order>),
}
