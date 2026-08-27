import { index, pgTableCreator, uniqueIndex } from "drizzle-orm/pg-core";

import type {
  Coordinate,
  GameState,
  GameStatus,
  PlayerColor,
} from "~/game/types";

export const createTable = pgTableCreator((name) => `seze_${name}`);

export const games = createTable(
  "game",
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    code: d.varchar({ length: 8 }).notNull(),
    status: d.varchar({ length: 16 }).$type<GameStatus>().notNull(),
    rulesetVersion: d.varchar({ length: 32 }).notNull(),
    version: d.integer().default(0).notNull(),
    state: d.jsonb().$type<GameState>().notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    uniqueIndex("game_code_unique").on(table.code),
    index("game_status_updated_idx").on(table.status, table.updatedAt),
  ],
);

export const gamePlayers = createTable(
  "game_player",
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    gameId: d
      .uuid()
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    color: d.varchar({ length: 16 }).$type<PlayerColor>().notNull(),
    displayName: d.varchar({ length: 24 }).notNull(),
    tokenHash: d.varchar({ length: 64 }).notNull(),
    joinedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    uniqueIndex("game_player_color_unique").on(table.gameId, table.color),
    uniqueIndex("game_player_token_unique").on(table.gameId, table.tokenHash),
    index("game_player_game_idx").on(table.gameId),
  ],
);

export const gameMoves = createTable(
  "game_move",
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    gameId: d
      .uuid()
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    moveNumber: d.integer().notNull(),
    playerColor: d.varchar({ length: 16 }).$type<PlayerColor>().notNull(),
    pieceId: d.varchar({ length: 16 }).notNull(),
    from: d.jsonb().$type<Coordinate>().notNull(),
    to: d.jsonb().$type<Coordinate>().notNull(),
    capturedCount: d.integer().default(0).notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    uniqueIndex("game_move_number_unique").on(table.gameId, table.moveNumber),
    index("game_move_game_idx").on(table.gameId, table.createdAt),
  ],
);
