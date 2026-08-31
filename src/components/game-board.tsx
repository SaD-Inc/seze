"use client";

import { Crown, Plus, X } from "lucide-react";
import { type CSSProperties, useId, useMemo, useState } from "react";

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
const marbleTexturePositions = coordinates.map((_, index) => {
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  const finalCell = BOARD_SIZE - 1;

  return {
    "--marble-position": `${(col / finalCell) * 100}% ${(row / finalCell) * 100}%`,
  } as CSSProperties;
});

const lightMarbleTile =
  "bg-[#e7e3dc] before:bg-[url('/textures/board-marble-white.svg')] before:opacity-[0.72]";
const darkMarbleTile =
  "bg-[#151515] before:bg-[url('/textures/board-marble-black.svg')] before:opacity-[0.76]";
const royalGoldCrown = "text-[#d5a62e]";
const metallicGoldGradient =
  "conic-gradient(from 210deg, #5d3004 0deg, #bd7d16 38deg, #ffe895 72deg, #a65e09 116deg, #f7d15d 166deg, #754008 214deg, #d99a27 264deg, #fff0a3 315deg, #5d3004 360deg)";

function PieceCrown({ color }: { color: PlayerColor }) {
  const gradientId = `piece-crown-${useId().replaceAll(":", "")}`;
  const onIvoryPiece = color === "ivory";

  return (
    <svg
      aria-hidden="true"
      className="size-[48%]"
      viewBox="0 2 24 17"
      fill={onIvoryPiece ? "#936309" : "#741426"}
      stroke={`url(#${gradientId})`}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="3"
          y1="4"
          x2="21"
          y2="20"
        >
          <stop offset="0" stopColor={onIvoryPiece ? "#704008" : "#8a4b08"} />
          <stop
            offset="0.32"
            stopColor={onIvoryPiece ? "#c68a24" : "#ffe89a"}
          />
          <stop
            offset="0.58"
            stopColor={onIvoryPiece ? "#e9bd5c" : "#c78213"}
          />
          <stop offset="0.8" stopColor={onIvoryPiece ? "#b57414" : "#f9d66c"} />
          <stop offset="1" stopColor={onIvoryPiece ? "#603203" : "#754008"} />
        </linearGradient>
      </defs>
      <path d="M4.3 16.5 3 6.5l5 4L12 4l4 6.5 5-4-1.3 10H4.3Z" />
    </svg>
  );
}

function Piece({ piece, selected }: { piece: GamePiece; selected: boolean }) {
  const faceColor = piece.color === "ivory" ? "#e6c83e" : "#741426";

  return (
    <span
      style={{ backgroundImage: metallicGoldGradient }}
      className={cn(
        "relative grid size-[74%] place-items-center rounded-full p-[4%] transition-transform duration-200",
        "shadow-[0_5px_9px_rgba(23,3,7,0.38),inset_0_2px_2px_rgba(255,247,184,0.72),inset_0_-2px_3px_rgba(82,39,1,0.58)]",
        selected &&
          "scale-110 ring-4 ring-[#ffe29b] ring-offset-2 ring-offset-[#7d1830]",
      )}
    >
      <span
        style={{
          backgroundColor: faceColor,
          backgroundImage:
            "radial-gradient(ellipse 74% 68% at 50% 45%, transparent 52%, rgba(0, 0, 0, 0.18) 72%, rgba(0, 0, 0, 0.72) 100%)",
        }}
        className="relative grid size-full place-items-center rounded-full"
      >
        {piece.kind === "captain" ? <PieceCrown color={piece.color} /> : null}
      </span>
      {piece.power ? (
        <span className="absolute -end-1 -top-1 grid size-[32%] min-h-3 min-w-3 place-items-center text-[#f0c56b] drop-shadow-[0_2px_1px_rgba(45,13,9,0.9)]">
          {piece.power === "rook" ? (
            <Plus className="size-full" strokeWidth={4} />
          ) : (
            <X className="size-full" strokeWidth={4} />
          )}
        </span>
      ) : null}
    </span>
  );
}

function BoardPowerIcon({
  power,
  gradientId,
  tileTone,
}: {
  power: "rook" | "bishop";
  gradientId: string;
  tileTone: "light" | "dark";
}) {
  const onLightTile = tileTone === "light";

  return (
    <svg
      aria-hidden="true"
      className="size-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={4.25}
      strokeLinecap="round"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="3"
          y1="3"
          x2="21"
          y2="21"
        >
          <stop offset="0" stopColor={onLightTile ? "#9a6512" : "#b77d19"} />
          <stop offset="0.38" stopColor={onLightTile ? "#c98a22" : "#edc45a"} />
          <stop offset="0.62" stopColor={onLightTile ? "#ddb04b" : "#ffe39a"} />
          <stop offset="1" stopColor={onLightTile ? "#aa7319" : "#c6922d"} />
        </linearGradient>
      </defs>
      {power === "rook" ? (
        <>
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </>
      ) : (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      )}
    </svg>
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

  const guidance =
    footerMessage ?? (selectedPiece ? `${legalMoves.length} legal moves` : "");

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
      <div
        style={{ backgroundImage: metallicGoldGradient }}
        className="absolute -inset-2 rounded-[2rem] shadow-[0_20px_52px_rgba(0,0,0,0.45)] sm:-inset-3"
      />
      <div className="absolute -inset-1 rounded-[1.6rem] border border-[#f2d693]/35 bg-[#3c150e] shadow-[inset_0_0_16px_rgba(0,0,0,0.68)] sm:-inset-2" />
      <fieldset
        aria-label="SEZE game board"
        className="relative grid min-w-0 aspect-square grid-cols-8 overflow-hidden rounded-[1.25rem] border border-[#eac779]/20 bg-[#2a070d] p-1 shadow-[inset_0_0_28px_rgba(20,0,4,0.58)] sm:p-2"
      >
        {displayCoordinates.map((coordinate, displayIndex) => {
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
              ? `${piece.color} ${piece.kind}${
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
              style={marbleTexturePositions[displayIndex]}
              className={cn(
                "group relative grid aspect-square touch-manipulation place-items-center overflow-hidden transition before:pointer-events-none before:absolute before:inset-0 before:bg-[length:800%_800%] before:bg-no-repeat before:[background-position:var(--marble-position)] focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-[#ffe29b] focus-visible:ring-inset",
                (coordinate.row + coordinate.col) % 2 === 0
                  ? lightMarbleTile
                  : darkMarbleTile,
                (lastFrom || lastTo) && "ring-2 ring-inset ring-[#e2be6e]",
                legal && "cursor-pointer hover:brightness-110",
                selected && "z-10",
              )}
              aria-label={cellDetails.join(", ")}
              aria-pressed={piece?.color === viewerColor ? selected : undefined}
            >
              {center ? (
                <Crown
                  className={cn("absolute size-[29%]", royalGoldCrown)}
                  strokeWidth={1.9}
                />
              ) : null}
              {power ? (
                <span className="absolute grid size-[39%] place-items-center">
                  <BoardPowerIcon
                    power={power}
                    gradientId={`board-power-${coordinate.row}-${coordinate.col}`}
                    tileTone={
                      (coordinate.row + coordinate.col) % 2 === 0
                        ? "light"
                        : "dark"
                    }
                  />
                </span>
              ) : null}
              {legal ? (
                <span className="absolute z-10 size-[18%] rounded-full bg-[#ffe1a0] shadow-[0_0_14px_rgba(255,218,137,0.85)]" />
              ) : null}
              {piece ? <Piece piece={piece} selected={selected} /> : null}
            </button>
          );
        })}
        <div
          aria-hidden
          style={{ borderImage: `${metallicGoldGradient} 1` }}
          className="pointer-events-none absolute inset-0 z-10 col-start-3 col-end-7 row-start-3 row-end-7 border-[3px] border-solid border-transparent"
        />
      </fieldset>
      {guidance ? (
        <p
          role="status"
          aria-live="polite"
          className="relative mt-5 text-center text-sm text-[#b9aa93] sm:mt-7"
        >
          {guidance}
        </p>
      ) : null}
    </div>
  );
}
