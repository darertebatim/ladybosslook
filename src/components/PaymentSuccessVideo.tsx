import { detectVideoType, getVideoEmbedUrl } from '@/lib/videoUtils';

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
  const video = resolveSuccessVideo(url);
  if (!video) return null;

  return (
    <section className="mt-7 text-foreground" aria-label="Program welcome video">
      <h2 className="mb-3 text-base font-bold">ویدیوی راهنمای شروع / Getting started</h2>
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-card shadow-ios">
        {video.type === 'direct' ? (
          <video src={video.url} controls playsInline preload="metadata" className="h-full w-full" aria-label="Program welcome video" />
        ) : (
          <iframe src={video.url} title="Program welcome video" className="h-full w-full border-0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
        )}
      </div>
    </section>
  );
}