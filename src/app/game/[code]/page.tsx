import type { Metadata } from "next";

import { GameRoom } from "~/components/game-room";

export const metadata: Metadata = {
  title: "Live table",
  description: "A live two-player game of SE!ZE.",
  robots: { index: false, follow: false },
};

export default async function GamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <GameRoom code={code} />;
}
