let audioCtx: AudioContext | null = null;
let isMuted = false;

// Initialize mute state from localStorage
try {
  const saved = localStorage.getItem('puzzle_sound_muted');
  if (saved !== null) {
    isMuted = JSON.parse(saved);
  }
} catch {
  // localStorage might be unavailable
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean): void {
  isMuted = muted;
  try {
    localStorage.setItem('puzzle_sound_muted', JSON.stringify(muted));
  } catch {
    // Ignore error
  }
}

export function getSoundMuted(): boolean {
  return isMuted;
}

/**
 * Snappy click when a puzzle piece snaps into the correct position
 */
export function playSnapSound(): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);

  // Secondary soft chime
  const chime = ctx.createOscillator();
  const chimeGain = ctx.createGain();
  chime.type = 'sine';
  chime.frequency.setValueAtTime(880, now + 0.02);
  chime.frequency.exponentialRampToValueAtTime(1046, now + 0.12);

  chimeGain.gain.setValueAtTime(0.15, now + 0.02);
  chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  chime.connect(chimeGain);
  chimeGain.connect(ctx.destination);

  chime.start(now + 0.02);
  chime.stop(now + 0.14);
}

/**
 * Gentle click when selecting a piece in swap mode
 */
export function playSelectSound(): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.07);
}

/**
 * Whoosh/tone when swapping two pieces
 */
export function playSwapSound(): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // First tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(440, now);
  osc1.frequency.exponentialRampToValueAtTime(587.33, now + 0.1);
  gain1.gain.setValueAtTime(0.18, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.12);

  // Second tone
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(587.33, now + 0.07);
  osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
  gain2.gain.setValueAtTime(0.15, now + 0.07);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.07);
  osc2.stop(now + 0.2);
}

/**
 * Victory fanfare when puzzle is completed
 */
export function playVictorySound(): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0, dur: 0.18 }, // C5
    { freq: 659.25, time: 0.14, dur: 0.18 }, // E5
    { freq: 783.99, time: 0.28, dur: 0.22 }, // G5
    { freq: 1046.5, time: 0.44, dur: 0.5 }, // C6
  ];

  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(n.freq, now + n.time);

    gain.gain.setValueAtTime(0.24, now + n.time);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + n.time);
    osc.stop(now + n.time + n.dur);
  });
}
