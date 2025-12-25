import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Play, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HomeBannerData {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  youtube_url: string | null;
  background_color: string | null;
}

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export function HomeBanner() {
  const [banners, setBanners] = useState<HomeBannerData[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('home_banners')
        .select('id, title, description, button_text, button_url, youtube_url, background_color')
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
    setDismissedIds(prev => new Set([...prev, id]));
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
        const youtubeId = banner.youtube_url ? extractYouTubeId(banner.youtube_url) : null;
        const isVideoExpanded = expandedVideoId === banner.id;

        return (
          <div
            key={banner.id}
            className="relative bg-primary/10 border border-primary/20 rounded-xl p-4 overflow-hidden"
          >
            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(banner.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors z-10"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* YouTube Video */}
            {youtubeId && (
              <div className="mb-3">
                {isVideoExpanded ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
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
                      src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                      alt={banner.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        // Fallback to lower quality thumbnail if maxres doesn't exist
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                      <div className="bg-primary text-primary-foreground rounded-full p-3">
                        <Play className="h-6 w-6 fill-current" />
                      </div>
                    </div>
                  </button>
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
