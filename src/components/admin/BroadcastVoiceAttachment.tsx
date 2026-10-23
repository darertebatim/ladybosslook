import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Mic, Square, Upload, X, Loader2, Play, Pause, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useChatAttachmentUrl } from '@/hooks/useChatAttachmentUrl';

export interface VoiceAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface Props {
  value: VoiceAttachment | null;
  onChange: (v: VoiceAttachment | null) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}

// AAC-in-MP4 first: it plays on every iPhone. Voice-only bitrate keeps files small
// (~0.25 MB per minute instead of several MB).
const VOICE_BITRATE = 32000;

function pickMime(): string {
  return ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
    .find((mime) => MediaRecorder.isTypeSupported(mime)) || '';
}

function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
}

export function BroadcastVoiceAttachment({ value, onChange, onBusyChange, disabled = false }: Props) {
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedRef = useRef(0);
  const mountedRef = useRef(true);
  const versionRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Stored URLs are identifiers for a PRIVATE bucket, not playable public URLs.
  const signedUrl = useChatAttachmentUrl(value?.url);
  const playbackUrl = localUrl || signedUrl;
  const pending = starting || recording || uploading || (!!localFile && !value);

  useEffect(() => { onBusyChange?.(pending); }, [pending, onBusyChange]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      versionRef.current += 1;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl); }, [localUrl]);
  useEffect(() => {
    if (!value && !pending) {
      setLocalUrl(null);
      setLocalFile(null);
      setDuration(0);
      setPosition(0);
      setPlaying(false);
    }
  }, [value, pending]);

  const upload = async (file: File) => {
    const version = ++versionRef.current;
    setUploading(true);
    setUploadError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Please sign in again, then retry. Your recording is still here.');
      const ext = file.name.split('.').pop() || 'm4a';
      const path = `${user.id}/broadcast-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('chat-attachments').upload(path, file, { contentType: file.type });
      if (error) throw error;
      if (!mountedRef.current || version !== versionRef.current) return;
      const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
      // Persist the existing stable URL format; resolve signed URLs only for playback.
      onChange({ url: data.publicUrl, name: file.name, type: file.type.split(';')[0] || 'audio/mpeg', size: file.size });
    } catch (error: unknown) {
      if (mountedRef.current && version === versionRef.current) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed. Your audio is saved here; please retry.');
      }
    } finally {
      if (mountedRef.current && version === versionRef.current) setUploading(false);
    }
  };

  const acceptFile = (file: File, recordedDuration = 0) => {
    if (!file.size) { setUploadError('The recording was empty. Please record again.'); return; }
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|webm|mp4)$/i.test(file.name)) {
      setUploadError('Please choose an audio file.'); return;
    }
    audioRef.current?.pause();
    onChange(null);
    setLocalFile(file);
    setLocalUrl(URL.createObjectURL(file));
    setDuration(recordedDuration);
    setPosition(0);
    setPlaying(false);
    setPlayError(null);
    void upload(file);
  };

  const start = async () => {
    setStarting(true);
    setUploadError(null);
    try {
      if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Recording is unavailable in this browser. Please upload an audio file.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (!mountedRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      const mime = pickMime();
      const recorder = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: VOICE_BITRATE });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (!mountedRef.current) return;
        const elapsed = (performance.now() - startedRef.current) / 1000;
        const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        acceptFile(new File(chunks, `voice-message.${ext}`, { type }), elapsed);
      };
      recorderRef.current = recorder;
      startedRef.current = performance.now();
      recorder.start(250);
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds(Math.floor((performance.now() - startedRef.current) / 1000)), 250);
    } catch (error: unknown) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setUploadError(error instanceof Error && error.name !== 'NotAllowedError'
        ? error.message : 'Microphone access was denied. Allow access or upload an audio file.');
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  };

  const stop = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setRecording(false);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const remove = () => {
    versionRef.current += 1;
    audioRef.current?.pause();
    setLocalUrl(null);
    setLocalFile(null);
    setUploadError(null);
    setPlayError(null);
    setDuration(0);
    setPosition(0);
    setPlaying(false);
    setUploading(false);
    onChange(null);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    setPlayError(null);
    try { await audio.play(); }
    catch { setPlayError('This audio could not play. Try again or replace it with an MP3/M4A file.'); }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2"><Mic className="h-4 w-4 text-primary" /> Voice message <span className="font-normal text-muted-foreground">(optional)</span></Label>
      <div className="rounded-lg bg-muted/40 p-3 sm:p-4 space-y-3">
        {localFile || value ? (
          <>
            <div className="flex items-center gap-3">
              <Button type="button" size="icon" className="h-12 w-12 shrink-0 rounded-full" disabled={!playbackUrl} onClick={togglePlay} aria-label={playing ? 'Pause voice preview' : 'Play voice preview'} title={playing ? 'Pause' : 'Play preview'}>
                {!playbackUrl ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium">{localFile?.name || value?.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {uploading ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</> : uploadError ? <><AlertCircle className="h-3 w-3 text-destructive" /> Not attached</> : <><Check className="h-3 w-3 text-primary" /> Attached</>}
                  <span>· {Math.max(1, Math.round((localFile?.size || value?.size || 0) / 1024))} KB</span>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={remove} disabled={disabled} aria-label="Remove voice" title="Remove voice"><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-10 text-xs tabular-nums">{formatTime(position)}</span>
              <Slider aria-label="Voice preview position" className="min-h-10 flex-1" value={[position]} max={duration || 1} step={0.1} disabled={!duration} onValueChange={([time]) => {
                const audio = audioRef.current;
                if (audio && Number.isFinite(time)) { audio.currentTime = time; setPosition(time); }
              }} />
              <span className="w-10 text-right text-xs tabular-nums">{formatTime(duration)}</span>
            </div>
            {playbackUrl && <audio ref={audioRef} src={playbackUrl} preload="metadata" onLoadedMetadata={(event) => {
              const length = event.currentTarget.duration;
              if (Number.isFinite(length) && length > 0) setDuration(length);
            }} onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setPosition(0); if (audioRef.current) audioRef.current.currentTime = 0; }} onError={() => { setPlaying(false); setPlayError('Audio could not load. Retry playback or replace the file.'); }} />}
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {recording ? <>
              <span className="flex items-center gap-2 text-sm font-medium text-destructive"><span className="h-2 w-2 rounded-full bg-destructive" /> Recording <span className="tabular-nums">{formatTime(seconds)}</span></span>
              <Button type="button" variant="destructive" className="min-h-11" onClick={stop}><Square className="mr-2 h-4 w-4" /> Stop recording</Button>
            </> : <Button type="button" variant="outline" className="min-h-11" onClick={start} disabled={disabled || starting || uploading}>
              {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}{starting ? 'Connecting microphone…' : 'Record voice'}
            </Button>}
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => fileRef.current?.click()} disabled={disabled || recording || starting || uploading}><Upload className="mr-2 h-4 w-4" /> Upload audio</Button>
          </div>
        )}
        {(uploadError || playError) && <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /><span className="flex-1">{uploadError || playError}</span>
          {uploadError && localFile && <Button type="button" variant="outline" className="min-h-10" disabled={uploading || disabled} onClick={() => void upload(localFile)}><RotateCcw className="mr-2 h-4 w-4" /> Retry upload</Button>}
        </div>}
      </div>
      <input ref={fileRef} type="file" accept="audio/*,.m4a,.mp3" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) acceptFile(file); event.target.value = ''; }} />
    </div>
  );
}
