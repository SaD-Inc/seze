import { Crown, Diamond, Sparkles } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import {
  BOARD_SIZE,
  coordinateKey,
  createInitialState,
  isCenterCell,
  isPlayableCell,
  powerAt,
} from "~/game/rules";
import type { GamePiece } from "~/game/types";
import { cn } from "~/lib/utils";

const overviewCoordinates = Array.from(
  { length: BOARD_SIZE * BOARD_SIZE },
  (_, index) => ({
    row: Math.floor(index / BOARD_SIZE),
    col: index % BOARD_SIZE,
  }),
);

const demoCells = Array.from({ length: 25 }, (_, index) => ({
  row: Math.floor(index / 5),
  col: index % 5,
}));

type PositionedStyle = CSSProperties & {
  "--demo-row": number;
  "--demo-col": number;
};

function position(row: number, col: number): PositionedStyle {
  return { "--demo-row": row, "--demo-col": col };
}

function OverviewPiece({ piece }: { piece: GamePiece }) {
  return (
    <span
      className={cn(
        "relative z-10 grid size-[72%] place-items-center rounded-full border shadow-[0_5px_10px_rgba(18,2,5,0.4),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-3px_5px_rgba(0,0,0,0.32)]",
        piece.color === "ivory"
          ? "border-[#9c8359] bg-[radial-gradient(circle_at_35%_28%,#fffaf0_0%,#e8d7b8_55%,#ac9062_100%)] text-[#694d2e]"
          : "border-[#e5ad78]/55 bg-[radial-gradient(circle_at_35%_28%,#bd3e4c_0%,#741426_48%,#2c0610_100%)] text-[#f0ca8a]",
        piece.kind === "captain" &&
          "ring-1 ring-[#e2bd72]/70 ring-offset-1 ring-offset-[#6f1126]",
      )}
    >
      {piece.kind === "captain" ? (
        <Crown className="size-[44%]" strokeWidth={1.8} />
      ) : (
        <span className="size-[26%] rounded-full border border-current/55" />
      )}
    </span>
  );
}

export function RulesBoardOverview() {
  const state = createInitialState();
  const pieces = new Map(
    state.pieces.map((piece) => [coordinateKey(piece), piece] as const),
  );

  return (
    <figure className="mx-auto w-full max-w-[36rem]">
      <div
        aria-hidden="true"
        className="relative grid aspect-square grid-cols-8 overflow-hidden rounded-[1.4rem] border-4 border-[#9b6b31] bg-[#26070d] p-1.5 shadow-[0_28px_80px_rgba(0,0,0,0.42),inset_0_0_24px_rgba(0,0,0,0.72)] sm:p-2"
      >
        {overviewCoordinates.map((coordinate) => {
          const key = coordinateKey(coordinate);
          const playable = isPlayableCell(coordinate);
          const piece = pieces.get(key);
          const power = powerAt(coordinate);

          if (!playable) return <span key={key} />;

          return (
            <span
              key={key}
              className={cn(
                "relative grid aspect-square place-items-center border border-[#4d0714]/35",
                (coordinate.row + coordinate.col) % 2 === 0
                  ? "bg-[#971c37]"
                  : "bg-[#7c132b]",
                isCenterCell(coordinate) &&
                  "shadow-[inset_0_0_0_2px_rgba(233,198,121,0.78)]",
              )}
            >
              {isCenterCell(coordinate) ? (
                <span className="absolute size-[62%] rotate-45 rounded-[18%] border border-[#efd38e]/55" />
              ) : null}
              {power ? (
                <span className="absolute grid size-[47%] place-items-center rounded-full border border-[#efd189]/65 bg-[#48101b]/45 text-[#edcb81]/85">
                  {power === "rook" ? (
                    <Sparkles className="size-[52%]" strokeWidth={1.5} />
                  ) : (
                    <Diamond className="size-[48%]" strokeWidth={1.5} />
                  )}
                </span>
              ) : null}
              {piece ? <OverviewPiece piece={piece} /> : null}
            </span>
          );
        })}
      </div>
      <figcaption className="mt-5 text-center text-sm leading-6 text-[#a99a86]">
        The opening position used by prototype rules v0.1. Four clipped corners,
        four marked power spaces, and four bosses in the center.
      </figcaption>
    </figure>
  );
}

function DemoBoard({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <figure>
      <div className="rule-demo-board" aria-hidden="true">
        {demoCells.map((cell) => (
          <span
            key={`${cell.row}:${cell.col}`}
            className={cn(
              "rule-demo-cell",
              (cell.row + cell.col) % 2 === 0 && "rule-demo-cell-light",
            )}
          />
        ))}
        {children}
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

function DemoPiece({
  row,
  col,
  color,
  boss = false,
  animation,
}: {
  row: number;
  col: number;
  color: "ivory" | "burgundy";
  boss?: boolean;
  animation?: string;
}) {
  return (
    <span
      style={position(row, col)}
      className={cn(
        "rule-demo-piece",
        color === "ivory"
          ? "rule-demo-piece-ivory"
          : "rule-demo-piece-burgundy",
        boss && "rule-demo-piece-boss",
        animation,
      )}
    >
      {boss ? <Crown aria-hidden="true" /> : null}
    </span>
  );
}

function Target({
  row,
  col,
  className,
}: {
  row: number;
  col: number;
  className?: string;
}) {
  return (
    <span
      style={position(row, col)}
      className={cn("rule-demo-target", className)}
    />
  );
}

export function GuardMoveVisual() {
  return (
    <DemoBoard label="An ivory guard moves one square horizontally into the highlighted space.">
      <Target row={2} col={3} />
      <DemoPiece
        row={2}
        col={2}
        color="ivory"
        animation="rule-demo-guard-move"
      />
    </DemoBoard>
  );
}

export function BossMoveVisual() {
  return (
    <DemoBoard label="An ivory boss moves two clear squares vertically into the highlighted space.">
      <Target row={3} col={2} />
      <DemoPiece
        row={1}
        col={2}
        color="ivory"
        boss
        animation="rule-demo-boss-move"
      />
    </DemoBoard>
  );
}

export function CaptureVisual() {
  return (
    <DemoBoard label="An ivory guard moves upward, trapping and removing a burgundy guard between two ivory pieces.">
      <DemoPiece row={2} col={3} color="ivory" />
      <DemoPiece
        row={2}
        col={2}
        color="burgundy"
        animation="rule-demo-captured"
      />
      <Target row={2} col={1} />
      <DemoPiece
        row={3}
        col={1}
        color="ivory"
        animation="rule-demo-capture-move"
      />
    </DemoBoard>
  );
}

export function PowerMoveVisual() {
  return (
    <DemoBoard label="An ivory guard lands on a diamond power space, then uses its one powered move to travel diagonally.">
      <span style={position(3, 1)} className="rule-demo-power-space">
        <Diamond aria-hidden="true" />
      </span>
      <Target row={1} col={3} className="rule-demo-target-final" />
      <DemoPiece
        row={3}
        col={0}
        color="ivory"
        animation="rule-demo-power-move"
      />
    </DemoBoard>
  );
}
