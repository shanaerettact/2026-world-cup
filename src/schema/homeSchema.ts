import { z } from "zod";

/** API 常回 null，統一轉成空字串 */
const apiString = z.union([z.string(), z.null()]).transform((v) => v ?? "");

/* ===========================
   賠率
=========================== */
export const OddsSchema = z.object({
  id: apiString, // 賠率ID
  title: apiString, // 名稱（南非/巴西/平手）
  odds: apiString, // 賠率
  draw: apiString,
});

/* ===========================
   比賽
=========================== */
export const GameSchema = z.object({
  id: apiString,
  status: apiString,
  number: apiString,
  group_id: apiString,
  title: apiString,

  content: apiString,
  create_time: apiString,
  modify_time: apiString,
  start_time: apiString,
  end_time: apiString,

  image: apiString,
  icon: apiString,

  odds: z.array(OddsSchema),

  team1_title: apiString,
  team1_score: apiString,
  team1_result: apiString,
  team1_home: apiString,
  team1_icon: apiString,
  team1_image: apiString,
  team1_content: apiString,

  team2_title: apiString,
  team2_score: apiString,
  team2_result: apiString,
  team2_home: apiString,
  team2_icon: apiString,
  team2_image: apiString,
  team2_content: apiString,

  top: apiString,
});

/* ===========================
   分組
=========================== */
export const GroupSchema = z.object({
  id: apiString,
  title: apiString,
  icon: apiString,
  image: apiString,
  game: z.array(GameSchema).optional(), // 有些 group 可能沒有 game
});

/* ===========================
   Banner
=========================== */
export const BannerSchema = z.object({
  id: apiString,
  title: apiString,
  image: apiString,
  url: apiString,
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
  msg: apiString,
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