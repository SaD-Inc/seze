"use client";

import { ArrowRight, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { readDisplayName, storePlayerToken } from "~/lib/player-token";
import { api } from "~/trpc/react";

export function Lobby() {
  const router = useRouter();
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const saved = readDisplayName();
    setCreateName(saved);
    setJoinName(saved);
  }, []);

  const create = api.game.create.useMutation({
    onSuccess: ({ game, token }) => {
      storePlayerToken(game.code, token, createName.trim());
      router.push(`/game/${game.code}`);
    },
  });

  const join = api.game.join.useMutation({
    onSuccess: ({ game, token }) => {
      storePlayerToken(game.code, token, joinName.trim());
      router.push(`/game/${game.code}`);
    },
  });

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createName.trim().length >= 2) {
      create.mutate({ displayName: createName });
    }
  }

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (joinName.trim().length >= 2 && joinCode.trim().length >= 6) {
      join.mutate({ displayName: joinName, code: joinCode });
    }
  }

  return (
    <div className="grid w-full max-w-3xl gap-4 md:grid-cols-2">
      <Card className="border-[#e8cc91]/15 bg-[#1c0d0d]/75 text-[#f7ecd6] shadow-2xl backdrop-blur">
        <CardHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-full bg-[#8f1630] text-[#f6deb0]">
            <Swords className="size-5" />
          </div>
          <CardTitle className="font-serif text-2xl">Create a table</CardTitle>
          <p className="text-sm leading-6 text-[#c9b8a3]">
            Start as Ivory and invite one opponent with a private link.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="space-y-2">
              <Label htmlFor="create-name">Your name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Player one"
                minLength={2}
                maxLength={24}
                autoComplete="nickname"
                className="border-[#e7c987]/20 bg-black/20"
              />
            </div>
            {create.error ? (
              <p role="alert" className="text-sm text-red-300">
                {create.error.message}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={create.isPending || createName.trim().length < 2}
              className="w-full bg-[#a91f3d] text-[#fff3dc] hover:bg-[#bf294a]"
            >
              {create.isPending ? "Preparing table…" : "Create game"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#e8cc91]/15 bg-[#1c0d0d]/75 text-[#f7ecd6] shadow-2xl backdrop-blur">
        <CardHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-full border border-[#cda85f]/35 bg-[#271a13] text-[#e3c17c]">
            <span className="font-serif text-lg">II</span>
          </div>
          <CardTitle className="font-serif text-2xl">Join a table</CardTitle>
          <p className="text-sm leading-6 text-[#c9b8a3]">
            Enter the six-character code from your opponent.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitJoin}>
            <div className="grid grid-cols-[1fr_0.8fr] gap-3">
              <div className="space-y-2">
                <Label htmlFor="join-name">Your name</Label>
                <Input
                  id="join-name"
                  value={joinName}
                  onChange={(event) => setJoinName(event.target.value)}
                  placeholder="Player two"
                  minLength={2}
                  maxLength={24}
                  autoComplete="nickname"
                  className="border-[#e7c987]/20 bg-black/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-code">Game code</Label>
                <Input
                  id="join-code"
                  value={joinCode}
                  onChange={(event) =>
                    setJoinCode(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, ""),
                    )
                  }
                  placeholder="AB12CD"
                  minLength={6}
                  maxLength={8}
                  autoCapitalize="characters"
                  className="border-[#e7c987]/20 bg-black/20 font-mono uppercase tracking-[0.18em]"
                />
              </div>
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
                joinName.trim().length < 2 ||
                joinCode.trim().length < 6
              }
              className="w-full border-[#d6b46c]/35 bg-[#d6b46c]/5 text-[#f1d69d] hover:bg-[#d6b46c]/15 hover:text-[#ffe6b1]"
            >
              {join.isPending ? "Joining…" : "Join game"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
