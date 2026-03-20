import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '/'), 
  timeout: 30000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  },
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function unwrapApiBody(body: unknown) {
  if (body != null && typeof body === 'object' && 'code' in body) {
    const { code, msg, data } = body as { code: number; msg?: string; data?: unknown }
    if (code !== 1) {
      return Promise.reject(new Error(msg || `code ${code}`))
    }
    return data
  }
  return body
}

instance.interceptors.response.use(
  (response) => unwrapApiBody(response.data) as unknown as typeof response,
  (error) => {
    const body = error.response?.data
    if (body != null && typeof body === 'object' && 'code' in body) {
      const { msg } = body as { msg?: string }
      return Promise.reject(new Error(msg || 'request failed'))
    }
    console.error('API Error:', error.response?.status)
    return Promise.reject(error)
  }
)

export default instance;