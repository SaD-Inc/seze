const PLAYER_TOKEN_PREFIX = "seze:v1:player:";
const PLAYER_NAME_KEY = "seze:v1:display-name";

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
  if (displayName) window.localStorage.setItem(PLAYER_NAME_KEY, displayName);
}

export function readDisplayName(): string {
  return window.localStorage.getItem(PLAYER_NAME_KEY) ?? "";
}

export function readOrCreateDisplayName(): string {
  const savedName = readDisplayName().trim();
  if (savedName.length >= 2) return savedName;

  const generatedName = generateGuestName();
  window.localStorage.setItem(PLAYER_NAME_KEY, generatedName);
  return generatedName;
}
