import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Play, ExternalLink, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { detectVideoType, extractYouTubeId, getVideoEmbedUrl, getVideoPlatformLabel } from '@/lib/videoUtils';
import { BUILD_INFO } from '@/lib/buildInfo';

interface HomeBannerData {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  video_url: string | null;
  background_color: string | null;
  target_below_version: string | null;
}

const DISMISSED_BANNERS_KEY = 'dismissedBannerIds';

export function HomeBanner() {
  const [banners, setBanners] = useState<HomeBannerData[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_BANNERS_KEY);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error reading dismissed banners:', e);
    }
    return new Set();
  });
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('home_banners')
        .select('id, title, description, button_text, button_url, video_url, background_color, target_below_version')
        .eq('is_active', true)
        .or('starts_at.is.null,starts_at.lte.now()')
        .or('ends_at.is.null,ends_at.gte.now()')
        .order('priority', { ascending: false })
        .limit(3);

      if (error) throw error;

      // Filter out banners that target a specific version if user is already on that version or above
      const currentVersion = BUILD_INFO.version;
      const filtered = (data || []).map(d => ({ ...d, target_below_version: (d as any).target_below_version ?? null })).filter((banner) => {
        if (!banner.target_below_version) return true; // No version filter = show to all
        return isVersionLessThan(currentVersion, banner.target_below_version);
      });

      setBanners(filtered);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDismissedIds(prev => {
      const updated = new Set([...prev, id]);
      try {
        localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify([...updated]));
      } catch (e) {
        console.error('Error saving dismissed banner:', e);
      }
      return updated;
    });
  };

  const handleButtonClick = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  const visibleBanners = banners.filter(b => !dismissedIds.has(b.id));

  if (visibleBanners.length === 0) return null;

  return (
    <div className="px-4 py-2 space-y-3">
      {visibleBanners.map((banner) => {
        const videoType = banner.video_url ? detectVideoType(banner.video_url) : null;
        const isVideoExpanded = expandedVideoId === banner.id;

        return (
          <div
            key={banner.id}
            className="relative bg-white dark:bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden"
          >
            {/* Dismiss button */}
            <button
              onClick={(e) => handleDismiss(e, banner.id)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors z-10"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4 text-white" />
            </button>

            {/* Video Section */}
            {banner.video_url && videoType && (
              <div className="w-full">
                {/* YouTube with embed */}
                {videoType === 'youtube' && (
                  <>
                    {isVideoExpanded ? (
                      <div className="relative aspect-video">
                        <iframe
                          src={getVideoEmbedUrl(banner.video_url, 'youtube', true) || ''}
                          title={banner.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setExpandedVideoId(banner.id)}
                        className="relative w-full aspect-video group"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${extractYouTubeId(banner.video_url)}/maxresdefault.jpg`}
                          alt={banner.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            const youtubeId = extractYouTubeId(banner.video_url!);
                            if (youtubeId) {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                          <div className="bg-white/90 text-foreground rounded-full p-3 shadow-lg">
                            <Play className="h-6 w-6 fill-current" />
                          </div>
                        </div>
                      </button>
                    )}
                  </>
                )}

                {/* Vimeo with embed */}
                {videoType === 'vimeo' && (
                  <>
                    {isVideoExpanded ? (
                      <div className="relative aspect-video">
                        <iframe
                          src={getVideoEmbedUrl(banner.video_url, 'vimeo', true) || ''}
                          title={banner.title}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setExpandedVideoId(banner.id)}
                        className="relative w-full aspect-video bg-muted flex items-center justify-center group"
                      >
                        <div className="text-center">
                          <div className="bg-white/90 text-foreground rounded-full p-3 mx-auto mb-2 shadow-lg">
                            <Play className="h-6 w-6 fill-current" />
                          </div>
                          <span className="text-sm text-muted-foreground">Play Vimeo Video</span>
                        </div>
                      </button>
                    )}
                  </>
                )}

                {/* Direct MP4/video file */}
                {videoType === 'direct' && (
                  <video
                    src={banner.video_url}
                    controls
                    playsInline
                    className="w-full aspect-video object-cover"
                  />
                )}

                {/* Instagram/TikTok - external link */}
                {(videoType === 'instagram' || videoType === 'tiktok') && (
                  <div className="p-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(banner.video_url!, '_blank')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Watch on {getVideoPlatformLabel(videoType)}
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-semibold text-foreground">{banner.title}</h3>
                  {banner.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{banner.description}</p>
                  )}
                </div>
              </div>

              {/* Button */}
              {banner.button_text && banner.button_url && (
                <Button
                  size="sm"
                  className="mt-3 w-full bg-violet-600 hover:bg-violet-700"
                  onClick={() => handleButtonClick(banner.button_url!)}
                >
                  {banner.button_text}
                  {banner.button_url.startsWith('http') && (
                    <ExternalLink className="h-3 w-3 ml-1" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
