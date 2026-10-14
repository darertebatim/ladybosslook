import { useState } from 'react';
import { detectVideoType, extractYouTubeId, getVideoThumbnail, getVideoEmbedUrl } from '@/lib/videoUtils';

export function resolveSuccessVideo(rawUrl: string): { type: 'direct' | 'embed'; url: string } | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    const type = detectVideoType(parsed.href);
    if (type === 'direct') return { type: 'direct', url: parsed.href };
    const supportedHost = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'vimeo.com', 'www.vimeo.com', 'player.vimeo.com', 'drive.google.com'].includes(host);
    if (!supportedHost) return null;
    const embedUrl = getVideoEmbedUrl(parsed.href, type);
    return embedUrl ? { type: 'embed', url: embedUrl } : null;
  } catch {
    return null;
  }
}

export function PaymentSuccessVideo({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);

  const video = resolveSuccessVideo(url);
  const videoType = detectVideoType(url);
  const youtubeId = videoType === 'youtube' ? extractYouTubeId(url) : null;
  const thumbnail = getVideoThumbnail(url, videoType);

  if (!video) return null;

  return (
    <section className="mt-7 text-foreground" aria-label="Program welcome video">
      <h2 className="mb-3 text-base font-bold">ویدیوی راهنمای شروع / Getting started</h2>
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-card shadow-ios">
        {playing || !thumbnail ? (
          video.type === 'direct' ? (
            <video src={video.url} controls playsInline preload="metadata" autoPlay={playing} className="h-full w-full" aria-label="Program welcome video" />
          ) : (
            <iframe src={video.url} title="Program welcome video" className="h-full w-full border-0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
          )
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play video"
            className="group relative block h-full w-full"
          >
            <img
              src={thumbnail}
              onError={(e) => {
                const img = e.currentTarget;
                if (youtubeId && !img.src.includes('hqdefault')) {
                  img.src = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
                }
              }}
              alt="Program welcome video"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-black/10 transition group-active:from-black/55" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-ios-raised backdrop-blur-md transition group-active:scale-95">
                <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-brand">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
