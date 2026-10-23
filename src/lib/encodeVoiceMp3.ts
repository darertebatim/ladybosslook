// Re-encode any browser-decodable audio into mono MP3.
// Chrome's MediaRecorder writes Opus inside MP4 even when labeled "audio/mp4", which iPhones
// cannot play. MP3 plays on every iPhone/Android/browser, so broadcast voice notes always use it.
import { Mp3Encoder } from '@breezystack/lamejs';

const KBPS = 48;
const BLOCK = 1152;

export async function encodeVoiceMp3(input: Blob, name = 'voice-message.mp3'): Promise<File> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await input.arrayBuffer());
  } finally {
    void ctx.close();
  }

  const length = decoded.length;
  const mono = new Float32Array(length);
  for (let c = 0; c < decoded.numberOfChannels; c++) {
    const data = decoded.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += data[i] / decoded.numberOfChannels;
  }

  const encoder = new Mp3Encoder(1, decoded.sampleRate, KBPS);
  const parts: Uint8Array[] = [];
  const block = new Int16Array(BLOCK);
  for (let i = 0, n = 0; i < length; i += BLOCK, n++) {
    const end = Math.min(i + BLOCK, length);
    const chunk = end - i === BLOCK ? block : new Int16Array(end - i);
    for (let j = i; j < end; j++) {
      const s = Math.max(-1, Math.min(1, mono[j]));
      chunk[j - i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const out = encoder.encodeBuffer(chunk);
    if (out.length) parts.push(out.slice());
    // Yield now and then so the page stays responsive on long recordings.
    if (n % 400 === 399) await new Promise((r) => setTimeout(r, 0));
  }
  const tail = encoder.flush();
  if (tail.length) parts.push(tail.slice());

  return new File(parts as BlobPart[], name.replace(/\.[^.]+$/, '') + '.mp3', { type: 'audio/mpeg' });
}
