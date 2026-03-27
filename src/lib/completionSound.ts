/**
 * Plays an Apple-style "cha-ching" completion sound using Web Audio API.
 * Warm, satisfying two-tone ping — lower register for a pleasing feel.
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

    const master = ctx.createGain();
    master.gain.value = 0.2;
    master.connect(ctx.destination);

    // --- "Cha" — short tap (E5 ~659 Hz) ---
    const cha = ctx.createOscillator();
    cha.type = 'square';
    cha.frequency.value = 659;
    const chaGain = ctx.createGain();
    chaGain.gain.setValueAtTime(0, now);
    chaGain.gain.linearRampToValueAtTime(0.5, now + 0.01);
    chaGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    cha.connect(chaGain);
    chaGain.connect(master);
    cha.start(now);
    cha.stop(now + 0.09);

    // --- Metallic harmonic on "cha" (E6 overtone) ---
    const chaHarm = ctx.createOscillator();
    chaHarm.type = 'sine';
    chaHarm.frequency.value = 1318;
    const chaHarmGain = ctx.createGain();
    chaHarmGain.gain.setValueAtTime(0, now);
    chaHarmGain.gain.linearRampToValueAtTime(0.15, now + 0.008);
    chaHarmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    chaHarm.connect(chaHarmGain);
    chaHarmGain.connect(master);
    chaHarm.start(now);
    chaHarm.stop(now + 0.07);

    // --- "Ching" — resonant ring (A5 ~880 Hz) ---
    const ching = ctx.createOscillator();
    ching.type = 'sine';
    ching.frequency.value = 880;
    const chingGain = ctx.createGain();
    chingGain.gain.setValueAtTime(0, now + 0.1);
    chingGain.gain.linearRampToValueAtTime(0.65, now + 0.11);
    chingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    ching.connect(chingGain);
    chingGain.connect(master);
    ching.start(now + 0.1);
    ching.stop(now + 0.6);

    // --- Shimmer overtone (A6 ~1760 Hz) ---
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 1760;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, now + 0.1);
    shimmerGain.gain.linearRampToValueAtTime(0.12, now + 0.11);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start(now + 0.1);
    shimmer.stop(now + 0.45);

    // --- Sub-bass thud (A3 ~220 Hz) ---
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.value = 220;
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0, now);
    thudGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    thud.connect(thudGain);
    thudGain.connect(master);
    thud.start(now);
    thud.stop(now + 0.15);

  } catch (e) {
    console.warn('[completionSound] Failed to play:', e);
  }
}
