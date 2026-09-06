import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, ExternalLink, Loader2, Headphones, FileText } from 'lucide-react';
import { detectVideoType, extractYouTubeId, extractVimeoId, extractGoogleDriveId, getVideoPlatformLabel, isVerticalVideo } from '@/lib/videoUtils';
import { smartOpenUrl } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Video — plays inline inside the lesson page (no full-screen sheet)  */
/* ------------------------------------------------------------------ */

export function LessonVideo({
  url,
  poster,
  title,
  isVertical,
  onStarted,
}: {
  url: string;
  poster?: string | null;
  title?: string;
  isVertical?: boolean | null;
  onStarted?: () => void;
}) {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const type = detectVideoType(url);
  const vertical = isVertical ?? isVerticalVideo(url);

  const embedUrl = useMemo(() => {
    if (type === 'youtube') {
      const id = extractYouTubeId(url);
      return id
        ? `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
        : null;
    }
    if (type === 'vimeo') {
      const id = extractVimeoId(url);
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&playsinline=1` : null;
    }
    if (type === 'instagram') {
      const m = url.match(/instagram\.com\/(?:reel|p|reels)\/([^/?#]+)/i);
      return m ? `https://www.instagram.com/p/${m[1]}/embed/` : null;
    }
    if (type === 'gdrive') {
      const id = extractGoogleDriveId(url);
      return id ? `https://drive.google.com/file/d/${id}/preview` : null;
    }
    return null;
  }, [type, url]);

  const frameClass = vertical
    ? 'relative w-full max-w-[320px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-black'
    : 'relative w-full aspect-video rounded-2xl overflow-hidden bg-black';

  const start = () => {
    setStarted(true);
    onStarted?.();
  };

  if (type === 'direct') {
    return (
      <div className={frameClass}>
        <video
          src={url}
          poster={poster || undefined}
          controls
          playsInline
          preload="metadata"
          onPlay={onStarted}
          className="w-full h-full object-contain bg-black"
        />
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <button
        onClick={() => smartOpenUrl(url, navigate)}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-peach text-fg-warm font-semibold py-3.5 min-h-[48px] active:scale-[0.98] transition-transform"
      >
        <ExternalLink className="h-4 w-4 text-brand" />
        Watch on {getVideoPlatformLabel(type)}
      </button>
    );
  }

  return (
    <div className={frameClass}>
      {started ? (
        <iframe
          src={embedUrl}
          title={title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="w-full h-full border-0"
        />
      ) : (
        <button onClick={start} className="absolute inset-0 active:opacity-90 transition-opacity">
          {poster ? (
            <img src={poster} alt={title || ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-orange" />
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-16 h-16 rounded-full bg-white/95 shadow-ios flex items-center justify-center">
              <Play className="h-7 w-7 text-brand fill-brand ml-0.5" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Audio — cover art + inline transport (does not use global player)   */
/* ------------------------------------------------------------------ */

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export function LessonAudio({
  url,
  cover,
  title,
  durationSeconds,
  onStarted,
}: {
  url: string;
  cover?: string | null;
  title?: string;
  durationSeconds?: number | null;
  onStarted?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);

  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(durationSeconds || 0);
  }, [url, durationSeconds]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      setLoading(true);
      el.play().then(() => onStarted?.()).catch(() => setLoading(false));
    } else {
      el.pause();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const v = Number(e.target.value);
    el.currentTime = v;
    setCurrent(v);
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-background">
      <div className="relative w-full aspect-square bg-peach">
        {cover ? (
          <img src={cover} alt={title || ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-orange flex items-center justify-center">
            <Headphones className="h-10 w-10 text-white" />
          </div>
        )}
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="absolute inset-0 flex items-center justify-center active:opacity-90 transition-opacity"
        >
          <span className="w-16 h-16 rounded-full bg-white/95 shadow-ios flex items-center justify-center">
            {loading && !playing ? (
              <Loader2 className="h-6 w-6 text-brand animate-spin" />
            ) : playing ? (
              <Pause className="h-7 w-7 text-brand fill-brand" />
            ) : (
              <Play className="h-7 w-7 text-brand fill-brand ml-0.5" />
            )}
          </span>
        </button>
      </div>

      <div className="p-3 space-y-1.5">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(current, duration || 0)}
          onChange={seek}
          className="w-full accent-[hsl(var(--brand-primary))]"
          aria-label="Seek"
        />
        <div className="flex items-center justify-between text-xs text-fg-warm-muted">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => { setPlaying(true); setLoading(false); }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || durationSeconds || 0)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        className="hidden"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PDF — rendered inside the app, with an open/download fallback        */
/* ------------------------------------------------------------------ */

export function LessonPdf({ url, title }: { url: string; title?: string }) {
  const navigate = useNavigate();
  const [useViewer, setUseViewer] = useState(true);

  // Mobile browsers / native webviews can't render a PDF in an iframe,
  // so route those through Google's document viewer.
  const isMobile = typeof navigator !== 'undefined' && /iphone|ipad|ipod|android/i.test(navigator.userAgent);
  const src = useViewer && isMobile
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
    : `${url}#view=FitH`;

  return (
    <div className="space-y-2">
      <div className="w-full h-[65vh] min-h-[380px] rounded-2xl overflow-hidden bg-background">
        <iframe
          src={src}
          title={title || 'PDF'}
          className="w-full h-full border-0"
          onError={() => setUseViewer(false)}
        />
      </div>
      <button
        onClick={() => smartOpenUrl(url, navigate)}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-full bg-peach text-fg-warm font-semibold py-3.5 min-h-[48px]',
          'active:scale-[0.98] transition-transform'
        )}
      >
        <FileText className="h-4 w-4 text-brand" />
        Open / download file
      </button>
    </div>
  );
}
