import { Crown, Plus, Pyramid, X } from "lucide-react";
import { type CSSProperties, Fragment, type ReactNode } from "react";

import { GamePieceToken } from "~/components/game-piece-token";
import {
  BOARD_SIZE,
  coordinateKey,
  createInitialState,
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

type DemoCoordinate = (typeof demoCells)[number];

const guardMoveChoices: readonly DemoCoordinate[] = [
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 2, col: 1 },
  { row: 2, col: 3 },
  { row: 3, col: 1 },
  { row: 3, col: 2 },
  { row: 3, col: 3 },
];

const bossMoveChoices: readonly DemoCoordinate[] = [
  { row: 0, col: 0 },
  { row: 0, col: 2 },
  { row: 0, col: 4 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 3 },
  { row: 2, col: 4 },
  { row: 3, col: 1 },
  { row: 3, col: 2 },
  { row: 3, col: 3 },
  { row: 4, col: 0 },
  { row: 4, col: 2 },
  { row: 4, col: 4 },
];

const captureMoveChoices: readonly DemoCoordinate[] = [
  { row: 3, col: 0 },
  { row: 3, col: 1 },
  { row: 4, col: 1 },
];

const unpoweredMoveChoices: readonly DemoCoordinate[] = [
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 3, col: 1 },
  { row: 4, col: 0 },
  { row: 4, col: 1 },
];

const diagonalCapMoveChoices: readonly DemoCoordinate[] = [
  { row: 0, col: 4 },
  { row: 1, col: 3 },
  { row: 2, col: 0 },
  { row: 2, col: 2 },
  { row: 4, col: 0 },
  { row: 4, col: 2 },
];

type PositionedStyle = CSSProperties & {
  "--demo-row": number;
  "--demo-col": number;
};

function position(row: number, col: number): PositionedStyle {
  return { "--demo-row": row, "--demo-col": col };
}

function OverviewPiece({ piece }: { piece: GamePiece }) {
  return (
    <GamePieceToken
      color={piece.color}
      kind={piece.kind}
      power={piece.power}
      className="z-10"
    />
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
        className="relative grid aspect-square grid-cols-8 overflow-hidden rounded-xl border-[3px] border-[var(--game-board-edge)] bg-[#242223] p-1 shadow-[0_10px_28px_rgba(0,0,0,0.32)] sm:p-2"
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
                "relative grid aspect-square place-items-center",
                (coordinate.row + coordinate.col) % 2 === 0
                  ? "bg-[var(--game-tile-light)]"
                  : "bg-[var(--game-tile-dark)]",
              )}
            >
              {power ? (
                <span
                  className={cn(
                    "absolute grid size-[34%] place-items-center",
                    (coordinate.row + coordinate.col) % 2 === 0
                      ? "text-[#89672d]"
                      : "text-[#cfb46f]",
                  )}
                >
                  {power === "rook" ? (
                    <Plus className="size-full" strokeWidth={3.25} />
                  ) : power === "bishop" ? (
                    <X className="size-full" strokeWidth={3.25} />
                  ) : (
                    <Crown className="size-full" strokeWidth={2.5} />
                  )}
                </span>
              ) : null}
              {piece ? <OverviewPiece piece={piece} /> : null}
            </span>
          );
        })}
        <span className="pointer-events-none absolute inset-0 z-20 col-start-3 col-end-7 row-start-3 row-end-7 border-2 border-[var(--game-gold)]/80" />
      </div>
      <figcaption className="mt-5 text-center text-sm leading-6 text-[#a99a86]">
        The opening position. Red moves first; four + and four × power spaces
        ring the board, and the center markers grant crowns to guards.
      </figcaption>
    </figure>
  );
}

function DemoBoard({
  children,
  label,
  pace = "standard",
}: {
  children: ReactNode;
  label: string;
  pace?: "standard" | "power";
}) {
  return (
    <figure>
      <div
        className={cn(
          "rule-demo-board",
          pace === "power" && "rule-demo-board-power",
        )}
        aria-hidden="true"
      >
        {demoCells.map((cell) => (
          <span
            key={`${cell.row}:${cell.col}`}
            className={cn(
              "rule-demo-cell",
              (cell.row + cell.col) % 2 === 0 && "rule-demo-cell-light",
            )}
          />
        ))}
        <span className="rule-demo-scene">{children}</span>
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
  power,
  animation,
}: {
  row: number;
  col: number;
  color: "ivory" | "burgundy";
  boss?: boolean;
  power?: GamePiece["power"];
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
        animation ?? "rule-demo-piece-appear",
      )}
    >
      {boss ? <Crown aria-hidden="true" /> : null}
      {power ? (
        <span className="rule-demo-piece-power">
          {power === "rook" ? (
            <Plus aria-hidden="true" />
          ) : power === "bishop" ? (
            <Pyramid aria-hidden="true" />
          ) : (
            <Crown aria-hidden="true" />
          )}
        </span>
      ) : null}
    </span>
  );
}

function Target({
  row,
  col,
  selected = false,
  className,
}: {
  row: number;
  col: number;
  selected?: boolean;
  className?: string;
}) {
  return (
    <span
      style={position(row, col)}
      className={cn(
        "rule-demo-target",
        selected && "rule-demo-target-selected",
        className,
      )}
    />
  );
}

function Targets({
  choices,
  selectedChoice,
  className,
}: {
  choices: readonly DemoCoordinate[];
  selectedChoice: DemoCoordinate;
  className?: string;
}) {
  return (
    <Fragment>
      <span className={cn("rule-demo-target-group", className)}>
        {choices
          .filter(
            (choice) =>
              choice.row !== selectedChoice.row ||
              choice.col !== selectedChoice.col,
          )
          .map((choice) => (
            <Target
              key={`${choice.row}:${choice.col}`}
              row={choice.row}
              col={choice.col}
            />
          ))}
      </span>
      <Target
        row={selectedChoice.row}
        col={selectedChoice.col}
        selected
        className={className}
      />
    </Fragment>
  );
}

export function GuardMoveVisual() {
  return (
    <DemoBoard label="Grey dots mark all eight legal destinations for a gold guard. The selected destination turns larger and blue before the guard moves one square diagonally.">
      <Targets choices={guardMoveChoices} selectedChoice={{ row: 3, col: 3 }} />
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
    <DemoBoard label="Grey dots mark every legal one- and two-square destination for a gold boss. The selected destination turns larger and blue before the boss moves two squares diagonally.">
      <Targets choices={bossMoveChoices} selectedChoice={{ row: 4, col: 4 }} />
      <DemoPiece
        row={2}
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
    <DemoBoard label="Grey dots mark every legal guard destination. The selected destination turns larger and blue before the guard makes the diagonal move that traps and removes a red guard.">
      <DemoPiece row={1} col={3} color="ivory" />
      <DemoPiece
        row={2}
        col={2}
        color="burgundy"
        animation="rule-demo-captured"
      />
      <Targets
        choices={captureMoveChoices}
        selectedChoice={{ row: 3, col: 1 }}
      />
      <DemoPiece
        row={4}
        col={0}
        color="ivory"
        animation="rule-demo-capture-move"
      />
    </DemoBoard>
  );
}

export function PowerMoveVisual() {
  return (
    <DemoBoard
      label="Grey dots first mark every legal guard step, then switch to every available diagonal destination after the guard receives a pyramid cap. Each selected destination turns larger and blue."
      pace="power"
    >
      <span style={position(3, 1)} className="rule-demo-power-space">
        <X aria-hidden="true" />
      </span>
      <Targets
        choices={unpoweredMoveChoices}
        selectedChoice={{ row: 3, col: 1 }}
        className="rule-demo-target-before-power"
      />
      <Targets
        choices={diagonalCapMoveChoices}
        selectedChoice={{ row: 1, col: 3 }}
        className="rule-demo-target-after-power"
      />
      <DemoPiece
        row={3}
        col={0}
        color="ivory"
        power="bishop"
        animation="rule-demo-power-move"
      />
    </DemoBoard>
  );
}
