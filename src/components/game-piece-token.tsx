import { Crown, Plus, Pyramid } from "lucide-react";

import type { GamePiece, PlayerColor } from "~/game/types";
import { cn } from "~/lib/utils";

type GamePieceTokenProps = {
  color: PlayerColor;
  kind: GamePiece["kind"];
  power?: GamePiece["power"];
  className?: string;
};

/** The shared visual used anywhere a SE!ZE piece is shown outside the rules engine. */
export function GamePieceToken({
  color,
  kind,
  power,
  className,
}: GamePieceTokenProps) {
  return (
    <span
      className={cn(
        "relative grid size-[70%] place-items-center rounded-full border-2 border-[var(--game-gold)] bg-[var(--game-piece-yellow)] text-[var(--game-piece-yellow-ink)] shadow-[0_2px_4px_rgba(0,0,0,0.34)]",
        color === "burgundy" &&
          "bg-[var(--game-piece-burgundy)] text-[var(--game-gold-bright)]",
        className,
      )}
    >
      {kind === "boss" ? (
        <Crown aria-hidden="true" className="size-[34%]" strokeWidth={2} />
      ) : null}
      {power && !(kind === "boss" && power === "boss") ? (
        <span className="absolute -end-[16%] -top-[16%] grid size-[40%] min-h-3 min-w-3 place-items-center text-current">
          {power === "rook" ? (
            <Plus aria-hidden="true" className="size-[68%]" strokeWidth={3.8} />
          ) : power === "bishop" ? (
            <Pyramid
              aria-hidden="true"
              className="size-[72%]"
              strokeWidth={3.2}
            />
          ) : (
            <Crown
              aria-hidden="true"
              className="size-[72%]"
              strokeWidth={3.2}
            />
          )}
        </span>
      ) : null}
    </span>
  );
}
