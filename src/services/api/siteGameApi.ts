import request from '@/utils/request'
import { GameDetailDataSchema } from '@/schema/siteGameSchema'

/** Body is { game, list } or nested under data / Data */
function coerceSiteGamePayload(raw: unknown): unknown {
  if (raw == null || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  if (o.game != null && typeof o.game === 'object' && Array.isArray(o.list)) return raw
  const inner = o.data ?? o.Data
  if (inner != null && typeof inner === 'object') {
    const i = inner as Record<string, unknown>
    if (i.game != null && typeof i.game === 'object' && Array.isArray(i.list)) return inner
  }
  return raw
}

export const getSiteGame = async (id: number) => {
  const formData = new FormData()
  formData.append('id', String(id))
  const { data } = await request.post('/site/game', formData)
  return GameDetailDataSchema.parse(coerceSiteGamePayload(data))
}