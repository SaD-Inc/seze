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

### CI parity and pushes

- Treat `.github/workflows/ci.yml` as the authoritative verification contract. Before pushing, inspect it and reproduce every applicable CI step; `bun run check` alone is not sufficient when a change affects dependencies, environment validation, database tooling, builds, runtime packaging, or workflows.
- Never rely on the developer's local `.env` to validate CI. For environment-sensitive changes, run the affected commands with `bun --no-env-file` and only the variables declared by the workflow. A local pass with extra environment variables does not count as CI verification.
- Classify every new environment variable by where it is required. Variables needed only by optional browser integrations must remain optional for database commands, tests, builds, and runtime startup unless CI and every other execution context explicitly provide them.
- When dependencies change, commit both `package.json` and `bun.lock`, then verify `bun install --frozen-lockfile` succeeds.
- Before pushing, run `git diff --check`, confirm the intended files with `git status`, and run the relevant full CI sequence from a clean-environment perspective. Do not push known-unverified changes to `main`.
- A push is not complete when `git push` returns successfully. Watch the resulting GitHub Actions run to a terminal state. If CI fails, read the failed step and logs, fix the cause, rerun local verification, and push the correction before reporting completion.
