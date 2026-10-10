import type { AxiosResponse } from 'axios'
import { apiClient } from './client'

export interface Address {
  id: string
  recipientName: string
  phone: string
  province?: string
  city?: string
  district: string
  ward?: string
  street?: string
  line1?: string
  line2?: string
  postalCode?: string
  label?: string
  isDefault: boolean
}
export type AddressPayload = Omit<Address, 'id'>

const unwrap = <T>(response: AxiosResponse<T | { data: T }>): T => {
  const body = response.data
  return (body && typeof body === 'object' && 'data' in body ? body.data : body) as T
}

export const usersApi = {
  async updateProfile(payload: { fullName: string; phone?: string; avatarUrl?: string }) {
    return unwrap(await apiClient.patch('/users/me', payload))
  },
  async getAddresses() {
    return unwrap(await apiClient.get<Address[]>('/users/me/addresses'))
  },
  async createAddress(payload: AddressPayload) {
    return unwrap(await apiClient.post<Address>('/users/me/addresses', payload))
  },
  async updateAddress(id: string, payload: AddressPayload) {
    return unwrap(await apiClient.patch<Address>(`/users/me/addresses/${id}`, payload))
  },
  async deleteAddress(id: string) {
    await apiClient.delete(`/users/me/addresses/${id}`)
  },
  async setDefaultAddress(id: string) {
    return unwrap(await apiClient.patch<Address>(`/users/me/addresses/${id}/default`))
  },
}
