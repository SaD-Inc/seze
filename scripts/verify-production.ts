import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
} from "@trpc/client";
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
const subscriptionClient = createTRPCClient<AppRouter>({
  links: [httpSubscriptionLink({ transformer: SuperJSON, url: apiUrl })],
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

let stopSubscription: (() => void) | undefined;
const pushedUpdate = new Promise<PublicGame>((resolve, reject) => {
  const timeout = setTimeout(() => {
    stopSubscription?.();
    reject(new Error("Timed out waiting for the live SSE board update."));
  }, 10_000);

  const subscription = subscriptionClient.game.onChange.subscribe(
    { code: created.game.code, token: joined.token },
    {
      onData(game) {
        if (game.data.version <= joined.game.version) return;
        clearTimeout(timeout);
        resolve(game.data);
      },
      onError(error) {
        clearTimeout(timeout);
        reject(error);
      },
    },
  );

  stopSubscription = () => subscription.unsubscribe();
});

await Bun.sleep(300);

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
const pushed = await pushedUpdate.finally(() => stopSubscription?.());
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
