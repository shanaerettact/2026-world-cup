import { z } from "zod";

/* -----------------------------------
   🎮 單一賠率項目（item → item[]）
----------------------------------- */
export const OddsItemSchema = z.object({
  id: z.string(),
  play_id: z.string(),
  title: z.string(),
  odds: z.string(),
  draw: z.string().nullable(),
});

/* -----------------------------------
   🎮 玩法區塊（item[] → play groups）
----------------------------------- */
export const PlayItemSchema = z.object({
  id: z.string(),
  class_id: z.coerce.string(),
  title: z.string(),
  type: z.coerce.string(),
  item: z.array(OddsItemSchema), // 多個賠率項目
});

/* -----------------------------------
   🎮 時段區塊（上半場/下半場/全場等）
----------------------------------- */
export const GamePeriodSchema = z.object({
  id: z.string(),
  title: z.string(),          // 上半場 / 下半場 / 全場
  escape: z.string(),
  escape_fee: z.string(),
  escape_win: z.string(),
  escape_lose: z.string(),
  escape_deadline: z.string().nullable(),
  start_time: z.string(),
  end_time: z.string(),

  // 🆕 差異：全場可能沒有 item，因此必須 optional + nullable
  item: z.array(PlayItemSchema).optional().nullable(),
});

/* -----------------------------------
   ⚽ 單一比賽主檔
----------------------------------- */
export const GameInfoSchema = z.object({
  id: z.string(),
  status: z.string(),
  number: z.string(),
  group_id: z.string(),
  title: z.string(),
  icon: z.string().nullable(),
  image: z.string().nullable(),
  content: z.string(),
  team1_title: z.string(),
  team2_title: z.string(),
  team1_icon: z.string().nullable(),
  team2_icon: z.string().nullable(),
  team1_image: z.string().nullable(),
  team2_image: z.string().nullable(),
  team1_content: z.string(),
  team2_content: z.string(),
  team1_home: z.string(),
  team2_home: z.string(),
  team1_score: z.string(),
  team2_score: z.string(),
  team1_result: z.string(),
  team2_result: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  top: z.string(),
  create_time: z.string(),
  modify_time: z.string().nullable(),
});

/* -----------------------------------
   📦 axios unwrap 後的 data（與 request interceptor 一致）
----------------------------------- */
export const GameDetailDataSchema = z.object({
  game: GameInfoSchema,
  list: z.array(GamePeriodSchema),
});

/* -----------------------------------
   📌 TS 型別輸出
----------------------------------- */
export type OddsItem = z.infer<typeof OddsItemSchema>;
export type PlayItem = z.infer<typeof PlayItemSchema>;
export type GamePeriod = z.infer<typeof GamePeriodSchema>;
export type GameInfo = z.infer<typeof GameInfoSchema>;
export type GameDetailData = z.infer<typeof GameDetailDataSchema>;