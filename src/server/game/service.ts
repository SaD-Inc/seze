import { createHash, randomBytes } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import { applyMove, createInitialState, InvalidMoveError } from "~/game/rules";
import type {
  Coordinate,
  GameState,
  GameStatus,
  PlayerColor,
  PublicGame,
} from "~/game/types";
import type { db as database } from "~/server/db";
import { gameMoves, gamePlayers, games } from "~/server/db/schema";
import { emitGameChanged } from "~/server/game/events";

type Database = typeof database;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function gameCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
    .join("")
    .slice(0, 6);
}

function playerToken(): string {
  return randomBytes(24).toString("base64url");
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

async function publicGameFrom(
  db: Database | Transaction,
  code: string,
  token?: string,
): Promise<PublicGame> {
  const normalizedCode = normalizeCode(code);
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.code, normalizedCode))
    .limit(1);

  if (!game) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." });
  }

  const players = await db
    .select({
      color: gamePlayers.color,
      displayName: gamePlayers.displayName,
      tokenHash: gamePlayers.tokenHash,
    })
    .from(gamePlayers)
    .where(eq(gamePlayers.gameId, game.id));

  const viewerHash = token ? tokenHash(token) : null;
  const viewer = viewerHash
    ? players.find((candidate) => candidate.tokenHash === viewerHash)
    : undefined;

  return {
    code: game.code,
    status: game.status,
    version: game.version,
    state: game.state,
    players: players.map(({ color, displayName }) => ({ color, displayName })),
    viewerColor: viewer?.color ?? null,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}

export async function getPublicGame(
  db: Database,
  code: string,
  token?: string,
): Promise<PublicGame> {
  return publicGameFrom(db, code, token);
}

export async function createGame(
  db: Database,
  displayName: string,
): Promise<{ game: PublicGame; token: string }> {
  const code = gameCode();
  const token = playerToken();
  const state = createInitialState();

  await db.transaction(async (tx) => {
    const [game] = await tx
      .insert(games)
      .values({
        code,
        status: "waiting",
        rulesetVersion: state.rulesetVersion,
        state,
      })
      .returning({ id: games.id });

    if (!game) throw new Error("Game creation did not return an id.");

    await tx.insert(gamePlayers).values({
      gameId: game.id,
      color: "ivory",
      displayName: normalizeName(displayName),
      tokenHash: tokenHash(token),
    });
  });

  return { game: await publicGameFrom(db, code, token), token };
}

export async function joinGame(
  db: Database,
  codeInput: string,
  displayName: string,
): Promise<{ game: PublicGame; token: string }> {
  const code = normalizeCode(codeInput);
  const token = playerToken();

  await db.transaction(async (tx) => {
    const [game] = await tx
      .select()
      .from(games)
      .where(eq(games.code, code))
      .for("update")
      .limit(1);

    if (!game) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." });
    }
    if (game.status !== "waiting") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This game already has two players.",
      });
    }

    await tx.insert(gamePlayers).values({
      gameId: game.id,
      color: "burgundy",
      displayName: normalizeName(displayName),
      tokenHash: tokenHash(token),
    });

    await tx
      .update(games)
      .set({
        status: "active",
        version: game.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(games.id, game.id));
  });

  emitGameChanged(code);
  return { game: await publicGameFrom(db, code, token), token };
}

export async function makeMove(
  db: Database,
  input: { code: string; token: string; pieceId: string; to: Coordinate },
): Promise<PublicGame> {
  const code = normalizeCode(input.code);

  const result = await db.transaction(async (tx) => {
    const [game] = await tx
      .select()
      .from(games)
      .where(eq(games.code, code))
      .for("update")
      .limit(1);

    if (!game) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." });
    }
    if (game.status !== "active") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "The game is not active.",
      });
    }

    const [player] = await tx
      .select({ color: gamePlayers.color })
      .from(gamePlayers)
      .where(
        and(
          eq(gamePlayers.gameId, game.id),
          eq(gamePlayers.tokenHash, tokenHash(input.token)),
        ),
      )
      .limit(1);

    if (!player) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Player token is invalid.",
      });
    }
    if (player.color !== game.state.turn) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "It is not your turn.",
      });
    }

    let nextState: GameState;
    try {
      nextState = applyMove(game.state, input.pieceId, input.to);
    } catch (error) {
      if (error instanceof InvalidMoveError) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }
      throw error;
    }

    const nextStatus: GameStatus = nextState.winner ? "finished" : "active";
    const [updated] = await tx
      .update(games)
      .set({
        state: nextState,
        status: nextStatus,
        version: game.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(games.id, game.id), eq(games.version, game.version)))
      .returning({ id: games.id });

    if (!updated) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "The board changed. Please try your move again.",
      });
    }

    const lastMove = nextState.lastMove;
    if (!lastMove)
      throw new Error("Applied move did not produce a move record.");
    await tx.insert(gameMoves).values({
      gameId: game.id,
      moveNumber: nextState.moveNumber,
      playerColor: player.color as PlayerColor,
      pieceId: input.pieceId,
      from: lastMove.from,
      to: lastMove.to,
      capturedCount: lastMove.capturedPieceIds.length,
    });

    return publicGameFrom(tx, code, input.token);
  });

  emitGameChanged(code);
  return result;
}
