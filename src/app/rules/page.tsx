import {
  ArrowRight,
  BookOpenCheck,
  CircleDot,
  Crown,
  Diamond,
  ExternalLink,
  Focus,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "~/components/brand";
import {
  CaptainMoveVisual,
  CaptureVisual,
  GuardMoveVisual,
  PowerMoveVisual,
  RulesBoardOverview,
} from "~/components/rules-visuals";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export const metadata: Metadata = {
  title: "How to play",
  description:
    "Learn the prototype SE!ZE rules with animated examples for movement, power spaces, captures, and all three ways to win.",
  alternates: { canonical: "/rules" },
  openGraph: {
    title: "How to play SE!ZE",
    description:
      "Learn setup, movement, captures, power spaces, and all three ways to win with animated examples.",
    url: "/rules",
  },
};

export default function RulesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-20 text-[#f5e8d1] sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[54rem] bg-[radial-gradient(circle_at_50%_-12%,rgba(151,24,52,0.5),transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between py-5 sm:py-6">
          <Brand />
          <nav
            className="flex items-center gap-1"
            aria-label="Primary navigation"
          >
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-[#c9b898] hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              <Link href="/">Home</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[#9c1b37] text-white hover:bg-[#b62343]"
            >
              <Link href="/#play">
                Play now <ArrowRight className="size-4" />
              </Link>
            </Button>
          </nav>
        </header>

        <section className="mx-auto max-w-3xl pb-16 pt-14 text-center sm:pb-24 sm:pt-24">
          <Badge
            variant="outline"
            className="border-[#d0ac62]/25 bg-black/10 text-[#d7b971]"
          >
            <BookOpenCheck className="size-3.5" /> Prototype rules v0.1
          </Badge>
          <h1 className="mt-7 font-serif text-5xl leading-[0.95] text-[#fff0d3] sm:text-7xl">
            Learn the board.
            <br />
            <span className="text-[#d14a61]">Seize the game.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-8 text-[#c7b59e]">
            Two players alternate one move at a time. Control space, create a
            trap, and pursue any of three paths to victory.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-[#aa9a84]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d5b46b]/15 bg-black/10 px-3 py-2">
              <Users className="size-4 text-[#d2ae63]" /> 2 players
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d5b46b]/15 bg-black/10 px-3 py-2">
              <CircleDot className="size-4 text-[#d2ae63]" /> 8 pieces each
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d5b46b]/15 bg-black/10 px-3 py-2">
              <Focus className="size-4 text-[#d2ae63]" /> 3 ways to win
            </span>
          </div>
        </section>

        <section className="grid items-center gap-12 border-y border-[#d7b76f]/12 py-16 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Eyebrow>01 · Set the table</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl text-[#f4e5ca] sm:text-5xl">
              Six guards.
              <br />
              Two captains.
            </h2>
            <div className="mt-7 space-y-5 text-base leading-7 text-[#bbaa93]">
              <p>
                The board is an 8×8 grid with its four corner squares removed.
                Each side begins with six guards and two crowned captains.
              </p>
              <p>
                The four center cells are the heart of the position. The four
                circular marks near the corners are power spaces available to
                guards.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Legend icon={<Shield />} title="Guard">
                One orthogonal space
              </Legend>
              <Legend icon={<Crown />} title="Captain">
                Up to two orthogonal spaces
              </Legend>
            </div>
          </div>
          <RulesBoardOverview />
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>02 · Take a turn</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl text-[#f4e5ca] sm:text-5xl">
              Move with purpose
            </h2>
            <p className="mt-5 text-base leading-7 text-[#bbaa93]">
              Select one of your pieces, then choose a highlighted destination.
              Pieces cannot land on occupied cells or jump over another piece.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <RuleCard
              number="01"
              title="Guards step one"
              description="A guard moves one open square up, down, left, or right. Diagonal movement needs a power."
            >
              <GuardMoveVisual />
            </RuleCard>
            <RuleCard
              number="02"
              title="Captains reach two"
              description="A captain moves one or two open squares in a straight orthogonal line. It cannot jump."
            >
              <CaptainMoveVisual />
            </RuleCard>
            <RuleCard
              number="03"
              title="Make the sandwich"
              description="End a move with an enemy directly between the moved piece and another friendly piece. The trapped piece leaves the board."
            >
              <CaptureVisual />
            </RuleCard>
            <RuleCard
              number="04"
              title="Claim a power"
              description="A guard that lands on a marked space gains one rook-like or bishop-like sliding move, spent the next time that guard moves."
              provisional
            >
              <PowerMoveVisual />
            </RuleCard>
          </div>
        </section>

        <section className="border-y border-[#d7b76f]/12 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>03 · Finish the game</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl text-[#f4e5ca] sm:text-5xl">
              Win any one of three ways
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <WinCard icon={<Focus />} number="01" title="Seize the center">
              Occupy all four marked center cells with your own pieces.
            </WinCard>
            <WinCard icon={<Crown />} number="02" title="Take the captains">
              Capture both opposing captains through sandwich traps.
            </WinCard>
            <WinCard icon={<Shield />} number="03" title="Break the force">
              Reduce the opponent to only two remaining pieces.
            </WinCard>
          </div>
        </section>

        <section className="grid gap-8 py-16 sm:py-24 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <Eyebrow>Rules status</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl text-[#f4e5ca] sm:text-4xl">
              Clear about what we know
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-[#bbaa93]">
              Public descriptions confirm the board shape, piece counts, basic
              movement, sandwich capture, power-up spaces, and all three win
              conditions. A complete public rulebook has not been found.
            </p>
            <a
              href="https://boardgamegeek.com/boardgame/469945/seze"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#ddbd78] underline-offset-4 hover:text-[#f4d795] hover:underline"
            >
              Read the public game summary
              <ExternalLink className="size-4" />
            </a>
          </div>
          <div className="rounded-2xl border border-[#d5b46b]/18 bg-[#1a0c0e]/75 p-6 shadow-xl sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#d7b66d]/20 bg-[#8a1730]/25 text-[#e2bd72]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h3 className="font-serif text-xl text-[#f6e7cc]">
                  Prototype interpretation
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#b5a58f]">
                  Exact setup coordinates, stopping after one captain step,
                  no-jump behavior, which mark grants which power, and the
                  one-use power lifecycle remain provisional. Every match
                  records ruleset v0.1 so later revisions stay explicit.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#d6b56b]/18 bg-[radial-gradient(circle_at_50%_0%,rgba(149,28,55,0.34),transparent_65%),#170a0d] px-6 py-14 text-center shadow-2xl sm:px-10 sm:py-20">
          <Diamond className="mx-auto size-7 text-[#d8b66d]" />
          <h2 className="mt-6 font-serif text-4xl text-[#fff0d3] sm:text-5xl">
            Ready to take the center?
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#bbaa93]">
            Create a table as a guest, send the invite link, and play from any
            phone or desktop browser.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 min-h-12 bg-[#a31d3a] px-7 text-white hover:bg-[#bb2747]"
          >
            <Link href="/#play">
              Create a game <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>

        <footer className="mt-16 border-t border-[#d7b76f]/10 py-8 text-center text-xs text-[#766b5d]">
          SE!ZE prototype · Rules may evolve as stronger source material becomes
          available.
        </footer>
      </div>
    </main>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#d7b971]">
      {children}
    </p>
  );
}

function Legend({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#d5b46b]/15 bg-black/10 p-3">
      <span className="grid size-9 place-items-center rounded-full bg-[#742038]/45 text-[#e2bd72] [&_svg]:size-4">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-[#f0dfc2]">{title}</p>
        <p className="text-xs text-[#9f907c]">{children}</p>
      </div>
    </div>
  );
}

function RuleCard({
  number,
  title,
  description,
  provisional = false,
  children,
}: {
  number: string;
  title: string;
  description: string;
  provisional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#d5b46b]/16 bg-[#180b0d]/80 shadow-xl transition hover:border-[#d5b46b]/28">
      <div className="p-4 sm:p-5">{children}</div>
      <div className="border-t border-[#d5b46b]/12 px-5 pb-6 pt-5 sm:px-7 sm:pb-7">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs tracking-[0.2em] text-[#9c7d49]">
            {number}
          </span>
          {provisional ? (
            <Badge
              variant="outline"
              className="border-[#d0ac62]/20 text-[0.65rem] text-[#b9a67f]"
            >
              Prototype detail
            </Badge>
          ) : null}
        </div>
        <h3 className="mt-3 font-serif text-2xl text-[#f2dfbf]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#a99a86]">{description}</p>
      </div>
    </article>
  );
}

function WinCard({
  icon,
  number,
  title,
  children,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#d5b46b]/16 bg-[#180b0d]/72 p-6 sm:p-7">
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-[#8a1730]/15 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-full border border-[#d7b66d]/20 bg-[#8a1730]/25 text-[#e2bd72] [&_svg]:size-5">
          {icon}
        </span>
        <span className="font-mono text-xs tracking-[0.2em] text-[#765f3b]">
          {number}
        </span>
      </div>
      <h3 className="relative mt-6 font-serif text-2xl text-[#f2dfbf]">
        {title}
      </h3>
      <p className="relative mt-2 text-sm leading-6 text-[#a99a86]">
        {children}
      </p>
    </article>
  );
}
