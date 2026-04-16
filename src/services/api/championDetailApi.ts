import request from '@/utils/request'
import { ChampionGameDataSchema } from '@/schema/championDetailSchema'

/** 與 siteGame 相同：axios 回傳本體在 `data`；攔截器已 unwrap 業務 `data` */
function coerceChampionPayload(raw: unknown): unknown {
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

export const getChampionDetail = async (id: string) => {
  const formData = new FormData()
  formData.append('id', id)
  const { data } = await request.post('/site/champion', formData)
  return ChampionGameDataSchema.parse(coerceChampionPayload(data))
}