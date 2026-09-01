import { describe, expect, test } from "bun:test";

import {
  applyMove,
  CENTER_CELLS,
  createInitialState,
  getLegalMoves,
  InvalidMoveError,
  isPlayableCell,
  powerAt,
  scoreForCapturedPiece,
} from "~/game/rules";
import type { GamePiece, GameState } from "~/game/types";

function gamePiece(
  id: string,
  color: GamePiece["color"],
  kind: GamePiece["kind"],
  row: number,
  col: number,
  power: GamePiece["power"] = null,
): GamePiece {
  return { id, color, kind, row, col, power };
}

function testState(
  pieces: GamePiece[],
  overrides: Partial<Omit<GameState, "pieces">> = {},
): GameState {
  return { ...createInitialState(), turn: "ivory", ...overrides, pieces };
}

describe("SEZE board and setup", () => {
  test("only removes the four corners and rejects out-of-bounds cells", () => {
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const isCorner = (row === 0 || row === 7) && (col === 0 || col === 7);
        expect(isPlayableCell({ row, col })).toBe(!isCorner);
      }
    }

    expect(isPlayableCell({ row: -1, col: 3 })).toBe(false);
    expect(isPlayableCell({ row: 8, col: 3 })).toBe(false);
    expect(isPlayableCell({ row: 3, col: -1 })).toBe(false);
    expect(isPlayableCell({ row: 3, col: 8 })).toBe(false);
  });

  test("starts each side with six guards, two bosses, and unique playable positions", () => {
    const state = createInitialState();
    expect(state.rulesetVersion).toBe("prototype-0.3");
    expect(state.turn).toBe("burgundy");
    expect(state.moveNumber).toBe(0);
    expect(state.scores).toEqual({ ivory: 0, burgundy: 0 });
    expect(state.winner).toBeNull();
    expect(new Set(state.pieces.map((piece) => piece.id)).size).toBe(16);
    expect(
      new Set(state.pieces.map((piece) => `${piece.row}:${piece.col}`)).size,
    ).toBe(16);
    expect(state.pieces.every(isPlayableCell)).toBe(true);

    for (const color of ["ivory", "burgundy"] as const) {
      const pieces = state.pieces.filter((piece) => piece.color === color);
      expect(pieces).toHaveLength(8);
      expect(pieces.filter((piece) => piece.kind === "guard")).toHaveLength(6);
      expect(pieces.filter((piece) => piece.kind === "boss")).toHaveLength(2);
    }

    expect(
      CENTER_CELLS.map(
        (cell) =>
          state.pieces.find(
            (piece) => piece.row === cell.row && piece.col === cell.col,
          )?.kind,
      ),
    ).toEqual(["boss", "boss", "boss", "boss"]);

    expect(
      state.pieces
        .filter((piece) => piece.color === "ivory")
        .map(({ row, col }) => `${row}:${col}`)
        .sort(),
    ).toEqual(["2:2", "2:3", "2:4", "2:5", "3:2", "3:3", "3:4", "3:5"]);
    expect(
      state.pieces
        .filter((piece) => piece.color === "burgundy")
        .map(({ row, col }) => `${row}:${col}`)
        .sort(),
    ).toEqual(["4:2", "4:3", "4:4", "4:5", "5:2", "5:3", "5:4", "5:5"]);
  });

  test("maps the perimeter caps and four center crown spaces", () => {
    expect(powerAt({ row: 0, col: 2 })).toBe("rook");
    expect(powerAt({ row: 0, col: 5 })).toBe("bishop");
    expect(powerAt({ row: 2, col: 7 })).toBe("rook");
    expect(powerAt({ row: 5, col: 7 })).toBe("bishop");
    expect(powerAt({ row: 7, col: 5 })).toBe("rook");
    expect(powerAt({ row: 7, col: 2 })).toBe("bishop");
    expect(powerAt({ row: 5, col: 0 })).toBe("rook");
    expect(powerAt({ row: 2, col: 0 })).toBe("bishop");
    expect(powerAt({ row: 3, col: 3 })).toBe("boss");
    expect(powerAt({ row: 4, col: 4 })).toBe("boss");
  });
});

describe("SEZE movement", () => {
  test("guards move one open space in all eight directions", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 4, 4),
      gamePiece("b-g1", "burgundy", "guard", 6, 6),
    ]);

    expect(getLegalMoves(state, "i-g1")).toHaveLength(8);
    expect(getLegalMoves(state, "i-g1")).toContainEqual({ row: 3, col: 3 });
    expect(getLegalMoves(state, "i-g1")).toContainEqual({ row: 5, col: 5 });
  });

  test("bosses move one or two spaces orthogonally or diagonally without jumping blockers", () => {
    const state = testState([
      gamePiece("i-c1", "ivory", "boss", 4, 4),
      gamePiece("i-g1", "ivory", "guard", 2, 4),
      gamePiece("b-g1", "burgundy", "guard", 4, 2),
    ]);

    const moves = getLegalMoves(state, "i-c1");
    expect(moves).toContainEqual({ row: 3, col: 4 });
    expect(moves).not.toContainEqual({ row: 2, col: 4 });
    expect(moves).toContainEqual({ row: 4, col: 3 });
    expect(moves).not.toContainEqual({ row: 4, col: 2 });
    expect(moves).toContainEqual({ row: 3, col: 3 });
    expect(moves).toContainEqual({ row: 2, col: 2 });
    expect(moves).toContainEqual({ row: 5, col: 5 });
    expect(moves).toContainEqual({ row: 6, col: 6 });
  });

  test("rook and bishop powers slide on their matching lines and never jump", () => {
    const rookState = testState([
      gamePiece("i-g1", "ivory", "guard", 4, 4, "rook"),
      gamePiece("i-g2", "ivory", "guard", 2, 4),
      gamePiece("b-g1", "burgundy", "guard", 4, 6),
    ]);
    const rookMoves = getLegalMoves(rookState, "i-g1");
    expect(rookMoves).toContainEqual({ row: 3, col: 4 });
    expect(rookMoves).not.toContainEqual({ row: 1, col: 4 });
    expect(rookMoves).toContainEqual({ row: 4, col: 5 });
    expect(rookMoves).not.toContainEqual({ row: 4, col: 6 });
    expect(rookMoves).not.toContainEqual({ row: 4, col: 7 });
    expect(rookMoves).toContainEqual({ row: 3, col: 3 });

    const bishopState = testState([
      gamePiece("i-g1", "ivory", "guard", 4, 4, "bishop"),
      gamePiece("b-g1", "burgundy", "guard", 2, 2),
    ]);
    const bishopMoves = getLegalMoves(bishopState, "i-g1");
    expect(bishopMoves).toContainEqual({ row: 3, col: 3 });
    expect(bishopMoves).not.toContainEqual({ row: 2, col: 2 });
    expect(bishopMoves).not.toContainEqual({ row: 1, col: 1 });
    expect(bishopMoves).toContainEqual({ row: 7, col: 1 });
    expect(bishopMoves).toContainEqual({ row: 4, col: 3 });
  });

  test("a guard landing in the center is promoted to a boss", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 4, 2),
      gamePiece("b-c1", "burgundy", "boss", 0, 3),
      gamePiece("b-c2", "burgundy", "boss", 0, 4),
      gamePiece("b-g1", "burgundy", "guard", 6, 6),
    ]);

    const crowned = applyMove(state, "i-g1", { row: 3, col: 3 });
    const promotedBoss = crowned.pieces.find((piece) => piece.id === "i-g1");
    expect(promotedBoss).toMatchObject({ kind: "boss", power: "boss" });
    if (!promotedBoss) throw new Error("Expected the guard to be promoted.");
    expect(scoreForCapturedPiece(promotedBoss)).toBe(3);
    expect(crowned.lastMove?.powerGranted).toBe("boss");

    const bossMoves = getLegalMoves({ ...crowned, turn: "ivory" }, "i-g1");
    expect(bossMoves).toContainEqual({ row: 1, col: 1 });
  });

  test("rejects missing pieces, the wrong turn, occupied targets, and illegal geometry", () => {
    const state = createInitialState();
    expect(getLegalMoves(state, "missing")).toEqual([]);
    expect(getLegalMoves(state, "i-g1")).toEqual([]);

    expect(() => applyMove(state, "missing", { row: 4, col: 1 })).toThrow(
      "That piece is no longer on the board.",
    );
    expect(() => applyMove(state, "i-g1", { row: 1, col: 1 })).toThrow(
      "It is not that player's turn.",
    );
    expect(() => applyMove(state, "b-g1", { row: 5, col: 3 })).toThrow(
      "That move is not legal.",
    );
    expect(() => applyMove(state, "b-g1", { row: 3, col: 0 })).toThrow(
      "That move is not legal.",
    );
  });

  test("attaches a power on landing and keeps it on the guard", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 0, 1),
      gamePiece("i-c1", "ivory", "boss", 7, 3),
      gamePiece("i-c2", "ivory", "boss", 7, 4),
      gamePiece("b-g1", "burgundy", "guard", 5, 5),
      gamePiece("b-c1", "burgundy", "boss", 0, 3),
      gamePiece("b-c2", "burgundy", "boss", 0, 4),
    ]);
    const powered = applyMove(state, "i-g1", { row: 0, col: 2 });
    expect(powered.pieces.find((piece) => piece.id === "i-g1")?.power).toBe(
      "rook",
    );
    expect(powered.lastMove?.powerGranted).toBe("rook");

    const movedAgain = applyMove({ ...powered, turn: "ivory" }, "i-g1", {
      row: 5,
      col: 2,
    });
    expect(movedAgain.pieces.find((piece) => piece.id === "i-g1")?.power).toBe(
      "rook",
    );
    expect(movedAgain.lastMove?.powerGranted).toBeNull();
  });

  test("produces a new state, move record, and opposing turn", () => {
    const state = testState(createInitialState().pieces);
    const next = applyMove(state, "i-g1", { row: 1, col: 2 });

    expect(next).not.toBe(state);
    expect(state.pieces.find((piece) => piece.id === "i-g1")).toMatchObject({
      row: 2,
      col: 2,
    });
    expect(next.turn).toBe("burgundy");
    expect(next.moveNumber).toBe(1);
    expect(next.lastMove).toEqual({
      pieceId: "i-g1",
      from: { row: 2, col: 2 },
      to: { row: 1, col: 2 },
      capturedPieceIds: [],
      powerGranted: null,
      scoreEarned: 0,
    });
  });
});

describe("SEZE capture and victory", () => {
  test("captures an orthogonally sandwiched enemy", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 3, 1),
      gamePiece("i-g2", "ivory", "guard", 3, 4),
      gamePiece("i-c1", "ivory", "boss", 7, 3),
      gamePiece("i-c2", "ivory", "boss", 7, 4),
      gamePiece("b-g1", "burgundy", "guard", 3, 3),
      gamePiece("b-g2", "burgundy", "guard", 5, 5),
      gamePiece("b-c1", "burgundy", "boss", 0, 3),
      gamePiece("b-c2", "burgundy", "boss", 0, 4),
    ]);

    const next = applyMove(state, "i-g1", { row: 3, col: 2 });
    expect(next.pieces.some((piece) => piece.id === "b-g1")).toBe(false);
    expect(next.lastMove?.capturedPieceIds).toEqual(["b-g1"]);
  });

  test("captures on multiple sides in one move", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 2, 2),
      gamePiece("i-g2", "ivory", "guard", 0, 3),
      gamePiece("i-g3", "ivory", "guard", 2, 5),
      gamePiece("i-c1", "ivory", "boss", 7, 3),
      gamePiece("i-c2", "ivory", "boss", 7, 4),
      gamePiece("b-g1", "burgundy", "guard", 1, 3),
      gamePiece("b-g2", "burgundy", "guard", 2, 4),
      gamePiece("b-g3", "burgundy", "guard", 5, 5),
      gamePiece("b-c1", "burgundy", "boss", 0, 4),
      gamePiece("b-c2", "burgundy", "boss", 0, 5),
    ]);

    const next = applyMove(state, "i-g1", { row: 2, col: 3 });
    expect(next.lastMove?.capturedPieceIds).toEqual(["b-g1", "b-g2"]);
  });

  test("captures diagonally but does not punish moving between enemy pieces", () => {
    const diagonal = testState([
      gamePiece("i-g1", "ivory", "guard", 2, 1),
      gamePiece("i-g2", "ivory", "guard", 4, 4),
      gamePiece("i-c1", "ivory", "boss", 7, 3),
      gamePiece("i-c2", "ivory", "boss", 7, 4),
      gamePiece("b-g1", "burgundy", "guard", 3, 3),
      gamePiece("b-g2", "burgundy", "guard", 5, 5),
      gamePiece("b-c1", "burgundy", "boss", 0, 3),
      gamePiece("b-c2", "burgundy", "boss", 0, 4),
    ]);
    const diagonalMove = applyMove(diagonal, "i-g1", { row: 2, col: 2 });
    expect(diagonalMove.pieces.some((piece) => piece.id === "b-g1")).toBe(
      false,
    );

    const betweenEnemies = testState([
      gamePiece("i-g1", "ivory", "guard", 2, 1),
      gamePiece("i-c1", "ivory", "boss", 7, 3),
      gamePiece("i-c2", "ivory", "boss", 7, 4),
      gamePiece("b-g1", "burgundy", "guard", 1, 2),
      gamePiece("b-g2", "burgundy", "guard", 3, 2),
      gamePiece("b-g3", "burgundy", "guard", 5, 5),
      gamePiece("b-c1", "burgundy", "boss", 0, 3),
      gamePiece("b-c2", "burgundy", "boss", 0, 4),
    ]);
    const safeMove = applyMove(betweenEnemies, "i-g1", { row: 2, col: 2 });
    expect(safeMove.pieces.some((piece) => piece.id === "i-g1")).toBe(true);
    expect(safeMove.lastMove?.capturedPieceIds).toEqual([]);
  });

  test("scores one for a guard, two for a plus/pyramid guard, and three for a boss", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 4, 1),
      gamePiece("i-g2", "ivory", "guard", 3, 3),
      gamePiece("i-g3", "ivory", "guard", 1, 1),
      gamePiece("i-g4", "ivory", "guard", 1, 3),
      gamePiece("b-g1", "burgundy", "guard", 3, 2),
      gamePiece("b-g2", "burgundy", "guard", 2, 1, "rook"),
      gamePiece("b-c1", "burgundy", "boss", 2, 2),
      gamePiece("b-c2", "burgundy", "boss", 0, 4),
      gamePiece("b-g3", "burgundy", "guard", 6, 5),
      gamePiece("b-g4", "burgundy", "guard", 6, 6),
    ]);

    const next = applyMove(state, "i-g1", { row: 3, col: 1 });
    expect(next.lastMove?.capturedPieceIds).toEqual(["b-g2", "b-g1", "b-c1"]);
    expect(next.lastMove?.scoreEarned).toBe(6);
    expect(next.scores).toEqual({ ivory: 6, burgundy: 0 });
  });

  test("wins by occupying all four center cells", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 2, 3),
      gamePiece("i-g2", "ivory", "guard", 3, 4),
      gamePiece("i-c1", "ivory", "boss", 4, 3),
      gamePiece("i-c2", "ivory", "boss", 4, 4),
      gamePiece("b-g1", "burgundy", "guard", 1, 1),
      gamePiece("b-g2", "burgundy", "guard", 1, 2),
      gamePiece("b-c1", "burgundy", "boss", 0, 3),
      gamePiece("b-c2", "burgundy", "boss", 0, 4),
    ]);

    const next = applyMove(state, "i-g1", { row: 3, col: 3 });
    expect(next.winner).toBe("ivory");
    expect(next.winReason).toBe("center");
  });

  test("wins by capturing every opposing boss", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 3, 1),
      gamePiece("i-g2", "ivory", "guard", 1, 2),
      gamePiece("i-g3", "ivory", "guard", 3, 4),
      gamePiece("i-c1", "ivory", "boss", 7, 3),
      gamePiece("i-c2", "ivory", "boss", 7, 4),
      gamePiece("b-c1", "burgundy", "boss", 2, 2),
      gamePiece("b-c2", "burgundy", "boss", 3, 3),
      gamePiece("b-g1", "burgundy", "guard", 5, 1),
      gamePiece("b-g2", "burgundy", "guard", 5, 2),
      gamePiece("b-g3", "burgundy", "guard", 5, 3),
    ]);

    const next = applyMove(state, "i-g1", { row: 3, col: 2 });
    expect(next.winner).toBe("ivory");
    expect(next.winReason).toBe("bosses");
  });

  test("a promoted boss must also be captured for the boss victory", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 3, 1),
      gamePiece("i-g2", "ivory", "guard", 3, 4),
      gamePiece("i-b1", "ivory", "boss", 7, 3),
      gamePiece("i-b2", "ivory", "boss", 7, 4),
      gamePiece("b-b1", "burgundy", "boss", 3, 3),
      gamePiece("b-promoted", "burgundy", "boss", 0, 4, "boss"),
      gamePiece("b-g1", "burgundy", "guard", 5, 1),
      gamePiece("b-g2", "burgundy", "guard", 5, 2),
      gamePiece("b-g3", "burgundy", "guard", 5, 3),
    ]);

    const next = applyMove(state, "i-g1", { row: 3, col: 2 });
    expect(next.lastMove?.capturedPieceIds).toEqual(["b-b1"]);
    expect(next.pieces.some((piece) => piece.id === "b-promoted")).toBe(true);
    expect(next.winner).toBeNull();
  });

  test("wins by reducing the opposing force to two pieces", () => {
    const state = testState([
      gamePiece("i-g1", "ivory", "guard", 3, 1),
      gamePiece("i-g2", "ivory", "guard", 3, 4),
      gamePiece("i-c1", "ivory", "boss", 7, 3),
      gamePiece("i-c2", "ivory", "boss", 7, 4),
      gamePiece("b-g1", "burgundy", "guard", 3, 3),
      gamePiece("b-c1", "burgundy", "boss", 0, 3),
      gamePiece("b-c2", "burgundy", "boss", 0, 4),
    ]);

    const next = applyMove(state, "i-g1", { row: 3, col: 2 });
    expect(next.winner).toBe("ivory");
    expect(next.winReason).toBe("pieces");
  });

  test("finished games have no legal moves and cannot be changed", () => {
    const finished = {
      ...createInitialState(),
      winner: "ivory" as const,
      winReason: "center" as const,
    };
    expect(getLegalMoves(finished, "i-g1")).toEqual([]);
    expect(() => applyMove(finished, "i-g1", { row: 4, col: 1 })).toThrow(
      InvalidMoveError,
    );
    expect(() => applyMove(finished, "i-g1", { row: 4, col: 1 })).toThrow(
      "This game is already finished.",
    );
  });
});
