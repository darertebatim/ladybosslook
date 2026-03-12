/**
 * Plays a "swoosh + ding" completion sound using Web Audio API.
 * No external audio files needed.
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended (iOS requirement)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playCompletionSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // --- Swoosh (noise burst with bandpass filter) ---
    const swooshDuration = 0.15;
    const bufferSize = ctx.sampleRate * swooshDuration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // fade out
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const swooshFilter = ctx.createBiquadFilter();
    swooshFilter.type = 'bandpass';
    swooshFilter.frequency.setValueAtTime(2000, now);
    swooshFilter.frequency.exponentialRampToValueAtTime(6000, now + swooshDuration);
    swooshFilter.Q.value = 1.5;

    const swooshGain = ctx.createGain();
    swooshGain.gain.setValueAtTime(0.12, now);
    swooshGain.gain.exponentialRampToValueAtTime(0.001, now + swooshDuration);

    noiseSource.connect(swooshFilter);
    swooshFilter.connect(swooshGain);
    swooshGain.connect(ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + swooshDuration);

    // --- Ding (two-tone chime) ---
    const dingStart = now + 0.08;
    const dingDuration = 0.35;

    // First tone (higher)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 1200;
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.18, dingStart);
    gain1.gain.exponentialRampToValueAtTime(0.001, dingStart + dingDuration);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(dingStart);
    osc1.stop(dingStart + dingDuration);

    // Second tone (harmonic, slightly delayed)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1800;
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.09, dingStart + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, dingStart + dingDuration + 0.05);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(dingStart + 0.03);
    osc2.stop(dingStart + dingDuration + 0.05);
  } catch (e) {
    // Silently fail - sound is non-critical
    console.warn('[completionSound] Failed to play:', e);
  }
}
