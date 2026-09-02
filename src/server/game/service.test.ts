import { afterAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getAllLegalMoves } from "~/game/bot";
import { createInitialState, otherColor } from "~/game/rules";
import type { PublicGame } from "~/game/types";
import * as schema from "~/server/db/schema";
import {
  createBotGame,
  createGame,
  getGameHistory,
  getPublicGame,
  joinGame,
  makeBotMove,
  makeMove,
  requestRematch,
} from "./service";

const testUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!testUrl)("game service integration", () => {
  const sql = postgres(testUrl ?? "postgresql://localhost/seze_test");
  const db = drizzle(sql, { schema });
  const codes: string[] = [];

  afterAll(async () => {
    try {
      if (codes.length) {
        await db.delete(schema.games).where(inArray(schema.games.code, codes));
      }
    } finally {
      await sql.end();
    }
  });

  async function humanMove(game: PublicGame, token: string) {
    const move = getAllLegalMoves(game.state)[0];
    if (!move) throw new Error("Expected a legal test move");
    return makeMove(db, { code: game.code, token, ...move });
  }

  test("assigns opposite online sides, enforces turns and persists history", async () => {
    const host = await createGame(db, "Release host");
    codes.push(host.game.code);
    const guest = await joinGame(db, host.game.code, "Release guest");
    if (!host.game.viewerColor) throw new Error("Expected the host's side");
    expect(guest.game.viewerColor).toBe(otherColor(host.game.viewerColor));
    expect(guest.game.state.turn).toBe("burgundy");
    const red = host.game.viewerColor === "burgundy" ? host : guest;
    const gold = red === host ? guest : host;
    await expect(humanMove(guest.game, gold.token)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      joinGame(db, host.game.code, "Third guest"),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const moved = await humanMove(guest.game, red.token);
    const reloaded = await getPublicGame(db, moved.code, gold.token);
    expect(reloaded.state).toEqual(moved.state);
    expect(reloaded.viewerColor).toBe("ivory");
    expect((await getGameHistory(db, moved.code)).moves).toHaveLength(1);
    expect((await getPublicGame(db, moved.code)).viewerColor).toBeNull();
  });

  for (const difficulty of ["easy", "balanced", "hard"] as const) {
    test(`${difficulty} bot requires the human token and moves once per version`, async () => {
      const created = await createBotGame(db, "Bot tester", difficulty);
      codes.push(created.game.code);
      let game = created.game;
      expect(game.botDifficulty).toBe(difficulty);
      expect(
        game.players.filter((player) => player.kind === "bot"),
      ).toHaveLength(1);
      if (game.viewerColor === game.state.turn)
        game = await humanMove(game, created.token);
      const input = {
        code: game.code,
        token: created.token,
        expectedVersion: game.version,
      };
      await expect(
        makeBotMove(db, { ...input, token: "invalid-token" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      const results = await Promise.allSettled([
        makeBotMove(db, input),
        makeBotMove(db, input),
      ]);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      const reloaded = await getPublicGame(db, game.code, created.token);
      expect(reloaded.version).toBe(game.version + 1);
      if (!reloaded.viewerColor) throw new Error("Expected the human's side");
      expect(reloaded.state.turn).toBe(reloaded.viewerColor);
      expect((await getGameHistory(db, game.code)).moves).toHaveLength(
        reloaded.state.moveNumber,
      );
    });
  }

  test("bot rematches retain difficulty and token without claiming the bot seat", async () => {
    const created = await createBotGame(db, "Rematch tester", "easy");
    codes.push(created.game.code);
    const finishedState = {
      ...createInitialState(),
      winner: created.game.viewerColor,
      winReason: "center" as const,
    };
    await db
      .update(schema.games)
      .set({ status: "finished", state: finishedState })
      .where(inArray(schema.games.code, [created.game.code]));
    const result = await requestRematch(db, {
      code: created.game.code,
      token: created.token,
    });
    const nextCode = result.rematch?.gameCode;
    if (!nextCode) throw new Error("Expected immediate bot rematch");
    codes.push(nextCode);
    const next = await getPublicGame(db, nextCode, created.token);
    expect(next.status).toBe("active");
    expect(next.botDifficulty).toBe("easy");
    expect(
      next.players.find((player) => player.color === next.viewerColor)?.kind,
    ).toBe("human");
    expect(next.state.moveNumber).toBe(0);
  });
});
