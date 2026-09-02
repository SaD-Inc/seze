import {
  ArrowRight,
  BookOpenCheck,
  CircleDot,
  Crown,
  Diamond,
  Focus,
  Plus,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "~/components/brand";
import { JsonLd } from "~/components/json-ld";
import { ProjectDisclaimer } from "~/components/project-disclaimer";
import {
  BossMoveVisual,
  CaptureVisual,
  GuardMoveVisual,
  PowerMoveVisual,
  RulesBoardOverview,
} from "~/components/rules-visuals";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { siteConfig } from "~/lib/site";
import { rulesStructuredData } from "~/lib/structured-data";

const title = "How to Play SE!ZE — Rules, Moves & Ways to Win";
const description =
  "Learn how to play SE!ZE: move guards and bosses, capture in straight or diagonal sandwiches, use three cap powers, score captures, and master all three ways to win.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/rules" },
  openGraph: {
    type: "article",
    locale: siteConfig.locale,
    url: "/rules",
    siteName: siteConfig.name,
    title,
    description,
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "SE!ZE — Move. Trap. Seize. Play the free strategy game online. No account needed.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [
      {
        url: "/twitter-image.jpg",
        alt: "SE!ZE — Move. Trap. Seize. Play the free strategy game online. No account needed.",
      },
    ],
  },
};

export default function RulesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-20 text-[#f5e8d1] sm:px-6">
      <JsonLd id="rules-structured-data" data={rulesStructuredData} />
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
              <Link href="/">
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
            <BookOpenCheck className="size-3.5" /> Rules guide
          </Badge>
          <h1 className="mt-7 font-serif text-[clamp(2rem,9.3vw,2.5rem)] leading-[1.08] text-[#fff0d3] sm:text-7xl sm:leading-[1.02]">
            <span className="block whitespace-nowrap">How to play SE!ZE.</span>
            <span className="mt-2 block text-[#d14a61] sm:mt-1">
              Learn the board.
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-8 text-[#c7b59e]">
            Red moves first, then players alternate one move at a time. Control
            space, create a trap, and pursue any of three paths to victory.
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
          <p className="mt-6 text-xs text-[#8f816e]">
            <time dateTime={siteConfig.contentLastModified}>
              Last reviewed 1 September 2026
            </time>
          </p>
        </section>

        <section className="grid items-center gap-12 border-y border-[#d7b76f]/12 py-16 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Eyebrow>01 · Set the table</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl text-[#f4e5ca] sm:text-5xl">
              Sixteen pieces.
              <br />
              Two bosses per side.
            </h2>
            <div className="mt-7 space-y-5 text-base leading-7 text-[#bbaa93]">
              <p>
                The board is an 8×8 grid with its four corner squares removed.
                There are 16 pieces total: each side begins with six guards and
                two crowned bosses.
              </p>
              <p>
                All 16 pieces fill the central 4×4: Gold takes the upper two
                rows and Red the lower two. The perimeter has four + and four ×
                power spaces; the four center markers are crown spaces.
              </p>
              <p>
                The physical cap supply contains eight pluses, eight pyramids,
                and eight crowns. Red takes the first turn.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Legend icon={<Shield />} title="Guard">
                One space in any direction
              </Legend>
              <Legend icon={<Crown />} title="Boss">
                Up to two spaces in any direction
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
              description="A guard moves one open square horizontally, vertically, or diagonally."
            >
              <GuardMoveVisual />
            </RuleCard>
            <RuleCard
              number="02"
              title="Bosses reach two"
              description="A boss moves one or two open squares orthogonally or diagonally. It cannot jump."
            >
              <BossMoveVisual />
            </RuleCard>
            <RuleCard
              number="03"
              title="Make the sandwich"
              description="Complete a horizontal, vertical, or diagonal sandwich with the piece you moved. Moving into an existing trap does not cause a capture."
            >
              <CaptureVisual />
            </RuleCard>
            <RuleCard
              number="04"
              title="Attach a cap"
              description="A guard on + gains long rook-like lines, × grants a pyramid cap for long diagonals, and a center marker grants a crown that promotes it to a boss."
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
            <WinCard icon={<Crown />} number="02" title="Take the bosses">
              Capture every opposing boss through sandwich traps. Each side
              begins with two, but center promotion can add more.
            </WinCard>
            <WinCard icon={<Shield />} number="03" title="Break the force">
              Reduce the opponent to only two remaining pieces.
            </WinCard>
          </div>
          <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#d5b46b]/16 bg-[#180b0d]/72 p-6 text-[#a99a86] sm:flex-row sm:items-center sm:p-7">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#d7b66d]/20 bg-[#8a1730]/25 text-[#e2bd72]">
              <Trophy className="size-5" />
            </span>
            <div>
              <h3 className="font-serif text-2xl text-[#f2dfbf]">
                Keep score from the first capture
              </h3>
              <p className="mt-2 text-sm leading-6">
                A plain guard is worth 1 point, a guard wearing a plus or
                pyramid cap is worth 2, and any boss—including a guard promoted
                with a crown—is worth 3. This online ruleset has no timer;
                points are recorded alongside the three victory paths.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 py-16 sm:py-24 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <Eyebrow>Rules status</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl text-[#f4e5ca] sm:text-4xl">
              Clear about what we know
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-[#bbaa93]">
              A live rules recap confirms 16 pieces, Red moving first, all eight
              one-step directions, boss movement, three cap types, straight and
              diagonal captures, scoring, and all three win conditions.
            </p>
            <div className="mt-8 border-s-2 border-[#d7b66d]/25 ps-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#d7b971]">
                Original game design
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a99a86]">
                SE!ZE was designed by British game designer{" "}
                <a
                  className="text-[#d9bc7e] underline decoration-[#d9bc7e]/35 underline-offset-4 transition-colors hover:text-[#ffe1a2]"
                  href={siteConfig.gameCredits.designer.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {siteConfig.gameCredits.designer.name}
                </a>{" "}
                in collaboration with {siteConfig.gameCredits.collaborator} for
                Baby Teeth and Chivas Regal. The{" "}
                <a
                  className="text-[#d9bc7e] underline decoration-[#d9bc7e]/35 underline-offset-4 transition-colors hover:text-[#ffe1a2]"
                  href={siteConfig.gameCredits.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  original collaboration
                </a>{" "}
                is documented by Chivas Regal.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#d5b46b]/18 bg-[#1a0c0e]/75 p-6 shadow-xl sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#d7b66d]/20 bg-[#8a1730]/25 text-[#e2bd72]">
                <Plus className="size-4" />
              </span>
              <div>
                <h3 className="font-serif text-xl text-[#f6e7cc]">
                  Rules note
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#b5a58f]">
                  A guard that reaches a center marker takes a crown and becomes
                  a boss. It is then worth 3 capture points and must be captured
                  along with every other opposing boss for the boss-capture
                  victory. The cap replacement and inventory lifecycle were not
                  explained in the recap, so every match records its rules
                  version for future corrections.
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
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="min-h-12 bg-[#a31d3a] px-7 text-white hover:bg-[#bb2747]"
            >
              <Link href="/">
                Create a game <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-12 border-[#d6b46c]/25 bg-[#d6b46c]/5 px-7 text-[#e9cc90] hover:bg-[#d6b46c]/12 hover:text-[#ffe5ad]"
            >
              <Link href="/strategy">Read the strategy guide</Link>
            </Button>
          </div>
        </section>

        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#d7b76f]/10 py-8 text-xs text-[#766b5d] sm:flex-row">
          <ProjectDisclaimer tagline="SE!ZE · Learn the board, then take the center." />
          <nav
            className="flex shrink-0 items-center gap-5"
            aria-label="Footer navigation"
          >
            <Link className="hover:text-[#c8ac75]" href="/">
              Play
            </Link>
            <Link className="hover:text-[#c8ac75]" href="/rules">
              Rules
            </Link>
            <Link className="hover:text-[#c8ac75]" href="/strategy">
              Strategy
            </Link>
          </nav>
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
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#d5b46b]/16 bg-[#180b0d]/80 shadow-xl transition-colors hover:border-[#d5b46b]/28">
      <div className="px-4 pb-0 pt-4 sm:px-5 sm:pt-5">{children}</div>
      <div className="px-5 pb-6 pt-4 sm:px-7 sm:pb-7 sm:pt-4">
        <div className="flex items-start justify-between gap-5">
          <h3 className="font-serif text-2xl text-[#f2dfbf]">{title}</h3>
          <span className="mt-1 shrink-0 font-mono text-xs tracking-[0.2em] text-[#9c7d49]">
            {number}
          </span>
        </div>
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
