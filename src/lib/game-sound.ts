let audioContext: AudioContext | null = null;

export type SoundedMove = { code: string; moveNumber: number } | null;

export function advanceSoundedMove(
  previous: SoundedMove,
  code: string,
  moveNumber: number,
) {
  const current = { code, moveNumber };

  if (!previous || previous.code !== code) {
    return { next: current, shouldPlay: false };
  }
  if (moveNumber <= previous.moveNumber) {
    return { next: previous, shouldPlay: false };
  }

  return { next: current, shouldPlay: true };
}

function getAudioContext() {
  if (typeof window === "undefined") return null;

  try {
    audioContext ??= new AudioContext();
    return audioContext;
  } catch {
    return null;
  }
}

export function primeGameAudio() {
  const context = getAudioContext();
  if (context?.state === "suspended") {
    void context.resume().catch(() => undefined);
  }
}

export async function playMoveSound() {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  if (context.state !== "running") return;

  const startedAt = context.currentTime;
  const output = context.createGain();
  const tone = context.createOscillator();

  output.gain.setValueAtTime(0.0001, startedAt);
  output.gain.exponentialRampToValueAtTime(0.13, startedAt + 0.003);
  output.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.09);

  tone.type = "triangle";
  tone.frequency.setValueAtTime(185, startedAt);
  tone.frequency.exponentialRampToValueAtTime(105, startedAt + 0.075);
  tone.connect(output);
  output.connect(context.destination);
  tone.start(startedAt);
  tone.stop(startedAt + 0.09);

  tone.addEventListener("ended", () => output.disconnect(), { once: true });
}
