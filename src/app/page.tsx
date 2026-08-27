import { ArrowDown, CircleDot, Clock3, Users } from "lucide-react";
import Link from "next/link";

import { Brand } from "~/components/brand";
import { Lobby } from "~/components/lobby";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-20 text-[#f5e8d1] sm:px-6">
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
              Prototype rules · Live multiplayer
            </Badge>
          </div>
        </header>

        <section className="flex min-h-[24rem] flex-col items-center justify-center py-8 text-center sm:min-h-[36rem] sm:py-16">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.28em] text-[#d7b971]">
            A game of position and pressure
          </p>
          <h1 className="font-serif text-6xl leading-none tracking-[0.08em] text-[#fff0d3] drop-shadow-2xl sm:text-8xl md:text-[9rem]">
            SE<span className="text-[#c5304c]">!</span>ZE
          </h1>
          <p className="mt-7 max-w-xl text-balance text-lg leading-8 text-[#c7b59e] sm:text-xl">
            Control the center. Trap your opponent. Find one of three paths to
            victory in a fast two-player strategy game.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[#a99a85]">
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
          <ArrowDown className="mt-8 size-5 animate-bounce text-[#8d7658] sm:mt-14" />
        </section>

        <section className="flex justify-center scroll-mt-8" id="play">
          <Lobby />
        </section>

        <section className="mx-auto mt-24 grid max-w-4xl gap-8 border-t border-[#d7b76f]/12 pt-12 text-center sm:grid-cols-3">
          <Feature number="01" title="Seize the center">
            Occupy the four central spaces and hold the heart of the board.
          </Feature>
          <Feature number="02" title="Take the captains">
            Use positioning and sandwich captures to remove both captains.
          </Feature>
          <Feature number="03" title="Break the guard">
            Reduce the opposing force to its final two pieces.
          </Feature>
        </section>

        <footer className="mt-24 border-t border-[#d7b76f]/10 py-8 text-center text-xs text-[#766b5d]">
          SE!ZE prototype · Rules may evolve as official details become
          available.
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
    <div>
      <span className="font-mono text-xs tracking-[0.22em] text-[#9c7d49]">
        {number}
      </span>
      <h2 className="mt-3 font-serif text-xl text-[#ead9bd]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#9f907d]">{children}</p>
    </div>
  );
}
