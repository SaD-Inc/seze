const PLAYER_TOKEN_PREFIX = "seze:v1:player:";
const PLAYER_NAME_KEY = "seze:v1:display-name";

type DisplayNameStorage = Pick<Storage, "getItem" | "setItem">;

const GUEST_ADJECTIVES = [
  "Bold",
  "Bright",
  "Calm",
  "Clever",
  "Keen",
  "Lucky",
  "Quiet",
  "Swift",
] as const;

const GUEST_CREATURES = [
  "Badger",
  "Falcon",
  "Fox",
  "Heron",
  "Lynx",
  "Marten",
  "Owl",
  "Raven",
] as const;

function randomItem<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(Math.floor(random() * items.length), items.length - 1);
  return items[index] as T;
}

export function generateGuestName(random: () => number = Math.random): string {
  return `${randomItem(GUEST_ADJECTIVES, random)} ${randomItem(GUEST_CREATURES, random)}`;
}

export function readPlayerToken(code: string): string | null {
  return window.localStorage.getItem(`${PLAYER_TOKEN_PREFIX}${code}`);
}

export function storePlayerToken(
  code: string,
  token: string,
  displayName?: string,
): void {
  window.localStorage.setItem(`${PLAYER_TOKEN_PREFIX}${code}`, token);
  if (displayName) storeDisplayName(displayName);
}

export function readDisplayName(
  storage: DisplayNameStorage = window.localStorage,
): string {
  return storage.getItem(PLAYER_NAME_KEY) ?? "";
}

export function storeDisplayName(
  displayName: string,
  storage: DisplayNameStorage = window.localStorage,
): void {
  const normalizedName = displayName.trim().replace(/\s+/g, " ");
  if (normalizedName.length < 2) return;

  storage.setItem(PLAYER_NAME_KEY, normalizedName);
}

export function readOrCreateDisplayName(
  storage: DisplayNameStorage = window.localStorage,
  random: () => number = Math.random,
): string {
  const savedName = readDisplayName(storage).trim();
  if (savedName.length >= 2) return savedName;

  const generatedName = generateGuestName(random);
  storeDisplayName(generatedName, storage);
  return generatedName;
}

export function resolveDisplayName(
  override: string,
  suggestedName: string,
): string {
  const normalizedOverride = override.trim().replace(/\s+/g, " ");
  if (normalizedOverride.length > 0) return normalizedOverride;

  return suggestedName.trim().replace(/\s+/g, " ");
}
