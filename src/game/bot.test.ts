import { describe, expect, test } from "bun:test";

import {
  BOT_DIFFICULTY_SEARCH,
  chooseBotMove,
  evaluateState,
  getAllLegalMoves,
} from "~/game/bot";
import { applyMove, createInitialState } from "~/game/rules";
import type { GamePiece, GameState } from "~/game/types";

function piece(
  id: string,
  color: GamePiece["color"],
  kind: GamePiece["kind"],
  row: number,
  col: number,
  power: GamePiece["power"] = null,
): GamePiece {
  return { id, color, kind, row, col, power };
}

function state(
  pieces: GamePiece[],
  overrides: Partial<Omit<GameState, "pieces">> = {},
): GameState {
  return { ...createInitialState(), turn: "ivory", ...overrides, pieces };
}

describe("SEZE bot", () => {
  test("uses progressively deeper searches for each difficulty", () => {
    expect(BOT_DIFFICULTY_SEARCH.easy.maximumDepth).toBeLessThan(
      BOT_DIFFICULTY_SEARCH.balanced.maximumDepth,
    );
    expect(BOT_DIFFICULTY_SEARCH.balanced.maximumDepth).toBeLessThan(
      BOT_DIFFICULTY_SEARCH.hard.maximumDepth,
    );
    expect(BOT_DIFFICULTY_SEARCH.easy.timeBudgetMs).toBeLessThan(
      BOT_DIFFICULTY_SEARCH.balanced.timeBudgetMs,
    );
    expect(BOT_DIFFICULTY_SEARCH.balanced.timeBudgetMs).toBeLessThan(
      BOT_DIFFICULTY_SEARCH.hard.timeBudgetMs,
    );
  });

  test("always chooses a legal move from the opening position", () => {
    const opening = createInitialState();
    const legalMoves = getAllLegalMoves(opening);
    const selected = chooseBotMove(opening, {
      maximumDepth: 2,
      timeBudgetMs: 1_000,
    });

    expect(legalMoves).toContainEqual(selected);
    expect(() =>
      applyMove(opening, selected.pieceId, selected.to),
    ).not.toThrow();
  });

  test("takes an immediate center victory", () => {
    const position = state([
      piece("i-g1", "ivory", "guard", 2, 3),
      piece("i-g2", "ivory", "guard", 3, 4),
      piece("i-c1", "ivory", "boss", 4, 3),
      piece("i-c2", "ivory", "boss", 4, 4),
      piece("b-g1", "burgundy", "guard", 1, 1),
      piece("b-g2", "burgundy", "guard", 1, 2),
      piece("b-c1", "burgundy", "boss", 0, 3),
      piece("b-c2", "burgundy", "boss", 0, 4),
    ]);

    const selected = chooseBotMove(position, {
      maximumDepth: 2,
      timeBudgetMs: 1_000,
    });

    expect(selected).toEqual({ pieceId: "i-g1", to: { row: 3, col: 3 } });
    expect(applyMove(position, selected.pieceId, selected.to).winner).toBe(
      "ivory",
    );
  });

  test("blocks an opponent's immediate center victory", () => {
    const position = state(
      [
        piece("b-g1", "burgundy", "guard", 2, 2),
        piece("b-c1", "burgundy", "boss", 6, 3),
        piece("b-c2", "burgundy", "boss", 6, 4),
        piece("b-g2", "burgundy", "guard", 6, 5),
        piece("i-g1", "ivory", "guard", 2, 3),
        piece("i-g2", "ivory", "guard", 3, 4),
        piece("i-c1", "ivory", "boss", 4, 3),
        piece("i-c2", "ivory", "boss", 4, 4),
      ],
      { turn: "burgundy" },
    );

    const selected = chooseBotMove(position, {
      maximumDepth: 2,
      timeBudgetMs: 1_000,
    });

    expect(selected).toEqual({ pieceId: "b-g1", to: { row: 3, col: 3 } });
  });

  test("scores wins above material advantages", () => {
    const won = state([], {
      winner: "ivory",
      winReason: "center",
    });
    const materialLead = state([
      piece("i-c1", "ivory", "boss", 4, 4),
      piece("i-c2", "ivory", "boss", 5, 5),
      piece("b-g1", "burgundy", "guard", 1, 1),
    ]);

    expect(evaluateState(won, "ivory")).toBeGreaterThan(
      evaluateState(materialLead, "ivory"),
    );
  });
});
