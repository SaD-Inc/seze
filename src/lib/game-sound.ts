let audioContext: AudioContext | null = null;

export type SoundedMove = { code: string; moveNumber: number } | null;
export type GameSoundKind = "move" | "capture";

export function gameSoundForMove(capturedPieces: number): GameSoundKind {
  return capturedPieces > 0 ? "capture" : "move";
}

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

type MarbleImpact = {
  at: number;
  gain: number;
  resonance: number;
  body: number;
};

function playMarbleImpact(context: AudioContext, impact: MarbleImpact) {
  const duration = 0.075;
  const frameCount = Math.ceil(context.sampleRate * duration);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    const progress = index / frameCount;
    const envelope = (1 - progress) ** 4;
    samples[index] = (Math.random() * 2 - 1) * envelope;
  }

  const noise = context.createBufferSource();
  const highPass = context.createBiquadFilter();
  const resonator = context.createBiquadFilter();
  const clickGain = context.createGain();
  const bodyTone = context.createOscillator();
  const bodyGain = context.createGain();

  noise.buffer = buffer;
  highPass.type = "highpass";
  highPass.frequency.setValueAtTime(520, impact.at);
  resonator.type = "bandpass";
  resonator.frequency.setValueAtTime(impact.resonance, impact.at);
  resonator.Q.setValueAtTime(2.8, impact.at);

  clickGain.gain.setValueAtTime(0.0001, impact.at);
  clickGain.gain.exponentialRampToValueAtTime(impact.gain, impact.at + 0.002);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, impact.at + duration);

  bodyTone.type = "sine";
  bodyTone.frequency.setValueAtTime(impact.body, impact.at);
  bodyTone.frequency.exponentialRampToValueAtTime(
    impact.body * 0.72,
    impact.at + 0.055,
  );
  bodyGain.gain.setValueAtTime(0.0001, impact.at);
  bodyGain.gain.exponentialRampToValueAtTime(
    impact.gain * 0.3,
    impact.at + 0.003,
  );
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, impact.at + 0.06);

  noise.connect(highPass);
  highPass.connect(resonator);
  resonator.connect(clickGain);
  clickGain.connect(context.destination);
  bodyTone.connect(bodyGain);
  bodyGain.connect(context.destination);

  noise.start(impact.at);
  noise.stop(impact.at + duration);
  bodyTone.start(impact.at);
  bodyTone.stop(impact.at + 0.06);

  noise.addEventListener(
    "ended",
    () => {
      noise.disconnect();
      highPass.disconnect();
      resonator.disconnect();
      clickGain.disconnect();
      bodyTone.disconnect();
      bodyGain.disconnect();
    },
    { once: true },
  );
}

export async function playMoveSound(capturedPieces = 0) {
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
  const soundKind = gameSoundForMove(capturedPieces);
  playMarbleImpact(context, {
    at: startedAt,
    gain: soundKind === "capture" ? 0.16 : 0.1,
    resonance: soundKind === "capture" ? 1_180 : 1_760,
    body: soundKind === "capture" ? 112 : 176,
  });

  if (soundKind === "capture") {
    playMarbleImpact(context, {
      at: startedAt + 0.045,
      gain: Math.min(0.18, 0.11 + capturedPieces * 0.018),
      resonance: 860,
      body: 82,
    });
  }
}
