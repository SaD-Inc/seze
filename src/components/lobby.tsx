"use client";

import { ArrowRight, Plus, Swords, Users } from "lucide-react";
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
import {
  readOrCreateDisplayName,
  resolveDisplayName,
  storePlayerToken,
} from "~/lib/player-token";
import { api } from "~/trpc/react";

export function Lobby() {
  const router = useRouter();
  const [suggestedName, setSuggestedName] = useState("");
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    setSuggestedName(readOrCreateDisplayName());
  }, []);

  const resolvedCreateName = resolveDisplayName(createName, suggestedName);
  const resolvedJoinName = resolveDisplayName(joinName, suggestedName);

  const create = api.game.create.useMutation({
    onSuccess: ({ game, token }, variables) => {
      storePlayerToken(game.code, token, variables.displayName);
      router.push(`/game/${game.code}`);
    },
  });

  const join = api.game.join.useMutation({
    onSuccess: ({ game, token }, variables) => {
      storePlayerToken(game.code, token, variables.displayName);
      router.push(`/game/${game.code}`);
    },
  });

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resolvedCreateName.length >= 2) {
      create.mutate({ displayName: resolvedCreateName });
    }
  }

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resolvedJoinName.length >= 2 && joinCode.trim().length >= 6) {
      join.mutate({ displayName: resolvedJoinName, code: joinCode });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="h-16 w-full bg-[#a91f3d] px-6 text-base text-[#fff3dc] shadow-[0_12px_40px_rgba(139,19,45,0.35)] hover:bg-[#bf294a] sm:flex-1"
          >
            <Plus className="size-5" />
            Create table
          </Button>
        </DialogTrigger>
        <DialogContent className="border-[#e8cc91]/20 bg-[#180b0d] p-6 text-[#f7ecd6] shadow-2xl sm:max-w-md">
          <DialogHeader className="pe-8">
            <div className="mb-2 grid size-11 place-items-center rounded-full bg-[#8f1630] text-[#f6deb0]">
              <Swords className="size-5" />
            </div>
            <DialogTitle className="font-serif text-2xl">
              Create a table
            </DialogTitle>
            <DialogDescription className="leading-6 text-[#bfae97]">
              You’ll take Ivory. We’ll make a private table and give you a link
              to invite your opponent.
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
            className="h-16 w-full border-[#d6b46c]/35 bg-[#d6b46c]/7 px-6 text-base text-[#f1d69d] shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:bg-[#d6b46c]/15 hover:text-[#ffe6b1] sm:flex-1"
          >
            <Users className="size-5" />
            Join table
          </Button>
        </DialogTrigger>
        <DialogContent className="border-[#e8cc91]/20 bg-[#180b0d] p-6 text-[#f7ecd6] shadow-2xl sm:max-w-md">
          <DialogHeader className="pe-8">
            <div className="mb-2 grid size-11 place-items-center rounded-full border border-[#cda85f]/35 bg-[#271a13] text-[#e3c17c]">
              <Users className="size-5" />
            </div>
            <DialogTitle className="font-serif text-2xl">
              Join a table
            </DialogTitle>
            <DialogDescription className="leading-6 text-[#bfae97]">
              Enter the code your opponent sent you. No account needed.
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
                autoFocus
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
