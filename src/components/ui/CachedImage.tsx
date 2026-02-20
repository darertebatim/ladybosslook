import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { getOrCacheImage } from '@/lib/imageCache';
import { isNativeApp } from '@/lib/platform';

interface CachedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallback?: React.ReactNode;
}

/**
 * Drop-in replacement for <img> that transparently caches images
 * on native iOS/Android using Capacitor Filesystem.
 * On web, falls back to a normal <img> tag.
 */
export function CachedImage({ src, fallback, alt, className, ...props }: CachedImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(
    // On web we can use src immediately; on native we start undefined until cache resolves
    isNativeApp() ? undefined : src
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setResolvedSrc(undefined);
      return;
    }

    if (!isNativeApp()) {
      setResolvedSrc(src);
      return;
    }

    // On native: resolve from cache (downloads if needed)
    let cancelled = false;
    setHasError(false);
    
    getOrCacheImage(src).then(uri => {
      if (!cancelled) setResolvedSrc(uri);
    });

    return () => { cancelled = true; };
  }, [src]);

  if (!resolvedSrc || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => {
        // If local cache URI fails, fall back to original URL
        if (resolvedSrc !== src && src) {
          setResolvedSrc(src);
        } else {
          setHasError(true);
        }
      }}
      {...props}
    />
  );
}
