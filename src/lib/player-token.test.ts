import { describe, expect, test } from "bun:test";

import {
  generateGuestName,
  readDisplayName,
  readOrCreateDisplayName,
  resolveDisplayName,
  storeDisplayName,
} from "~/lib/player-token";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

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

  test("caches generated names and valid player edits", () => {
    const storage = memoryStorage();

    expect(readOrCreateDisplayName(storage, () => 0)).toBe("Bold Badger");
    expect(readDisplayName(storage)).toBe("Bold Badger");

    storeDisplayName("  Keen   Fox  ", storage);
    expect(readOrCreateDisplayName(storage, () => 0.999)).toBe("Keen Fox");

    storeDisplayName("x", storage);
    expect(readDisplayName(storage)).toBe("Keen Fox");
  });

  test("treats the suggested guest name as an empty-input fallback", () => {
    expect(resolveDisplayName("", "Swift Owl")).toBe("Swift Owl");
    expect(resolveDisplayName("   ", "Swift Owl")).toBe("Swift Owl");
    expect(resolveDisplayName("  My   Name  ", "Swift Owl")).toBe("My Name");
  });
});
