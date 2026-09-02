"use client";

import {
  ArrowRight,
  Bot,
  Eye,
  History,
  Link2,
  Play,
  Radio,
  RotateCcw,
  Share2,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Brand } from "~/components/brand";
import { GameBoard } from "~/components/game-board";
import { GamePieceToken } from "~/components/game-piece-token";
import { RulesDialog } from "~/components/rules-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type {
  BotDifficulty,
  Coordinate,
  PlayerColor,
  PublicGame,
  WinReason,
} from "~/game/types";
import {
  analyticsErrorCode,
  captureAnalyticsEvent,
  captureAnalyticsEventOnce,
} from "~/lib/analytics";
import { quickJoinUrl } from "~/lib/game-links";
import {
  advanceSoundedMove,
  playMoveSound,
  primeGameAudio,
  type SoundedMove,
} from "~/lib/game-sound";
import {
  readOrCreateDisplayName,
  readPlayerToken,
  resolveDisplayName,
  storePlayerToken,
} from "~/lib/player-token";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const winCopy: Record<WinReason, string> = {
  center: "Claimed all four center spaces",
  bosses: "Captured every opposing boss",
  pieces: "Reduced the opposition to two pieces",
};

const FIRST_WIN_SHARE_MATCH_KEY = "seze:first-win-share-match:v1";
const FINAL_POSITION_HOLD_MS = 1_400;

type FinishedPresentation = "board-hold" | "dialog" | "board-inspect";

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
  const [firstWinShareMatchId, setFirstWinShareMatchId] = useState<
    string | null
  >(null);
  const [firstWinSharePending, setFirstWinSharePending] = useState(false);
  const [finishedPresentation, setFinishedPresentation] =
    useState<FinishedPresentation>("board-hold");
  const soundedMove = useRef<SoundedMove>(null);
  const observedGameStatus = useRef<{
    code: string;
    status: PublicGame["status"];
  } | null>(null);
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

  const moveNumber = gameQuery.data?.state.moveNumber;
  const capturedOnLastMove =
    gameQuery.data?.state.lastMove?.capturedPieceIds.length ?? 0;
  const currentStatus = gameQuery.data?.status;

  useEffect(() => {
    if (!currentStatus) return;

    const previous = observedGameStatus.current;
    const isFirstObservation = previous?.code !== normalizedCode;
    const becameFinished =
      !isFirstObservation &&
      previous.status !== "finished" &&
      currentStatus === "finished";

    observedGameStatus.current = {
      code: normalizedCode,
      status: currentStatus,
    };

    if (currentStatus !== "finished") {
      setFinishedPresentation("board-hold");
      return;
    }

    if (!becameFinished) {
      setFinishedPresentation("dialog");
      return;
    }

    setFinishedPresentation("board-hold");
    const timer = window.setTimeout(
      () => setFinishedPresentation("dialog"),
      FINAL_POSITION_HOLD_MS,
    );

    return () => window.clearTimeout(timer);
  }, [currentStatus, normalizedCode]);

  useEffect(() => {
    const game = gameQuery.data;
    if (
      game?.status !== "finished" ||
      !game.viewerColor ||
      game.state.winner !== game.viewerColor ||
      !game.state.winReason
    ) {
      return;
    }

    let firstWinMatchId = game.analyticsMatchId;

    try {
      firstWinMatchId =
        window.localStorage.getItem(FIRST_WIN_SHARE_MATCH_KEY) ??
        game.analyticsMatchId;
      window.localStorage.setItem(FIRST_WIN_SHARE_MATCH_KEY, firstWinMatchId);
    } catch {
      // Keep the first-win prompt available when storage is blocked.
    }

    setFirstWinShareMatchId(firstWinMatchId);

    if (firstWinMatchId === game.analyticsMatchId) {
      captureAnalyticsEventOnce(
        "first win share shown",
        game.analyticsMatchId,
        {
          match_id: game.analyticsMatchId,
          win_reason: game.state.winReason,
        },
      );
    }
  }, [gameQuery.data]);

  useEffect(() => {
    if (moveNumber === undefined) return;

    const result = advanceSoundedMove(
      soundedMove.current,
      normalizedCode,
      moveNumber,
    );
    soundedMove.current = result.next;
    if (result.shouldPlay) void playMoveSound(capturedOnLastMove);
  }, [capturedOnLastMove, moveNumber, normalizedCode]);

  useEffect(() => {
    window.addEventListener("pointerdown", primeGameAudio, { once: true });
    return () => window.removeEventListener("pointerdown", primeGameAudio);
  }, []);

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
      captureAnalyticsEvent("second player joined", {
        join_method: quickJoin ? "quick_link" : "manual_code",
        match_id: game.analyticsMatchId,
        ruleset_version: game.state.rulesetVersion,
      });
      storePlayerToken(game.code, newToken, variables.displayName.trim());
      setToken(newToken);
      utils.game.get.setData({ code: normalizedCode, token: newToken }, game);
    },
    onError: (error) => {
      captureAnalyticsEvent("table join failed", {
        join_method: quickJoin ? "quick_link" : "manual_code",
        error_code: analyticsErrorCode(error),
      });
    },
  });

  const move = api.game.move.useMutation({
    onSuccess: (game) => {
      utils.game.get.setData(queryInput, game);

      if (game.viewerColor && game.state.moveNumber === 1) {
        captureAnalyticsEventOnce(
          "game first move made",
          game.analyticsMatchId,
          {
            match_id: game.analyticsMatchId,
            player_color: game.viewerColor,
            ruleset_version: game.state.rulesetVersion,
          },
        );
      }

      if (
        game.status === "finished" &&
        game.viewerColor &&
        game.state.winReason
      ) {
        captureAnalyticsEventOnce("game completed", game.analyticsMatchId, {
          match_id: game.analyticsMatchId,
          move_count: game.state.moveNumber,
          player_color: game.viewerColor,
          ruleset_version: game.state.rulesetVersion,
          win_reason: game.state.winReason,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
      void gameQuery.refetch();
    },
  });

  const botMove = api.game.botMove.useMutation({
    onSuccess: (updatedGame) => {
      utils.game.get.setData(queryInput, updatedGame);
      if (updatedGame.status === "finished" && updatedGame.state.winReason) {
        captureAnalyticsEventOnce(
          "game completed",
          updatedGame.analyticsMatchId,
          {
            match_id: updatedGame.analyticsMatchId,
            move_count: updatedGame.state.moveNumber,
            player_color: updatedGame.state.winner ?? updatedGame.state.turn,
            ruleset_version: updatedGame.state.rulesetVersion,
            win_reason: updatedGame.state.winReason,
          },
        );
      }
    },
    onError: (error) => {
      toast.error(error.message);
      void gameQuery.refetch();
    },
  });
  const requestBotMove = botMove.mutate;

  const createAnother = api.game.create.useMutation({
    onSuccess: ({ game: newGame, token: newToken }, variables) => {
      captureAnalyticsEvent("table created", {
        entry_point: "game_over",
        match_id: newGame.analyticsMatchId,
        ruleset_version: newGame.state.rulesetVersion,
      });
      storePlayerToken(newGame.code, newToken, variables.displayName);
      router.push(`/game/${newGame.code}`);
    },
    onError: (error) => {
      captureAnalyticsEvent("table create failed", {
        entry_point: "game_over",
        error_code: analyticsErrorCode(error),
      });
      toast.error(error.message);
    },
  });

  const rematch = api.game.rematch.useMutation({
    onSuccess: (updatedGame) => {
      utils.game.get.setData(queryInput, updatedGame);

      const rematchCreated = Boolean(updatedGame.rematch?.gameCode);
      captureAnalyticsEventOnce(
        "rematch requested",
        updatedGame.analyticsMatchId,
        {
          match_id: updatedGame.analyticsMatchId,
          request_type: rematchCreated ? "accepted" : "initiated",
        },
      );

      const rematchMatchId = updatedGame.rematch?.analyticsMatchId;
      if (rematchCreated && rematchMatchId) {
        captureAnalyticsEventOnce("rematch created", rematchMatchId, {
          match_id: rematchMatchId,
          ruleset_version: updatedGame.state.rulesetVersion,
        });
      }
    },
    onError: (error) => {
      captureAnalyticsEvent("rematch request failed", {
        error_code: analyticsErrorCode(error),
      });
      toast.error(error.message);
    },
  });

  const botTurnVersion =
    gameQuery.data?.status === "active" &&
    gameQuery.data.players.some(
      (player) =>
        player.kind === "bot" && player.color === gameQuery.data?.state.turn,
    )
      ? gameQuery.data.version
      : null;

  useEffect(() => {
    if (botTurnVersion === null || !token) return;
    const timer = window.setTimeout(() => {
      requestBotMove({
        code: normalizedCode,
        token,
        expectedVersion: botTurnVersion,
      });
    }, 520);

    return () => window.clearTimeout(timer);
  }, [botTurnVersion, normalizedCode, requestBotMove, token]);

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
  const occupiedColor = game.players[0]?.color;
  const openColor = occupiedColor ? otherColor(occupiedColor) : "ivory";

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resolvedJoinName.length >= 2) {
      captureAnalyticsEvent("table join intent", {
        join_method: quickJoin ? "quick_link" : "manual_code",
      });
      join.mutate({ code: normalizedCode, displayName: resolvedJoinName });
    }
  }

  function makeGameMove(pieceId: string, to: { row: number; col: number }) {
    if (!token) return;
    primeGameAudio();
    move.mutate({ code: normalizedCode, token, pieceId, to });
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(
        quickJoinUrl(window.location.origin, normalizedCode),
      );
      captureAnalyticsEventOnce("invite copied", game.analyticsMatchId, {
        match_id: game.analyticsMatchId,
        share_method: "clipboard",
      });
      toast.success("Quick-join link copied");
    } catch {
      captureAnalyticsEventOnce("invite copy failed", game.analyticsMatchId, {
        share_method: "clipboard",
      });
      toast.error("Could not copy the quick-join link");
    }
  }

  function startAnotherGame() {
    if (!viewerName) {
      router.push("/");
      return;
    }
    captureAnalyticsEvent("table create intent", {
      entry_point: "game_over",
    });
    createAnother.mutate({ displayName: viewerName });
  }

  function requestGameRematch() {
    if (!token) return;
    rematch.mutate({ code: normalizedCode, token });
  }

  async function shareFirstWin() {
    const game = gameQuery.data;
    if (game?.status !== "finished" || game.state.winner !== game.viewerColor) {
      return;
    }

    const url = new URL("/", window.location.origin);
    url.searchParams.set("utm_source", "player_share");
    url.searchParams.set("utm_medium", "organic");
    url.searchParams.set("utm_campaign", "first_win");

    const text = `I just won SE!ZE in ${game.state.moveNumber} moves. Think you can beat me? No account needed.`;
    const shareMethod =
      typeof navigator.share === "function" ? "native" : "clipboard";

    captureAnalyticsEvent("first win share clicked", {
      match_id: game.analyticsMatchId,
      share_method: shareMethod,
    });
    setFirstWinSharePending(true);

    try {
      if (shareMethod === "native") {
        await navigator.share({
          title: "I won at SE!ZE",
          text,
          url: url.toString(),
        });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url.toString()}`);
        toast.success("Win message copied—share it anywhere");
      }

      captureAnalyticsEvent("first win share completed", {
        match_id: game.analyticsMatchId,
        share_method: shareMethod,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error("Could not open sharing");
      }
    } finally {
      setFirstWinSharePending(false);
    }
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
        color={openColor}
        onSubmit={submitJoin}
      />
    );
  }

  return (
    <main className="flex h-svh flex-col overflow-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4 lg:px-8">
      <header className="mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between py-3 sm:py-4">
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

      <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-rows-[minmax(0,1fr)_auto] gap-4 lg:grid-cols-[minmax(0,1fr)_290px] lg:grid-rows-1 lg:items-center lg:gap-8">
        <section className="-mx-2 flex min-h-0 items-center justify-center py-1 [container-type:size] sm:mx-0 sm:px-8 lg:h-full lg:py-2">
          <div className="relative flex w-[min(100cqw,calc(100cqh-8rem))] max-w-[720px] flex-col">
            <BoardPlayerBar
              game={game}
              color={otherColor(game.viewerColor ?? "ivory")}
              placement="top"
            />
            <GameBoard
              state={game.state}
              viewerColor={game.viewerColor}
              disabled={
                game.status !== "active" || move.isPending || botMove.isPending
              }
              onMove={makeGameMove}
            />
            <BoardPlayerBar
              game={game}
              color={game.viewerColor ?? "ivory"}
              placement="bottom"
            />
            {botTurnVersion !== null && botMove.isError && token ? (
              <Button
                className="absolute right-3 bottom-[4.75rem] z-30"
                onClick={() =>
                  requestBotMove({
                    code: normalizedCode,
                    token,
                    expectedVersion: botTurnVersion,
                  })
                }
              >
                Retry computer move
              </Button>
            ) : null}
            {game.status === "finished" &&
            finishedPresentation === "board-inspect" ? (
              <div className="absolute right-3 bottom-[4.75rem] z-30">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFinishedPresentation("dialog")}
                  className="border-[#d6b46c]/40 bg-[#160a0c] text-[#f1d59b] shadow-[0_8px_24px_rgba(0,0,0,0.48)] hover:bg-[#2a1718] hover:text-[#ffe7b4]"
                >
                  <Trophy className="size-4" />
                  Show result
                </Button>
              </div>
            ) : null}
            {game.status === "finished" && finishedPresentation === "dialog" ? (
              <div className="fixed inset-0 z-40 grid place-items-center bg-black/48 p-4 backdrop-blur-[2px]">
                <FinishedGameActions
                  game={game}
                  viewerName={viewerName}
                  newTablePending={createAnother.isPending}
                  rematchPending={rematch.isPending}
                  firstWinSharePending={firstWinSharePending}
                  showFirstWinShare={
                    firstWinShareMatchId === game.analyticsMatchId &&
                    game.state.winner === game.viewerColor
                  }
                  onNewTable={startAnotherGame}
                  onRematch={requestGameRematch}
                  onShareFirstWin={shareFirstWin}
                  onViewFinalPosition={() =>
                    setFinishedPresentation("board-inspect")
                  }
                />
              </div>
            ) : null}
          </div>
        </section>

        <aside
          className={cn(
            "min-h-0 space-y-4 lg:sticky lg:top-4",
            game.status !== "waiting" && game.viewerColor && "hidden lg:block",
          )}
        >
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
                  Share this table. The game starts as soon as a{" "}
                  {colorName(openColor)} player joins.
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
          ? "border-[#8a763e] bg-[#1d1a17] text-[#f0e4c5]"
          : "border-[#6e2b3b] bg-[#1d1719] text-[#f0dfe2]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 rounded-full border",
          color === "ivory"
            ? "border-[var(--game-gold)] bg-[var(--game-piece-yellow)]"
            : "border-[var(--game-gold)] bg-[var(--game-piece-burgundy)]",
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
  firstWinSharePending,
  showFirstWinShare,
  onNewTable,
  onRematch,
  onShareFirstWin,
  onViewFinalPosition,
}: {
  game: PublicGame;
  viewerName?: string;
  newTablePending: boolean;
  rematchPending: boolean;
  firstWinSharePending: boolean;
  showFirstWinShare: boolean;
  onNewTable: () => void;
  onRematch: () => void;
  onShareFirstWin: () => void;
  onViewFinalPosition: () => void;
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
  const viewerWon = game.viewerColor === game.state.winner;
  const resultLabel = viewerName
    ? viewerWon
      ? "Victory"
      : "Defeat"
    : "Match complete";
  const finalMove = game.state.lastMove;
  const winnerColor = game.state.winner;
  const resultCopy = game.state.winReason
    ? `${winCopy[game.state.winReason]}.`
    : "The match is complete.";
  const rematchCopy = opponentRequested
    ? `${rematchRequester ?? "Opponent"} is ready for another game.`
    : viewerRequested
      ? "Your rematch request is waiting."
      : null;

  return (
    <Card
      role="dialog"
      aria-label="Game result"
      className="max-h-[calc(100svh-2rem)] w-full max-w-sm overflow-y-auto overscroll-contain border-[#d9b86d]/35 bg-[linear-gradient(155deg,rgba(48,18,23,0.99),rgba(17,12,13,0.995)_58%)] text-[#f2e5cd] shadow-[0_28px_90px_rgba(0,0,0,0.68)]"
    >
      <CardHeader className="justify-items-center px-5 pt-6 pb-4 text-center">
        <div
          className={cn(
            "grid size-14 place-items-center rounded-full border border-[#e0c47e]/45 bg-black/25 shadow-[0_10px_30px_rgba(0,0,0,0.34),inset_0_1px_rgba(255,255,255,0.12)]",
            winnerColor === "ivory" ? "text-[#4a3410]" : "text-[#f1d08e]",
          )}
        >
          <GamePieceToken
            color={winnerColor ?? "ivory"}
            kind="boss"
            className="size-10"
          />
        </div>
        <div className="mt-1 space-y-1.5">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[#d0b276]">
            {resultLabel}
          </p>
          <CardTitle className="font-serif text-[2rem] leading-none text-[#fff0d5]">
            {viewerWon ? "You won" : `${winnerName ?? "Winner"} wins`}
          </CardTitle>
          <p className="text-sm leading-5 text-[#c8b89f]">{resultCopy}</p>
        </div>

        <div className="mt-3 grid w-full grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-xl border border-[#d7b96f]/18 bg-black/20">
          <ResultScore
            color="burgundy"
            score={game.state.scores.burgundy}
            pieces={
              game.state.pieces.filter((piece) => piece.color === "burgundy")
                .length
            }
            winner={winnerColor === "burgundy"}
          />
          <div className="my-2 w-px bg-[#d7b96f]/15" />
          <ResultScore
            color="ivory"
            score={game.state.scores.ivory}
            pieces={
              game.state.pieces.filter((piece) => piece.color === "ivory")
                .length
            }
            winner={winnerColor === "ivory"}
          />
        </div>

        {finalMove ? (
          <div className="mt-1 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-[#a8977d]">
            <span>Final move</span>
            <span className="font-mono text-xs tracking-normal text-[#e6cf9e]">
              {squareName(finalMove.from)}
            </span>
            <ArrowRight className="size-3 text-[#967f51]" />
            <span className="font-mono text-xs tracking-normal text-[#e6cf9e]">
              {squareName(finalMove.to)}
            </span>
          </div>
        ) : null}
        {rematchCopy ? (
          <p className="mt-1 text-xs text-[#d9c49b]">{rematchCopy}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2.5 border-t border-[#d7b96f]/12 bg-black/10 px-5 pt-4 pb-5">
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
        {showFirstWinShare ? (
          <div className="rounded-xl border border-[#d6b46c]/25 bg-[#d6b46c]/8 p-3 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#d9bb78]">
                  First victory
                </p>
                <p className="mt-1 text-sm leading-5 text-[#ead9ba]">
                  Enjoyed the win? Bring someone new to the table.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={onShareFirstWin}
                disabled={firstWinSharePending}
                className="h-10 shrink-0 border-[#d6b46c]/35 bg-[#d6b46c]/12 px-3 text-[#f4d99d] hover:bg-[#d6b46c]/20 hover:text-[#ffebbd]"
              >
                <Share2 className="size-4" />
                {firstWinSharePending ? "Opening…" : "Share win"}
              </Button>
            </div>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={onViewFinalPosition}
          className="h-10 w-full border-[#d6b46c]/20 bg-white/[0.025] text-[#e2cca1] hover:bg-white/[0.07] hover:text-[#fff0d1]"
        >
          <Eye className="size-4" />
          View final position
        </Button>
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

function ResultScore({
  color,
  score,
  pieces,
  winner,
}: {
  color: PlayerColor;
  score: number;
  pieces: number;
  winner: boolean;
}) {
  return (
    <div
      className={cn(
        "px-2 py-2.5 text-center sm:px-3",
        winner && "bg-[#d8b86f]/8",
      )}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full border border-[#d4af5f]",
            color === "ivory"
              ? "bg-[var(--game-piece-yellow)]"
              : "bg-[var(--game-piece-burgundy)]",
          )}
        />
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#b6a58a]">
          {colorName(color)}
        </span>
        {winner ? (
          <span className="text-[0.52rem] font-bold uppercase tracking-[0.1em] text-[#dfc177]">
            Winner
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 font-serif text-2xl leading-none tabular-nums text-[#f5dfb1]">
        {score}
      </p>
      <p className="mt-1 text-[0.62rem] text-[#958772]">
        {pieces} {pieces === 1 ? "piece" : "pieces"} left
      </p>
    </div>
  );
}

function colorName(color: PlayerColor) {
  return color === "ivory" ? "Gold" : "Red";
}

function squareName({ row, col }: Coordinate) {
  return `${String.fromCharCode(65 + col)}${8 - row}`;
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
  const score = game.state.scores?.[color] ?? 0;
  const viewer = game.viewerColor === color;
  const active = game.status === "active" && game.state.turn === color;
  const winner = game.state.winner === color;
  const computer = player?.kind === "bot";
  const stateLabel = winner
    ? "Winner"
    : active
      ? viewer
        ? "Your move"
        : computer
          ? "Thinking…"
          : "To move"
      : null;

  return (
    <div
      role={active ? "status" : undefined}
      aria-live={active ? "polite" : undefined}
      className={cn(
        "relative z-0 mx-2 grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden border px-3.5 transition-[border-color,background-color] duration-200",
        placement === "top"
          ? "-mb-3 rounded-t-2xl rounded-b-none pt-2.5 pb-5"
          : "-mt-3 rounded-t-none rounded-b-2xl pt-5 pb-2.5",
        active
          ? "border-[#71938f]/90 bg-[linear-gradient(90deg,rgba(83,120,116,0.18),rgba(24,20,22,0.98)_44%)] text-[#f2e8da]"
          : winner
            ? "border-[#d8b86f]/65 bg-[linear-gradient(90deg,rgba(216,184,111,0.16),rgba(24,18,19,0.98)_44%)] text-[#f2e5cd]"
            : "border-[#5b454a] bg-[#181416] text-[#ddccb0]",
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-full border border-[#d5b46a]/35 bg-black/25 shadow-[inset_0_1px_rgba(255,255,255,0.06)]">
        <GamePieceToken color={color} kind="guard" className="size-7" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-[#f0e3ce] sm:text-base">
          {player?.displayName ?? "Waiting for player"}
        </p>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#9e907d]">
          <span
            className={cn(
              color === "ivory" ? "text-[#d6bd7b]" : "text-[#c78492]",
            )}
          >
            {colorName(color)}
          </span>
          {viewer ? (
            <>
              <span aria-hidden="true" className="opacity-40">
                ·
              </span>
              <span>You</span>
            </>
          ) : null}
          {computer ? (
            <>
              <span aria-hidden="true" className="opacity-40">
                ·
              </span>
              <span className="flex min-w-0 items-center gap-1 truncate">
                <Bot className="size-3 shrink-0" />
                {game.botDifficulty
                  ? botDifficultyName(game.botDifficulty)
                  : "Computer"}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex min-w-[4.8rem] flex-col items-end">
        {stateLabel ? (
          <span
            className={cn(
              "flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.12em]",
              active ? "text-[#a7c8c4]" : "text-[#dfc177]",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                active
                  ? "bg-[#83aaa5] shadow-[0_0_0_3px_rgba(131,170,165,0.13)]"
                  : "bg-[#d8b86f] shadow-[0_0_0_3px_rgba(216,184,111,0.12)]",
              )}
            />
            {stateLabel}
          </span>
        ) : (
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#776c5e]">
            {game.status === "finished"
              ? "Finished"
              : game.status === "waiting"
                ? player
                  ? "Ready"
                  : "Open seat"
                : "Waiting"}
          </span>
        )}
        <p className="mt-1.5 text-xs tabular-nums text-[#a99a83]">
          <span className="font-semibold text-[#e2d1b4]">{score}</span> pts
          <span aria-hidden="true" className="mx-1.5 opacity-35">
            ·
          </span>
          <span className="font-semibold text-[#e2d1b4]">{pieces}</span> left
        </p>
      </div>
    </div>
  );
}

function botDifficultyName(difficulty: BotDifficulty) {
  if (difficulty === "easy") return "Easy";
  if (difficulty === "hard") return "Hard";
  return "Balanced";
}

function GameStatus({ game }: { game: PublicGame }) {
  const isViewerTurn = game.viewerColor === game.state.turn;
  const isBotTurn = game.players.some(
    (player) => player.kind === "bot" && player.color === game.state.turn,
  );

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
          {isViewerTurn
            ? "Your move"
            : isBotTurn
              ? "Computer thinking…"
              : "Opponent’s move"}
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
          ? "border-[#8a763e] bg-[#1d1a17] text-[#f0e4c5]"
          : "border-[#6e2b3b] bg-[#1d1719] text-[#f0dfe2]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-3 shrink-0 rounded-full border",
          color === "ivory"
            ? "border-[var(--game-gold)] bg-[var(--game-piece-yellow)]"
            : "border-[var(--game-gold)] bg-[var(--game-piece-burgundy)]",
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
  color,
  onSubmit,
}: {
  code: string;
  quickJoin: boolean;
  name: string;
  suggestedName: string;
  setName: (name: string) => void;
  pending: boolean;
  error?: string;
  color: PlayerColor;
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
              <ViewerColorCallout color={color} />
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
