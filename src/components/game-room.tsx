"use client";

import {
  ArrowRight,
  Check,
  Link2,
  Radio,
  RotateCcw,
  Users,
  Zap,
} from "lucide-react";
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
import { quickJoinUrl } from "~/lib/game-links";
import {
  readOrCreateDisplayName,
  readPlayerToken,
  resolveDisplayName,
  storePlayerToken,
} from "~/lib/player-token";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const winCopy: Record<WinReason, string> = {
  center: "seized all four central spaces",
  captains: "captured both opposing bosses",
  pieces: "reduced the opposition to two pieces",
};

export function GameRoom({
  code,
  quickJoin = false,
}: {
  code: string;
  quickJoin?: boolean;
}) {
  const normalizedCode = code.toUpperCase();
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [suggestedName, setSuggestedName] = useState("");
  const [joinName, setJoinName] = useState("");
  const utils = api.useUtils();

  useEffect(() => {
    setToken(readPlayerToken(normalizedCode));
    setSuggestedName(readOrCreateDisplayName());
    setTokenLoaded(true);
  }, [normalizedCode]);

  const resolvedJoinName = resolveDisplayName(joinName, suggestedName);

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
    onSuccess: ({ game, token: newToken }, variables) => {
      storePlayerToken(game.code, newToken, variables.displayName.trim());
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
    if (resolvedJoinName.length >= 2) {
      join.mutate({ code: normalizedCode, displayName: resolvedJoinName });
    }
  }

  function makeGameMove(pieceId: string, to: { row: number; col: number }) {
    if (!token) return;
    move.mutate({ code: normalizedCode, token, pieceId, to });
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(
      quickJoinUrl(window.location.origin, normalizedCode),
    );
    toast.success("Quick-join link copied");
  }

  if (game.status === "waiting" && !game.viewerColor) {
    return (
      <JoinTableGate
        code={game.code}
        quickJoin={quickJoin}
        name={joinName}
        suggestedName={suggestedName}
        setName={setJoinName}
        pending={join.isPending}
        error={join.error?.message}
        onSubmit={submitJoin}
      />
    );
  }

  return (
    <main className="min-h-screen px-3 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between py-4 sm:py-5">
        <Brand />
        <RulesDialog />
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
                  <Link2 className="size-4" />
                  Copy quick-join link
                </Button>
              </CardContent>
            </Card>
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
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#9e8f79]">
          Table {game.code} · Turn {game.state.moveNumber + 1}
        </p>
        {game.viewerColor ? (
          <ViewerColorCallout color={game.viewerColor} compact />
        ) : null}
      </div>
      <p className="mt-2 truncate font-serif text-xl">{headline}</p>
      <div className="mt-3 flex justify-end gap-4 border-t border-[#d6b468]/10 pt-2 text-xs tabular-nums text-[#aa9a84]">
        <span>Ivory {ivoryPieces}/8</span>
        <span>Burgundy {burgundyPieces}/8</span>
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
        {game.viewerColor ? (
          <ViewerColorCallout color={game.viewerColor} />
        ) : null}
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
          {viewer ? (
            <span className="rounded-full border border-[#d7b76e]/20 bg-[#d7b76e]/8 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-[#d8bd85]">
              You
            </span>
          ) : null}
        </div>
        <p className="text-xs capitalize text-[#988a77]">{color}</p>
      </div>
      <span className="text-sm tabular-nums text-[#cbb99d]">{pieces}/8</span>
    </div>
  );
}

function ViewerColorCallout({
  color,
  compact = false,
}: {
  color: PlayerColor;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border",
        compact ? "shrink-0 px-2.5 py-2 text-xs" : "w-full px-3 py-3 text-sm",
        color === "ivory"
          ? "border-[#d8bd86]/25 bg-[#eadabd]/8 text-[#ead9bb]"
          : "border-[#d7697e]/25 bg-[#82172e]/18 text-[#f0c4cb]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-3 shrink-0 rounded-full border shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_0_8px_rgba(0,0,0,0.25)]",
          color === "ivory"
            ? "border-[#a98b59] bg-[#eadabd]"
            : "border-[#dc8a78]/55 bg-[#8f1c35]",
        )}
      />
      <span>
        <span className="text-[#a99a84]">You play</span>{" "}
        <strong className="capitalize text-inherit">{color}</strong>
      </span>
    </div>
  );
}

function JoinTableGate({
  code,
  quickJoin,
  name,
  suggestedName,
  setName,
  pending,
  error,
  onSubmit,
}: {
  code: string;
  quickJoin: boolean;
  name: string;
  suggestedName: string;
  setName: (name: string) => void;
  pending: boolean;
  error?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const resolvedName = resolveDisplayName(name, suggestedName);

  return (
    <main className="relative min-h-svh overflow-hidden px-4 text-[#f2e5cd] sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_50%_-10%,rgba(151,24,52,0.5),transparent_62%)]" />
      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col">
        <header className="flex shrink-0 items-center justify-between py-6">
          <Brand />
          <Badge
            variant="outline"
            className="border-[#d6b46c]/20 bg-black/15 text-[#bda77f]"
          >
            Table {code}
          </Badge>
        </header>
        <section className="grid flex-1 place-items-center pb-16 pt-8 sm:pb-24">
          <Card className="w-full max-w-md border-[#d9b86d]/20 bg-[#1a0c0e]/92 text-[#f2e5cd] shadow-[0_32px_90px_rgba(0,0,0,0.45)] backdrop-blur">
            <CardHeader className="space-y-4 pb-3 text-center">
              <Badge className="mx-auto border-0 bg-[#7d142c] text-[#f2d69a]">
                {quickJoin ? (
                  <Zap className="size-3.5" />
                ) : (
                  <Users className="size-3.5" />
                )}
                {quickJoin ? "Quick join" : "Open seat"}
              </Badge>
              <div>
                <CardTitle className="font-serif text-3xl">
                  Join this table
                </CardTitle>
                <p className="mt-2 text-sm leading-6 text-[#b9a78e]">
                  Your opponent is waiting. Confirm your name and start playing.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ViewerColorCallout color="burgundy" />
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="table-name">Your name</Label>
                    <span className="text-xs text-[#887b69]">Optional</span>
                  </div>
                  <Input
                    id="table-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={24}
                    placeholder={suggestedName || "Guest name"}
                    autoComplete="off"
                    className="h-13 border-[#d7b76e]/20 bg-black/25 text-base placeholder:text-[#8e806c]"
                  />
                  <p className="text-xs text-[#887b69]">
                    Leave blank to use the suggested name.
                  </p>
                </div>
                {error ? (
                  <p role="alert" className="text-sm text-red-300">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  disabled={pending || resolvedName.length < 2}
                  className="h-14 w-full bg-[#a91f3d] text-base text-white shadow-[0_14px_36px_rgba(139,19,45,0.3)] hover:bg-[#bf294a]"
                >
                  {pending ? (
                    <RotateCcw className="size-4 animate-spin" />
                  ) : null}
                  {pending ? "Joining…" : `Join as ${resolvedName}`}
                  {!pending ? <ArrowRight className="size-4" /> : null}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
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
