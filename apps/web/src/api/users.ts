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

function addressBody(payload: AddressPayload) {
  const { street, province, line1, city, label: _label, ...rest } = payload
  return { ...rest, line1: line1 || street || '', city: city || province || '' }
}

export const usersApi = {
  async updateProfile(payload: { fullName: string; phone?: string; avatarUrl?: string }) {
    return unwrap(await apiClient.patch('/users/me', {
      name: payload.fullName,
      phone: payload.phone,
      avatarUrl: payload.avatarUrl,
    }))
  },
  async getAddresses() {
    const addresses = unwrap(await apiClient.get<Address[]>('/users/me/addresses'))
    return addresses.map((address) => ({
      ...address,
      street: address.street || address.line1,
      province: address.province || address.city,
    }))
  },
  async createAddress(payload: AddressPayload) {
    const address = unwrap(await apiClient.post<Address>('/users/me/addresses', addressBody(payload)))
    return { ...address, street: address.line1, province: address.city }
  },
  async updateAddress(id: string, payload: AddressPayload) {
    const address = unwrap(await apiClient.patch<Address>(`/users/me/addresses/${id}`, addressBody(payload)))
    return { ...address, street: address.line1, province: address.city }
  },
  async deleteAddress(id: string) {
    await apiClient.delete(`/users/me/addresses/${id}`)
  },
  async setDefaultAddress(id: string) {
    return unwrap(await apiClient.patch<Address>(`/users/me/addresses/${id}/default`))
  },
}
