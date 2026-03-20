import { z } from "zod";

/* ===========================
   賠率
=========================== */
export const OddsSchema = z.object({
  id: z.string(),              // 賠率ID
  title: z.string(),           // 名稱（南非/巴西/平手）
  odds: z.string(),            // 賠率
  // API 可能回 null
  draw: z.union([z.string(), z.null()]).transform((v) => v ?? ''),
});

/* ===========================
   比賽
=========================== */
export const GameSchema = z.object({
  id: z.string(),
  status: z.string(),
  number: z.string(),
  group_id: z.string(),
  title: z.string(),

  content: z.string(),
  create_time: z.string(),
  modify_time: z.string(),
  start_time: z.string(),
  end_time: z.string(),

  image: z.string(),
  icon: z.string(),

  odds: z.array(OddsSchema),

  team1_title: z.string(),
  team1_score: z.string(),
  team1_result: z.string(),
  team1_home: z.string(),
  team1_icon: z.string(),
  team1_image: z.string(),
  team1_content: z.string(),

  team2_title: z.string(),
  team2_score: z.string(),
  team2_result: z.string(),
  team2_home: z.string(),
  team2_icon: z.string(),
  team2_image: z.string(),
  team2_content: z.string(),

  top: z.string(),
});

/* ===========================
   分組
=========================== */
export const GroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string(),
  image: z.string(),
  game: z.array(GameSchema).optional(), // 有些 group 可能沒有 game
});

/* ===========================
   Banner
=========================== */
export const BannerSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string(),
  url: z.string(),
});

/* ===========================
   Data 主體
=========================== */
export const HomeDataSchema = z.object({
  banner: z.array(BannerSchema),
  group: z.array(GroupSchema),
});

/* ===========================
   首頁 Featured 卡片（由 Game 衍生的顯示用欄位）
=========================== */
export const FeaturedCardViewSchema = z.object({
  game: GameSchema,
  showScore: z.boolean(),
  oddsHome: z.number(),
  oddsDraw: z.number(),
  oddsAway: z.number(),
});

/* ===========================
   API 回傳
=========================== */
export const HomeApiResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: HomeDataSchema,
});

/* ===========================
   TypeScript 型別
=========================== */
export type Odds = z.infer<typeof OddsSchema>;
export type Game = z.infer<typeof GameSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type Banner = z.infer<typeof BannerSchema>;
export type HomeData = z.infer<typeof HomeDataSchema>;
export type HomeApiResponse = z.infer<typeof HomeApiResponseSchema>;
export type FeaturedCardViewData = z.infer<typeof FeaturedCardViewSchema>;