import type { Metadata } from "next";

import { GameHistory } from "~/components/game-history";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Review game",
  description: "Review every move and position from a game of SE!ZE.",
  robots: { index: false, follow: false },
};

export default async function GameHistoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <TRPCReactProvider>
      <GameHistory code={code} />
    </TRPCReactProvider>
  );
}
