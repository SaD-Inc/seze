import { describe, expect, test } from "bun:test";

import { generateGuestName } from "~/lib/player-token";

describe("guest names", () => {
  test("generates a friendly two-word alias", () => {
    const values = [0, 0.999];
    let call = 0;

    expect(generateGuestName(() => values[call++] ?? 0)).toBe("Bold Raven");
  });

  test("never exceeds the display-name limit", () => {
    for (let step = 0; step < 64; step += 1) {
      const name = generateGuestName(() => step / 64);
      expect(name.length).toBeGreaterThanOrEqual(2);
      expect(name.length).toBeLessThanOrEqual(24);
    }
  });
});
