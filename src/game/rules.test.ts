import { describe, expect, test } from "bun:test";

import {
  applyMove,
  createInitialState,
  getLegalMoves,
  isPlayableCell,
} from "~/game/rules";
import type { GameState } from "~/game/types";

describe("prototype SEZE rules", () => {
  test("removes all four corner cells", () => {
    expect(isPlayableCell({ row: 0, col: 0 })).toBe(false);
    expect(isPlayableCell({ row: 0, col: 7 })).toBe(false);
    expect(isPlayableCell({ row: 7, col: 0 })).toBe(false);
    expect(isPlayableCell({ row: 7, col: 7 })).toBe(false);
    expect(isPlayableCell({ row: 0, col: 1 })).toBe(true);
  });

  test("starts with six guards and two captains per player", () => {
    const state = createInitialState();
    for (const color of ["ivory", "burgundy"] as const) {
      const pieces = state.pieces.filter((piece) => piece.color === color);
      expect(pieces).toHaveLength(8);
      expect(pieces.filter((piece) => piece.kind === "guard")).toHaveLength(6);
      expect(pieces.filter((piece) => piece.kind === "captain")).toHaveLength(
        2,
      );
    }
  });

  test("guards move one open orthogonal space", () => {
    const state = createInitialState();
    expect(getLegalMoves(state, "i-g1")).toEqual([
      { row: 4, col: 1 },
      { row: 6, col: 1 },
      { row: 5, col: 0 },
    ]);
  });

  test("captures an enemy sandwiched between friendly pieces", () => {
    const state: GameState = {
      ...createInitialState(),
      pieces: [
        {
          id: "i-g1",
          color: "ivory",
          kind: "guard",
          power: null,
          row: 3,
          col: 1,
        },
        {
          id: "i-g2",
          color: "ivory",
          kind: "guard",
          power: null,
          row: 3,
          col: 4,
        },
        {
          id: "i-c1",
          color: "ivory",
          kind: "captain",
          power: null,
          row: 7,
          col: 3,
        },
        {
          id: "i-c2",
          color: "ivory",
          kind: "captain",
          power: null,
          row: 7,
          col: 4,
        },
        {
          id: "b-g1",
          color: "burgundy",
          kind: "guard",
          power: null,
          row: 3,
          col: 3,
        },
        {
          id: "b-c1",
          color: "burgundy",
          kind: "captain",
          power: null,
          row: 0,
          col: 3,
        },
        {
          id: "b-c2",
          color: "burgundy",
          kind: "captain",
          power: null,
          row: 0,
          col: 4,
        },
      ],
    };

    const next = applyMove(state, "i-g1", { row: 3, col: 2 });
    expect(next.pieces.some((piece) => piece.id === "b-g1")).toBe(false);
    expect(next.lastMove?.capturedPieceIds).toEqual(["b-g1"]);
  });
});
