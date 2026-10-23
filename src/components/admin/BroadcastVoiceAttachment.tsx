import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mic, Square, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VoiceAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface Props {
  value: VoiceAttachment | null;
  onChange: (v: VoiceAttachment | null) => void;
}

function pickMime(): string {
  const options = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'];
  for (const m of options) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

export function BroadcastVoiceAttachment({ value, onChange }: Props) {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const ext = file.name.split('.').pop() || 'm4a';
      const path = `${user.id}/broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('chat-attachments').upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
      onChange({ url: data.publicUrl, name: file.name, type: file.type || 'audio/mpeg', size: file.size });
    } catch (e: any) {
      toast({ title: 'Voice upload failed', description: e?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = (rec.mimeType || 'audio/webm').split(';')[0];
        const ext = type.includes('mp4') || type.includes('aac') ? 'm4a' : 'webm';
        const blob = new Blob(chunksRef.current, { type });
        upload(new File([blob], `voice-message.${ext}`, { type }));
      };
      rec.start();
      recorderRef.current = rec;
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast({ title: 'Microphone unavailable', description: 'Allow microphone access or upload an audio file.', variant: 'destructive' });
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const fmt = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-2">
      <Label>Voice message (optional)</Label>
      {value ? (
        <div className="flex items-center gap-2 rounded-md border p-2">
          <audio src={value.url} controls className="h-10 flex-1" />
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Remove voice">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {recording ? (
            <Button type="button" variant="destructive" onClick={stop}>
              <Square className="mr-2 h-4 w-4" /> Stop ({fmt})
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={start} disabled={uploading}>
              <Mic className="mr-2 h-4 w-4" /> Record
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={recording || uploading}>
            <Upload className="mr-2 h-4 w-4" /> Upload audio
          </Button>
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.m4a,.mp3"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }}
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">Plays in each student's support chat. MP3/M4A work best on iPhone.</p>
    </div>
  );
}
