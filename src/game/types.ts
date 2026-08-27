export type PlayerColor = "ivory" | "burgundy";
// `captain` is the prototype-0.1 serialized key for the player-facing boss.
export type PieceKind = "guard" | "captain";
export type PowerType = "rook" | "bishop";
export type GameStatus = "waiting" | "active" | "finished";
// `captains` remains serialized for compatibility; the rule is "take both bosses."
export type WinReason = "center" | "captains" | "pieces";

export type Coordinate = {
  row: number;
  col: number;
};

export type GamePiece = Coordinate & {
  id: string;
  color: PlayerColor;
  kind: PieceKind;
  power: PowerType | null;
};

export type GameMove = {
  pieceId: string;
  from: Coordinate;
  to: Coordinate;
  capturedPieceIds: string[];
  powerGranted: PowerType | null;
};

export type GameState = {
  rulesetVersion: "prototype-0.1";
  turn: PlayerColor;
  moveNumber: number;
  pieces: GamePiece[];
  lastMove: GameMove | null;
  winner: PlayerColor | null;
  winReason: WinReason | null;
};

export type PublicPlayer = {
  color: PlayerColor;
  displayName: string;
};

export type PublicGame = {
  code: string;
  status: GameStatus;
  version: number;
  state: GameState;
  players: PublicPlayer[];
  viewerColor: PlayerColor | null;
  createdAt: Date;
  updatedAt: Date;
};
