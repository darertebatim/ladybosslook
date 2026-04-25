import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { buildShareOneLink, logAppsFlyerEvent } from '@/lib/appsflyer';

interface UseShareContentOptions {
  title: string;
  text: string;
  imageUrl?: string | null;
  /**
   * Tracking source — appears as `c=<source>` in AppsFlyer.
   * Examples: 'audio_player', 'routine_completion', 'gold_streak'.
   */
  source: string;
  /** Optional content identifier (routine slug, audio id, story id) */
  contentId?: string;
}

export function useShareContent({ title, text, imageUrl, source, contentId }: UseShareContentOptions) {
  const [isSharing, setIsSharing] = useState(false);

  const shareUrl = buildShareOneLink(source, contentId, title);
  const fullText = `${text}\nGet the app: ${shareUrl}`;

  const trackShareIntent = () => {
    try {
      logAppsFlyerEvent('af_share', { source, content_id: contentId ?? '' });
    } catch { /* ignore */ }
  };

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    trackShareIntent();
    try {
      // Try sharing with image
      if (imageUrl && navigator.canShare) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const safeName = title.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-').substring(0, 40);
          const extension = blob.type?.includes('png') ? 'png' : 'jpg';
          const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
          const file = new File([blob], `${safeName}.${extension}`, { type: mimeType });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title, text: fullText });
            return;
          }
        } catch (imgErr: any) {
          if (imgErr?.name === 'AbortError') return;
          // Fall through to text-only share
        }
      }

      // Fallback: text + url only
      if (navigator.share) {
        await navigator.share({ title, text: fullText, url: shareUrl });
        return;
      }

      // Final fallback: clipboard
      await navigator.clipboard.writeText(fullText);
      toast.success('Link copied to clipboard!');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(fullText);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Sharing is not supported in this browser');
      }
    } finally {
      setIsSharing(false);
    }
  }, [title, fullText, imageUrl, shareUrl, source, contentId]);

  const handleShareInstagram = useCallback(async () => {
    if (!imageUrl) {
      toast.error('No image available to share');
      return;
    }
    setIsSharing(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const safeName = title.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-').substring(0, 40);
      const extension = blob.type?.includes('png') ? 'png' : 'jpg';
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
      const file = new File([blob], `${safeName}.${extension}`, { type: mimeType });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      toast('Open Instagram and share from your gallery', { duration: 3000 });
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      toast('Open Instagram and share from your gallery', { duration: 3000 });
    } finally {
      setIsSharing(false);
    }
  }, [title, imageUrl]);

  return { handleShare, handleShareInstagram, isSharing };
}
