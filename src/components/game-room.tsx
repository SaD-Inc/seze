"use client";

import {
  ArrowRight,
  History,
  Link2,
  Play,
  Radio,
  RotateCcw,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

  api.game.onChange.useSubscription(queryInput, {
    enabled: tokenLoaded,
    onData: (incoming) => {
      utils.game.get.setData(queryInput, incoming.data);
    },
    onError: () => void gameQuery.refetch(),
  });

  const rematchGameCode = gameQuery.data?.rematch?.gameCode;
  const rematchViewerColor = gameQuery.data?.viewerColor;
  const rematchDisplayName = rematchViewerColor
    ? gameQuery.data?.players.find(
        (player) => player.color === rematchViewerColor,
      )?.displayName
    : undefined;

  useEffect(() => {
    if (!rematchViewerColor || !rematchGameCode || !token) return;

    storePlayerToken(rematchGameCode, token, rematchDisplayName);
    router.replace(`/game/${rematchGameCode}`);
  }, [rematchDisplayName, rematchGameCode, rematchViewerColor, router, token]);

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

  const createAnother = api.game.create.useMutation({
    onSuccess: ({ game: newGame, token: newToken }, variables) => {
      storePlayerToken(newGame.code, newToken, variables.displayName);
      router.push(`/game/${newGame.code}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const rematch = api.game.rematch.useMutation({
    onSuccess: (updatedGame) => {
      utils.game.get.setData(queryInput, updatedGame);
    },
    onError: (error) => toast.error(error.message),
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
  const viewerName = game.viewerColor
    ? game.players.find((player) => player.color === game.viewerColor)
        ?.displayName
    : undefined;

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

  function startAnotherGame() {
    if (!viewerName) {
      router.push("/");
      return;
    }
    createAnother.mutate({ displayName: viewerName });
  }

  function requestGameRematch() {
    if (!token) return;
    rematch.mutate({ code: normalizedCode, token });
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
        <div className="flex items-center gap-2">
          {game.state.moveNumber > 0 ? (
            <Button
              asChild
              variant="ghost"
              className="text-[#cdb889] hover:bg-[#d6b46c]/10 hover:text-[#ffe7b3]"
            >
              <Link href={`/game/${game.code}/history`}>
                <History className="size-4" />
                <span className="hidden sm:inline">Review moves</span>
              </Link>
            </Button>
          ) : null}
          <RulesDialog />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-center lg:gap-8">
        <section className="flex min-h-0 items-start justify-center px-1 py-2 sm:px-8 sm:py-4 lg:min-h-[calc(100vh-6rem)] lg:items-center lg:py-6">
          <div className="relative flex w-[min(100%,calc(100svh-15rem))] max-w-[720px] flex-col">
            <BoardPlayerBar
              game={game}
              color={otherColor(game.viewerColor ?? "ivory")}
              placement="top"
            />
            <GameBoard
              state={game.state}
              viewerColor={game.viewerColor}
              disabled={game.status !== "active" || move.isPending}
              onMove={makeGameMove}
            />
            <BoardPlayerBar
              game={game}
              color={game.viewerColor ?? "ivory"}
              placement="bottom"
            />
            {game.status === "finished" ? (
              <div className="absolute -inset-2 z-30 grid place-items-center rounded-[2rem] bg-black/48 p-4 backdrop-blur-[2px] sm:-inset-4">
                <FinishedGameActions
                  game={game}
                  viewerName={viewerName}
                  newTablePending={createAnother.isPending}
                  rematchPending={rematch.isPending}
                  onNewTable={startAnotherGame}
                  onRematch={requestGameRematch}
                />
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          {game.status === "active" ? (
            <div className="hidden lg:block">
              <GameStatus game={game} />
            </div>
          ) : null}

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

function TurnColorChip({ color }: { color: PlayerColor }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] shadow-lg",
        color === "ivory"
          ? "border-[#f5e7ca] bg-[#eadabd] text-[#3c2817]"
          : "border-[#e17086]/45 bg-[#8f1c35] text-[#fff0df]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 rounded-full border",
          color === "ivory"
            ? "border-[#9e8153] bg-[#fff7e8]"
            : "border-[#f1a0a9]/55 bg-[#c53655]",
        )}
      />
      {colorName(color)} to move
    </div>
  );
}

function FinishedGameActions({
  game,
  viewerName,
  newTablePending,
  rematchPending,
  onNewTable,
  onRematch,
}: {
  game: PublicGame;
  viewerName?: string;
  newTablePending: boolean;
  rematchPending: boolean;
  onNewTable: () => void;
  onRematch: () => void;
}) {
  const rematchRequester = game.rematch
    ? game.players.find((player) => player.color === game.rematch?.requestedBy)
        ?.displayName
    : undefined;
  const viewerRequested = game.rematch?.requestedBy === game.viewerColor;
  const opponentRequested = Boolean(game.rematch && !viewerRequested);
  const winnerName = game.players.find(
    (player) => player.color === game.state.winner,
  )?.displayName;

  return (
    <Card
      role="dialog"
      aria-label="Game result"
      className="w-full max-w-sm border-[#d9b86d]/35 bg-[linear-gradient(145deg,rgba(91,15,33,0.98),rgba(20,9,11,0.99))] text-[#f2e5cd] shadow-[0_28px_90px_rgba(0,0,0,0.62)]"
    >
      <CardHeader className="pb-4 text-center">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#d0b276]">
          Game over
        </p>
        <CardTitle className="font-serif text-3xl">
          {winnerName ?? "Winner"} wins
        </CardTitle>
        <p className="text-sm leading-6 text-[#baa98f]">
          {opponentRequested
            ? `${rematchRequester ?? "Opponent"} requested a rematch.`
            : viewerRequested
              ? "Waiting for your opponent."
              : game.state.winReason
                ? `${winCopy[game.state.winReason]}.`
                : "Play again or review the game."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {viewerName ? (
          <Button
            type="button"
            onClick={onRematch}
            disabled={rematchPending || viewerRequested}
            className="h-12 w-full bg-[#ac2341] text-white shadow-[0_12px_32px_rgba(139,19,45,0.28)] hover:bg-[#c32d4e]"
          >
            <RotateCcw
              className={cn("size-4", rematchPending && "animate-spin")}
            />
            {rematchPending
              ? "Updating…"
              : viewerRequested
                ? "Requested"
                : opponentRequested
                  ? "Accept rematch"
                  : "Rematch"}
          </Button>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onNewTable}
            disabled={newTablePending}
            className="h-11 border-[#d6b46c]/25 bg-[#d6b46c]/7 text-[#ebd19b] hover:bg-[#d6b46c]/15 hover:text-[#ffe7b4]"
          >
            {newTablePending ? (
              <RotateCcw className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            {newTablePending ? "Starting…" : "New table"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 border-[#d6b46c]/25 bg-[#d6b46c]/7 text-[#ebd19b] hover:bg-[#d6b46c]/15 hover:text-[#ffe7b4]"
          >
            <Link href={`/game/${game.code}/history`}>
              <History className="size-4" />
              Review
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function colorName(color: PlayerColor) {
  return color === "ivory" ? "Yellow" : "Burgundy";
}

function otherColor(color: PlayerColor): PlayerColor {
  return color === "ivory" ? "burgundy" : "ivory";
}

function BoardPlayerBar({
  game,
  color,
  placement,
}: {
  game: PublicGame;
  color: PlayerColor;
  placement: "top" | "bottom";
}) {
  const player = game.players.find((candidate) => candidate.color === color);
  const pieces = game.state.pieces.filter(
    (piece) => piece.color === color,
  ).length;
  const viewer = game.viewerColor === color;
  const active = game.status === "active" && game.state.turn === color;
  const winner = game.state.winner === color;
  const stateLabel = winner
    ? "Winner"
    : active
      ? viewer
        ? "Your move"
        : "To move"
      : null;

  return (
    <div
      role={active ? "status" : undefined}
      aria-live={active ? "polite" : undefined}
      className={cn(
        "relative z-0 flex min-h-14 items-center gap-3 border px-3 transition-colors",
        placement === "top"
          ? "rounded-t-xl rounded-b-none pt-2 pb-4"
          : "rounded-t-none rounded-b-xl pt-4 pb-2",
        active && color === "ivory"
          ? "border-[#cdbb99] bg-[#d8c9ad] text-[#3a2818] shadow-[0_5px_18px_rgba(225,199,143,0.1)]"
          : active && color === "burgundy"
            ? "border-[#a84a60] bg-[#64172a] text-[#f4e5d4] shadow-[0_5px_18px_rgba(100,23,42,0.16)]"
            : winner
              ? "border-[#d8b86f]/60 bg-[#d8b86f]/14 text-[#f2e5cd]"
              : "border-[#d6b46c]/14 bg-[#160a0c]/72 text-[#ddccb0]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-8 shrink-0 rounded-full border shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-3px_5px_rgba(0,0,0,0.3)]",
          color === "ivory"
            ? "border-black/70 bg-[#e6c83e]"
            : "border-[#d17078]/55 bg-[#75152b]",
          active && "ring-2 ring-current/35 ring-offset-2 ring-offset-inherit",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">
            {player?.displayName ?? "Waiting…"}
          </span>
          {viewer ? (
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] opacity-65">
              You<span className="hidden sm:inline"> · {colorName(color)}</span>
            </span>
          ) : null}
        </div>
      </div>
      <span className="text-xs tabular-nums opacity-65">{pieces}/8</span>
      {stateLabel ? (
        <span className="rounded-full bg-current px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em]">
          <span
            className={cn(
              active && color === "ivory" ? "text-[#f5ead5]" : "text-[#2e1214]",
            )}
          >
            {stateLabel}
          </span>
        </span>
      ) : null}
    </div>
  );
}

function GameStatus({ game }: { game: PublicGame }) {
  const isViewerTurn = game.viewerColor === game.state.turn;

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
        <p className="text-xs uppercase tracking-[0.18em] text-[#9e8f79]">
          Turn {game.state.moveNumber + 1}
        </p>
        <CardTitle className="font-serif text-2xl">
          {isViewerTurn ? "Your move" : "Opponent’s move"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TurnColorChip color={game.state.turn} />
        {game.viewerColor ? (
          <ViewerColorCallout color={game.viewerColor} />
        ) : null}
      </CardContent>
    </Card>
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
        "flex items-center gap-2 rounded-xl border font-semibold shadow-lg",
        compact ? "shrink-0 px-3 py-2.5 text-xs" : "w-full px-3 py-3 text-sm",
        color === "ivory"
          ? "border-[#f5e7ca] bg-[#eadabd] text-[#3c2817]"
          : "border-[#e17086]/45 bg-[#8f1c35] text-[#fff0df]",
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
      <span>You are {colorName(color)}</span>
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
