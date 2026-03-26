import { z } from "zod";

/* ===========================
   單筆下注紀錄
=========================== */
export const BetRecordSchema = z.object({
  id: z.string(),                // 注單 ID
  number: z.string(),            // 注單號碼
  status: z.string(),            // 注單狀態
  group_id: z.string(),          // 群組（運動種類）
  game_title: z.string(),        // 比賽名稱：阿根廷 vs 巴西
  class_title: z.string(),       // 時段名稱：下半場
  play_title: z.string(),        // 玩法名稱：巴西紅牌數量
  odds_title: z.string(),        // 賠率選項：小於4張
  odds: z.string(),              // 賠率
  amount: z.string(),            // 投注金額
  escape: z.string(),            // 是否可逃跑
  escape_fee: z.string(),        // 逃跑收益
  bonus: z.string(),             // 中獎金額
  result: z.string(),            // 結果代碼
  result_title: z.string(),      // 結果名稱：小於4張
  bet_time: z.string(),          // 投注時間
  escape_time: z.string().nullable(), // 逃跑時間（可能為 null）
});

/* ===========================
   data 區段
=========================== */
export const BetHistoryDataSchema = z.object({
  list: z.array(BetRecordSchema),
});

/* ===========================
   API 回傳
=========================== */
export const BetHistoryResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: BetHistoryDataSchema,
});

/* ===========================
   TypeScript 型別
=========================== */
export type BetRecord = z.infer<typeof BetRecordSchema>;
export type BetHistoryData = z.infer<typeof BetHistoryDataSchema>;
export type BetHistoryResponse = z.infer<typeof BetHistoryResponseSchema>;