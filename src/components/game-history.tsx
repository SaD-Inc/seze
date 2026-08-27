"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crown,
  History as HistoryIcon,
  SkipBack,
  SkipForward,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Brand } from "~/components/brand";
import { GameBoard } from "~/components/game-board";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { buildReplayStates } from "~/game/replay";
import type { GamePiece, PublicGameMove } from "~/game/types";
import { readPlayerToken } from "~/lib/player-token";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const emptyMoves: PublicGameMove[] = [];

export function GameHistory({ code }: { code: string }) {
  const normalizedCode = code.toUpperCase();
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  useEffect(() => {
    setToken(readPlayerToken(normalizedCode));
    setTokenLoaded(true);
  }, [normalizedCode]);

  const historyQuery = api.game.history.useQuery(
    { code: normalizedCode, token: token ?? undefined },
    { enabled: tokenLoaded, refetchOnWindowFocus: true },
  );
  api.game.onChange.useSubscription(
    { code: normalizedCode },
    {
      enabled: tokenLoaded,
      onData: () => void historyQuery.refetch(),
    },
  );
  const moves = historyQuery.data?.moves ?? emptyMoves;
  const rulesetVersion = historyQuery.data?.game.state.rulesetVersion;
  const replay = useMemo(() => {
    try {
      return {
        states: buildReplayStates(moves, rulesetVersion),
        error: null,
      };
    } catch (error) {
      return {
        states: [],
        error:
          error instanceof Error
            ? error.message
            : "This replay is unavailable.",
      };
    }
  }, [moves, rulesetVersion]);

  const maximumStep = moves.length;
  const step = Math.min(selectedStep ?? maximumStep, maximumStep);
  const state = replay.states[step];

  if (!tokenLoaded || historyQuery.isLoading) return <HistoryLoading />;

  if (historyQuery.error || !historyQuery.data || replay.error || !state) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-[#f4e7d0]">
        <Card className="max-w-md border-[#d2ad61]/20 bg-[#180b0d] text-center text-inherit">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              Replay unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-[#bdaa92]">
            <p role="alert">
              {historyQuery.error?.message ??
                replay.error ??
                "This game could not be reconstructed."}
            </p>
            <Button
              asChild
              className="bg-[#9c1b37] text-white hover:bg-[#b62343]"
            >
              <Link href={`/game/${normalizedCode}`}>Return to the table</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { game } = historyQuery.data;
  const selectedMove = step > 0 ? moves[step - 1] : null;
  const previousState = step > 0 ? replay.states[step - 1] : null;
  const movedPiece = selectedMove
    ? previousState?.pieces.find((piece) => piece.id === selectedMove.pieceId)
    : undefined;
  const moverName = selectedMove
    ? game.players.find((player) => player.color === selectedMove.playerColor)
        ?.displayName
    : null;
  const atLatest = step === maximumStep;
  const heading =
    step === 0
      ? "Opening position"
      : atLatest && game.state.winner
        ? "Final position"
        : `Move ${step} of ${maximumStep}`;
  const footerMessage = selectedMove
    ? `${moverName ?? colorName(selectedMove.playerColor)} moved ${pieceName(movedPiece)} ${squareName(selectedMove.from)} → ${squareName(selectedMove.to)}${selectedMove.capturedCount ? ` · captured ${selectedMove.capturedCount}` : ""}.`
    : "The opening setup before the first move.";

  function chooseStep(nextStep: number) {
    setSelectedStep(Math.max(0, Math.min(nextStep, maximumStep)));
  }

  return (
    <main className="min-h-screen px-3 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between py-4 sm:py-5">
        <Brand />
        <Button
          asChild
          variant="outline"
          className="border-[#d6b46c]/25 bg-[#d6b46c]/7 text-[#ead1a1] hover:bg-[#d6b46c]/15 hover:text-[#ffe7b6]"
        >
          <Link href={`/game/${normalizedCode}`}>
            <ArrowLeft className="size-4" />
            Back to table
          </Link>
        </Button>
      </header>

      <section className="mx-auto max-w-7xl">
        <div className="mb-1 flex items-end justify-between gap-4 px-1 py-2 text-[#f4e7d0]">
          <div>
            <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-[#a99572]">
              <HistoryIcon className="size-3.5" /> Review · {game.code}
            </div>
            <h1 className="mt-0.5 font-serif text-xl sm:text-2xl">{heading}</h1>
          </div>
          {game.state.winner ? (
            <Badge className="border-0 bg-[#d8b76d] px-3 py-1.5 text-[#35160e]">
              <Crown className="size-3.5" />
              {colorName(game.state.winner)} won
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-[#d6b46c]/25 text-[#cdb788]"
            >
              Live
            </Badge>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
          <section className="flex min-h-0 items-start justify-center px-1 py-2 sm:px-8 sm:py-4 lg:sticky lg:top-4 lg:py-6">
            <div className="w-[min(100%,calc(100svh-17rem))] max-w-[720px]">
              <GameBoard
                state={state}
                viewerColor={game.viewerColor}
                disabled
                footerMessage={footerMessage}
              />
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-5">
            <Card className="border-[#d9b86d]/20 bg-[#1a0c0e]/92 text-[#f2e5cd] shadow-2xl">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[#9f907a]">
                  <span>Position</span>
                  <span className="tabular-nums">
                    {step} / {maximumStep}
                  </span>
                </div>
                <CardTitle className="font-serif text-2xl">{heading}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  aria-label="Replay position"
                  type="range"
                  min={0}
                  max={maximumStep}
                  value={step}
                  onChange={(event) => chooseStep(Number(event.target.value))}
                  disabled={maximumStep === 0}
                  className="h-2 w-full cursor-pointer accent-[#c72e4f] disabled:cursor-default"
                />
                <div className="grid grid-cols-4 gap-2">
                  <ReplayButton
                    label="Opening position"
                    disabled={step === 0}
                    onClick={() => chooseStep(0)}
                  >
                    <SkipBack />
                  </ReplayButton>
                  <ReplayButton
                    label="Previous move"
                    disabled={step === 0}
                    onClick={() => chooseStep(step - 1)}
                  >
                    <ChevronLeft />
                  </ReplayButton>
                  <ReplayButton
                    label="Next move"
                    disabled={atLatest}
                    onClick={() => chooseStep(step + 1)}
                  >
                    <ChevronRight />
                  </ReplayButton>
                  <ReplayButton
                    label="Latest position"
                    disabled={atLatest}
                    onClick={() => chooseStep(maximumStep)}
                  >
                    <SkipForward />
                  </ReplayButton>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#d9b86d]/20 bg-[#160a0c]/88 text-[#f2e5cd]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between font-serif text-xl">
                  Move history
                  <span className="font-sans text-xs font-normal text-[#8f816e]">
                    {maximumStep} moves
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="max-h-[22rem] space-y-1 overflow-y-auto pe-1">
                  <HistoryRow
                    active={step === 0}
                    title="Opening setup"
                    detail="Move 0"
                    onClick={() => chooseStep(0)}
                  />
                  {moves.map((move, index) => {
                    const before = replay.states[index];
                    const piece = before?.pieces.find(
                      (candidate) => candidate.id === move.pieceId,
                    );
                    const player = game.players.find(
                      (candidate) => candidate.color === move.playerColor,
                    );

                    return (
                      <HistoryRow
                        key={move.moveNumber}
                        active={step === move.moveNumber}
                        color={move.playerColor}
                        title={`${player?.displayName ?? colorName(move.playerColor)} · ${pieceName(piece)}`}
                        detail={`${squareName(move.from)} → ${squareName(move.to)}${move.capturedCount ? ` · ${move.capturedCount} captured` : ""}`}
                        onClick={() => chooseStep(move.moveNumber)}
                      />
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ReplayButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="w-full border-[#d6b46c]/20 bg-[#d6b46c]/6 text-[#dfc68f] hover:bg-[#d6b46c]/14 hover:text-[#ffe7b2]"
    >
      {children}
    </Button>
  );
}

function HistoryRow({
  active,
  color,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  color?: PublicGameMove["playerColor"];
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-current={active ? "step" : undefined}
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition",
          active
            ? "border-[#d7b86e]/35 bg-[#8b1731]/35"
            : "border-transparent hover:border-[#d7b86e]/15 hover:bg-white/3",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-3 shrink-0 rounded-full border",
            !color && "border-[#8c7d68] bg-[#3a2c27]",
            color === "ivory" && "border-[#a88a58] bg-[#eadabd]",
            color === "burgundy" && "border-[#d47b6c]/55 bg-[#8f1c35]",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{title}</span>
          <span className="block truncate text-xs text-[#958772]">
            {detail}
          </span>
        </span>
      </button>
    </li>
  );
}

function colorName(color: "ivory" | "burgundy") {
  return color === "ivory" ? "Ivory" : "Burgundy";
}

function pieceName(piece?: GamePiece) {
  return piece?.kind === "captain" ? "Boss" : "Guard";
}

function squareName({ row, col }: PublicGameMove["from"]) {
  return `${String.fromCharCode(65 + col)}${8 - row}`;
}

function HistoryLoading() {
  return (
    <main className="grid min-h-screen place-items-center text-[#e7d6b8]">
      <div className="text-center">
        <Brand className="pointer-events-none" />
        <p className="mt-5 animate-pulse text-sm tracking-wide text-[#9f917d]">
          Rebuilding the game…
        </p>
      </div>
    </main>
  );
}
