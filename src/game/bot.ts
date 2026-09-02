import {
  applyMove,
  CENTER_CELLS,
  coordinatesEqual,
  getLegalMoves,
  otherColor,
} from "~/game/rules";
import type {
  BotDifficulty,
  Coordinate,
  GamePiece,
  GameState,
  PlayerColor,
} from "~/game/types";

export type BotMove = {
  pieceId: string;
  to: Coordinate;
};

type BotSearchOptions = {
  difficulty?: BotDifficulty;
  maximumDepth?: number;
  timeBudgetMs?: number;
};

type RankedMove = BotMove & {
  nextState: GameState;
  priority: number;
};

const WIN_SCORE = 100_000;
export const BOT_DIFFICULTY_SEARCH = {
  easy: { maximumDepth: 1, timeBudgetMs: 40 },
  balanced: { maximumDepth: 4, timeBudgetMs: 180 },
  hard: { maximumDepth: 7, timeBudgetMs: 650 },
} as const satisfies Record<
  BotDifficulty,
  Required<Omit<BotSearchOptions, "difficulty">>
>;

class SearchTimeout extends Error {}

export function getAllLegalMoves(state: GameState): BotMove[] {
  return state.pieces
    .filter((piece) => piece.color === state.turn)
    .flatMap((piece) =>
      getLegalMoves(state, piece.id).map((to) => ({ pieceId: piece.id, to })),
    );
}

export function chooseBotMove(
  state: GameState,
  options: BotSearchOptions = {},
): BotMove {
  const difficulty = options.difficulty ?? "balanced";
  const settings = BOT_DIFFICULTY_SEARCH[difficulty];
  const maximumDepth = options.maximumDepth ?? settings.maximumDepth;
  const timeBudgetMs = options.timeBudgetMs ?? settings.timeBudgetMs;
  const deadline = Date.now() + Math.max(1, timeBudgetMs);
  const botColor = state.turn;
  const rootMoves = rankMoves(state);

  const fallback = rootMoves[0];
  if (!fallback) throw new Error("The bot has no legal move.");

  let bestMove: BotMove = moveFrom(fallback);

  for (let depth = 1; depth <= maximumDepth; depth += 1) {
    try {
      bestMove = searchRoot(state, botColor, depth, deadline).move;
    } catch (error) {
      if (error instanceof SearchTimeout) break;
      throw error;
    }
  }

  return bestMove;
}

function searchRoot(
  state: GameState,
  botColor: PlayerColor,
  depth: number,
  deadline: number,
): { move: BotMove; score: number } {
  assertWithinBudget(deadline);

  let alpha = -Infinity;
  const beta = Infinity;
  let bestScore = -Infinity;
  let bestMove: BotMove | null = null;
  const transpositions = new Map<string, number>();

  for (const move of rankMoves(state)) {
    const score = minimax(
      move.nextState,
      botColor,
      depth - 1,
      alpha,
      beta,
      deadline,
      transpositions,
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = moveFrom(move);
    }
    alpha = Math.max(alpha, bestScore);
  }

  if (!bestMove) throw new Error("The bot has no legal move.");
  return { move: bestMove, score: bestScore };
}

function minimax(
  state: GameState,
  botColor: PlayerColor,
  depth: number,
  alphaInput: number,
  betaInput: number,
  deadline: number,
  transpositions: Map<string, number>,
): number {
  assertWithinBudget(deadline);

  if (state.winner || depth === 0) return evaluateState(state, botColor);

  const cacheKey = stateKey(state, depth);
  const cached = transpositions.get(cacheKey);
  if (cached !== undefined) return cached;

  const moves = rankMoves(state);
  if (moves.length === 0) return evaluateState(state, botColor);

  const maximizing = state.turn === botColor;
  let alpha = alphaInput;
  let beta = betaInput;
  let bestScore = maximizing ? -Infinity : Infinity;
  let cutOff = false;

  for (const move of moves) {
    const score = minimax(
      move.nextState,
      botColor,
      depth - 1,
      alpha,
      beta,
      deadline,
      transpositions,
    );

    if (maximizing) {
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);
    } else {
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) {
      cutOff = true;
      break;
    }
  }

  if (!cutOff) transpositions.set(cacheKey, bestScore);
  return bestScore;
}

export function evaluateState(state: GameState, botColor: PlayerColor): number {
  if (state.winner === botColor) return WIN_SCORE - state.moveNumber;
  if (state.winner === otherColor(botColor)) {
    return -WIN_SCORE + state.moveNumber;
  }

  const opponent = otherColor(botColor);
  const botMaterial = materialScore(state.pieces, botColor);
  const opponentMaterial = materialScore(state.pieces, opponent);
  const centerDifference =
    centerCount(state, botColor) - centerCount(state, opponent);
  const mobilityDifference =
    mobility(state, botColor) - mobility(state, opponent);
  const scoreDifference = state.scores[botColor] - state.scores[opponent];

  return (
    botMaterial -
    opponentMaterial +
    centerDifference * 70 +
    mobilityDifference * 2 +
    scoreDifference * 8
  );
}

function materialScore(
  pieces: readonly GamePiece[],
  color: PlayerColor,
): number {
  return pieces
    .filter((piece) => piece.color === color)
    .reduce((score, piece) => {
      if (piece.kind === "boss") return score + 450;
      if (piece.power) return score + 180;
      return score + 100;
    }, 0);
}

function centerCount(state: GameState, color: PlayerColor): number {
  return CENTER_CELLS.filter((cell) =>
    state.pieces.some(
      (piece) => piece.color === color && coordinatesEqual(piece, cell),
    ),
  ).length;
}

function mobility(state: GameState, color: PlayerColor): number {
  const stateForColor = {
    ...state,
    turn: color,
    winner: null,
    winReason: null,
  };
  return getAllLegalMoves(stateForColor).length;
}

function rankMoves(state: GameState): RankedMove[] {
  const movingColor = state.turn;

  return getAllLegalMoves(state)
    .map((move) => {
      const nextState = applyMove(state, move.pieceId, move.to);
      const lastMove = nextState.lastMove;
      const priority =
        (nextState.winner === movingColor ? 1_000_000 : 0) +
        (lastMove?.scoreEarned ?? 0) * 10_000 +
        (lastMove?.powerGranted ? 1_000 : 0) +
        (CENTER_CELLS.some((cell) => coordinatesEqual(cell, move.to))
          ? 500
          : 0);

      return { ...move, nextState, priority };
    })
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        a.pieceId.localeCompare(b.pieceId) ||
        a.to.row - b.to.row ||
        a.to.col - b.to.col,
    );
}

function moveFrom(move: BotMove): BotMove {
  return { pieceId: move.pieceId, to: move.to };
}

function assertWithinBudget(deadline: number): void {
  if (Date.now() >= deadline) throw new SearchTimeout();
}

function stateKey(state: GameState, depth: number): string {
  const pieces = [...state.pieces]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (piece) =>
        `${piece.id}:${piece.color}:${piece.kind}:${piece.power ?? "-"}:${piece.row}:${piece.col}`,
    )
    .join("|");

  return `${depth}:${state.turn}:${state.scores.ivory}:${state.scores.burgundy}:${pieces}`;
}
