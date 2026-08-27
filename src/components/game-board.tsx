"use client";

import { Crown, Diamond, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import {
  BOARD_SIZE,
  coordinateKey,
  coordinatesEqual,
  getLegalMoves,
  isCenterCell,
  isPlayableCell,
  powerAt,
} from "~/game/rules";
import type {
  Coordinate,
  GamePiece,
  GameState,
  PlayerColor,
} from "~/game/types";
import { cn } from "~/lib/utils";

type GameBoardProps = {
  state: GameState;
  viewerColor: PlayerColor | null;
  disabled?: boolean;
  onMove: (pieceId: string, to: Coordinate) => void;
};

const coordinates = Array.from(
  { length: BOARD_SIZE * BOARD_SIZE },
  (_, index) => ({
    row: Math.floor(index / BOARD_SIZE),
    col: index % BOARD_SIZE,
  }),
);
const reversedCoordinates = [...coordinates].reverse();

function Piece({ piece, selected }: { piece: GamePiece; selected: boolean }) {
  return (
    <span
      className={cn(
        "relative grid size-[72%] place-items-center rounded-full border transition duration-200",
        "shadow-[0_8px_14px_rgba(23,3,7,0.38),inset_0_2px_2px_rgba(255,255,255,0.38),inset_0_-4px_7px_rgba(0,0,0,0.34)]",
        piece.color === "ivory"
          ? "border-[#9c8359] bg-[radial-gradient(circle_at_35%_28%,#fffaf0_0%,#e8d7b8_55%,#ac9062_100%)] text-[#694d2e]"
          : "border-[#e5ad78]/55 bg-[radial-gradient(circle_at_35%_28%,#bd3e4c_0%,#741426_48%,#2c0610_100%)] text-[#f0ca8a]",
        piece.kind === "captain" &&
          "ring-2 ring-[#d6af62]/55 ring-offset-1 ring-offset-[#5c0d1e]",
        selected &&
          "scale-110 ring-4 ring-[#ffe29b] ring-offset-2 ring-offset-[#7d1830]",
      )}
    >
      {piece.kind === "captain" ? (
        <Crown className="size-[46%] drop-shadow-sm" strokeWidth={1.8} />
      ) : (
        <span className="size-[28%] rounded-full border border-current/55" />
      )}
      {piece.power ? (
        <span className="absolute -end-1 -top-1 grid size-[30%] min-h-3 min-w-3 place-items-center rounded-full bg-[#e8bd64] text-[#4e1420] shadow">
          {piece.power === "rook" ? (
            <Sparkles className="size-[68%]" />
          ) : (
            <Diamond className="size-[64%]" />
          )}
        </span>
      ) : null}
    </span>
  );
}

export function GameBoard({
  state,
  viewerColor,
  disabled = false,
  onMove,
}: GameBoardProps) {
  const [selection, setSelection] = useState<{
    pieceId: string | null;
    moveNumber: number;
  }>({ pieceId: null, moveNumber: state.moveNumber });
  const isFlipped = viewerColor === "burgundy";

  const selectedId =
    selection.moveNumber === state.moveNumber ? selection.pieceId : null;

  const selectedPiece = state.pieces.find((piece) => piece.id === selectedId);
  const legalMoves = useMemo(
    () => (selectedId ? getLegalMoves(state, selectedId) : []),
    [selectedId, state],
  );
  const legalKeys = new Set(legalMoves.map(coordinateKey));
  const pieceByCoordinate = useMemo(
    () =>
      new Map(
        state.pieces.map((piece) => [coordinateKey(piece), piece] as const),
      ),
    [state.pieces],
  );
  const displayCoordinates = isFlipped ? reversedCoordinates : coordinates;
  const interactionBlocked =
    disabled ||
    Boolean(state.winner) ||
    !viewerColor ||
    viewerColor !== state.turn;

  const guidance = state.winner
    ? "Game complete."
    : !viewerColor
      ? "Watching the current position."
      : disabled || viewerColor !== state.turn
        ? "Waiting for the next turn."
        : selectedPiece
          ? `${selectedPiece.kind === "captain" ? "Boss" : "Guard"} selected · choose one of ${legalMoves.length} highlighted spaces.`
          : "";

  function handleCell(coordinate: Coordinate, piece?: GamePiece) {
    if (interactionBlocked || !viewerColor) return;

    if (piece?.color === viewerColor) {
      setSelection({
        pieceId: piece.id === selectedId ? null : piece.id,
        moveNumber: state.moveNumber,
      });
      return;
    }

    if (selectedPiece && legalKeys.has(coordinateKey(coordinate))) {
      onMove(selectedPiece.id, coordinate);
      setSelection({ pieceId: null, moveNumber: state.moveNumber });
    }
  }

  return (
    <div className="relative w-full max-w-[720px] touch-manipulation select-none">
      <div className="absolute -inset-3 rounded-[2rem] bg-[linear-gradient(135deg,#e3bd75_0%,#6e471f_20%,#d0a55e_48%,#563316_73%,#b7823d_100%)] shadow-[0_32px_80px_rgba(0,0,0,0.55)] sm:-inset-5" />
      <div className="absolute -inset-1 rounded-[1.6rem] border border-[#f2d693]/40 bg-[#3c150e] shadow-[inset_0_0_24px_rgba(0,0,0,0.8)] sm:-inset-2" />
      <fieldset
        aria-label="SEZE game board"
        className="relative grid min-w-0 aspect-square grid-cols-8 overflow-hidden rounded-[1.25rem] border border-[#eac779]/25 bg-[#2a070d] p-1 shadow-[inset_0_0_40px_rgba(20,0,4,0.7)] sm:p-2"
      >
        {displayCoordinates.map((coordinate) => {
          const playable = isPlayableCell(coordinate);
          const piece = pieceByCoordinate.get(coordinateKey(coordinate));
          const center = isCenterCell(coordinate);
          const power = powerAt(coordinate);
          const legal = legalKeys.has(coordinateKey(coordinate));
          const selected = piece?.id === selectedId;
          const lastFrom = state.lastMove
            ? coordinatesEqual(state.lastMove.from, coordinate)
            : false;
          const lastTo = state.lastMove
            ? coordinatesEqual(state.lastMove.to, coordinate)
            : false;
          const canInteract =
            !interactionBlocked && (piece?.color === viewerColor || legal);
          const cellDetails = [
            `Row ${coordinate.row + 1}, column ${coordinate.col + 1}`,
            center ? "center space" : null,
            power ? `${power} power space` : null,
            piece ? `${piece.color} ${piece.kind}` : "empty",
            legal ? "legal destination" : null,
          ].filter(Boolean);

          if (!playable) {
            return (
              <div
                key={coordinateKey(coordinate)}
                aria-hidden
                className="bg-transparent"
              />
            );
          }

          return (
            <button
              type="button"
              key={coordinateKey(coordinate)}
              onClick={() => handleCell(coordinate, piece)}
              disabled={!canInteract}
              className={cn(
                "group relative grid aspect-square touch-manipulation place-items-center border border-[#4d0714]/35 transition focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-[#ffe29b] focus-visible:ring-inset",
                (coordinate.row + coordinate.col) % 2 === 0
                  ? "bg-[#971c37]"
                  : "bg-[#7c132b]",
                "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_45%_35%,rgba(255,255,255,0.08),transparent_60%)]",
                center && "shadow-[inset_0_0_0_2px_rgba(226,190,110,0.72)]",
                (lastFrom || lastTo) && "bg-[#b12b44]",
                legal && "cursor-pointer bg-[#af3048] hover:bg-[#c33b55]",
                selected && "z-10",
              )}
              aria-label={cellDetails.join(", ")}
              aria-pressed={piece?.color === viewerColor ? selected : undefined}
            >
              {center ? (
                <span className="absolute size-[62%] rotate-45 rounded-[18%] border border-[#e8c16e]/45" />
              ) : null}
              {power ? (
                <span className="absolute grid size-[45%] place-items-center rounded-full border border-[#efd189]/60 bg-[#48101b]/38 text-[#edcb81]/75">
                  {power === "rook" ? (
                    <Sparkles className="size-[52%]" strokeWidth={1.5} />
                  ) : (
                    <Diamond className="size-[48%]" strokeWidth={1.5} />
                  )}
                </span>
              ) : null}
              {legal ? (
                <span className="absolute z-10 size-[18%] rounded-full bg-[#ffe1a0] shadow-[0_0_14px_rgba(255,218,137,0.85)]" />
              ) : null}
              {piece ? <Piece piece={piece} selected={selected} /> : null}
            </button>
          );
        })}
      </fieldset>
      <p
        role="status"
        aria-live="polite"
        className="relative mt-5 min-h-6 text-center text-sm text-[#b9aa93] sm:mt-7"
      >
        {guidance}
      </p>
    </div>
  );
}
