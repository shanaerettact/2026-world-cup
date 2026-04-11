import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '/'), 
  timeout: 30000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  },
});

function shouldAttachMemId(config: import('axios').InternalAxiosRequestConfig) {
  const extra = config as { skipAuthMemId?: boolean }
  if (extra.skipAuthMemId) return false
  const path = (config.url || '').split('?')[0]
  if (/\/test\/login\b/.test(path)) return false
  return true
}

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && shouldAttachMemId(config)) {
      config.headers.Authorization = `Bearer ${token}`
      if (config.params instanceof URLSearchParams) {
        config.params.set('MemID', token)
      } else {
        const prev =
          config.params != null &&
          typeof config.params === 'object' &&
          !Array.isArray(config.params)
            ? (config.params as Record<string, unknown>)
            : {}
        config.params = { ...prev, MemID: token }
      }
      if (config.data instanceof FormData && !config.data.has('MemID')) {
        config.data.append('MemID', token)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

function unwrapApiBody(body: unknown) {
  if (body != null && typeof body === 'object' && 'code' in body) {
    const { code, msg, message, data } = body as {
      code: number
      msg?: string
      message?: string
      data?: unknown
    }
    if (code !== 1) {
      return Promise.reject(new Error(msg || message || `code ${code}`))
    }
    return data
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

type WorldcupLoginBody = {
  code: number
  message?: string
  Data?: { RedirectUrl?: string }
}

function memIdFromRedirectUrl(redirectUrl: string): string | null {
  try {
    return new URL(redirectUrl).searchParams.get('MemID')
  } catch {
    return null
  }
}

export async function bootstrapWorldcupAuth(user: string) {
  const { data } = await instance.get<WorldcupLoginBody>('/test/login', {
    params: { user },
    skipUnwrap: true,
    skipAuthMemId: true,
  } as import('axios').AxiosRequestConfig & {
    skipUnwrap?: boolean
    skipAuthMemId?: boolean
  })

  if (data.code !== 200 || !data.Data?.RedirectUrl) {
    throw new Error(data.message || 'login failed')
  }
  const memId = memIdFromRedirectUrl(data.Data.RedirectUrl)
  if (!memId) {
    throw new Error('MemID missing in RedirectUrl')
  }
  localStorage.setItem('token', memId)
}

export default instance;
