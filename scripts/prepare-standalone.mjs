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

if (!existsSync(standalone)) {
  throw new Error("Next.js standalone output was not created.");
}

await mkdir(staticTarget, { recursive: true });
await cp(staticSource, staticTarget, { recursive: true });

if (existsSync(publicSource)) {
  await mkdir(publicTarget, { recursive: true });
  await cp(publicSource, publicTarget, { recursive: true });
}
