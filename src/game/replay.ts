import { applyMove, createInitialState } from "~/game/rules";
import type { GameState, PublicGameMove } from "~/game/types";

export class InvalidReplayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidReplayError";
  }
}

export function buildReplayStates(
  moves: readonly PublicGameMove[],
): GameState[] {
  const states = [createInitialState()];

  for (const move of moves) {
    const current = states.at(-1);
    if (!current) throw new InvalidReplayError("Replay has no opening state.");
    if (move.moveNumber !== current.moveNumber + 1) {
      throw new InvalidReplayError(
        `Expected move ${current.moveNumber + 1}, received ${move.moveNumber}.`,
      );
    }

    states.push(applyMove(current, move.pieceId, move.to));
  }

  return states;
}
