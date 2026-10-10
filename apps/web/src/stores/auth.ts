import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi, type LoginPayload, type RegisterPayload, type User } from '../api/auth'
import { TOKEN_KEY } from '../api/client'

const REFRESH_KEY = 'cho-viet-refresh-token'
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
    catch { clear() }
  }

  async function logout() {
    const refreshToken = localStorage.getItem(REFRESH_KEY) ?? undefined
    clear()
    try { await authApi.logout(refreshToken) } catch { /* Session is already cleared locally. */ }
  }

  function setUser(value: User) { user.value = value; localStorage.setItem(USER_KEY, JSON.stringify(value)) }

  return { user, token, loading, error, isAuthenticated, isSeller, login, register, logout, fetchUser, clear, setUser }
})

function messageOf(reason: unknown) {
  if (typeof reason === 'object' && reason && 'response' in reason) {
    const response = (reason as { response?: { data?: { message?: string } } }).response
    return response?.data?.message ?? 'Không thể kết nối. Vui lòng thử lại.'
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}
