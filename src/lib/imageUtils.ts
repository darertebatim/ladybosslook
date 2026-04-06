import imageCompression from 'browser-image-compression';

/**
 * Compress an image file before upload.
 * Targets max 800KB and 1920px width — good balance of quality vs size.
 */
export async function compressImage(file: File, options?: {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}): Promise<File> {
  const { maxSizeMB = 0.8, maxWidthOrHeight = 1920 } = options || {};

  // Skip if already small enough (under 100KB)
  if (file.size < 100 * 1024) return file;

  const compressed = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp', // Convert to WebP for better compression
  });

  console.log(
    `[ImageUtils] Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`
  );

  return compressed;
}

/**
 * Get an optimized version of a Supabase Storage public URL.
 * Appends width/quality transform params for on-the-fly resizing.
 * 
 * Only works with Supabase Storage URLs — passes through external URLs unchanged.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options?: { width?: number; height?: number; quality?: number }
): string {
  if (!url) return '';

  // Only transform Supabase storage URLs
  const isSupabaseStorage = url.includes('/storage/v1/object/public/');
  if (!isSupabaseStorage) return url;

  const { width, height, quality = 75 } = options || {};

  // Use Supabase Image Transformations via render endpoint
  // /storage/v1/object/public/bucket/path → /storage/v1/render/image/public/bucket/path
  const transformedUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('quality', String(quality));

  return `${transformedUrl}?${params.toString()}`;
}

/**
 * Preset sizes for common use cases
 */
export const IMAGE_SIZES = {
  /** Grid thumbnails / cards (400px wide) */
  thumbnail: { width: 400, quality: 70 },
  /** Detail page covers (800px wide) */
  cover: { width: 800, quality: 80 },
  /** Full-width hero images */
  hero: { width: 1200, quality: 85 },
  /** Small icons / avatars */
  avatar: { width: 128, quality: 70 },
} as const;
