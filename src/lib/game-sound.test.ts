import { describe, expect, test } from "bun:test";

import { advanceSoundedMove, gameSoundForMove } from "~/lib/game-sound";

describe("move sound state", () => {
  test("uses a distinct impact for captures", () => {
    expect(gameSoundForMove(0)).toBe("move");
    expect(gameSoundForMove(1)).toBe("capture");
    expect(gameSoundForMove(3)).toBe("capture");
  });

  test("stays silent when a game first loads", () => {
    expect(advanceSoundedMove(null, "ABC123", 4)).toEqual({
      next: { code: "ABC123", moveNumber: 4 },
      shouldPlay: false,
    });
  });

  test("plays once when the move number advances", () => {
    expect(
      advanceSoundedMove({ code: "ABC123", moveNumber: 4 }, "ABC123", 5),
    ).toEqual({
      next: { code: "ABC123", moveNumber: 5 },
      shouldPlay: true,
    });
  });

  test("ignores duplicate and stale updates", () => {
    const previous = { code: "ABC123", moveNumber: 5 };

    expect(advanceSoundedMove(previous, "ABC123", 5)).toEqual({
      next: previous,
      shouldPlay: false,
    });
    expect(advanceSoundedMove(previous, "ABC123", 4)).toEqual({
      next: previous,
      shouldPlay: false,
    });
  });

  test("stays silent when navigating to another game", () => {
    expect(
      advanceSoundedMove({ code: "ABC123", moveNumber: 5 }, "XYZ789", 1),
    ).toEqual({
      next: { code: "XYZ789", moveNumber: 1 },
      shouldPlay: false,
    });
  });
});
