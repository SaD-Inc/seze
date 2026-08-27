# SE!ZE

A public, guest-first web implementation of the two-player abstract strategy game SE!ZE.

**Play:** [playseze.com](https://playseze.com)

**Learn:** [playseze.com/rules](https://playseze.com/rules)

## Current release

- Create a private two-player table without an account.
- Join with a six-character code or shared link.
- Start from focused Create table and Join table dialogs with a generated,
  editable guest name.
- Share a `/join/CODE` quick-join link that offers a safe one-tap guest seat
  without allowing link-preview crawlers to consume it.
- Serve canonical, Open Graph, robots, sitemap, and structured game metadata
  from [playseze.com](https://playseze.com).
- Play on a synchronized, server-authoritative board.
- Reconnect to a persisted PostgreSQL game.
- Play with touch-sized controls, player strips around the board, and a clear
  active-turn treatment on both mobile and desktop.
- Request or accept a rematch after the game; both players move together to a
  new table with colors swapped.
- Review every position on a dedicated replay screen with a move list, slider,
  and opening/previous/next/latest controls.
- Learn through a responsive visual guide with animated movement, capture, and
  power-space examples plus a reduced-motion fallback.
- Use the transcript-confirmed boss terminology and three victory conditions.
- Start all 16 pieces in the central 4×4, with Ivory above Burgundy and each
  side's bosses together in the middle of its inward-facing row.
- Show eight bare perimeter powers—four `+` and four `×`. A guard landing on
  `+` gains attached rook-like movement; `×` grants attached bishop-like
  movement.
- Let bosses move one or two clear squares orthogonally or diagonally while
  preserving earlier matches under their original rules version.
- Use the current versioned movement and power rules with legal-move
  highlighting and sandwich captures.
- Run as a self-contained, minimal Next.js standalone image on Railway.

The rules are incomplete in public sources. The `+`/`×` mapping, persistent
attachment lifecycle, and diagonal boss movement remain working
interpretations. Inferred behavior is isolated in the versioned rules engine
so it can be revised without mixing match versions. Crowns and pyramids are
intentionally deferred until their behavior is understood.

## Stack

- Bun and TypeScript
- Next.js App Router through create-t3-app
- tRPC queries, mutations, and SSE subscriptions
- Drizzle ORM and PostgreSQL
- Tailwind CSS and shadcn/ui
- Railway standalone deployment

## Local development

Requirements: Bun and a Docker-compatible runtime.

```bash
cp .env.example .env
bun install
bun run dev
```

`bun run dev` starts PostgreSQL, applies reviewed migrations, and starts Next.js. Stop the database with `bun run db:stop`.

## Verification

```bash
bun run check
```

This formats and lints the source, validates TypeScript, runs all game, link,
guest-name, and retention tests, and creates the production standalone bundle.
Pull requests and pushes to `main` repeat that gate against PostgreSQL 17,
verify migration drift, audit production dependencies, and smoke-test the
standalone server.

The deployed acceptance pass also creates and completes a legal move through
both a 390×844 mobile viewport and a 1440×900 desktop viewport.

## Deployment

The production artifact contains a bundled migration runner and applies
reviewed migrations before launching the standalone server. Railway builds the
multi-stage `Dockerfile` with persistent Bun and Next.js caches, then ships only
the standalone runtime. The app exposes `/api/health`, Railway automatically
deploys pushes to `main`, and the web runtime is pinned to one EU replica
because live-table events are process-local in this first release.

A separate Railway cron service runs the bundled `cleanup:games` job once daily
and deletes tables whose last activity is more than 24 hours old. Foreign-key
cascades remove the associated players and move history in the same operation;
the cleanup path is backed by an activity-time index.

After a release, verify the real production path with:

```bash
bun run verify:production -- https://playseze.com
```

See [ROADMAP.md](./ROADMAP.md) for progress and planned work.
