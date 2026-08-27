import { lt } from "drizzle-orm";

import type { db as database } from "~/server/db";
import { games } from "~/server/db/schema";

type Database = typeof database;

export const STALE_GAME_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

export function staleGameCutoff(now = new Date()): Date {
  return new Date(now.getTime() - STALE_GAME_MAX_AGE_MS);
}

export async function deleteStaleGames(
  db: Database,
  cutoff = staleGameCutoff(),
): Promise<number> {
  const deleted = await db
    .delete(games)
    .where(lt(games.updatedAt, cutoff))
    .returning({ id: games.id });

  return deleted.length;
}
