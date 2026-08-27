import type {
  Coordinate,
  GamePiece,
  GameState,
  PlayerColor,
  PowerType,
  RulesetVersion,
  WinReason,
} from "~/game/types";

export const BOARD_SIZE = 8;
export const RULESET_VERSION = "prototype-0.2" as const;

export const CENTER_CELLS: readonly Coordinate[] = [
  { row: 3, col: 3 },
  { row: 3, col: 4 },
  { row: 4, col: 3 },
  { row: 4, col: 4 },
];

const LEGACY_POWER_CELLS: ReadonlyArray<Coordinate & { power: PowerType }> = [
  { row: 1, col: 1, power: "bishop" },
  { row: 1, col: 6, power: "rook" },
  { row: 6, col: 1, power: "rook" },
  { row: 6, col: 6, power: "bishop" },
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

export function powerAt(
  coordinate: Coordinate,
  rulesetVersion: RulesetVersion = RULESET_VERSION,
): PowerType | null {
  const powerCells =
    rulesetVersion === "prototype-0.1" ? LEGACY_POWER_CELLS : POWER_CELLS;

  return (
    powerCells.find((cell) => coordinatesEqual(cell, coordinate))?.power ?? null
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

function createLegacyPieces(): GamePiece[] {
  return [
    piece("i-g1", "ivory", "guard", 5, 1),
    piece("i-g2", "ivory", "guard", 5, 2),
    piece("i-g3", "ivory", "guard", 5, 5),
    piece("i-g4", "ivory", "guard", 5, 6),
    piece("i-g5", "ivory", "guard", 4, 2),
    piece("i-g6", "ivory", "guard", 4, 5),
    piece("i-c1", "ivory", "captain", 4, 3),
    piece("i-c2", "ivory", "captain", 4, 4),
    piece("b-g1", "burgundy", "guard", 2, 1),
    piece("b-g2", "burgundy", "guard", 2, 2),
    piece("b-g3", "burgundy", "guard", 2, 5),
    piece("b-g4", "burgundy", "guard", 2, 6),
    piece("b-g5", "burgundy", "guard", 3, 2),
    piece("b-g6", "burgundy", "guard", 3, 5),
    piece("b-c1", "burgundy", "captain", 3, 3),
    piece("b-c2", "burgundy", "captain", 3, 4),
  ];
}

function createCurrentPieces(): GamePiece[] {
  return [
    piece("i-g1", "ivory", "guard", 2, 2),
    piece("i-g2", "ivory", "guard", 2, 3),
    piece("i-g3", "ivory", "guard", 2, 4),
    piece("i-g4", "ivory", "guard", 2, 5),
    piece("i-g5", "ivory", "guard", 3, 2),
    piece("i-g6", "ivory", "guard", 3, 5),
    piece("i-c1", "ivory", "captain", 3, 3),
    piece("i-c2", "ivory", "captain", 3, 4),
    piece("b-g1", "burgundy", "guard", 5, 2),
    piece("b-g2", "burgundy", "guard", 5, 3),
    piece("b-g3", "burgundy", "guard", 5, 4),
    piece("b-g4", "burgundy", "guard", 5, 5),
    piece("b-g5", "burgundy", "guard", 4, 2),
    piece("b-g6", "burgundy", "guard", 4, 5),
    piece("b-c1", "burgundy", "captain", 4, 3),
    piece("b-c2", "burgundy", "captain", 4, 4),
  ];
}

export function createInitialState(
  rulesetVersion: RulesetVersion = RULESET_VERSION,
): GameState {
  return {
    rulesetVersion,
    turn: "ivory",
    moveNumber: 0,
    winner: null,
    winReason: null,
    lastMove: null,
    pieces:
      rulesetVersion === "prototype-0.1"
        ? createLegacyPieces()
        : createCurrentPieces(),
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

  if (movingPiece.kind === "captain") {
    const directions =
      state.rulesetVersion === "prototype-0.1"
        ? ORTHOGONAL_DIRECTIONS
        : [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];
    return collectSlidingMoves(state, movingPiece, directions, 2);
  }

  if (movingPiece.power === "rook") {
    return collectSlidingMoves(
      state,
      movingPiece,
      ORTHOGONAL_DIRECTIONS,
      BOARD_SIZE,
    );
  }

  if (movingPiece.power === "bishop") {
    return collectSlidingMoves(
      state,
      movingPiece,
      DIAGONAL_DIRECTIONS,
      BOARD_SIZE,
    );
  }

  return collectSlidingMoves(state, movingPiece, ORTHOGONAL_DIRECTIONS, 1);
}

function capturedAfterMove(state: GameState, movingPiece: GamePiece): string[] {
  const captured = new Set<string>();

  for (const direction of ORTHOGONAL_DIRECTIONS) {
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
  if (!opponentPieces.some((candidate) => candidate.kind === "captain")) {
    return { winner: movingColor, reason: "captains" };
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
  const usesLegacyPowerLifecycle =
    state.rulesetVersion === "prototype-0.1" &&
    movingPiece.kind === "guard" &&
    movingPiece.power !== null;
  const movedPieces = state.pieces.map((candidate) =>
    candidate.id === pieceId
      ? {
          ...candidate,
          row: target.row,
          col: target.col,
          power: usesLegacyPowerLifecycle ? null : candidate.power,
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
  const remainingPieces = movedPieces.filter(
    (candidate) => !captureIds.includes(candidate.id),
  );
  const grantedPower =
    movedPiece.kind === "guard" && !usesLegacyPowerLifecycle
      ? powerAt(target, state.rulesetVersion)
      : null;
  const poweredPieces = remainingPieces.map((candidate) =>
    candidate.id === pieceId && grantedPower
      ? { ...candidate, power: grantedPower }
      : candidate,
  );
  const result = determineWinner(poweredPieces, movingPiece.color);

  return {
    ...state,
    turn: result ? state.turn : otherColor(state.turn),
    moveNumber: state.moveNumber + 1,
    pieces: poweredPieces,
    winner: result?.winner ?? null,
    winReason: result?.reason ?? null,
    lastMove: {
      pieceId,
      from,
      to: target,
      capturedPieceIds: captureIds,
      powerGranted: grantedPower,
    },
  };
}
