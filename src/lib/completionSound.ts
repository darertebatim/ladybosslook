/**
 * Plays an Apple-style "cha-ching" completion sound using Web Audio API.
 * Bright, metallic two-tone ping — like a cash register / payment confirmed.
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

    // --- "Cha" — short metallic tap (A6 ~1760 Hz) ---
    const cha = ctx.createOscillator();
    cha.type = 'square';
    cha.frequency.value = 1760;
    const chaGain = ctx.createGain();
    chaGain.gain.setValueAtTime(0, now);
    chaGain.gain.linearRampToValueAtTime(0.6, now + 0.008);
    chaGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    cha.connect(chaGain);
    chaGain.connect(master);
    cha.start(now);
    cha.stop(now + 0.08);

    // --- Metallic harmonic on "cha" ---
    const chaHarm = ctx.createOscillator();
    chaHarm.type = 'sine';
    chaHarm.frequency.value = 3520; // A7 overtone
    const chaHarmGain = ctx.createGain();
    chaHarmGain.gain.setValueAtTime(0, now);
    chaHarmGain.gain.linearRampToValueAtTime(0.2, now + 0.006);
    chaHarmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    chaHarm.connect(chaHarmGain);
    chaHarmGain.connect(master);
    chaHarm.start(now);
    chaHarm.stop(now + 0.06);

    // --- "Ching" — bright resonant ring (E7 ~2637 Hz), delayed ---
    const ching = ctx.createOscillator();
    ching.type = 'sine';
    ching.frequency.value = 2637;
    const chingGain = ctx.createGain();
    chingGain.gain.setValueAtTime(0, now + 0.09);
    chingGain.gain.linearRampToValueAtTime(0.7, now + 0.1);
    chingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    ching.connect(chingGain);
    chingGain.connect(master);
    ching.start(now + 0.09);
    ching.stop(now + 0.55);

    // --- "Ching" shimmer overtone (E8 ~5274 Hz) ---
    const chingShimmer = ctx.createOscillator();
    chingShimmer.type = 'sine';
    chingShimmer.frequency.value = 5274;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, now + 0.09);
    shimmerGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    chingShimmer.connect(shimmerGain);
    shimmerGain.connect(master);
    chingShimmer.start(now + 0.09);
    chingShimmer.stop(now + 0.4);

    // --- Sub-bass thud for weight (A4 ~220 Hz) ---
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.value = 220;
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0, now);
    thudGain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thud.connect(thudGain);
    thudGain.connect(master);
    thud.start(now);
    thud.stop(now + 0.12);

  } catch (e) {
    console.warn('[completionSound] Failed to play:', e);
  }
}
