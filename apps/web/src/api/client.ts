import axios, { type InternalAxiosRequestConfig } from 'axios'

const TOKEN_KEY = 'cho-viet-access-token'
const REFRESH_KEY = 'cho-viet-refresh-token'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * One refresh at a time. Every request that hits 401 awaits the same promise, so a
 * page that fires five calls at once still rotates the token once.
 */
let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!refreshToken) return null
  try {
    // Plain axios: going through apiClient would re-enter this interceptor.
    const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, { refreshToken })
    const body = response.data?.data ?? response.data
    if (!body?.accessToken) return null
    localStorage.setItem(TOKEN_KEY, body.accessToken)
    if (body.refreshToken) localStorage.setItem(REFRESH_KEY, body.refreshToken)
    return body.accessToken as string
  } catch {
    return null
  }
}

type RetryableConfig = InternalAxiosRequestConfig & { retried?: boolean }

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined
    const status = error.response?.status
    const isRefreshCall = typeof config?.url === 'string' && config.url.includes('/auth/refresh')

    if (status !== 401 || !config || config.retried || isRefreshCall) {
      if (status === 401) window.dispatchEvent(new Event('auth:unauthorized'))
      return Promise.reject(error)
    }

    config.retried = true
    refreshing ??= refreshAccessToken().finally(() => { refreshing = null })
    const token = await refreshing
    if (!token) {
      window.dispatchEvent(new Event('auth:unauthorized'))
      return Promise.reject(error)
    }
    config.headers.Authorization = `Bearer ${token}`
    return apiClient(config)
  },
)

export { TOKEN_KEY, REFRESH_KEY }
