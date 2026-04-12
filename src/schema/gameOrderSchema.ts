import { z } from "zod";

/* ===========================
   Single bet row (API may return numbers; coerce to string)
=========================== */
const coercedStr = z.coerce.string()

export const BetRecordSchema = z.object({
  id: coercedStr,
  number: coercedStr,
  status: coercedStr,
  group_id: coercedStr,
  game_title: coercedStr,
  class_title: coercedStr,
  play_title: coercedStr,
  odds_title: coercedStr,
  odds: coercedStr,
  amount: coercedStr,
  escape: coercedStr,
  escape_fee: coercedStr,
  escape_win: z.coerce.string().optional(),
  escape_lose: z.coerce.string().optional(),
  bonus: coercedStr,
  result: coercedStr,
  result_title: coercedStr,
  bet_time: coercedStr,
  escape_time: z.preprocess(
    (v) => (v == null || v === '' ? null : String(v)),
    z.string().nullable(),
  ),
});

/* ===========================
   data section
=========================== */
export const BetHistoryDataSchema = z.object({
  list: z.array(BetRecordSchema),
});

/* ===========================
   Full API envelope
=========================== */
export const BetHistoryResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: BetHistoryDataSchema,
});

/* ===========================
   TypeScript
=========================== */
export type BetRecord = z.infer<typeof BetRecordSchema>;
export type BetHistoryData = z.infer<typeof BetHistoryDataSchema>;
export type BetHistoryResponse = z.infer<typeof BetHistoryResponseSchema>;
