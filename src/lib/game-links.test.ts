import { describe, expect, test } from "bun:test";

import { quickJoinPath, quickJoinUrl } from "~/lib/game-links";

describe("quick join links", () => {
  test("normalizes table codes into a dedicated join path", () => {
    expect(quickJoinPath(" ab12cd ")).toBe("/join/AB12CD");
  });

  test("builds an absolute URL without retaining an existing path", () => {
    expect(quickJoinUrl("https://play.example/game/OLD", "xy34za")).toBe(
      "https://play.example/join/XY34ZA",
    );
  });
});
