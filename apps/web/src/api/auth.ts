import type { AxiosResponse } from 'axios'
import { apiClient } from './client'

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN'

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  role: UserRole
  createdAt?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  user: User
}

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload extends LoginPayload {
  fullName: string
  phone?: string
  role: 'BUYER' | 'SELLER'
  storeName?: string
}

const unwrap = <T>(response: AxiosResponse<T | { data: T }>): T => {
  const body = response.data
  return (body && typeof body === 'object' && 'data' in body ? body.data : body) as T
}

export const authApi = {
  async login(payload: LoginPayload) {
    return unwrap(await apiClient.post<AuthResponse>('/auth/login', payload))
  },
  async register(payload: RegisterPayload) {
    return unwrap(await apiClient.post<AuthResponse>('/auth/register', payload))
  },
  async me() {
    return unwrap(await apiClient.get<User>('/auth/me'))
  },
  async refresh(refreshToken: string) {
    return unwrap(await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }))
  },
  async logout(refreshToken?: string) {
    await apiClient.post('/auth/logout', { refreshToken })
  },
}
