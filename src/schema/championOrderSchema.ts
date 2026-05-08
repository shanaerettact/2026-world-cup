import { z } from 'zod'

const coercedStr = z.coerce.string()

export const ChampionOrderRecordSchema = z.object({
  id: coercedStr,
  number: coercedStr,
  status: coercedStr,
  game_title: coercedStr,
  champion_title: coercedStr,
  odds_title: coercedStr,
  odds: coercedStr,
  amount: coercedStr,
  bonus: coercedStr,
  result: coercedStr,
  result_title: coercedStr,
  bet_time: coercedStr,
})

export const ChampionOrderListDataSchema = z.object({
  list: z.array(ChampionOrderRecordSchema),
})

export const ChampionOrderListParamsSchema = z.object({
  status: coercedStr,
  startTime: coercedStr,
  endTime: coercedStr,
})

export type ChampionOrderRecord = z.infer<typeof ChampionOrderRecordSchema>
export type ChampionOrderListData = z.infer<typeof ChampionOrderListDataSchema>
export type ChampionOrderList = ChampionOrderListData['list']
export type ChampionOrderListParams = z.infer<typeof ChampionOrderListParamsSchema>
