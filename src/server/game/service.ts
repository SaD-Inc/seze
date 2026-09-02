import { createHash, randomBytes, randomInt } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";

import { chooseBotMove } from "~/game/bot";
import { applyMove, createInitialState, InvalidMoveError } from "~/game/rules";
import type {
  BotDifficulty,
  Coordinate,
  GameState,
  GameStatus,
  PlayerColor,
  PublicGame,
  PublicGameHistory,
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

function randomPlayerColor(): PlayerColor {
  return randomInt(2) === 0 ? "burgundy" : "ivory";
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
      kind: gamePlayers.kind,
      tokenHash: gamePlayers.tokenHash,
    })
    .from(gamePlayers)
    .where(eq(gamePlayers.gameId, game.id));

  const viewerHash = token ? tokenHash(token) : null;
  const viewer = viewerHash
    ? players.find((candidate) => candidate.tokenHash === viewerHash)
    : undefined;
  const [rematchGame] = game.rematchCode
    ? await db
        .select({ analyticsMatchId: games.analyticsMatchId })
        .from(games)
        .where(eq(games.code, game.rematchCode))
        .limit(1)
    : [];

  return {
    code: game.code,
    analyticsMatchId: game.analyticsMatchId,
    status: game.status,
    version: game.version,
    state: game.state,
    players: players.map(({ color, displayName, kind }) => ({
      color,
      displayName,
      kind,
    })),
    viewerColor: viewer?.color ?? null,
    botDifficulty: game.botDifficulty,
    rematch: game.rematchRequestedBy
      ? {
          requestedBy: game.rematchRequestedBy,
          gameCode: game.rematchCode,
          analyticsMatchId: rematchGame?.analyticsMatchId ?? null,
        }
      : null,
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

export async function getGameHistory(
  db: Database,
  codeInput: string,
  token?: string,
): Promise<PublicGameHistory> {
  const code = normalizeCode(codeInput);
  const [gameRow] = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.code, code))
    .limit(1);

  if (!gameRow) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." });
  }

  const [game, moves] = await Promise.all([
    publicGameFrom(db, code, token),
    db
      .select({
        moveNumber: gameMoves.moveNumber,
        playerColor: gameMoves.playerColor,
        pieceId: gameMoves.pieceId,
        from: gameMoves.from,
        to: gameMoves.to,
        capturedCount: gameMoves.capturedCount,
        createdAt: gameMoves.createdAt,
      })
      .from(gameMoves)
      .where(eq(gameMoves.gameId, gameRow.id))
      .orderBy(asc(gameMoves.moveNumber)),
  ]);

  return { game, moves };
}

export async function createGame(
  db: Database,
  displayName: string,
): Promise<{ game: PublicGame; token: string }> {
  const code = gameCode();
  const token = playerToken();
  const state = createInitialState();
  const creatorColor = randomPlayerColor();

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
      color: creatorColor,
      displayName: normalizeName(displayName),
      tokenHash: tokenHash(token),
    });
  });

  return { game: await publicGameFrom(db, code, token), token };
}

export async function createBotGame(
  db: Database,
  displayName: string,
  difficulty: BotDifficulty,
): Promise<{ game: PublicGame; token: string }> {
  const code = gameCode();
  const token = playerToken();
  const state = createInitialState();
  const humanColor = randomPlayerColor();
  const botColor = otherColor(humanColor);

  await db.transaction(async (tx) => {
    const [game] = await tx
      .insert(games)
      .values({
        code,
        status: "active",
        botDifficulty: difficulty,
        rulesetVersion: state.rulesetVersion,
        state,
      })
      .returning({ id: games.id });

    if (!game) throw new Error("Bot game creation did not return an id.");

    await tx.insert(gamePlayers).values([
      {
        gameId: game.id,
        color: humanColor,
        kind: "human",
        displayName: normalizeName(displayName),
        tokenHash: tokenHash(token),
      },
      {
        gameId: game.id,
        color: botColor,
        kind: "bot",
        displayName: "SE!ZE Bot",
        tokenHash: null,
      },
    ]);
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

    const [existingPlayer] = await tx
      .select({ color: gamePlayers.color })
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, game.id))
      .limit(1);

    if (!existingPlayer) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This table does not have a host.",
      });
    }

    await tx.insert(gamePlayers).values({
      gameId: game.id,
      color: otherColor(existingPlayer.color),
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

export async function makeBotMove(
  db: Database,
  input: {
    code: string;
    token: string;
    expectedVersion: number;
  },
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
    if (!game.botDifficulty) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This table does not have a computer player.",
      });
    }
    if (game.version !== input.expectedVersion) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "The board changed before the computer could move.",
      });
    }

    const players = await tx
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, game.id));
    const callerHash = tokenHash(input.token);
    const caller = players.find(
      (candidate) =>
        candidate.kind === "human" && candidate.tokenHash === callerHash,
    );
    const bot = players.find(
      (candidate) =>
        candidate.kind === "bot" && candidate.color === game.state.turn,
    );

    if (!caller) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Player token is invalid.",
      });
    }
    if (!bot) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "It is not the computer's turn.",
      });
    }

    const selectedMove = chooseBotMove(game.state, {
      difficulty: game.botDifficulty,
    });
    const nextState = applyMove(
      game.state,
      selectedMove.pieceId,
      selectedMove.to,
    );
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
        message: "The board changed before the computer could move.",
      });
    }

    const lastMove = nextState.lastMove;
    if (!lastMove) {
      throw new Error("Applied bot move did not produce a move record.");
    }
    await tx.insert(gameMoves).values({
      gameId: game.id,
      moveNumber: nextState.moveNumber,
      playerColor: bot.color,
      pieceId: selectedMove.pieceId,
      from: lastMove.from,
      to: lastMove.to,
      capturedCount: lastMove.capturedPieceIds.length,
    });

    return publicGameFrom(tx, code, input.token);
  });

  emitGameChanged(code);
  return result;
}

export async function requestRematch(
  db: Database,
  input: { code: string; token: string },
): Promise<PublicGame> {
  const code = normalizeCode(input.code);
  let createdCode: string | null = null;

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
    if (game.status !== "finished") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A rematch can only start after the game ends.",
      });
    }

    const players = await tx
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, game.id));
    const player = players.find(
      (candidate) => candidate.tokenHash === tokenHash(input.token),
    );

    if (!player) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Player token is invalid.",
      });
    }
    if (players.length !== 2) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Both players must be present to request a rematch.",
      });
    }
    if (game.rematchCode || game.rematchRequestedBy === player.color) {
      return publicGameFrom(tx, code, input.token);
    }

    const botPlayer = players.find((candidate) => candidate.kind === "bot");
    if (botPlayer) {
      const nextState = createInitialState();
      const humanColor = randomPlayerColor();
      createdCode = gameCode();
      const [nextGame] = await tx
        .insert(games)
        .values({
          code: createdCode,
          status: "active",
          botDifficulty: game.botDifficulty ?? "balanced",
          rulesetVersion: nextState.rulesetVersion,
          state: nextState,
        })
        .returning({ id: games.id });

      if (!nextGame) {
        throw new Error("Bot rematch creation did not return an id.");
      }

      await tx.insert(gamePlayers).values(
        players.map((existingPlayer) => ({
          gameId: nextGame.id,
          color:
            existingPlayer.kind === "human"
              ? humanColor
              : otherColor(humanColor),
          kind: existingPlayer.kind,
          displayName: existingPlayer.displayName,
          tokenHash: existingPlayer.tokenHash,
        })),
      );

      await tx
        .update(games)
        .set({
          rematchRequestedBy: player.color,
          rematchCode: createdCode,
          version: game.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(games.id, game.id));

      return publicGameFrom(tx, code, input.token);
    }

    if (!game.rematchRequestedBy) {
      await tx
        .update(games)
        .set({
          rematchRequestedBy: player.color,
          version: game.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(games.id, game.id));

      return publicGameFrom(tx, code, input.token);
    }

    const nextState = createInitialState();
    const firstPlayer = players[0];
    if (!firstPlayer) {
      throw new Error("Rematch creation requires an existing player.");
    }
    const firstPlayerColor = randomPlayerColor();
    createdCode = gameCode();
    const [nextGame] = await tx
      .insert(games)
      .values({
        code: createdCode,
        status: "active",
        rulesetVersion: nextState.rulesetVersion,
        state: nextState,
      })
      .returning({ id: games.id });

    if (!nextGame) throw new Error("Rematch creation did not return an id.");

    await tx.insert(gamePlayers).values(
      players.map((existingPlayer) => ({
        gameId: nextGame.id,
        color:
          existingPlayer.id === firstPlayer.id
            ? firstPlayerColor
            : otherColor(firstPlayerColor),
        kind: existingPlayer.kind,
        displayName: existingPlayer.displayName,
        tokenHash: existingPlayer.tokenHash,
      })),
    );

    await tx
      .update(games)
      .set({
        rematchCode: createdCode,
        version: game.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(games.id, game.id));

    return publicGameFrom(tx, code, input.token);
  });

  emitGameChanged(code);
  if (createdCode) emitGameChanged(createdCode);
  return result;
}

function otherColor(color: PlayerColor): PlayerColor {
  return color === "ivory" ? "burgundy" : "ivory";
}
