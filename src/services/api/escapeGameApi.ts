import request, {
  API_CODE_SESSION_EXPIRED,
  scheduleSessionExpiredNavigationIfStillLoggedOut,
} from '@/utils/request'

type EscapeGameResponse = {
  code?: number
  msg?: string
  message?: string
  Message?: string
}

function pickMsg(raw: EscapeGameResponse): string {
  return (
    (typeof raw.msg === 'string' && raw.msg) ||
    (typeof raw.message === 'string' && raw.message) ||
    (typeof raw.Message === 'string' ? raw.Message : '') ||
    ''
  )
}

export async function getEscapeGame(id: string): Promise<{ message: string }> {
  const formData = new FormData()
  formData.append('id', id)
  const { data } = await request.post<EscapeGameResponse>(
    '/game/escape-game',
    formData,
    { skipUnwrap: true } as Parameters<typeof request.post>[2],
  )
  const raw = data ?? {}
  const code = Number(raw.code)
  const ok = code === 1 || code === 200
  const msg = pickMsg(raw)
  if (!ok) {
    if (code === API_CODE_SESSION_EXPIRED) {
      scheduleSessionExpiredNavigationIfStillLoggedOut()
    }
    throw new Error(msg || `code ${raw.code ?? '?'}`)
  }
  return { message: msg }
}