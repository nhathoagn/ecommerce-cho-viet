import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi, type LoginPayload, type RegisterPayload, type User } from '../api/auth'
import { REFRESH_KEY, TOKEN_KEY } from '../api/client'

const USER_KEY = 'cho-viet-user'

function savedUser(): User | null {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as User | null } catch { return null }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(savedUser())
  const token = ref(localStorage.getItem(TOKEN_KEY))
  const loading = ref(false)
  const error = ref('')
  const isAuthenticated = computed(() => Boolean(token.value))
  const isSeller = computed(() => user.value?.role === 'SELLER')

  function persist(accessToken: string, currentUser: User, refreshToken?: string) {
    token.value = accessToken
    user.value = currentUser
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  }

  function clear() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  }

  async function login(payload: LoginPayload) {
    loading.value = true; error.value = ''
    try { const result = await authApi.login(payload); persist(result.accessToken, result.user, result.refreshToken) }
    catch (reason: unknown) { error.value = messageOf(reason); throw reason }
    finally { loading.value = false }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true; error.value = ''
    try { const result = await authApi.register(payload); persist(result.accessToken, result.user, result.refreshToken) }
    catch (reason: unknown) { error.value = messageOf(reason); throw reason }
    finally { loading.value = false }
  }

  async function fetchUser() {
    if (!token.value) return
    try { user.value = await authApi.me(); localStorage.setItem(USER_KEY, JSON.stringify(user.value)) }
    catch (reason: unknown) { if (statusOf(reason) === 401) clear() }
  }

  /** Bootstraps the session once; the router awaits this so a role guard sees the real user. */
  let booted: Promise<void> | null = null
  function ready() {
    booted ??= fetchUser()
    return booted
  }

  async function logout() {
    const refreshToken = localStorage.getItem(REFRESH_KEY) ?? undefined
    clear()
    try { await authApi.logout(refreshToken) } catch { /* Session is already cleared locally. */ }
  }

  function setUser(value: User) { user.value = value; localStorage.setItem(USER_KEY, JSON.stringify(value)) }

  return { user, token, loading, error, isAuthenticated, isSeller, login, register, logout, fetchUser, ready, clear, setUser }
})

function apiMessage(value: unknown): string {
  if (!value || typeof value !== 'object' || !('response' in value)) return ''
  const response = value.response
  if (!response || typeof response !== 'object' || !('data' in response)) return ''
  const data = response.data
  if (!data || typeof data !== 'object') return ''
  const nested = 'error' in data && data.error && typeof data.error === 'object' && 'message' in data.error
    ? data.error.message
    : 'message' in data
      ? data.message
      : undefined
  if (typeof nested === 'string' && nested) return nested
  if (Array.isArray(nested)) return nested.filter((item) => typeof item === 'string').join(' ')
  return ''
}

const knownErrors: Record<string, string> = {
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'Account is suspended': 'Tài khoản đã bị khóa.',
  'Cart is empty': 'Giỏ hàng đang trống. Thêm sản phẩm rồi thử lại.',
  'Coupon is not valid': 'Mã giảm giá không hợp lệ hoặc đã hết lượt.',
  'Shipping address not found': 'Không tìm thấy địa chỉ giao hàng.',
  'MoMo gateway unavailable': 'Không kết nối được MoMo. Thử lại sau.',
  'MoMo rejected payment request': 'MoMo từ chối giao dịch. Kiểm tra cấu hình thanh toán.',
  'Order is not awaiting payment': 'Đơn hàng không còn chờ thanh toán.',
  'Checkout supports one store at a time': 'Mỗi lần thanh toán chỉ được mua từ một gian hàng.',
}

/** Every user-facing error is Vietnamese: the API speaks English, the UI never does. */
export function messageOf(reason: unknown) {
  const status = statusOf(reason)
  if (status === undefined) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 404) return 'Không tìm thấy dữ liệu. Có thể mục này đã bị xoá.'
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Thử lại sau ít phút.'

  const message = apiMessage(reason)
  if (message.startsWith('Insufficient stock for '))
    return `Không đủ tồn kho cho ${message.slice('Insufficient stock for '.length)}.`
  return knownErrors[message] ?? 'Không thực hiện được. Vui lòng thử lại.'
}

function statusOf(reason: unknown): number | undefined {
  if (!reason || typeof reason !== 'object' || !('response' in reason)) return
  const response = reason.response
  if (!response || typeof response !== 'object' || !('status' in response)) return
  return typeof response.status === 'number' ? response.status : undefined
}
