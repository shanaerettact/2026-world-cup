import { z } from "zod";

const nullishArray = <T extends z.ZodTypeAny>(el: T) =>
  z
    .union([z.array(el), z.null(), z.undefined()])
    .transform((v) => v ?? []);

const stringishDraw = z
  .union([z.string(), z.null()])
  .transform((v) => v ?? "");

/* ===========================
   最底層：下注選項（play item）
=========================== */
export const PlayItemSchema = z.object({
  id: z.string(),
  play_id: z.string(),
  title: z.string(),
  odds: z.string(),
  draw: stringishDraw,
});

/* ===========================
   第二層：玩法（例如 獨贏 / 讓分）
=========================== */
export const GamePlaySchema = z.object({
  id: z.string(),
  class_id: z.string(),
  title: z.string(),
  type: z.string(),
  item: nullishArray(PlayItemSchema),
});

/* ===========================
   第三層：時間區段（上半場 / 全場）
=========================== */
export const GamePeriodSchema = z.object({
  id: z.string(),
  title: z.string(),
  escape: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  item: nullishArray(GamePlaySchema),
});

/* ===========================
   比賽主體（與 list 同層，見 API data）
=========================== */
export const GameDetailSchema = z.object({
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
   API data：game 與 list 同層
=========================== */
export const GameDetailDataSchema = z.object({
  game: GameDetailSchema,
  list: nullishArray(GamePeriodSchema),
});

/* ===========================
   完整 HTTP 回傳（未經 axios 解包時）
=========================== */
export const GameDetailResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: GameDetailDataSchema,
});

/* ===========================
   TypeScript
=========================== */
export type PlayItem = z.infer<typeof PlayItemSchema>;
export type GamePlay = z.infer<typeof GamePlaySchema>;
export type GamePeriod = z.infer<typeof GamePeriodSchema>;
export type GameDetail = z.infer<typeof GameDetailSchema>;
export type GameDetailResponse = z.infer<typeof GameDetailResponseSchema>;
export type GameDetailData = z.infer<typeof GameDetailDataSchema>;
