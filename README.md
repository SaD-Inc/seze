# SE!ZE

A public, guest-first web implementation of the two-player abstract strategy game SE!ZE.

**Play:** [playseze.com](https://playseze.com)

**Learn:** [playseze.com/rules](https://playseze.com/rules)

## Current release

- Create a private two-player table without an account.
- Join with a six-character code or shared link.
- Share a `/join/CODE` quick-join link that offers a safe one-tap guest seat
  without allowing link-preview crawlers to consume it.
- Serve canonical, Open Graph, robots, sitemap, and structured game metadata
  from [playseze.com](https://playseze.com).
- Play on a synchronized, server-authoritative board.
- Reconnect to a persisted PostgreSQL game.
- Play with touch-sized controls and an always-visible turn summary on phones,
  or the full board-and-status layout on desktop.
- Learn through a responsive visual guide with animated movement, capture, and
  power-space examples plus a reduced-motion fallback.
- Use the transcript-confirmed boss terminology and three victory conditions.
- Use the provisional `prototype-0.1` movement and power rules with legal-move
  highlighting and sandwich captures.
- Run as a self-contained Next.js standalone service on Railway.

The rules are incomplete in public sources. Inferred behavior is isolated in the versioned rules engine and clearly labelled in the product.

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

This formats and lints the source, validates TypeScript, runs the 16-test,
127-assertion rules-engine matrix, and creates the production standalone
bundle.

The deployed acceptance pass also creates and completes a legal move through
both a 390×844 mobile viewport and a 1440×900 desktop viewport.

## Deployment

The production start command applies reviewed migrations before launching the
standalone server. The app exposes `/api/health`, Railway automatically deploys
pushes to `main`, and the web runtime is pinned to one EU replica because
live-table events are process-local in this first release.

After a release, verify the real production path with:

```bash
bun run verify:production -- https://playseze.com
```

See [ROADMAP.md](./ROADMAP.md) for progress and planned work.
