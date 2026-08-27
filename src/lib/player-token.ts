const PLAYER_TOKEN_PREFIX = "seze:v1:player:";
const PLAYER_NAME_KEY = "seze:v1:display-name";

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
