import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '/'), 
  timeout: 30000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  },
});

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
    const { code, msg, message, data, Data } = body as {
      code: number
      msg?: string
      message?: string
      data?: unknown
      Data?: unknown
    }
    const isSuccess = code === 1 || code === 200
    if (!isSuccess) {
      if (code === API_CODE_SESSION_EXPIRED) {
        scheduleSessionExpiredNavigationIfStillLoggedOut()
      }
      return Promise.reject(new Error(msg || message || `code ${code}`))
    }
    return data !== undefined ? data : Data
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
    if (body != null && typeof body === 'object' && 'code' in body) {
      const { msg, message } = body as { msg?: string; message?: string }
      return Promise.reject(new Error(msg || message || 'request failed'))
    }
    console.error('API Error:', error.response?.status)
    return Promise.reject(error)
  }
)

export async function bootstrapWorldcupAuth(_user: string): Promise<void> {
  await instance.post('/user/index', new FormData())
  cancelDeferredSessionExpiredNavigation()
}

export default instance;
