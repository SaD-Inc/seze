import type { Metadata } from "next";

import { GameRoom } from "~/components/game-room";

export const metadata: Metadata = {
  title: "Quick join",
  description: "Join a SE!ZE table as a guest in one tap.",
  robots: { index: false, follow: false },
};

export default async function QuickJoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <GameRoom code={code} quickJoin />;
}
