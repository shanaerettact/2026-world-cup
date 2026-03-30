import { z } from "zod";

/* -----------------------------------
   單一賠率項目（list 裡的物件）
----------------------------------- */
export const ChampionOddsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  odds: z.string(),
});

/* -----------------------------------
   冠軍賽主檔（data.game）
----------------------------------- */
export const ChampionGameInfoSchema = z.object({
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
});

/* -----------------------------------
   data 主要資料層
----------------------------------- */
export const ChampionGameDataSchema = z.object({
  game: ChampionGameInfoSchema,
  list: z.array(ChampionOddsItemSchema),
});

/* -----------------------------------
   最外層 response
----------------------------------- */
export const ChampionGameResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: ChampionGameDataSchema,
});

/* -----------------------------------
   TS 型別輸出
----------------------------------- */
export type ChampionOddsItem = z.infer<typeof ChampionOddsItemSchema>;
export type ChampionGameInfo = z.infer<typeof ChampionGameInfoSchema>;
export type ChampionGameData = z.infer<typeof ChampionGameDataSchema>;
export type ChampionGameResponse = z.infer<typeof ChampionGameResponseSchema>;