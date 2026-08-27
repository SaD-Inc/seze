import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { deleteStaleGames, staleGameCutoff } from "~/server/game/cleanup";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to clean up stale games.");
}

const cutoff = staleGameCutoff();
const client = postgres(databaseUrl, { max: 1 });

try {
  const deletedGames = await deleteStaleGames(drizzle(client), cutoff);
  console.log(
    JSON.stringify({
      cutoff: cutoff.toISOString(),
      deletedGames,
      status: "ok",
    }),
  );
} finally {
  await client.end();
}
