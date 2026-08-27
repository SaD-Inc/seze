# Roadmap

Updated: 2026-08-27

## Now — public web MVP

- [x] create-t3-app foundation with Bun, Next.js, tRPC, Drizzle, and Tailwind
- [x] shadcn/ui design system and premium responsive visual direction
- [x] versioned provisional rules engine
- [x] guest-created tables and shareable join codes
- [x] PostgreSQL game state and move history
- [x] server-authoritative moves with optimistic concurrency
- [x] live SSE updates and reconnect recovery
- [x] Next.js standalone packaging and Railway configuration
- [x] two-client production multiplayer acceptance test
- [x] responsive production browser verification
- [ ] custom production domain

## Next — validate the game

- [ ] replace every inferred rule with confirmed behavior from authoritative gameplay
- [ ] expand capture, power, victory, and draw edge-case tests
- [ ] add move history and rematch
- [ ] add reconnect and abandoned-table cleanup policy
- [ ] add basic product analytics and error monitoring
- [ ] validate accessibility with keyboard and screen-reader play

## Later — native and competitive play

- [ ] Expo iOS and Android app using the same backend contract
- [ ] push notification when an opponent moves
- [ ] optional accounts for cross-device identity
- [ ] public matchmaking and ratings
- [ ] rules puzzles and computer opponent

## Product decisions

- Public name: SEZE / display mark: SE!ZE
- Public availability from the first working release
- Guest-first; accounts are explicitly deferred
- Game presented in isolation without creator or celebrity promotion
- Provisional rules allowed, with visible disclosure and versioned matches
