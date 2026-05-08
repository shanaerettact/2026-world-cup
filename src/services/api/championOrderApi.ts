import request from '@/utils/request'
import {
  ChampionOrderListDataSchema,
  type ChampionOrderList,
  type ChampionOrderListData,
  type ChampionOrderListParams,
} from '@/schema/championOrderSchema'

function normalizeChampionOrderBody(data: unknown): ChampionOrderListData {
  if (data == null) return { list: [] }
  if (Array.isArray(data)) return { list: data }
  if (typeof data !== 'object') return { list: [] }
  const o = data as Record<string, unknown>
  if (Array.isArray(o.list)) return { list: o.list as ChampionOrderList }
  const inner = o.data ?? o.Data
  if (Array.isArray(inner)) return { list: inner as ChampionOrderList }
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    const d = inner as Record<string, unknown>
    if (Array.isArray(d.list)) return { list: d.list as ChampionOrderList }
  }
  return { list: [] }
}

export const getChampionOrderList = async (
  params: ChampionOrderListParams,
): Promise<ChampionOrderListData> => {
  const formData = new FormData()
  formData.append('status', String(params.status))
  formData.append('startTime', String(params.startTime))
  formData.append('endTime', String(params.endTime))
  const { data } = await request.post('/user/champion-order', formData)
  const coerced = normalizeChampionOrderBody(data)
  const parsed = ChampionOrderListDataSchema.safeParse(coerced)
  if (parsed.success) return parsed.data
  console.warn('champion-order list schema:', parsed.error)
  return { list: coerced.list as ChampionOrderList }
}