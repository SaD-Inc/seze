export type PlayerColor = "ivory" | "burgundy";
export type PlayerKind = "human" | "bot";
export type BotDifficulty = "easy" | "balanced" | "hard";
export type PieceKind = "guard" | "boss";
export type PowerType = "rook" | "bishop" | "boss";
export type RulesetVersion = "prototype-0.3";
export type GameStatus = "waiting" | "active" | "finished";
export type WinReason = "center" | "bosses" | "pieces";

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
  scoreEarned: number;
};

export type GameState = {
  rulesetVersion: RulesetVersion;
  turn: PlayerColor;
  moveNumber: number;
  pieces: GamePiece[];
  scores: Record<PlayerColor, number>;
  lastMove: GameMove | null;
  winner: PlayerColor | null;
  winReason: WinReason | null;
};

export type PublicPlayer = {
  color: PlayerColor;
  displayName: string;
  kind: PlayerKind;
};

export type PublicGame = {
  code: string;
  analyticsMatchId: string;
  status: GameStatus;
  version: number;
  state: GameState;
  players: PublicPlayer[];
  viewerColor: PlayerColor | null;
  botDifficulty: BotDifficulty | null;
  rematch: {
    requestedBy: PlayerColor;
    gameCode: string | null;
    analyticsMatchId: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicGameMove = {
  moveNumber: number;
  playerColor: PlayerColor;
  pieceId: string;
  from: Coordinate;
  to: Coordinate;
  capturedCount: number;
  createdAt: Date;
};

export type PublicGameHistory = {
  game: PublicGame;
  moves: PublicGameMove[];
};
