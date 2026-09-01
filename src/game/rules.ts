import type {
  Coordinate,
  GamePiece,
  GameState,
  PlayerColor,
  PowerType,
  WinReason,
} from "~/game/types";

export const BOARD_SIZE = 8;
export const RULESET_VERSION = "prototype-0.3" as const;

export const CENTER_CELLS: readonly Coordinate[] = [
  { row: 3, col: 3 },
  { row: 3, col: 4 },
  { row: 4, col: 3 },
  { row: 4, col: 4 },
];

export const POWER_CELLS: ReadonlyArray<Coordinate & { power: PowerType }> = [
  { row: 0, col: 2, power: "rook" },
  { row: 0, col: 5, power: "bishop" },
  { row: 2, col: 7, power: "rook" },
  { row: 5, col: 7, power: "bishop" },
  { row: 7, col: 5, power: "rook" },
  { row: 7, col: 2, power: "bishop" },
  { row: 5, col: 0, power: "rook" },
  { row: 2, col: 0, power: "bishop" },
];

const ORTHOGONAL_DIRECTIONS: readonly Coordinate[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

const DIAGONAL_DIRECTIONS: readonly Coordinate[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

export class InvalidMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMoveError";
  }
}

export function otherColor(color: PlayerColor): PlayerColor {
  return color === "ivory" ? "burgundy" : "ivory";
}

export function coordinateKey({ row, col }: Coordinate): string {
  return `${row}:${col}`;
}

export function coordinatesEqual(a: Coordinate, b: Coordinate): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isPlayableCell({ row, col }: Coordinate): boolean {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return false;
  }

  return !(
    (row === 0 || row === BOARD_SIZE - 1) &&
    (col === 0 || col === BOARD_SIZE - 1)
  );
}

export function powerAt(coordinate: Coordinate): PowerType | null {
  if (isCenterCell(coordinate)) return "boss";

  return (
    POWER_CELLS.find((cell) => coordinatesEqual(cell, coordinate))?.power ??
    null
  );
}

export function isCenterCell(coordinate: Coordinate): boolean {
  return CENTER_CELLS.some((cell) => coordinatesEqual(cell, coordinate));
}

function piece(
  id: string,
  color: PlayerColor,
  kind: GamePiece["kind"],
  row: number,
  col: number,
): GamePiece {
  return { id, color, kind, row, col, power: null };
}

function createCurrentPieces(): GamePiece[] {
  return [
    piece("i-g1", "ivory", "guard", 2, 2),
    piece("i-g2", "ivory", "guard", 2, 3),
    piece("i-g3", "ivory", "guard", 2, 4),
    piece("i-g4", "ivory", "guard", 2, 5),
    piece("i-g5", "ivory", "guard", 3, 2),
    piece("i-g6", "ivory", "guard", 3, 5),
    piece("i-c1", "ivory", "boss", 3, 3),
    piece("i-c2", "ivory", "boss", 3, 4),
    piece("b-g1", "burgundy", "guard", 5, 2),
    piece("b-g2", "burgundy", "guard", 5, 3),
    piece("b-g3", "burgundy", "guard", 5, 4),
    piece("b-g4", "burgundy", "guard", 5, 5),
    piece("b-g5", "burgundy", "guard", 4, 2),
    piece("b-g6", "burgundy", "guard", 4, 5),
    piece("b-c1", "burgundy", "boss", 4, 3),
    piece("b-c2", "burgundy", "boss", 4, 4),
  ];
}

export function createInitialState(): GameState {
  return {
    rulesetVersion: RULESET_VERSION,
    turn: "burgundy",
    moveNumber: 0,
    winner: null,
    winReason: null,
    lastMove: null,
    scores: { ivory: 0, burgundy: 0 },
    pieces: createCurrentPieces(),
  };
}

export function getPieceAt(
  state: GameState,
  coordinate: Coordinate,
): GamePiece | undefined {
  return state.pieces.find((candidate) =>
    coordinatesEqual(candidate, coordinate),
  );
}

function collectSlidingMoves(
  state: GameState,
  origin: Coordinate,
  directions: readonly Coordinate[],
  maximumDistance: number,
): Coordinate[] {
  const moves: Coordinate[] = [];

  for (const direction of directions) {
    for (let distance = 1; distance <= maximumDistance; distance += 1) {
      const target = {
        row: origin.row + direction.row * distance,
        col: origin.col + direction.col * distance,
      };

      if (!isPlayableCell(target) || getPieceAt(state, target)) break;
      moves.push(target);
    }
  }

  return moves;
}

export function getLegalMoves(state: GameState, pieceId: string): Coordinate[] {
  if (state.winner) return [];

  const movingPiece = state.pieces.find(
    (candidate) => candidate.id === pieceId,
  );
  if (!movingPiece || movingPiece.color !== state.turn) return [];

  const allDirections = [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];

  if (movingPiece.kind === "boss" || movingPiece.power === "boss") {
    return collectSlidingMoves(state, movingPiece, allDirections, 2);
  }

  if (movingPiece.power === "rook") {
    const poweredMoves = collectSlidingMoves(
      state,
      movingPiece,
      ORTHOGONAL_DIRECTIONS,
      BOARD_SIZE,
    );
    return mergeCoordinates(
      poweredMoves,
      collectSlidingMoves(state, movingPiece, DIAGONAL_DIRECTIONS, 1),
    );
  }

  if (movingPiece.power === "bishop") {
    const poweredMoves = collectSlidingMoves(
      state,
      movingPiece,
      DIAGONAL_DIRECTIONS,
      BOARD_SIZE,
    );
    return mergeCoordinates(
      poweredMoves,
      collectSlidingMoves(state, movingPiece, ORTHOGONAL_DIRECTIONS, 1),
    );
  }

  return collectSlidingMoves(state, movingPiece, allDirections, 1);
}

function mergeCoordinates(...groups: readonly Coordinate[][]): Coordinate[] {
  const unique = new Map<string, Coordinate>();
  for (const coordinate of groups.flat()) {
    unique.set(coordinateKey(coordinate), coordinate);
  }
  return [...unique.values()];
}

function capturedAfterMove(state: GameState, movingPiece: GamePiece): string[] {
  const captured = new Set<string>();
  const captureDirections = [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];

  for (const direction of captureDirections) {
    const adjacent = getPieceAt(state, {
      row: movingPiece.row + direction.row,
      col: movingPiece.col + direction.col,
    });
    if (!adjacent || adjacent.color === movingPiece.color) continue;

    const anchor = getPieceAt(state, {
      row: adjacent.row + direction.row,
      col: adjacent.col + direction.col,
    });
    if (anchor?.color === movingPiece.color) captured.add(adjacent.id);
  }

  return [...captured];
}

export function scoreForCapturedPiece(piece: GamePiece): number {
  if (piece.kind === "boss") return 3;
  return piece.power ? 2 : 1;
}

function determineWinner(
  pieces: GamePiece[],
  movingColor: PlayerColor,
): { winner: PlayerColor; reason: WinReason } | null {
  const ownsCenter = CENTER_CELLS.every(
    (cell) => getPieceAt({ pieces } as GameState, cell)?.color === movingColor,
  );
  if (ownsCenter) return { winner: movingColor, reason: "center" };

  const opponent = otherColor(movingColor);
  const opponentPieces = pieces.filter(
    (candidate) => candidate.color === opponent,
  );
  if (!opponentPieces.some((candidate) => candidate.kind === "boss")) {
    return { winner: movingColor, reason: "bosses" };
  }
  if (opponentPieces.length <= 2) {
    return { winner: movingColor, reason: "pieces" };
  }

  return null;
}

export function applyMove(
  state: GameState,
  pieceId: string,
  target: Coordinate,
): GameState {
  if (state.winner)
    throw new InvalidMoveError("This game is already finished.");

  const movingPiece = state.pieces.find(
    (candidate) => candidate.id === pieceId,
  );
  if (!movingPiece)
    throw new InvalidMoveError("That piece is no longer on the board.");
  if (movingPiece.color !== state.turn) {
    throw new InvalidMoveError("It is not that player's turn.");
  }

  const legal = getLegalMoves(state, pieceId).some((move) =>
    coordinatesEqual(move, target),
  );
  if (!legal) throw new InvalidMoveError("That move is not legal.");

  const from = { row: movingPiece.row, col: movingPiece.col };
  const movedPieces = state.pieces.map((candidate) =>
    candidate.id === pieceId
      ? {
          ...candidate,
          row: target.row,
          col: target.col,
        }
      : candidate,
  );
  const movedPiece = movedPieces.find((candidate) => candidate.id === pieceId);
  if (!movedPiece)
    throw new InvalidMoveError("That piece is no longer on the board.");
  const captureIds = capturedAfterMove(
    { ...state, pieces: movedPieces },
    movedPiece,
  );
  const capturedPieces = movedPieces.filter((candidate) =>
    captureIds.includes(candidate.id),
  );
  const remainingPieces = movedPieces.filter(
    (candidate) => !captureIds.includes(candidate.id),
  );
  const grantedPower = movedPiece.kind === "guard" ? powerAt(target) : null;
  const poweredPieces = remainingPieces.map((candidate) =>
    candidate.id === pieceId && grantedPower
      ? {
          ...candidate,
          kind: grantedPower === "boss" ? ("boss" as const) : candidate.kind,
          power: grantedPower,
        }
      : candidate,
  );
  const result = determineWinner(poweredPieces, movingPiece.color);
  const scoreEarned = capturedPieces.reduce(
    (total, capturedPiece) => total + scoreForCapturedPiece(capturedPiece),
    0,
  );

  return {
    ...state,
    turn: result ? state.turn : otherColor(state.turn),
    moveNumber: state.moveNumber + 1,
    pieces: poweredPieces,
    scores: {
      ...state.scores,
      [movingPiece.color]: state.scores[movingPiece.color] + scoreEarned,
    },
    winner: result?.winner ?? null,
    winReason: result?.reason ?? null,
    lastMove: {
      pieceId,
      from,
      to: target,
      capturedPieceIds: captureIds,
      powerGranted: grantedPower,
      scoreEarned,
    },
  };
}
