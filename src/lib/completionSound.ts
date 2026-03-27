/**
 * Plays a warm, satisfying completion chime using Web Audio API.
 * Two-note rising tone with gentle reverb tail — feels rewarding, not rushed.
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playCompletionSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master gain
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);

    // --- Note 1: warm low tone (C6 ~523 Hz) ---
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 523;
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.7, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(master);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // --- Note 2: bright high tone (E6 ~659 Hz), slightly delayed ---
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 659;
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.6, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);

    // --- Note 3: sparkle top (G6 ~784 Hz), subtle shimmer ---
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 784;
    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0, now + 0.22);
    gain3.gain.linearRampToValueAtTime(0.35, now + 0.26);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc3.connect(gain3);
    gain3.connect(master);
    osc3.start(now + 0.22);
    osc3.stop(now + 0.75);

    // --- Soft harmonic overtone on note 1 for warmth ---
    const overtone = ctx.createOscillator();
    overtone.type = 'triangle';
    overtone.frequency.value = 1046; // C7 octave above
    const gainOT = ctx.createGain();
    gainOT.gain.setValueAtTime(0, now);
    gainOT.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gainOT.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    overtone.connect(gainOT);
    gainOT.connect(master);
    overtone.start(now);
    overtone.stop(now + 0.4);

  } catch (e) {
    console.warn('[completionSound] Failed to play:', e);
  }
}
