import { createTRPCClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";

import { getLegalMoves } from "~/game/rules";
import type { PublicGame } from "~/game/types";
import type { AppRouter } from "~/server/api/root";

const baseUrl = process.argv[2]?.replace(/\/$/, "");

if (!baseUrl) {
  throw new Error("Usage: bun run verify:production -- https://seze.example");
}

const apiUrl = `${baseUrl}/api/trpc`;
const client = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ transformer: SuperJSON, url: apiUrl })],
});

const created = await client.game.create.mutate({
  displayName: "Release Ivory",
});
const joined = await client.game.join.mutate({
  code: created.game.code,
  displayName: "Release Burgundy",
});

if (joined.game.status !== "active" || joined.game.players.length !== 2) {
  throw new Error("The second guest did not activate the table.");
}

const subscriptionAbort = new AbortController();
let markSubscriptionReady: (() => void) | undefined;
const subscriptionReady = new Promise<void>((resolve) => {
  markSubscriptionReady = resolve;
});
const pushedUpdate = readLiveUpdate(
  apiUrl,
  created.game.code,
  joined.token,
  joined.game.version,
  subscriptionAbort.signal,
  () => markSubscriptionReady?.(),
);
await Promise.race([
  subscriptionReady,
  Bun.sleep(10_000).then(() => {
    throw new Error("Timed out while opening the live SSE connection.");
  }),
]);

const initial = await client.game.get.query({
  code: created.game.code,
  token: created.token,
});
const piece = initial.state.pieces.find(
  (candidate) => candidate.color === initial.state.turn,
);
if (!piece) throw new Error("No piece was available for the opening move.");

const destination = getLegalMoves(initial.state, piece.id)[0];
if (!destination) throw new Error("The opening piece had no legal move.");

const moved = await client.game.move.mutate({
  code: created.game.code,
  token: created.token,
  pieceId: piece.id,
  to: destination,
});
const pushed = await pushedUpdate.finally(() => subscriptionAbort.abort());
const persisted = await client.game.get.query({
  code: created.game.code,
  token: joined.token,
});

if (
  moved.state.moveNumber !== 1 ||
  pushed.version !== moved.version ||
  persisted.version !== moved.version
) {
  throw new Error(
    "The move was not consistent across mutation, SSE, and reload.",
  );
}

console.log(
  JSON.stringify(
    {
      code: created.game.code,
      health: "guest create → join → move → SSE → persisted reload",
      status: "ok",
      version: moved.version,
    },
    null,
    2,
  ),
);

async function readLiveUpdate(
  url: string,
  code: string,
  token: string,
  initialVersion: number,
  signal: AbortSignal,
  onReady: () => void,
): Promise<PublicGame> {
  const input = encodeURIComponent(
    JSON.stringify(SuperJSON.serialize({ code, token })),
  );
  const response = await fetch(`${url}/game.onChange?input=${input}`, {
    headers: { accept: "text/event-stream" },
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE connection failed with HTTP ${response.status}.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder
      .decode(chunk.value, { stream: true })
      .replace(/\r\n/g, "\n");

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const event = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      const data = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) continue;

      const decoded: unknown = SuperJSON.deserialize(JSON.parse(data));
      if (!isPublicGame(decoded)) continue;
      onReady();
      if (decoded.version > initialVersion) return decoded;
    }
  }

  throw new Error("The live SSE connection closed before the move arrived.");
}

function isPublicGame(value: unknown): value is PublicGame {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    typeof value.version === "number" &&
    "state" in value
  );
}
