import { z } from "zod";

/* -----------------------------------
   🎯 單一賠率 (odds)
----------------------------------- */
export const ChampionOddsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  odds: z.string(),
});

/* -----------------------------------
   🎯 單一冠軍賽項目 (list[])
----------------------------------- */
export const ChampionItemSchema = z.object({
  id: z.string(),
  status: z.string(),
  number: z.string(),
  group_id: z.string(),
  title: z.string(),
  icon: z.string(),
  image: z.string(),
  content: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  top: z.string(),
  create_time: z.string(),
  modify_time: z.string().nullable(),
  odds: z.array(ChampionOddsItemSchema),
});

/* -----------------------------------
   🎯 API data 層
----------------------------------- */
export const ChampionListDataSchema = z.object({
  list: z.array(ChampionItemSchema),
});

/* -----------------------------------
   🎯 最外層（axios unwrap 前）
----------------------------------- */
export const ChampionListResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: ChampionListDataSchema,
});

/* -----------------------------------
   🧩 TS 型別輸出
----------------------------------- */
export type ChampionOddsItem = z.infer<typeof ChampionOddsItemSchema>;
export type ChampionItem = z.infer<typeof ChampionItemSchema>;
export type ChampionListData = z.infer<typeof ChampionListDataSchema>;
export type ChampionListResponse = z.infer<typeof ChampionListResponseSchema>;