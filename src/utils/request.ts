import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '/'), 
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  },
});

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.data instanceof FormData) {
    const headers = AxiosHeaders.from(config.headers)
    headers.delete('Content-Type')
    config.headers = headers
  }
  return config
})

/** 後端業務 code：例如 4 表示登入失效，應導向登入失效頁 */
export const API_CODE_SESSION_EXPIRED = 4

/** code 4 導向失效頁延後，讓 bootstrapWorldcupAuth 等有機會重新登入後取消 */
let sessionExpiredNavTimer: ReturnType<typeof setTimeout> | null = null

export function cancelDeferredSessionExpiredNavigation() {
  if (sessionExpiredNavTimer != null) {
    clearTimeout(sessionExpiredNavTimer)
    sessionExpiredNavTimer = null
  }
}

function scheduleSessionExpiredNavigationIfStillLoggedOut() {
  cancelDeferredSessionExpiredNavigation()
  sessionExpiredNavTimer = setTimeout(() => {
    sessionExpiredNavTimer = null
    window.dispatchEvent(new CustomEvent('worldcup:session-expired'))
  }, 1000)
}

function unwrapApiBody(body: unknown) {
  if (body != null && typeof body === 'object' && 'code' in body) {
    const b = body as Record<string, unknown> & {
      code: number
      msg?: string
      message?: string
      data?: unknown
    }
    const payload =
      b.data !== undefined ? b.data : b.Data !== undefined ? b.Data : undefined
    const errText =
      (typeof b.msg === 'string' && b.msg) ||
      (typeof b.message === 'string' && b.message) ||
      (typeof b.Message === 'string' ? b.Message : '') ||
      ''
    const isSuccess = b.code === 1 || b.code === 200
    if (!isSuccess) {
      if (b.code === API_CODE_SESSION_EXPIRED) {
        scheduleSessionExpiredNavigationIfStillLoggedOut()
      }
      return Promise.reject(new Error(errText || `code ${b.code}`))
    }
    return payload
  }
  return body
}

instance.interceptors.response.use(
  async (response) => {
    const cfg = response.config as { skipUnwrap?: boolean }
    if (cfg.skipUnwrap) return response
    const unwrapped = await Promise.resolve(unwrapApiBody(response.data))
    response.data = unwrapped as typeof response.data
    return response
  },
  (error) => {
    const body = error.response?.data
    if (body != null && typeof body === 'object') {
      const o = body as { code?: unknown; msg?: string; message?: string; Message?: string }
      if ('code' in o) {
        const msg =
          (typeof o.msg === 'string' && o.msg) ||
          (typeof o.message === 'string' && o.message) ||
          (typeof o.Message === 'string' ? o.Message : '') ||
          ''
        return Promise.reject(new Error(msg || 'request failed'))
      }
      const loose =
        (typeof o.msg === 'string' && o.msg) ||
        (typeof o.message === 'string' && o.message) ||
        (typeof o.Message === 'string' ? o.Message : '')
      if (loose) return Promise.reject(new Error(loose))
    }
    console.error('API Error:', error.response?.status)
    return Promise.reject(error)
  }
)

export async function bootstrapWorldcupAuth(user: string): Promise<void> {
  const formData = new FormData()
  if (user) {
    formData.append('user', user)
  }
  await instance.post('/user/index', formData)
  cancelDeferredSessionExpiredNavigation()
}

export default instance;
