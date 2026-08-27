import { describe, expect, test } from "bun:test";

import { STALE_GAME_MAX_AGE_MS, staleGameCutoff } from "./cleanup";

describe("stale game cleanup", () => {
  test("uses a strict 24-hour retention window", () => {
    const now = new Date("2026-08-27T17:00:00.000Z");

    expect(STALE_GAME_MAX_AGE_MS).toBe(86_400_000);
    expect(staleGameCutoff(now).toISOString()).toBe("2026-08-26T17:00:00.000Z");
  });
});
