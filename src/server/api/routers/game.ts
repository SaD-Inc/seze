import { on } from "node:events";

import { tracked } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { gameEvents } from "~/server/game/events";
import {
  createGame,
  getGameHistory,
  getPublicGame,
  joinGame,
  makeMove,
  requestRematch,
} from "~/server/game/service";

const displayName = z.string().trim().min(2).max(24);
const code = z
  .string()
  .trim()
  .min(6)
  .max(8)
  .transform((value) => value.toUpperCase());
const token = z.string().min(24).max(64);

export const gameRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ displayName }))
    .mutation(({ ctx, input }) => createGame(ctx.db, input.displayName)),

  join: publicProcedure
    .input(z.object({ code, displayName }))
    .mutation(({ ctx, input }) =>
      joinGame(ctx.db, input.code, input.displayName),
    ),

  get: publicProcedure
    .input(z.object({ code, token: token.optional() }))
    .query(({ ctx, input }) => getPublicGame(ctx.db, input.code, input.token)),

  history: publicProcedure
    .input(z.object({ code, token: token.optional() }))
    .query(({ ctx, input }) => getGameHistory(ctx.db, input.code, input.token)),

  move: publicProcedure
    .input(
      z.object({
        code,
        token,
        pieceId: z.string().min(3).max(16),
        to: z.object({
          row: z.number().int().min(0).max(7),
          col: z.number().int().min(0).max(7),
        }),
      }),
    )
    .mutation(({ ctx, input }) => makeMove(ctx.db, input)),

  rematch: publicProcedure
    .input(z.object({ code, token }))
    .mutation(({ ctx, input }) => requestRematch(ctx.db, input)),

  onChange: publicProcedure
    .input(z.object({ code, token: token.optional() }))
    .subscription(async function* ({ ctx, input, signal }) {
      const normalizedCode = input.code.toUpperCase();
      const initial = await getPublicGame(ctx.db, normalizedCode, input.token);
      yield tracked(String(initial.version), initial);

      try {
        for await (const [changedCode] of on(gameEvents, "changed", {
          signal,
        })) {
          if (changedCode !== normalizedCode) continue;
          const game = await getPublicGame(ctx.db, normalizedCode, input.token);
          yield tracked(String(game.version), game);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        throw error;
      }
    }),
});
