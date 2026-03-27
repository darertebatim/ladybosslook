/**
 * Plays an Apple Pay–style success chime using Web Audio API.
 * Soft, warm double-tap with a gentle resonant tail.
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
    master.gain.value = 0.18;
    master.connect(ctx.destination);

    // --- Tap 1: Soft muted "tick" (G5 ~784 Hz) ---
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 784;
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.8, now + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(master);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Tap 1 harmonic — adds body
    const h1 = ctx.createOscillator();
    h1.type = 'triangle';
    h1.frequency.value = 1568; // G6 octave
    const gh1 = ctx.createGain();
    gh1.gain.setValueAtTime(0, now);
    gh1.gain.linearRampToValueAtTime(0.2, now + 0.008);
    gh1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    h1.connect(gh1);
    gh1.connect(master);
    h1.start(now);
    h1.stop(now + 0.1);

    // --- Tap 2: Brighter confirmation (B5 ~988 Hz), quick follow ---
    const delay = 0.09;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 988;
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now + delay);
    gain2.gain.linearRampToValueAtTime(0.9, now + delay + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(now + delay);
    osc2.stop(now + delay + 0.25);

    // Tap 2 harmonic — shimmer
    const h2 = ctx.createOscillator();
    h2.type = 'triangle';
    h2.frequency.value = 1976; // B6 octave
    const gh2 = ctx.createGain();
    gh2.gain.setValueAtTime(0, now + delay);
    gh2.gain.linearRampToValueAtTime(0.15, now + delay + 0.008);
    gh2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
    h2.connect(gh2);
    gh2.connect(master);
    h2.start(now + delay);
    h2.stop(now + delay + 0.18);

    // --- Gentle resonant tail (D6 ~1175 Hz) — the "confirmed" ring ---
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 1175;
    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0, now + delay + 0.06);
    gain3.gain.linearRampToValueAtTime(0.25, now + delay + 0.1);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);
    osc3.connect(gain3);
    gain3.connect(master);
    osc3.start(now + delay + 0.06);
    osc3.stop(now + delay + 0.5);

  } catch (e) {
    console.warn('[completionSound] Failed to play:', e);
  }
}
