export type VideoType = 'youtube' | 'vimeo' | 'instagram' | 'tiktok' | 'direct' | null;

export function detectVideoType(url: string): VideoType {
  if (!url) return null;
  
  // YouTube
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  
  // Vimeo
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  
  // Instagram
  if (/instagram\.com\/(reel|p|reels)\//i.test(url)) return 'instagram';
  
  // TikTok
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  
  // Direct video files
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return 'direct';
  
  return null;
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function getVideoThumbnail(url: string, videoType: VideoType): string | null {
  switch (videoType) {
    case 'youtube': {
      const id = extractYouTubeId(url);
      return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
    }
    case 'vimeo': {
      // Vimeo thumbnails require API call, return null for now
      return null;
    }
    default:
      return null;
  }
}

export function getVideoEmbedUrl(url: string, videoType: VideoType, autoplay = false): string | null {
  switch (videoType) {
    case 'youtube': {
      const id = extractYouTubeId(url);
      return id ? `https://www.youtube.com/embed/${id}${autoplay ? '?autoplay=1' : ''}` : null;
    }
    case 'vimeo': {
      const id = extractVimeoId(url);
      return id ? `https://player.vimeo.com/video/${id}${autoplay ? '?autoplay=1' : ''}` : null;
    }
    default:
      return null;
  }
}

export function getVideoPlatformLabel(videoType: VideoType): string {
  switch (videoType) {
    case 'youtube': return 'YouTube';
    case 'vimeo': return 'Vimeo';
    case 'instagram': return 'Instagram';
    case 'tiktok': return 'TikTok';
    case 'direct': return 'Video';
    default: return 'Video';
  }
}
