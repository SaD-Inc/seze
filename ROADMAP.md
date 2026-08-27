# Roadmap

Updated: 2026-08-27

## Now — public web MVP

- [x] create-t3-app foundation with Bun, Next.js, tRPC, Drizzle, and Tailwind
- [x] shadcn/ui design system and premium responsive visual direction
- [x] versioned rules engine
- [x] guest-created tables and shareable join codes
- [x] PostgreSQL game state and move history
- [x] server-authoritative moves with optimistic concurrency
- [x] live SSE updates and reconnect recovery
- [x] Next.js standalone packaging and Railway configuration
- [x] two-client production multiplayer acceptance test
- [x] interactive mobile and desktop production move verification
- [x] animated responsive how-to-play guide
- [x] expanded setup, movement, blocker, power, capture, victory, and game-over
      rules tests
- [x] keyboard focus limited to playable pieces and legal destinations
- [x] crawler-safe quick-join links with a one-tap guest seat
- [x] custom production domain with canonical SEO and social sharing metadata
- [x] transcript-confirmed boss terminology, 16-piece setup, and three victory
      conditions reflected in the product
- [x] board-first mobile and desktop gameplay with active player emphasis
- [x] complete request/accept rematch flow with automatic shared-table routing
- [x] dedicated move-review screen with replay controls and position history

## Next — validate the game

- [ ] replace every inferred rule with confirmed behavior from authoritative gameplay
- [ ] confirm draw, stalemate, repeated-position, and forced-pass behavior
- [x] add reconnect and abandoned-table cleanup policy
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
- Versioned matches keep future rules revisions isolated
- Visual rules examples use CSS animation with a reduced-motion fallback and
  share opening-position data with the live rules engine
