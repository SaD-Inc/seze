# SEZE

SEZE is a guest-first web implementation of the two-player abstract strategy game. The web MVP is the current product; a native Expo client follows after the rules and multiplayer loop are validated.

## Product principles

- Make the first game possible without an account.
- Keep one dominant action per state: create, join, move, or invite.
- Treat the server as authoritative for every move and victory condition.
- Persist canonical game state so reconnecting never loses a match.
- Keep the rules engine framework-independent and version every ruleset.
- Label inferred mechanics honestly until authoritative rules are available.
- Present the game in isolation. Do not reference public personalities or campaign hype.
- Use the SEZE name throughout unless the product owner changes the branding decision.

## Stack

- Bun, TypeScript, Next.js App Router, tRPC, Drizzle, PostgreSQL
- Tailwind CSS and shadcn/ui with Radix primitives
- Next.js standalone output on Railway
- Guest player tokens stored locally; only hashes are persisted

## Verification

Run `bun run check` before committing. Multiplayer changes must also be exercised with two independent browser contexts.
