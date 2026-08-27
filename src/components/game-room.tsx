"use client";

import { Check, Copy, Radio, RotateCcw, Users } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Brand } from "~/components/brand";
import { GameBoard } from "~/components/game-board";
import { RulesDialog } from "~/components/rules-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import type { PlayerColor, PublicGame, WinReason } from "~/game/types";
import {
  readDisplayName,
  readPlayerToken,
  storePlayerToken,
} from "~/lib/player-token";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const winCopy: Record<WinReason, string> = {
  center: "seized all four central spaces",
  captains: "captured both opposing captains",
  pieces: "reduced the opposition to two pieces",
};

export function GameRoom({ code }: { code: string }) {
  const normalizedCode = code.toUpperCase();
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [joinName, setJoinName] = useState("");
  const utils = api.useUtils();

  useEffect(() => {
    setToken(readPlayerToken(normalizedCode));
    setJoinName(readDisplayName());
    setTokenLoaded(true);
  }, [normalizedCode]);

  const queryInput = useMemo(
    () => ({ code: normalizedCode, token: token ?? undefined }),
    [normalizedCode, token],
  );

  const gameQuery = api.game.get.useQuery(queryInput, {
    enabled: tokenLoaded,
    refetchOnWindowFocus: true,
  });

  api.game.onChange.useSubscription(
    { code: normalizedCode },
    {
      enabled: tokenLoaded,
      onData: (incoming) => {
        utils.game.get.setData(queryInput, (current) => ({
          ...incoming.data,
          viewerColor: current?.viewerColor ?? null,
        }));
      },
      onError: () => void gameQuery.refetch(),
    },
  );

  const join = api.game.join.useMutation({
    onSuccess: ({ game, token: newToken }) => {
      storePlayerToken(game.code, newToken, joinName.trim());
      setToken(newToken);
      utils.game.get.setData({ code: normalizedCode, token: newToken }, game);
    },
  });

  const move = api.game.move.useMutation({
    onSuccess: (game) => utils.game.get.setData(queryInput, game),
    onError: (error) => {
      toast.error(error.message);
      void gameQuery.refetch();
    },
  });

  if (!tokenLoaded || gameQuery.isLoading) return <GameLoading />;

  if (gameQuery.error || !gameQuery.data) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-[#f4e7d0]">
        <Card className="max-w-md border-[#d2ad61]/20 bg-[#180b0d] text-center text-inherit">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              Table unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-[#bdaa92]">
            <p role="alert">
              {gameQuery.error?.message ?? "This game could not be loaded."}
            </p>
            <Button
              asChild
              className="bg-[#9c1b37] text-white hover:bg-[#b62343]"
            >
              <Link href="/">Return home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const game = gameQuery.data;

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (joinName.trim().length >= 2) {
      join.mutate({ code: normalizedCode, displayName: joinName });
    }
  }

  function makeGameMove(pieceId: string, to: { row: number; col: number }) {
    if (!token) return;
    move.mutate({ code: normalizedCode, token, pieceId, to });
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Invite link copied");
  }

  return (
    <main className="min-h-screen px-3 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between py-4 sm:py-5">
        <Brand />
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className="hidden border-[#d5b46b]/25 text-[#cdbd9e] sm:inline-flex"
          >
            Prototype rules
          </Badge>
          <RulesDialog />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-center lg:gap-8">
        <div className="lg:hidden">
          <MobileGameStatus game={game} />
        </div>

        <section className="flex min-h-0 items-start justify-center px-2 py-4 sm:px-8 sm:py-6 lg:min-h-[calc(100vh-8rem)] lg:items-center lg:py-8">
          <GameBoard
            state={game.state}
            viewerColor={game.viewerColor}
            disabled={game.status !== "active" || move.isPending}
            onMove={makeGameMove}
          />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="hidden lg:block">
            <GameStatus game={game} />
          </div>

          {game.status === "waiting" ? (
            game.viewerColor ? (
              <Card className="border-[#d9b86d]/20 bg-[#1a0c0e]/80 text-[#f2e5cd]">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">
                    Waiting for an opponent
                  </CardTitle>
                  <p className="text-sm leading-6 text-[#b9a78e]">
                    Share this table. The game starts as soon as Burgundy joins.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-[#d5b46b]/20 bg-black/20 px-4 py-3 text-center font-mono text-xl tracking-[0.22em] text-[#f0ce86]">
                    {game.code}
                  </div>
                  <Button
                    onClick={copyInvite}
                    className="w-full bg-[#9e1c38] text-white hover:bg-[#b62343]"
                  >
                    <Copy className="size-4" />
                    Copy invite link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <JoinAtTable
                name={joinName}
                setName={setJoinName}
                pending={join.isPending}
                error={join.error?.message}
                onSubmit={submitJoin}
              />
            )
          ) : null}

          {!game.viewerColor && game.status !== "waiting" ? (
            <div className="rounded-xl border border-[#d2ad61]/15 bg-[#160a0c]/70 p-4 text-sm text-[#baa990]">
              This table is full. You are watching the current position.
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function MobileGameStatus({ game }: { game: PublicGame }) {
  const ivoryPieces = game.state.pieces.filter(
    (piece) => piece.color === "ivory",
  ).length;
  const burgundyPieces = game.state.pieces.filter(
    (piece) => piece.color === "burgundy",
  ).length;
  const turnName = game.players.find(
    (player) => player.color === game.state.turn,
  )?.displayName;
  const winnerName = game.players.find(
    (player) => player.color === game.state.winner,
  )?.displayName;
  const isViewerTurn = game.viewerColor === game.state.turn;
  const headline = game.state.winner
    ? `${winnerName ?? "Winner"} wins`
    : game.status === "waiting"
      ? "Waiting for an opponent"
      : isViewerTurn
        ? "Your turn"
        : `${turnName ?? game.state.turn} to move`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-[#d9b86d]/20 bg-[#1a0c0e]/88 px-4 py-3 text-[#f2e5cd] shadow-xl backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#9e8f79]">
            Table {game.code} · Turn {game.state.moveNumber + 1}
          </p>
          <p className="mt-1 truncate font-serif text-xl">{headline}</p>
        </div>
        <div className="shrink-0 text-right text-xs tabular-nums text-[#baa990]">
          <p>Ivory {ivoryPieces}/8</p>
          <p className="mt-1">Burgundy {burgundyPieces}/8</p>
        </div>
      </div>
    </div>
  );
}

function GameStatus({ game }: { game: PublicGame }) {
  const ivory = game.players.find((player) => player.color === "ivory");
  const burgundy = game.players.find((player) => player.color === "burgundy");
  const ivoryPieces = game.state.pieces.filter(
    (piece) => piece.color === "ivory",
  ).length;
  const burgundyPieces = game.state.pieces.filter(
    (piece) => piece.color === "burgundy",
  ).length;
  const turnName = game.players.find(
    (player) => player.color === game.state.turn,
  )?.displayName;
  const winnerName = game.players.find(
    (player) => player.color === game.state.winner,
  )?.displayName;

  return (
    <Card className="border-[#d9b86d]/20 bg-[#1a0c0e]/88 text-[#f2e5cd] shadow-2xl backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge className="border-0 bg-[#7d142c] text-[#f2d69a]">
            Table {game.code}
          </Badge>
          <span className="flex items-center gap-1.5 text-xs text-[#9f927f]">
            <Radio className="size-3 text-emerald-400" /> Live
          </span>
        </div>
        {game.state.winner ? (
          <div>
            <CardTitle className="font-serif text-2xl">
              {winnerName ?? "Winner"} wins
            </CardTitle>
            <p className="mt-1 text-sm text-[#bfae95]">
              {game.state.winReason
                ? winCopy[game.state.winReason]
                : "Game complete"}
              .
            </p>
          </div>
        ) : game.status === "active" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#9e8f79]">
              Turn {game.state.moveNumber + 1}
            </p>
            <CardTitle className="mt-1 font-serif text-2xl">
              {turnName ?? game.state.turn} to move
            </CardTitle>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#9e8f79]">
              Table open
            </p>
            <CardTitle className="mt-1 font-serif text-2xl">
              One seat remains
            </CardTitle>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <PlayerRow
          color="ivory"
          name={ivory?.displayName ?? "Ivory"}
          pieces={ivoryPieces}
          active={game.status === "active" && game.state.turn === "ivory"}
          viewer={game.viewerColor === "ivory"}
        />
        <Separator className="bg-[#d6b468]/12" />
        <PlayerRow
          color="burgundy"
          name={burgundy?.displayName ?? "Waiting…"}
          pieces={burgundyPieces}
          active={game.status === "active" && game.state.turn === "burgundy"}
          viewer={game.viewerColor === "burgundy"}
        />
      </CardContent>
    </Card>
  );
}

function PlayerRow({
  color,
  name,
  pieces,
  active,
  viewer,
}: {
  color: PlayerColor;
  name: string;
  pieces: number;
  active: boolean;
  viewer: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "grid size-10 place-items-center rounded-full border shadow-[inset_0_2px_2px_rgba(255,255,255,0.3),inset_0_-3px_5px_rgba(0,0,0,0.3)]",
          color === "ivory"
            ? "border-[#a88958] bg-[#eadabd] text-[#725437]"
            : "border-[#d69966]/50 bg-[#741429] text-[#edc583]",
          active && "ring-2 ring-[#f1ca78] ring-offset-2 ring-offset-[#1a0c0e]",
        )}
      >
        {active ? <Check className="size-4" /> : <Users className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{name}</span>
          {viewer ? <span className="text-xs text-[#9f907b]">You</span> : null}
        </div>
        <p className="text-xs capitalize text-[#988a77]">{color}</p>
      </div>
      <span className="text-sm tabular-nums text-[#cbb99d]">{pieces}/8</span>
    </div>
  );
}

function JoinAtTable({
  name,
  setName,
  pending,
  error,
  onSubmit,
}: {
  name: string;
  setName: (name: string) => void;
  pending: boolean;
  error?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="border-[#d9b86d]/20 bg-[#1a0c0e]/85 text-[#f2e5cd]">
      <CardHeader>
        <CardTitle className="font-serif text-xl">
          Take the Burgundy seat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="table-name">Your name</Label>
            <Input
              id="table-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={24}
              placeholder="Player two"
              className="border-[#d7b76e]/20 bg-black/20"
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={pending || name.trim().length < 2}
            className="w-full bg-[#9e1c38] text-white hover:bg-[#b62343]"
          >
            {pending ? <RotateCcw className="size-4 animate-spin" /> : null}
            {pending ? "Joining…" : "Join game"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GameLoading() {
  return (
    <main className="grid min-h-screen place-items-center text-[#e7d6b8]">
      <div className="text-center">
        <Brand className="pointer-events-none" />
        <p className="mt-5 animate-pulse text-sm tracking-wide text-[#9f917d]">
          Preparing the table…
        </p>
      </div>
    </main>
  );
}
