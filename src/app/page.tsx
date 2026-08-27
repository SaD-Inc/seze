import { ArrowDown, CircleDot, Clock3, Users } from "lucide-react";
import Link from "next/link";

import { Brand } from "~/components/brand";
import { Lobby } from "~/components/lobby";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { siteConfig } from "~/lib/site";

const videoGameSchema = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  applicationCategory: "Game",
  gamePlatform: "Web browser",
  operatingSystem: "Any",
  playMode: "MultiPlayer",
  numberOfPlayers: {
    "@type": "QuantitativeValue",
    value: 2,
  },
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
};

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-20 text-[#f5e8d1] sm:px-6">
      <script type="application/ld+json">
        {JSON.stringify(videoGameSchema)}
      </script>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[48rem] bg-[radial-gradient(circle_at_50%_-10%,rgba(151,24,52,0.48),transparent_58%)]" />
      <div className="pointer-events-none absolute start-[-12rem] top-72 size-[32rem] rounded-full bg-[#73152a]/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between py-6">
          <Brand />
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-[#c9b898] hover:bg-white/5 hover:text-white"
            >
              <Link href="/rules">How to play</Link>
            </Button>
            <Badge
              variant="outline"
              className="hidden border-[#d0ac62]/25 bg-black/10 text-[#c9b898] sm:inline-flex"
            >
              Live multiplayer
            </Badge>
          </div>
        </header>

        <section className="relative flex min-h-[38rem] flex-col items-center justify-center py-10 text-center sm:min-h-[42rem] sm:py-16">
          <div className="home-arena" aria-hidden="true">
            <span className="home-arena-piece home-arena-piece-ivory" />
            <span className="home-arena-piece home-arena-piece-burgundy" />
          </div>
          <div className="relative z-10 flex w-full flex-col items-center">
            <h1 className="font-serif text-6xl leading-none tracking-[0.08em] text-[#fff0d3] drop-shadow-2xl sm:text-8xl md:text-[9rem]">
              SE<span className="text-[#c5304c]">!</span>ZE
            </h1>
            <div className="mt-9 w-full">
              <Lobby />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[#a99a85]">
              <span className="flex items-center gap-2">
                <Users className="size-4 text-[#d2ae63]" /> 2 players
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="size-4 text-[#d2ae63]" /> 10–30 minutes
              </span>
              <span className="flex items-center gap-2">
                <CircleDot className="size-4 text-[#d2ae63]" /> 3 ways to win
              </span>
            </div>
            <Button
              asChild
              variant="link"
              className="mt-7 h-auto text-[#c8ac75] hover:text-[#f3d99e]"
            >
              <Link href="#what-is-seze">
                What is SE!ZE? <ArrowDown className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section
          className="mx-auto scroll-mt-8 border-t border-[#d7b76f]/12 pt-16 text-center"
          id="what-is-seze"
        >
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#aa8951]">
            Simple objective · layered decisions
          </p>
          <h2 className="mt-4 font-serif text-4xl text-[#f4e4c8] sm:text-5xl">
            What is SE!ZE?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance leading-7 text-[#b8a892]">
            A two-player strategy game played with sixteen pieces. Move,
            capture, and pressure the center—then win through one of three
            distinct paths.
          </p>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 text-start sm:grid-cols-3">
            <Feature number="01" title="Seize the center">
              Occupy the four central spaces and hold the heart of the board.
            </Feature>
            <Feature number="02" title="Take the bosses">
              Use positioning and sandwich captures to remove both bosses.
            </Feature>
            <Feature number="03" title="Break the guard">
              Reduce the opposing force to its final two pieces.
            </Feature>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-10 border-[#d6b46c]/25 bg-[#d6b46c]/5 text-[#e9cc90] hover:bg-[#d6b46c]/12 hover:text-[#ffe5ad]"
          >
            <Link href="/rules">See how to play</Link>
          </Button>
        </section>

        <footer className="mt-24 border-t border-[#d7b76f]/10 py-8 text-center text-xs text-[#766b5d]">
          SE!ZE · Play online with friends.
        </footer>
      </div>
    </main>
  );
}

function Feature({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#d7b76f]/12 bg-[#1a0d0e]/55 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
      <span className="font-mono text-xs tracking-[0.22em] text-[#9c7d49]">
        {number}
      </span>
      <h2 className="mt-3 font-serif text-xl text-[#ead9bd]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#9f907d]">{children}</p>
    </div>
  );
}
