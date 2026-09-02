"use client";

import { ArrowRight, Bot, Plus, Swords, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { BotDifficulty } from "~/game/types";
import { analyticsErrorCode, captureAnalyticsEvent } from "~/lib/analytics";
import {
  readOrCreateDisplayName,
  resolveDisplayName,
  storePlayerToken,
} from "~/lib/player-token";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const botDifficulties = [
  { value: "easy", label: "Easy", description: "Quick choices" },
  { value: "balanced", label: "Balanced", description: "Plans ahead" },
  { value: "hard", label: "Hard", description: "Deep search" },
] as const satisfies ReadonlyArray<{
  value: BotDifficulty;
  label: string;
  description: string;
}>;

export function Lobby() {
  const router = useRouter();
  const [suggestedName, setSuggestedName] = useState("");
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("balanced");

  useEffect(() => {
    setSuggestedName(readOrCreateDisplayName());
  }, []);

  const resolvedCreateName = resolveDisplayName(createName, suggestedName);
  const resolvedJoinName = resolveDisplayName(joinName, suggestedName);

  const create = api.game.create.useMutation({
    onSuccess: ({ game, token }, variables) => {
      captureAnalyticsEvent("table created", {
        entry_point: "home",
        match_id: game.analyticsMatchId,
        ruleset_version: game.state.rulesetVersion,
      });
      storePlayerToken(game.code, token, variables.displayName);
      router.push(`/game/${game.code}`);
    },
    onError: (error) => {
      captureAnalyticsEvent("table create failed", {
        entry_point: "home",
        error_code: analyticsErrorCode(error),
      });
    },
  });

  const createBot = api.game.createBot.useMutation({
    onSuccess: ({ game, token }, variables) => {
      captureAnalyticsEvent("bot game created", {
        difficulty: variables.difficulty,
        match_id: game.analyticsMatchId,
        ruleset_version: game.state.rulesetVersion,
      });
      storePlayerToken(game.code, token, variables.displayName);
      router.push(`/game/${game.code}`);
    },
    onError: (error, variables) => {
      captureAnalyticsEvent("bot game create failed", {
        difficulty: variables.difficulty,
        error_code: analyticsErrorCode(error),
      });
    },
  });

  const join = api.game.join.useMutation({
    onSuccess: ({ game, token }, variables) => {
      captureAnalyticsEvent("second player joined", {
        join_method: "manual_code",
        match_id: game.analyticsMatchId,
        ruleset_version: game.state.rulesetVersion,
      });
      storePlayerToken(game.code, token, variables.displayName);
      router.push(`/game/${game.code}`);
    },
    onError: (error) => {
      captureAnalyticsEvent("table join failed", {
        join_method: "manual_code",
        error_code: analyticsErrorCode(error),
      });
    },
  });

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resolvedCreateName.length >= 2) {
      captureAnalyticsEvent("table create intent", { entry_point: "home" });
      create.mutate({ displayName: resolvedCreateName });
    }
  }

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resolvedJoinName.length >= 2 && joinCode.trim().length >= 6) {
      captureAnalyticsEvent("table join intent", {
        join_method: "manual_code",
      });
      join.mutate({ displayName: resolvedJoinName, code: joinCode });
    }
  }

  function submitCreateBot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resolvedCreateName.length >= 2) {
      captureAnalyticsEvent("bot game create intent", {
        difficulty: botDifficulty,
      });
      createBot.mutate({
        displayName: resolvedCreateName,
        difficulty: botDifficulty,
      });
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="h-16 w-full bg-[#a91f3d] px-6 text-base text-[#fff3dc] shadow-[0_12px_40px_rgba(139,19,45,0.35)] hover:bg-[#bf294a]"
          >
            <Plus className="size-5" />
            Create table
          </Button>
        </DialogTrigger>
        <DialogContent
          tabIndex={-1}
          className="border-[#e8cc91]/20 bg-[#180b0d] p-6 text-[#f7ecd6] shadow-2xl sm:max-w-md"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
        >
          <DialogHeader className="pe-8">
            <div className="mb-2 grid size-11 place-items-center rounded-full bg-[#8f1630] text-[#f6deb0]">
              <Swords className="size-5" />
            </div>
            <DialogTitle className="font-serif text-2xl">
              Create a table
            </DialogTitle>
            <DialogDescription className="leading-6 text-[#bfae97]">
              Your side will be randomized. We’ll make a private table and give
              you a link to invite your opponent. Red moves first.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="space-y-2">
              <Label htmlFor="create-name">Playing as</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder={suggestedName || "Your name"}
                minLength={2}
                maxLength={24}
                autoComplete="off"
                className="h-12 border-[#e7c987]/20 bg-black/25 text-base"
              />
              <p className="text-xs text-[#887966]">
                Leave blank to play as {suggestedName || "your guest name"}.
              </p>
            </div>
            {create.error ? (
              <p role="alert" className="text-sm text-red-300">
                {create.error.message}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={create.isPending || resolvedCreateName.length < 2}
              className="h-12 w-full bg-[#a91f3d] text-[#fff3dc] hover:bg-[#bf294a]"
            >
              {create.isPending ? "Preparing table…" : "Create table"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="lg"
            variant="outline"
            className="h-16 w-full border-[#789b97]/45 bg-[#789b97]/10 px-6 text-base text-[#d8eeea] shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:bg-[#789b97]/18 hover:text-[#effffa]"
          >
            <Bot className="size-5" />
            Play computer
          </Button>
        </DialogTrigger>
        <DialogContent
          tabIndex={-1}
          className="border-[#e8cc91]/20 bg-[#180b0d] p-6 text-[#f7ecd6] shadow-2xl sm:max-w-md"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
        >
          <DialogHeader className="pe-8">
            <div className="mb-2 grid size-11 place-items-center rounded-full border border-[#789b97]/40 bg-[#172220] text-[#b7d8d3]">
              <Bot className="size-5" />
            </div>
            <DialogTitle className="font-serif text-2xl">
              Play the computer
            </DialogTitle>
            <DialogDescription className="leading-6 text-[#bfae97]">
              Choose the challenge, then receive a random side. Red always moves
              first.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCreateBot}>
            <div className="space-y-2">
              <Label htmlFor="bot-name">Playing as</Label>
              <Input
                id="bot-name"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder={suggestedName || "Your name"}
                minLength={2}
                maxLength={24}
                autoComplete="off"
                className="h-12 border-[#e7c987]/20 bg-black/25 text-base"
              />
              <p className="text-xs text-[#887966]">
                Leave blank to play as {suggestedName || "your guest name"}.
              </p>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Difficulty</legend>
              <div className="grid grid-cols-3 gap-2">
                {botDifficulties.map((difficulty) => {
                  const selected = botDifficulty === difficulty.value;

                  return (
                    <button
                      key={difficulty.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setBotDifficulty(difficulty.value)}
                      className={cn(
                        "min-h-16 rounded-lg border px-2.5 py-2 text-left transition-[transform,border-color,background-color,color] duration-150 ease-out active:scale-[0.97]",
                        selected
                          ? "border-[#8fb2ae] bg-[#789b97]/18 text-[#effffa]"
                          : "border-[#e7c987]/15 bg-black/20 text-[#bfae97] hover:border-[#789b97]/45 hover:bg-[#789b97]/8",
                      )}
                    >
                      <span className="block text-sm font-semibold">
                        {difficulty.label}
                      </span>
                      <span className="mt-0.5 block text-[0.65rem] leading-4 opacity-65">
                        {difficulty.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            {createBot.error ? (
              <p role="alert" className="text-sm text-red-300">
                {createBot.error.message}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={createBot.isPending || resolvedCreateName.length < 2}
              className="h-12 w-full bg-[#789b97] text-[#14211f] hover:bg-[#8fb2ae]"
            >
              {createBot.isPending ? "Preparing game…" : "Start game"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="lg"
            variant="outline"
            className="h-16 w-full border-[#d6b46c]/35 bg-[#d6b46c]/7 px-6 text-base text-[#f1d69d] shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:bg-[#d6b46c]/15 hover:text-[#ffe6b1]"
          >
            <Users className="size-5" />
            Join table
          </Button>
        </DialogTrigger>
        <DialogContent
          tabIndex={-1}
          className="border-[#e8cc91]/20 bg-[#180b0d] p-6 text-[#f7ecd6] shadow-2xl sm:max-w-md"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
        >
          <DialogHeader className="pe-8">
            <div className="mb-2 grid size-11 place-items-center rounded-full border border-[#cda85f]/35 bg-[#271a13] text-[#e3c17c]">
              <Users className="size-5" />
            </div>
            <DialogTitle className="font-serif text-2xl">
              Join a table
            </DialogTitle>
            <DialogDescription className="leading-6 text-[#bfae97]">
              Enter the code your opponent sent you.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitJoin}>
            <div className="space-y-2">
              <Label htmlFor="join-code">Table code</Label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(event) =>
                  setJoinCode(
                    event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  )
                }
                placeholder="AB12CD"
                minLength={6}
                maxLength={8}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="h-14 border-[#e7c987]/20 bg-black/25 text-center font-mono text-xl uppercase tracking-[0.22em]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="join-name">Playing as</Label>
              <Input
                id="join-name"
                value={joinName}
                onChange={(event) => setJoinName(event.target.value)}
                placeholder={suggestedName || "Your name"}
                minLength={2}
                maxLength={24}
                autoComplete="off"
                className="h-12 border-[#e7c987]/20 bg-black/25 text-base"
              />
              <p className="text-xs text-[#887966]">
                Leave blank to play as {suggestedName || "your guest name"}.
              </p>
            </div>
            {join.error ? (
              <p role="alert" className="text-sm text-red-300">
                {join.error.message}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="outline"
              disabled={
                join.isPending ||
                resolvedJoinName.length < 2 ||
                joinCode.trim().length < 6
              }
              className="h-12 w-full border-[#d6b46c]/35 bg-[#d6b46c]/7 text-[#f1d69d] hover:bg-[#d6b46c]/15 hover:text-[#ffe6b1]"
            >
              {join.isPending ? "Joining…" : "Join table"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
