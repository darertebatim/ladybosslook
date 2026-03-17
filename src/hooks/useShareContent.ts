import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const APP_STORE_URL = 'https://apps.apple.com/app/id6755076134';

interface UseShareContentOptions {
  title: string;
  text: string;
  imageUrl?: string | null;
}

export function useShareContent({ title, text, imageUrl }: UseShareContentOptions) {
  const [isSharing, setIsSharing] = useState(false);

  const fullText = `${text}\nDownload the app: ${APP_STORE_URL}`;

  const handleShare = useCallback(async () => {
    setIsSharing(true);
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
        await navigator.share({ title, text: fullText, url: APP_STORE_URL });
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
  }, [title, fullText, imageUrl]);

  return { handleShare, isSharing };
}
