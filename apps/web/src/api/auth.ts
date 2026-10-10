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

interface ApiUser extends Omit<User, 'fullName'> { name: string }
interface ApiAuthResponse extends Omit<AuthResponse, 'user'> { user: ApiUser }

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

const normalizeUser = (user: ApiUser): User => ({ ...user, fullName: user.name })
const normalizeAuth = (response: ApiAuthResponse): AuthResponse => ({ ...response, user: normalizeUser(response.user) })

export const authApi = {
  async login(payload: LoginPayload) {
    return normalizeAuth(unwrap(await apiClient.post<ApiAuthResponse>('/auth/login', payload)))
  },
  async register(payload: RegisterPayload) {
    const endpoint = payload.role === 'SELLER' ? '/auth/register/seller' : '/auth/register/buyer'
    const response = unwrap(await apiClient.post<ApiAuthResponse>(endpoint, {
      name: payload.fullName,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
    }))
    return normalizeAuth(response)
  },
  async me() {
    return normalizeUser(unwrap(await apiClient.get<ApiUser>('/users/me')))
  },
  async refresh(refreshToken: string) {
    return normalizeAuth(unwrap(await apiClient.post<ApiAuthResponse>('/auth/refresh', { refreshToken })))
  },
  async logout(refreshToken?: string) {
    await apiClient.post('/auth/logout', { refreshToken })
  },
}
