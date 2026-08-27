import { describe, expect, test } from "bun:test";

import { buildReplayStates, InvalidReplayError } from "~/game/replay";
import type { PublicGameMove } from "~/game/types";

function move(
  moveNumber: number,
  playerColor: PublicGameMove["playerColor"],
  pieceId: string,
  from: PublicGameMove["from"],
  to: PublicGameMove["to"],
): PublicGameMove {
  return {
    moveNumber,
    playerColor,
    pieceId,
    from,
    to,
    capturedCount: 0,
    createdAt: new Date("2026-08-27T00:00:00Z"),
  };
}

describe("game replay", () => {
  test("reconstructs every position from persisted moves", () => {
    const states = buildReplayStates([
      move(1, "ivory", "i-g1", { row: 5, col: 1 }, { row: 4, col: 1 }),
      move(2, "burgundy", "b-g1", { row: 2, col: 1 }, { row: 3, col: 1 }),
    ]);

    expect(states).toHaveLength(3);
    expect(states[0]?.moveNumber).toBe(0);
    expect(states[1]?.turn).toBe("burgundy");
    expect(states[2]?.turn).toBe("ivory");
    expect(
      states[2]?.pieces.find((piece) => piece.id === "b-g1"),
    ).toMatchObject({ row: 3, col: 1 });
  });

  test("rejects a replay with missing move numbers", () => {
    expect(() =>
      buildReplayStates([
        move(2, "ivory", "i-g1", { row: 5, col: 1 }, { row: 4, col: 1 }),
      ]),
    ).toThrow(InvalidReplayError);
  });
});
