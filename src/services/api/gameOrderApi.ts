import request from '@/utils/request'
import { BetHistoryDataSchema, type BetHistoryData } from '@/schema/gameOrderSchema'

export type GameOrderListParams = {
  status: string
  start_time: string
  end_time: string
}

const ORDER_LIST_KEYS = [
  'list',
  'List',
  'order_list',
  'orderList',
  'orders',
  'records',
  'rows',
  'items',
  'data_list',
  'game_order',
  'game_order_list',
] as const

function firstMatchingArray(obj: Record<string, unknown>): unknown[] | null {
  for (const k of ORDER_LIST_KEYS) {
    const v = obj[k]
    if (Array.isArray(v)) return v
  }
  return null
}

function longestObjectArray(obj: Record<string, unknown>): unknown[] | null {
  let best: unknown[] | null = null
  let n = -1
  for (const v of Object.values(obj)) {
    if (!Array.isArray(v) || v.length === 0) continue
    const first = v[0]
    if (first != null && typeof first === 'object' && v.length > n) {
      n = v.length
      best = v
    }
  }
  return best
}

/** Unwrapped body: list under known keys, data as array, or nested order arrays */
function coerceGameOrderPayload(raw: unknown): { list: unknown[] } {
  if (raw == null) return { list: [] }
  if (Array.isArray(raw)) return { list: raw }
  if (typeof raw !== 'object') return { list: [] }
  const o = raw as Record<string, unknown>

  const direct = firstMatchingArray(o)
  if (direct) return { list: direct }

  const inner = o.data ?? o.Data
  if (Array.isArray(inner)) return { list: inner }
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    const innerObj = inner as Record<string, unknown>
    const nested = firstMatchingArray(innerObj)
    if (nested) return { list: nested }
    const guess = longestObjectArray(innerObj)
    if (guess) return { list: guess }
  }

  const fallback = longestObjectArray(o)
  if (fallback) return { list: fallback }

  return { list: [] }
}

export const getGameOrderList = async (params: GameOrderListParams): Promise<BetHistoryData> => {
  const formData = new FormData()
  formData.append('status', String(params.status))
  formData.append('start_time', String(params.start_time))
  formData.append('end_time', String(params.end_time))
  const { data } = await request.post<unknown>('/user/game-order', formData)
  const coerced = coerceGameOrderPayload(data)
  const parsed = BetHistoryDataSchema.safeParse(coerced)
  if (parsed.success) return parsed.data
  console.warn('game-order list schema:', parsed.error)
  return { list: coerced.list as BetHistoryData['list'] }
}
