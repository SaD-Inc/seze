import {
  ArrowRight,
  BookOpenCheck,
  CircleDot,
  Crown,
  Focus,
  Shield,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "~/components/brand";
import { JsonLd } from "~/components/json-ld";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { siteConfig } from "~/lib/site";
import { strategyStructuredData } from "~/lib/structured-data";

const title = "SE!ZE Strategy Guide — Tactics to Win Online";
const description =
  "Improve your SE!ZE strategy with practical tactics for center control, sandwich captures, boss safety, power pieces, and all three ways to win.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/strategy" },
  openGraph: {
    type: "article",
    locale: siteConfig.locale,
    url: "/strategy",
    siteName: siteConfig.name,
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Play SE!ZE online — a two-player strategy game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/twitter-image"],
  },
};

export default function StrategyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-20 text-[#f5e8d1] sm:px-6">
      <JsonLd id="strategy-structured-data" data={strategyStructuredData} />
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
              <Link href="/rules">Rules</Link>
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

        <section className="mx-auto max-w-4xl pb-16 pt-14 text-center sm:pb-24 sm:pt-24">
          <Badge
            variant="outline"
            className="border-[#d0ac62]/25 bg-black/10 text-[#d7b971]"
          >
            <Sparkles className="size-3.5" /> Strategy guide
          </Badge>
          <h1 className="mt-7 font-serif text-5xl leading-[0.95] text-[#fff0d3] sm:text-7xl">
            SE!ZE strategy:
            <br />
            <span className="text-[#d14a61]">Choose the right win.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-3xl text-balance text-lg leading-8 text-[#c7b59e]">
            Strong SE!ZE strategy starts with one habit: after every move,
            evaluate center control, boss safety, and the remaining piece count.
            A move is strongest when it advances one victory path while forcing
            your opponent to answer another.
          </p>
          <p className="mt-6 text-xs text-[#8f816e]">
            <time dateTime={siteConfig.contentLastModified}>
              Last reviewed 28 August 2026
            </time>
          </p>
        </section>

        <section className="border-y border-[#d7b76f]/12 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>The central idea</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl text-[#f4e5ca] sm:text-5xl">
              Make one move do two jobs
            </h2>
            <p className="mt-5 text-base leading-7 text-[#bbaa93]">
              SE!ZE has three independent win conditions. The opponent must
              respect all of them, so a move that builds a center threat and a
              capture threat at the same time is more demanding than a move
              aimed at only one objective.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <PathCard icon={<Focus />} title="Center control">
              Count the four marked center spaces. Ask whether your move can
              claim one, support one, or force an enemy piece away from one.
            </PathCard>
            <PathCard icon={<Crown />} title="Boss pressure">
              Track both bosses as distinct targets. A boss that moves freely
              may still be unsafe if the landing square completes a sandwich.
            </PathCard>
            <PathCard icon={<Shield />} title="Piece count">
              Every capture matters because reducing the opposing force to two
              pieces ends the game even if both bosses survive.
            </PathCard>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Practical tactics</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl text-[#f4e5ca] sm:text-5xl">
              Six habits for better moves
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <TacticCard number="01" title="Read the landing square first">
              Captures are resolved from the piece that just moved. Before
              committing, inspect every orthogonal relationship created by the
              destination—not only the route used to reach it.
            </TacticCard>
            <TacticCard number="02" title="Keep valuable pieces supported">
              A lone advanced boss can become the middle of a sandwich. Build
              nearby support before extending, and check whether an apparent
              escape square gives the opponent a capture on the next turn.
            </TacticCard>
            <TacticCard number="03" title="Use guards to shape the board">
              Guards move slowly, which makes each step deliberate. Use them as
              anchors that restrict enemy destinations and as the fixed friendly
              piece on the far side of a planned sandwich capture.
            </TacticCard>
            <TacticCard number="04" title="Treat powers as lanes, not prizes">
              A + power creates long orthogonal movement and a × power creates
              long diagonal movement under the current rules version. Take one
              when its new lane changes the position, not merely because it is
              available.
            </TacticCard>
            <TacticCard number="05" title="Create threats on different axes">
              A center threat and a boss trap demand different replies. When
              both exist, look for the move that preserves either win after the
              opponent answers the other.
            </TacticCard>
            <TacticCard number="06" title="Recount after every capture">
              Captures change mobility, support, and the attrition win condition
              at once. Pause after the board changes and calculate again instead
              of continuing with the plan from the previous position.
            </TacticCard>
          </div>
        </section>

        <section className="grid gap-10 border-y border-[#d7b76f]/12 py-16 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow>Game plan</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl text-[#f4e5ca] sm:text-5xl">
              Change priorities as the board opens
            </h2>
            <p className="mt-5 leading-7 text-[#bbaa93]">
              The same piece can have a different job in the opening, middle
              game, and endgame. Reassign those jobs as lanes open and the piece
              count falls.
            </p>
          </div>
          <div className="space-y-4">
            <Phase title="Opening: improve without loosening">
              Develop pieces toward useful lanes while keeping bosses supported.
              Early moves should expand options and avoid giving the opponent a
              forcing sandwich.
            </Phase>
            <Phase title="Middle game: build overlapping threats">
              Once space opens, compare every candidate move across all three
              win conditions. Favor moves that attack the center while also
              creating a capture or restricting a boss.
            </Phase>
            <Phase title="Endgame: count before you chase">
              With fewer pieces, long lanes become stronger and every capture
              moves the attrition condition closer. Confirm whether the fastest
              win is the center, the bosses, or the remaining piece count.
            </Phase>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#d6b56b]/18 bg-[#170a0d]/80 p-7 shadow-2xl sm:p-10">
            <div className="flex items-center gap-3">
              <CircleDot className="size-5 text-[#d8b66d]" />
              <Eyebrow>Before you confirm a move</Eyebrow>
            </div>
            <h2 className="mt-5 font-serif text-3xl text-[#fff0d3] sm:text-4xl">
              The five-question turn check
            </h2>
            <ol className="mt-8 grid gap-3 text-sm leading-6 text-[#bbaa93] sm:grid-cols-2">
              <CheckItem number="1">
                Does this allow an immediate center win?
              </CheckItem>
              <CheckItem number="2">
                Can either boss be sandwiched next turn?
              </CheckItem>
              <CheckItem number="3">
                What capture does the landing square create?
              </CheckItem>
              <CheckItem number="4">
                Which lanes open after this piece moves?
              </CheckItem>
              <CheckItem number="5">
                What is the new piece count for both sides?
              </CheckItem>
            </ol>
          </div>
        </section>

        <section className="grid gap-8 rounded-[2rem] border border-[#d6b56b]/18 bg-[radial-gradient(circle_at_50%_0%,rgba(149,28,55,0.34),transparent_65%),#170a0d] px-6 py-14 shadow-2xl sm:px-10 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <BookOpenCheck className="size-7 text-[#d8b66d]" />
            <h2 className="mt-6 font-serif text-4xl text-[#fff0d3] sm:text-5xl">
              Know the rules before the tactic
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#bbaa93]">
              Review setup, legal movement, sandwich captures, and the current
              interpretation of power pieces before applying this guide.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <Button
              asChild
              size="lg"
              className="min-h-12 bg-[#a31d3a] px-7 text-white hover:bg-[#bb2747]"
            >
              <Link href="/rules">
                Read the rules <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-12 border-[#d6b46c]/25 bg-[#d6b46c]/5 px-7 text-[#e9cc90] hover:bg-[#d6b46c]/12 hover:text-[#ffe5ad]"
            >
              <Link href="/">Play a game</Link>
            </Button>
          </div>
        </section>

        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#d7b76f]/10 py-8 text-xs text-[#766b5d] sm:flex-row">
          <p>SE!ZE · Plan the threat, then take the space.</p>
          <nav
            className="flex items-center gap-5"
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

function PathCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[#d5b46b]/16 bg-[#180b0d]/72 p-6 sm:p-7">
      <span className="grid size-11 place-items-center rounded-full border border-[#d7b66d]/20 bg-[#8a1730]/25 text-[#e2bd72] [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="mt-6 font-serif text-2xl text-[#f2dfbf]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#a99a86]">{children}</p>
    </article>
  );
}

function TacticCard({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[#d5b46b]/16 bg-[#180b0d]/72 p-6 sm:p-7">
      <span className="font-mono text-xs tracking-[0.2em] text-[#9c7d49]">
        {number}
      </span>
      <h3 className="mt-3 font-serif text-2xl text-[#f2dfbf]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#a99a86]">{children}</p>
    </article>
  );
}

function Phase({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[#d5b46b]/15 bg-black/10 p-5 sm:p-6">
      <h3 className="font-serif text-xl text-[#f0dfc2]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#a99a86]">{children}</p>
    </article>
  );
}

function CheckItem({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex list-none items-start gap-3 rounded-xl border border-[#d5b46b]/12 bg-black/10 p-4">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#8a1730]/35 font-mono text-xs text-[#e2bd72]">
        {number}
      </span>
      <span>{children}</span>
    </li>
  );
}
