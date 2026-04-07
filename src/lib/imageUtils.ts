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

/**
 * Batch-optimize cover images for a given Supabase table.
 * Downloads each non-WebP cover, compresses to WebP, re-uploads, and updates the DB row.
 *
 * @returns `{ done, failed }` counts
 */
export async function optimizeCoversForTable(
  items: { id: string; coverUrl: string }[],
  tableName: string,
  columnName: string
): Promise<{ done: number; failed: number }> {
  const { supabase } = await import('@/integrations/supabase/client');
  const SUPABASE_URL = 'https://mnukhzjcvbwpvktxqlej.supabase.co';
  let done = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // Normalise relative paths (e.g. "/playlist-covers/file.jpg") to full URLs
      const fullUrl = item.coverUrl.startsWith('http')
        ? item.coverUrl
        : `${SUPABASE_URL}/storage/v1/object/public${item.coverUrl.startsWith('/') ? '' : '/'}${item.coverUrl}`;

      const resp = await fetch(fullUrl);
      const blob = await resp.blob();
      const file = new File([blob], 'cover.jpg', { type: blob.type });

      const compressed = await compressImage(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1200 });

      const match = fullUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (!match) { failed++; continue; }
      const [, bucket, oldPath] = match;
      const newPath = oldPath.replace(/\.[^.]+$/, '.webp');

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(newPath, compressed, { contentType: 'image/webp', upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(newPath);
      await supabase.from(tableName as any).update({ [columnName]: urlData.publicUrl }).eq('id', item.id);
      done++;
    } catch (e) {
      console.error(`Failed to optimize cover for ${item.id}:`, e);
      failed++;
    }
  }

  return { done, failed };
}
