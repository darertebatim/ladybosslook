import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Play, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { detectVideoType, extractYouTubeId, extractVimeoId, getVideoEmbedUrl, getVideoPlatformLabel } from '@/lib/videoUtils';

interface HomeBannerData {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  video_url: string | null;
  background_color: string | null;
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
        .select('id, title, description, button_text, button_url, video_url, background_color')
        .eq('is_active', true)
        .or('starts_at.is.null,starts_at.lte.now()')
        .or('ends_at.is.null,ends_at.gte.now()')
        .order('priority', { ascending: false })
        .limit(3);

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const handleDismiss = (id: string) => {
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
    <div className="space-y-3">
      {visibleBanners.map((banner) => {
        const videoType = banner.video_url ? detectVideoType(banner.video_url) : null;
        const isVideoExpanded = expandedVideoId === banner.id;

        return (
          <div
            key={banner.id}
            className="relative bg-primary/10 border border-primary/20 rounded-xl p-4 overflow-hidden"
          >
            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(banner.id)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors z-10 shadow-lg"
              aria-label="Dismiss banner"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Video Section */}
            {banner.video_url && videoType && (
              <div className="mb-3">
                {/* YouTube with embed */}
                {videoType === 'youtube' && (
                  <>
                    {isVideoExpanded ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden">
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
                        className="relative w-full aspect-video rounded-lg overflow-hidden group"
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
                          <div className="bg-primary text-primary-foreground rounded-full p-3">
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
                      <div className="relative aspect-video rounded-lg overflow-hidden">
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
                        className="relative w-full aspect-video rounded-lg overflow-hidden group bg-muted flex items-center justify-center"
                      >
                        <div className="text-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-3 mx-auto mb-2">
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
                    className="w-full aspect-video rounded-lg object-cover"
                  />
                )}

                {/* Instagram/TikTok - external link */}
                {(videoType === 'instagram' || videoType === 'tiktok') && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(banner.video_url!, '_blank')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch on {getVideoPlatformLabel(videoType)}
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="pr-6">
              <h3 className="font-semibold text-foreground">{banner.title}</h3>
              {banner.description && (
                <p className="text-sm text-muted-foreground mt-1">{banner.description}</p>
              )}
            </div>

            {/* Button */}
            {banner.button_text && banner.button_url && (
              <Button
                size="sm"
                className="mt-3"
                onClick={() => handleButtonClick(banner.button_url!)}
              >
                {banner.button_text}
                {banner.button_url.startsWith('http') && (
                  <ExternalLink className="h-3 w-3 ml-1" />
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
