import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to apply production migrations.");
}

const migrationClient = postgres(databaseUrl, { max: 1 });

try {
  await migrate(drizzle(migrationClient), {
    migrationsFolder: new URL("./drizzle/", import.meta.url).pathname,
  });
  console.log("Production database migrations are up to date.");
} finally {
  await migrationClient.end();
}
