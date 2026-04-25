import { useState, useCallback, memo } from 'react';
import { getFluentEmojiUrl, getFluentEmojiUrlAlt, isEmoji } from '@/lib/fluentEmoji';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

interface FluentEmojiProps {
  emoji: string;
  size?: number;
  className?: string;
  /** Whether to show fallback immediately without trying to load image */
  nativeOnly?: boolean;
}

/**
 * Renders Microsoft Fluent Emoji 3D images with native emoji fallback
 * Automatically handles CDN loading and error fallback
 */
export const FluentEmoji = memo(function FluentEmoji({ 
  emoji, 
  size = 24, 
  className,
  nativeOnly = false,
}: FluentEmojiProps) {
  const [loadError, setLoadError] = useState(false);
  const [useAltUrl, setUseAltUrl] = useState(false);
  const { isOnline } = useNetworkStatus();
  
  const handleError = useCallback(() => {
    if (!useAltUrl) {
      // Try alternate URL without variation selector
      setUseAltUrl(true);
    } else {
      // Both URLs failed, show native emoji
      setLoadError(true);
    }
  }, [useAltUrl]);

  // Prefer native emoji whenever:
  //  - it's not actually an emoji,
  //  - caller requested nativeOnly,
  //  - we're offline (the CDN load is guaranteed to fail and webview can
  //    paint a "?" box for a moment before our error handler fires), or
  //  - we already tried and the image failed to load.
  if (!emoji || !isEmoji(emoji) || nativeOnly || !isOnline || loadError) {
    return (
      <span 
        className={cn('inline-flex items-center justify-center', className)}
        style={{
          fontSize: size * 0.85,
          lineHeight: 1,
          // Force the OS emoji font stack so glyphs always render — without
          // this, our app font (Inter) may show "?" boxes for some emoji
          // when offline since Inter has no emoji glyphs.
          fontFamily:
            '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","EmojiOne Color","Android Emoji",sans-serif',
        }}
      >
        {emoji}
      </span>
    );
  }

  const imageUrl = useAltUrl ? getFluentEmojiUrlAlt(emoji) : getFluentEmojiUrl(emoji);

  return (
    <img
      src={imageUrl}
      alt={emoji}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn('inline-block object-contain', className)}
      style={{ width: size, height: size }}
      onError={handleError}
    />
  );
});

export default FluentEmoji;
