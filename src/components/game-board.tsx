"use client";

import { Crown, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { GamePieceToken } from "~/components/game-piece-token";
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
  footerMessage?: string;
  onMove?: (pieceId: string, to: Coordinate) => void;
};

const coordinates = Array.from(
  { length: BOARD_SIZE * BOARD_SIZE },
  (_, index) => ({
    row: Math.floor(index / BOARD_SIZE),
    col: index % BOARD_SIZE,
  }),
);
const reversedCoordinates = [...coordinates].reverse();
const lightBoardTile = "bg-[var(--game-tile-light)]";
const darkBoardTile = "bg-[var(--game-tile-dark)]";
const displayColor = (color: PlayerColor) =>
  color === "ivory" ? "yellow" : "burgundy";

function Piece({ piece, selected }: { piece: GamePiece; selected: boolean }) {
  return (
    <GamePieceToken
      color={piece.color}
      kind={piece.kind}
      power={piece.power}
      className={cn(
        selected && "ring-4 ring-[#8fb2ae] ring-offset-2 ring-offset-[#24312f]",
      )}
    />
  );
}

function BoardPowerIcon({
  power,
  tileTone,
}: {
  power: "rook" | "bishop";
  tileTone: "light" | "dark";
}) {
  const Icon = power === "rook" ? Plus : X;

  return (
    <Icon
      aria-hidden="true"
      className={cn(
        "size-full",
        tileTone === "light" ? "text-[#89672d]" : "text-[#cfb46f]",
      )}
      strokeWidth={3.25}
    />
  );
}

export function GameBoard({
  state,
  viewerColor,
  disabled = false,
  footerMessage,
  onMove,
}: GameBoardProps) {
  const [selection, setSelection] = useState<{
    pieceId: string | null;
    moveNumber: number;
  }>({ pieceId: null, moveNumber: state.moveNumber });
  const isFlipped =
    state.rulesetVersion === "prototype-0.1"
      ? viewerColor === "burgundy"
      : viewerColor === "ivory";

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
    !onMove ||
    disabled ||
    Boolean(state.winner) ||
    !viewerColor ||
    viewerColor !== state.turn;

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
      onMove?.(selectedPiece.id, coordinate);
      setSelection({ pieceId: null, moveNumber: state.moveNumber });
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[720px] touch-manipulation select-none">
      <fieldset
        aria-label="SEZE game board"
        className="relative grid min-w-0 aspect-square grid-cols-8 overflow-hidden rounded-xl border-[3px] border-[var(--game-board-edge)] bg-[#242223] p-1 shadow-[0_10px_28px_rgba(0,0,0,0.32)] sm:p-2"
      >
        {displayCoordinates.map((coordinate) => {
          const playable = isPlayableCell(coordinate);
          const piece = pieceByCoordinate.get(coordinateKey(coordinate));
          const center = isCenterCell(coordinate);
          const power = powerAt(coordinate, state.rulesetVersion);
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
            power
              ? `${power === "rook" ? "plus" : "cross"} ${power} power space`
              : null,
            piece
              ? `${displayColor(piece.color)} ${piece.kind}${
                  piece.power
                    ? ` with attached ${piece.power === "rook" ? "plus rook" : "cross bishop"} power`
                    : ""
                }`
              : "empty",
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
                "group relative grid aspect-square touch-manipulation place-items-center overflow-hidden focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-[#8fb2ae] focus-visible:ring-inset",
                (coordinate.row + coordinate.col) % 2 === 0
                  ? lightBoardTile
                  : darkBoardTile,
                (lastFrom || lastTo) && "ring-2 ring-inset ring-[#789b97]",
                legal && "cursor-pointer hover:brightness-105",
                selected && "z-10",
              )}
              aria-label={cellDetails.join(", ")}
              aria-pressed={piece?.color === viewerColor ? selected : undefined}
            >
              {center ? (
                <Crown
                  className="absolute size-[24%] text-[var(--game-gold-bright)]"
                  strokeWidth={2}
                />
              ) : null}
              {power ? (
                <span className="absolute grid size-[34%] place-items-center">
                  <BoardPowerIcon
                    power={power}
                    tileTone={
                      (coordinate.row + coordinate.col) % 2 === 0
                        ? "light"
                        : "dark"
                    }
                  />
                </span>
              ) : null}
              {legal ? (
                <span className="absolute z-10 size-[16%] rounded-full bg-[#8fb2ae]" />
              ) : null}
              {piece ? <Piece piece={piece} selected={selected} /> : null}
            </button>
          );
        })}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 col-start-3 col-end-7 row-start-3 row-end-7 border-2 border-[var(--game-gold)]/80"
        />
      </fieldset>
      {footerMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="relative mt-5 text-center text-sm text-[#b9aa93] sm:mt-7"
        >
          {footerMessage}
        </p>
      ) : null}
    </div>
  );
}
