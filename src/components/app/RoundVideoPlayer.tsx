import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  detectVideoType,
  extractYouTubeId,
  extractVimeoId,
  getVideoEmbedUrl,
} from "@/lib/videoUtils";

interface RoundVideoPlayerProps {
  url: string;
  title?: string;
  /** Fallback poster when the platform gives no thumbnail (e.g. Vimeo) */
  posterUrl?: string | null;
}

/**
 * Clean, iOS-style video player: shows a poster with a frosted play button,
 * then swaps to the real player (autoplaying) on tap.
 */
export function RoundVideoPlayer({ url, title, posterUrl }: RoundVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  const videoType = detectVideoType(url);
  const youtubeId = videoType === "youtube" ? extractYouTubeId(url) : null;
  const vimeoId = videoType === "vimeo" ? extractVimeoId(url) : null;

  const poster =
    (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg` : null) ||
    posterUrl ||
    null;

  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
      : getVideoEmbedUrl(url, videoType, true);

  const isDirect = !embedUrl;

  return (
    <Card className="overflow-hidden rounded-2xl border-0 shadow-ios-raised bg-card-warm">
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden bg-black">
          {playing || (!poster && !isDirect) ? (
            isDirect ? (
              <video
                src={url}
                controls
                autoPlay={playing}
                playsInline
                poster={poster || undefined}
                className="h-full w-full object-contain"
              />
            ) : (
              <iframe
                src={embedUrl || url}
                title={title || "Video"}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label="Play video"
              className="group relative block h-full w-full"
            >
              {poster ? (
                <img
                  src={poster}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (youtubeId && !img.src.includes("hqdefault")) {
                      img.src = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
                    }
                  }}
                  alt={title || "Video"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-black" />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-black/10 transition group-active:from-black/55" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/90 shadow-ios-raised backdrop-blur-md transition group-active:scale-95">
                  <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-brand">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
              {title && (
                <span className="absolute bottom-0 left-0 right-0 px-4 pb-3 text-start">
                  <span className="line-clamp-2 text-sm font-semibold text-white drop-shadow">
                    {title}
                  </span>
                </span>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RoundVideoPlayer;
