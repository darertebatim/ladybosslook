import { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Play, Megaphone, ExternalLink, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { smartOpenUrl } from '@/lib/navigation-utils';
import { detectVideoType, extractYouTubeId } from '@/lib/videoUtils';
import { BUILD_INFO } from '@/lib/buildInfo';
import { AppVideoPlayer } from '@/components/app/AppVideoPlayer';
import { cn } from '@/lib/utils';

type DisplayLocation = 'home_top' | 'home_rituals' | 'explore' | 'explore_tools' | 'listen' | 'player' | 'programs' | 'channels' | 'watch' | 'video_player' | 'routines_top' | 'routines_after_categories' | 'routine_player' | 'tasks_bank_top' | 'tasks_bank_after_categories' | 'my_rilo_top' | 'my_rilo_bottom';

function isVersionLessThan(v1: string, v2: string): boolean {
  const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return true;
    if (p1 > p2) return false;
  }
  return false;
}

interface HomeBannerData {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  video_url: string | null;
  background_color: string | null;
  target_below_version: string | null;
  display_location: string[] | null;
  destination_type: string | null;
  destination_id: string | null;
}

const DISMISSED_BANNERS_KEY = 'dismissedBannerIds';

interface HomeBannerProps {
  location?: DisplayLocation;
  onVisibilityChange?: (visible: boolean) => void;
  className?: string;
}

function resolveDestinationUrl(banner: HomeBannerData): string | null {
  // If explicit button_url is set, use that
  if (banner.button_url) return banner.button_url;
  
  // Otherwise resolve from destination_type/destination_id
  const { destination_type, destination_id } = banner;
  if (!destination_type || destination_type === 'custom_url') return null;

  switch (destination_type) {
    case 'routine':
    case 'routines_hub':
      return destination_id ? `/app/routines/${destination_id}` : '/app/routines';
    case 'playlist':
      return destination_id ? `/app/player/playlist/${destination_id}` : null;
    case 'journal': return '/app/reflections';
    case 'programs': return '/app/programs';
    case 'breathe': return '/app/breathe';
    case 'water': return '/app/water';
    case 'channels': return '/app/channels';
    case 'home': return '/app/home';
    case 'inspire': return '/app/routines';
    case 'tasks':
      return destination_id ? `/app/home/new?template=${destination_id}` : '/app/home';
    case 'tasks_bank': return '/app/tasks-bank';
    case 'breathe_exercise':
      return destination_id ? `/app/breathe/${destination_id}` : '/app/breathe';
    case 'external_url': return null;
    case 'emotion':
    case 'mood': return '/app/mood';
    case 'period': return '/app/period';
    case 'chat': return '/app/chat';
    case 'profile': return '/app/profile';
    case 'planner': return '/app/planner';
    case 'rate': return '/app/rate';
    case 'onboarding':
      if (destination_id === 'selfcare-quiz') return '/app/onboarding/selfcare-quiz';
      return destination_id ? `/app/onboarding/${destination_id}` : null;
    case 'watch': return '/app/watch';
    case 'video_playlist':
      return destination_id ? `/app/watch/playlist/${destination_id}` : '/app/watch';
    case 'routine_player': return '/app/routineplayer';
    case 'audio_track':
      return destination_id ? `/app/player/${destination_id}` : null;
    case 'video_track':
      return destination_id ? `/app/watch/video/${destination_id}` : null;
    default: return null;
  }
}

function getDestinationLabel(type: string | null): string {
  if (!type) return 'Open';
  const labels: Record<string, string> = {
    routine: 'View Routine', routines_hub: 'View Routines', playlist: 'Listen Now',
    journal: 'Open Journal', programs: 'View Programs', breathe: 'Start Breathing',
    water: 'Track Water', channels: 'View Channels', home: 'Go Home',
    inspire: 'Get Inspired', tasks: 'View Tasks', tasks_bank: 'Browse Tasks',
    breathe_exercise: 'Start Exercise', emotion: 'Log Mood', mood: 'Check Mood',
    period: 'Track Period', chat: 'Open Chat', profile: 'View Profile',
    planner: 'Open Planner', onboarding: 'Start', watch: 'Watch Now',
    video_playlist: 'Watch Now', routine_player: 'Play Routine',
    audio_track: 'Listen Now', video_track: 'Watch Now', rate: 'Rate Us',
  };
  return labels[type] || 'Open';
}

export function HomeBanner({ location = 'home_top', onVisibilityChange, className }: HomeBannerProps) {
  const [banners, setBanners] = useState<HomeBannerData[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_BANNERS_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.error('Error reading dismissed banners:', e);
    }
    return new Set();
  });
  const [videoPlayerId, setVideoPlayerId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBanners();
  }, [location]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('home_banners')
        .select('id, title, description, button_text, button_url, video_url, background_color, target_below_version, display_location, destination_type, destination_id, target_instructor_ids')
        .eq('is_active', true)
        .or('starts_at.is.null,starts_at.lte.now()')
        .or('ends_at.is.null,ends_at.gte.now()')
        .order('priority', { ascending: false })
        .limit(10);

      if (error) throw error;

      // If any banner is instructor-scoped, fetch user's referrals once
      const restricted = (data || []).filter((d: any) => Array.isArray(d.target_instructor_ids) && d.target_instructor_ids.length > 0);
      let userInstructorIds: string[] = [];
      if (restricted.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: refs } = await supabase
            .from('instructor_referrals')
            .select('instructor_id')
            .eq('user_id', user.id);
          userInstructorIds = (refs || []).map((r: any) => r.instructor_id);
        }
      }

      const currentVersion = BUILD_INFO.version;
      const filtered = (data || []).map(d => ({
        ...d,
        target_below_version: (d as any).target_below_version ?? null,
        display_location: (d as any).display_location ?? null,
        destination_type: (d as any).destination_type ?? null,
        destination_id: (d as any).destination_id ?? null,
      })).filter((banner) => {
        if (banner.target_below_version) {
          if (!isVersionLessThan(currentVersion, banner.target_below_version)) return false;
        }
        if (banner.display_location && banner.display_location.length > 0) {
          if (!banner.display_location.includes(location)) return false;
        }
        const instIds: string[] = (banner as any).target_instructor_ids || [];
        if (instIds.length > 0) {
          if (!instIds.some(id => userInstructorIds.includes(id))) return false;
        }
        return true;
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

  const handleBannerClick = (banner: HomeBannerData) => {
    const url = resolveDestinationUrl(banner);
    if (url) smartOpenUrl(url, navigate);
  };

  // Only show the highest-priority eligible banner (banners are already
  // ordered by priority desc from the query). Prevents stacking.
  const visibleBanners = banners.filter(b => !dismissedIds.has(b.id)).slice(0, 1);

  useEffect(() => {
    onVisibilityChange?.(visibleBanners.length > 0);
  }, [visibleBanners.length, onVisibilityChange]);

  if (visibleBanners.length === 0) return null;

  return (
    <div className={className || "px-4 py-2 space-y-3"}>
      {visibleBanners.map((banner) => {
        const videoType = banner.video_url ? detectVideoType(banner.video_url) : null;
        const destinationUrl = resolveDestinationUrl(banner);
        const hasDestination = !!destinationUrl;
        const buttonLabel = banner.button_text || getDestinationLabel(banner.destination_type);

        return (
          <div
            key={banner.id}
            className={`relative bg-white rounded-2xl shadow-card-warm overflow-hidden ${hasDestination && !banner.video_url ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''}`}
            onClick={hasDestination && !banner.video_url ? () => handleBannerClick(banner) : undefined}
          >
            {/* Dismiss button */}
            <button
              onClick={(e) => handleDismiss(e, banner.id)}
        className="absolute top-3 right-3 p-1 rounded-full active:bg-black/10 transition-colors z-10"
              aria-label="Dismiss banner"
            >
              <X className="h-[18px] w-[18px] text-fg-warm-muted" strokeWidth={2.25} />
            </button>

            {/* Video Thumbnail */}
            {banner.video_url && videoType && (
              <>
                <button
                  onClick={() => setVideoPlayerId(banner.id)}
                  className="relative w-full aspect-video group active:scale-[0.98] transition-transform"
                >
                  {videoType === 'youtube' ? (
                    <img
                      src={`https://img.youtube.com/vi/${extractYouTubeId(banner.video_url)}/hqdefault.jpg`}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-active:bg-black/40 transition-colors">
                    <div className="bg-white/90 text-foreground rounded-full p-3 shadow-lg">
                      <Play className="h-6 w-6 fill-current" />
                    </div>
                  </div>
                </button>
                <AppVideoPlayer
                  isOpen={videoPlayerId === banner.id}
                  onClose={() => setVideoPlayerId(null)}
                  url={banner.video_url}
                  title={banner.title}
                  description={banner.description || undefined}
                />
              </>
            )}

            {/* Content */}
            <div className="pl-3 pr-4 py-4">
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 rounded-full border border-fg-warm-muted/30 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="h-[18px] w-[18px] text-fg-warm" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-bold text-[15px] leading-snug text-fg-warm">{banner.title}</h3>
                  {banner.description && (
                    <p className="text-[14px] leading-snug text-fg-warm-muted mt-1">
                      {banner.description}
                      {hasDestination && (
                        <>
                          {' '}
                          <button
                            type="button"
                            className="text-[#D94B2B] font-semibold active:opacity-70 transition-opacity inline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBannerClick(banner);
                            }}
                          >
                            {buttonLabel}
                            {destinationUrl?.startsWith('http') && (
                              <ExternalLink className="inline h-3 w-3 ml-0.5 -mt-0.5" />
                            )}
                          </button>
                        </>
                      )}
                    </p>
                  )}
                  {!banner.description && hasDestination && (
                    <button
                      type="button"
                      className="mt-1 inline-flex items-center gap-0.5 text-[#D94B2B] font-semibold text-[14px] active:opacity-70 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBannerClick(banner);
                      }}
                    >
                      {buttonLabel}
                      {destinationUrl?.startsWith('http') && (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HomeBannerCard({
  banner,
  videoPlayerId,
  setVideoPlayerId,
  handleDismiss,
  handleBannerClick,
}: {
  banner: HomeBannerData;
  videoPlayerId: string | null;
  setVideoPlayerId: (id: string | null) => void;
  handleDismiss: (e: React.MouseEvent, id: string) => void;
  handleBannerClick: (banner: HomeBannerData) => void;
}) {
  const videoType = banner.video_url ? detectVideoType(banner.video_url) : null;
  const destinationUrl = resolveDestinationUrl(banner);
  const hasDestination = !!destinationUrl;
  const buttonLabel = banner.button_text || getDestinationLabel(banner.destination_type);

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-card-warm overflow-hidden ${hasDestination && !banner.video_url ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''}`}
      onClick={hasDestination && !banner.video_url ? () => handleBannerClick(banner) : undefined}
    >
            <button
              onClick={(e) => handleDismiss(e, banner.id)}
              className="absolute top-3 right-3 p-1 rounded-full active:bg-black/10 transition-colors z-10"
        aria-label="Dismiss banner"
      >
        <X className="h-[18px] w-[18px] text-fg-warm-muted" strokeWidth={2.25} />
      </button>

      {banner.video_url && videoType && (
        <>
          <button
            onClick={() => setVideoPlayerId(banner.id)}
            className="relative w-full aspect-video group active:scale-[0.98] transition-transform"
          >
            {videoType === 'youtube' ? (
              <img
                src={`https://img.youtube.com/vi/${extractYouTubeId(banner.video_url)}/hqdefault.jpg`}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-active:bg-black/40 transition-colors">
              <div className="bg-white/90 text-foreground rounded-full p-3 shadow-lg">
                <Play className="h-6 w-6 fill-current" />
              </div>
            </div>
          </button>
          <AppVideoPlayer
            isOpen={videoPlayerId === banner.id}
            onClose={() => setVideoPlayerId(null)}
            url={banner.video_url}
            title={banner.title}
            description={banner.description || undefined}
          />
        </>
      )}

      <div className="pl-3 pr-4 py-4">
        <div className="flex items-start gap-2">
          <div className="w-10 h-10 rounded-full border border-fg-warm-muted/30 flex items-center justify-center flex-shrink-0">
            <Megaphone className="h-[18px] w-[18px] text-fg-warm" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-bold text-[15px] leading-snug text-fg-warm">{banner.title}</h3>
            {banner.description && (
              <p className="text-[14px] leading-snug text-fg-warm-muted mt-1">
                {banner.description}
                {hasDestination && (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="text-[#D94B2B] font-semibold active:opacity-70 transition-opacity inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBannerClick(banner);
                      }}
                    >
                      {buttonLabel}
                      {destinationUrl?.startsWith('http') && (
                        <ExternalLink className="inline h-3 w-3 ml-0.5 -mt-0.5" />
                      )}
                    </button>
                  </>
                )}
              </p>
            )}
            {!banner.description && hasDestination && (
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-0.5 text-[#D94B2B] font-semibold text-[14px] active:opacity-70 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick(banner);
                }}
              >
                {buttonLabel}
                {destinationUrl?.startsWith('http') && (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeBannerCarousel({
  banners,
  className,
  videoPlayerId,
  setVideoPlayerId,
  handleDismiss,
  handleBannerClick,
}: {
  banners: HomeBannerData[];
  className?: string;
  videoPlayerId: string | null;
  setVideoPlayerId: (id: string | null) => void;
  handleDismiss: (e: React.MouseEvent, id: string) => void;
  handleBannerClick: (banner: HomeBannerData) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  return (
    <div className={className || "px-4 py-2"}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="min-w-0 flex-[0_0_100%] pr-2 last:pr-0">
              <HomeBannerCard
                banner={banner}
                videoPlayerId={videoPlayerId}
                setVideoPlayerId={setVideoPlayerId}
                handleDismiss={handleDismiss}
                handleBannerClick={handleBannerClick}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === selectedIndex
                ? "w-4 bg-[#D94B2B]"
                : "w-1.5 bg-fg-warm/20"
            )}
          />
        ))}
      </div>
    </div>
  );
}
