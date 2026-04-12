import { ChampionListDataSchema } from '@/schema/championListSchema'
import request from '@/utils/request'

/** 後端可能回 { list }、{ data: { list } }，或攔截器未拆包仍為 { code, data } */
function coerceChampionListPayload(raw: unknown): { list: unknown[] } {
  if (raw == null || typeof raw !== 'object') return { list: [] }
  const o = raw as Record<string, unknown>
  if (Array.isArray(o.list)) return { list: o.list }
  const inner = o.data ?? o.Data
  if (inner != null && typeof inner === 'object') {
    const i = inner as Record<string, unknown>
    if (Array.isArray(i.list)) return { list: i.list }
  }
  return { list: [] }
}

export const getChampionList = async () => {
  const { data } = await request.post('/site/champion-list', new URLSearchParams())
  return ChampionListDataSchema.parse(coerceChampionListPayload(data))
}