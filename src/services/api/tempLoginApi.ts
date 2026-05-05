import request, { cancelDeferredSessionExpiredNavigation } from '@/utils/request'

/** 暫時登入：可改此常數，或在呼叫 fetchTempLogin / bootstrapTempTestLogin 時傳入 user */
export const TEMP_LOGIN_USER = 'visitor004'

type RawLoginResponse = {
  code?: number
  msg?: string
  message?: string
  Message?: string
  data?: { RedirectUrl?: string }
  Data?: { RedirectUrl?: string }
}

function pickRedirectUrl(raw: RawLoginResponse): string {
  const inner = raw.Data ?? raw.data
  const url = inner?.RedirectUrl
  return typeof url === 'string' ? url.trim() : ''
}

function redirectPathAndQuery(redirectUrl: string, memId: string): string {
  try {
    const u = new URL(redirectUrl)
    const path = u.pathname || '/'
    const search = u.search && u.search !== '?' ? u.search : `?MemID=${encodeURIComponent(memId)}`
    return `${path}${search}`
  } catch {
    return `/?MemID=${encodeURIComponent(memId)}`
  }
}

function memIdFromRedirectUrl(redirectUrl: string): string | null {
  try {
    const u = new URL(redirectUrl, window.location.origin)
    const v = u.searchParams.get('MemID')
    if (v?.trim()) return v.trim()
  } catch {
    /* ignore */
  }
  const m = redirectUrl.match(/[?&]MemID=([^&]+)/)
  return m?.[1] ? decodeURIComponent(m[1]) : null
}

/** GET /test/login?user=…，回傳平台給的導向網址與解析出的 MemID（若有） */
export async function fetchTempLogin(user: string = TEMP_LOGIN_USER) {
  const { data } = await request.get<RawLoginResponse>(
    `/test/login?user=${encodeURIComponent(user)}`,
    { skipUnwrap: true } as Parameters<typeof request.get>[1],
  )
  const raw = data ?? {}
  const ok = raw.code === 1 || raw.code === 200
  if (!ok) {
    const err =
      raw.msg ||
      raw.message ||
      (typeof raw.Message === 'string' ? raw.Message : '') ||
      `code ${raw.code ?? '?'}`
    throw new Error(err)
  }
  const redirectUrl = pickRedirectUrl(raw)
  if (!redirectUrl) {
    throw new Error('test/login: 缺少 RedirectUrl')
  }
  return {
    redirectUrl,
    memId: memIdFromRedirectUrl(redirectUrl),
  }
}

/** 取暫時登入連結後：先 GET 與 RedirectUrl 相同 path+query（瀏覽器進站時會帶出的請求，通常在此寫入 session cookie），再 POST /user/index 完成握手 */
export async function bootstrapTempTestLogin(user: string = TEMP_LOGIN_USER) {
  const { redirectUrl, memId } = await fetchTempLogin(user)
  if (!memId) {
    throw new Error('test/login: RedirectUrl 無 MemID')
  }
  const pathQuery = redirectPathAndQuery(redirectUrl, memId)
  await request.get(pathQuery, {
    skipUnwrap: true,
    headers: { Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8' },
  } as Parameters<typeof request.get>[1])

  const body = new FormData()
  body.set('MemID', memId)
  await request.post(
    `/user/index?MemID=${encodeURIComponent(memId)}`,
    body,
  )
  cancelDeferredSessionExpiredNavigation()
  return { redirectUrl, memId }
}
