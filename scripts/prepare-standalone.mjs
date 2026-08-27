import { existsSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";

const standalone = new URL("../.next/standalone/", import.meta.url);
const staticSource = new URL("../.next/static/", import.meta.url);
const staticTarget = new URL(
  "../.next/standalone/.next/static/",
  import.meta.url,
);
const publicSource = new URL("../public/", import.meta.url);
const publicTarget = new URL("../.next/standalone/public/", import.meta.url);
const migrationsSource = new URL("../drizzle/", import.meta.url);
const migrationsTarget = new URL(
  "../.next/standalone/drizzle/",
  import.meta.url,
);
const startSource = new URL("./start-production.mjs", import.meta.url);
const startTarget = new URL("../.next/standalone/start.mjs", import.meta.url);

if (!existsSync(standalone)) {
  throw new Error("Next.js standalone output was not created.");
}

await mkdir(staticTarget, { recursive: true });
await cp(staticSource, staticTarget, { recursive: true });

if (existsSync(publicSource)) {
  await mkdir(publicTarget, { recursive: true });
  await cp(publicSource, publicTarget, { recursive: true });
}

await mkdir(migrationsTarget, { recursive: true });
await cp(migrationsSource, migrationsTarget, { recursive: true });
await cp(startSource, startTarget);

for (const requiredFile of [
  new URL("../.next/standalone/server.js", import.meta.url),
  new URL("../.next/standalone/migrate.mjs", import.meta.url),
  startTarget,
]) {
  if (!existsSync(requiredFile)) {
    throw new Error(`Standalone runtime is missing ${requiredFile.pathname}.`);
  }
}
