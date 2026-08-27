import { EventEmitter } from "node:events";

const globalForGameEvents = globalThis as unknown as {
  sezeGameEvents?: EventEmitter;
};

export const gameEvents =
  globalForGameEvents.sezeGameEvents ?? new EventEmitter();

gameEvents.setMaxListeners(0);

if (process.env.NODE_ENV !== "production") {
  globalForGameEvents.sezeGameEvents = gameEvents;
}

export function emitGameChanged(code: string): void {
  gameEvents.emit("changed", code);
}
