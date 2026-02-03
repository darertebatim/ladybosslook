import { useState, useCallback, memo } from 'react';
import { getFluentEmojiUrl, getFluentEmojiUrlAlt, isEmoji } from '@/lib/fluentEmoji';
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
  
  const handleError = useCallback(() => {
    if (!useAltUrl) {
      // Try alternate URL without variation selector
      setUseAltUrl(true);
    } else {
      // Both URLs failed, show native emoji
      setLoadError(true);
    }
  }, [useAltUrl]);

  // If not an emoji or native only mode, render as text
  if (!emoji || !isEmoji(emoji) || nativeOnly) {
    return (
      <span 
        className={cn('inline-flex items-center justify-center', className)} 
        style={{ fontSize: size * 0.85, lineHeight: 1 }}
      >
        {emoji}
      </span>
    );
  }

  // Show native emoji as fallback if image fails
  if (loadError) {
    return (
      <span 
        className={cn('inline-flex items-center justify-center', className)} 
        style={{ fontSize: size * 0.85, lineHeight: 1 }}
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
