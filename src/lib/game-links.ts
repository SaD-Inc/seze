export function quickJoinPath(code: string): string {
  const normalizedCode = code.trim().toUpperCase();
  return `/join/${encodeURIComponent(normalizedCode)}`;
}

export function quickJoinUrl(origin: string, code: string): string {
  return new URL(quickJoinPath(code), origin).toString();
}
