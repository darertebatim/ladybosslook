import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { smartOpenUrl } from '@/lib/navigation-utils';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { useAuth } from '@/hooks/useAuth';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

type DisplayLocation = 'home_top' | 'home_rituals' | 'explore' | 'explore_tools' | 'listen' | 'player' | 'programs' | 'channels' | 'watch' | 'video_player' | 'routines_top' | 'routines_after_categories' | 'routine_player' | 'tasks_bank_top' | 'tasks_bank_after_categories' | 'my_rilo_top' | 'my_rilo_bottom';

interface PromoBannerData {
  id: string;
  cover_image_url: string;
  destination_type: 'routine' | 'playlist' | 'journal' | 'programs' | 'breathe' | 'water' | 'channels' | 'home' | 'inspire' | 'custom_url' | 'tasks' | 'routines_hub' | 'tasks_bank' | 'breathe_exercise' | 'external_url' | 'emotion' | 'mood' | 'period' | 'chat' | 'profile' | 'planner' | 'rate' | 'onboarding' | 'watch' | 'video_playlist' | 'routine_player' | 'audio_track' | 'video_track';
  destination_id: string | null;
  custom_url: string | null;
  display_frequency: 'once' | 'daily' | 'weekly' | 'forever';
  aspect_ratio: '3:1' | '4:1' | '16:9' | '1:1' | 'full';
  target_type: 'all' | 'enrolled' | 'custom';
  include_programs: string[];
  exclude_programs: string[];
  include_playlists: string[];
  exclude_playlists: string[];
  include_tools: string[];
  exclude_tools: string[];
  target_languages: string[];
  target_timezones: string[];
  target_instructor_ids: string[];
  display_location: string[];
  target_playlist_ids: string[];
  target_audio_ids: string[];
  target_video_ids: string[];
  display_delay_seconds: number;
}

interface PromoBannerProps {
  location?: DisplayLocation;
  currentPlaylistId?: string;
  currentAudioId?: string;
  currentVideoId?: string;
  /** Current playback time in seconds (for delayed banner display) */
  playbackSeconds?: number;
  className?: string;
  onVisibilityChange?: (visible: boolean) => void;
  /** Show all eligible banners in a carousel instead of one at a time */
  carousel?: boolean;
  /** Always show the close/dismiss button regardless of display_frequency */
  forceShowClose?: boolean;
}

const STORAGE_KEY = 'promo_banner_dismissals';

interface DismissalRecord {
  [bannerId: string]: number; // timestamp of dismissal
}

function getDismissals(): DismissalRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setDismissal(bannerId: string) {
  const dismissals = getDismissals();
  dismissals[bannerId] = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissals));
}

function shouldShowBanner(banner: PromoBannerData): boolean {
  const dismissals = getDismissals();
  const dismissedAt = dismissals[banner.id];
  
  if (!dismissedAt) return true;
  
  // 'forever' banners reappear after 1 hour (session-like behavior)
  if (banner.display_frequency === 'forever') {
    const hoursSinceDismissal = (Date.now() - dismissedAt) / (1000 * 60 * 60);
    return hoursSinceDismissal >= 1;
  }
  
  const now = Date.now();
  const hoursSinceDismissal = (now - dismissedAt) / (1000 * 60 * 60);
  
  switch (banner.display_frequency) {
    case 'once':
      return false;
    case 'daily':
      return hoursSinceDismissal >= 24;
    case 'weekly':
      return hoursSinceDismissal >= 24 * 7;
    default:
      return true;
  }
}

export function PromoBanner({ 
  location = 'home_top', 
  currentPlaylistId,
  currentAudioId,
  currentVideoId,
  playbackSeconds = 0,
  className,
  onVisibilityChange,
  carousel = false,
  forceShowClose = false,
}: PromoBannerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Fetch active banners
  const { data: banners } = useQuery({
    queryKey: ['active-promo-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as PromoBannerData[];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch user's enrollments for targeting
  const { data: userEnrollments } = useQuery({
    queryKey: ['user-enrollments-for-promo', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) throw error;
      return data.map(e => e.program_slug).filter(Boolean) as string[];
    },
    enabled: !!user?.id,
  });

  // Fetch user's playlist access (based on audio progress)
  const { data: userPlaylists } = useQuery({
    queryKey: ['user-playlists-for-promo', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('audio_progress')
        .select('audio_id')
        .eq('user_id', user.id);
      if (error) throw error;
      
      // Get playlist IDs from audio progress
      if (!data?.length) return [];
      const audioIds = data.map(p => p.audio_id);
      const { data: playlistItems } = await supabase
        .from('audio_playlist_items')
        .select('playlist_id')
        .in('audio_id', audioIds);
      
      return [...new Set(playlistItems?.map(p => p.playlist_id) || [])];
    },
    enabled: !!user?.id,
  });

  // Fetch user's tool usage
  const { data: userTools } = useQuery({
    queryKey: ['user-tools-for-promo', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const tools: string[] = [];
      
      // Check reflections (merged from journal)
      const { count: journalCount } = await supabase
        .from('free_form_reflections' as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (journalCount && journalCount > 0) tools.push('journal');
      
      // Check breathing sessions
      const { count: breatheCount } = await supabase
        .from('breathing_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (breatheCount && breatheCount > 0) tools.push('breathe');
      
      // Check emotion logs
      const { count: emotionCount } = await supabase
        .from('emotion_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (emotionCount && emotionCount > 0) tools.push('emotion');
      
      // Check period logs
      const { count: periodCount } = await supabase
        .from('period_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (periodCount && periodCount > 0) tools.push('period');
      
      // Check tasks/planner
      const { count: tasksCount } = await supabase
        .from('user_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (tasksCount && tasksCount > 0) tools.push('planner');
      
      return tools;
    },
    enabled: !!user?.id,
  });

  // Fetch user profile for language/timezone targeting
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-for-promo', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language, timezone')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's instructor referrals for instructor-scoped targeting
  const { data: userInstructorIds } = useQuery({
    queryKey: ['user-instructor-refs-for-promo', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('instructor_referrals')
        .select('instructor_id')
        .eq('user_id', user.id);
      if (error) return [];
      return (data || []).map((r: any) => r.instructor_id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Filter banners based on location and targeting
  const eligibleBanners = useMemo(() => {
    if (!banners) return [];
    
    return banners.filter(banner => {
      // Always check dismiss status first
      if (!shouldShowBanner(banner) || dismissedIds.has(banner.id)) {
        return false;
      }

      // Instructor-scoped targeting (applies to ALL target_types).
      // If banner has target_instructor_ids set, only users referred by one
      // of those instructors should see it.
      const instructorIds = banner.target_instructor_ids || [];
      if (instructorIds.length > 0) {
        if (!userInstructorIds || userInstructorIds.length === 0) return false;
        const match = instructorIds.some(id => userInstructorIds.includes(id));
        if (!match) return false;
      }
      
      // Check display delay (for player/video_player locations — skip for full-screen overlays, they use page-time delay)
      if (banner.aspect_ratio !== 'full' && (banner.display_delay_seconds || 0) > 0 && playbackSeconds < banner.display_delay_seconds) {
        return false;
      }
      
      // Location filter - banner's display_location array must include this location
      const bannerLocations = banner.display_location || ['home_top'];
      if (!bannerLocations.includes(location)) {
        return false;
      }
      
      // For player location: check playlist targeting
      if (location === 'player' && bannerLocations.includes('player') && banner.target_playlist_ids?.length > 0) {
        if (!currentPlaylistId || !banner.target_playlist_ids.includes(currentPlaylistId)) {
          return false;
        }
      }
      
      // For player location: check audio targeting
      if (location === 'player' && bannerLocations.includes('player') && banner.target_audio_ids?.length > 0) {
        if (!currentAudioId || !banner.target_audio_ids.includes(currentAudioId)) {
          return false;
        }
      }
      
      // For video_player location: check video targeting
      if (location === 'video_player' && bannerLocations.includes('video_player') && banner.target_video_ids?.length > 0) {
        if (!currentVideoId || !banner.target_video_ids.includes(currentVideoId)) {
          return false;
        }
      }
      
      // Target type: all - show to everyone
      if (banner.target_type === 'all') {
        return true;
      }
      
      // Target type: enrolled - show to anyone with any enrollment
      if (banner.target_type === 'enrolled') {
        return userEnrollments && userEnrollments.length > 0;
      }
      
      // Target type: custom - apply include/exclude filters
      if (banner.target_type === 'custom') {
        let shouldShow = true;
        
        // Program includes (if specified, user must be in at least one)
        if (banner.include_programs?.length > 0) {
          const hasIncludedProgram = banner.include_programs.some(
            slug => userEnrollments?.includes(slug)
          );
          if (!hasIncludedProgram) shouldShow = false;
        }
        
        // Program excludes (if user is in any excluded program, hide)
        if (banner.exclude_programs?.length > 0 && shouldShow) {
          const hasExcludedProgram = banner.exclude_programs.some(
            slug => userEnrollments?.includes(slug)
          );
          if (hasExcludedProgram) shouldShow = false;
        }
        
        // Playlist includes
        if (banner.include_playlists?.length > 0 && shouldShow) {
          const hasIncludedPlaylist = banner.include_playlists.some(
            id => userPlaylists?.includes(id)
          );
          if (!hasIncludedPlaylist) shouldShow = false;
        }
        
        // Playlist excludes
        if (banner.exclude_playlists?.length > 0 && shouldShow) {
          const hasExcludedPlaylist = banner.exclude_playlists.some(
            id => userPlaylists?.includes(id)
          );
          if (hasExcludedPlaylist) shouldShow = false;
        }
        
        // Tool includes
        if (banner.include_tools?.length > 0 && shouldShow) {
          const hasIncludedTool = banner.include_tools.some(
            tool => userTools?.includes(tool)
          );
          if (!hasIncludedTool) shouldShow = false;
        }
        
        // Tool excludes
        if (banner.exclude_tools?.length > 0 && shouldShow) {
          const hasExcludedTool = banner.exclude_tools.some(
            tool => userTools?.includes(tool)
          );
          if (hasExcludedTool) shouldShow = false;
        }
        
        // Language filter (if specified, user must match one)
        if (banner.target_languages?.length > 0 && shouldShow) {
          const userLang = userProfile?.preferred_language || '';
          if (!userLang || !banner.target_languages.includes(userLang)) {
            shouldShow = false;
          }
        }
        
        // Timezone filter (if specified, user must match one)
        if (banner.target_timezones?.length > 0 && shouldShow) {
          const userTz = userProfile?.timezone || '';
          if (!userTz || !banner.target_timezones.includes(userTz)) {
            shouldShow = false;
          }
        }
        
        return shouldShow;
      }
      
      return true;
    });
  }, [banners, dismissedIds, location, currentPlaylistId, currentAudioId, currentVideoId, playbackSeconds, userEnrollments, userPlaylists, userTools, userProfile, userInstructorIds]);

  const handleDismiss = (e: React.MouseEvent, banner: PromoBannerData) => {
    e.stopPropagation();
    setDismissal(banner.id);
    setDismissedIds(prev => new Set([...prev, banner.id]));
  };

  const handleTap = (banner: PromoBannerData) => {
    // Also dismiss the banner when tapped (not just when X is clicked)
    setDismissal(banner.id);
    setDismissedIds(prev => new Set([...prev, banner.id]));

    switch (banner.destination_type) {
      case 'routine':
      case 'routines_hub':
        if (banner.destination_id) navigate(`/app/routines/${banner.destination_id}`);
        else navigate('/app/routines');
        break;
      case 'playlist':
        if (banner.destination_id) navigate(`/app/player/playlist/${banner.destination_id}`);
        break;
      case 'journal': navigate('/app/reflections'); break;
      case 'programs': navigate('/app/myprograms'); break;
      case 'breathe': navigate('/app/breathe'); break;
      case 'water': navigate('/app/water'); break;
      case 'channels': navigate('/app/channels'); break;
      case 'home': navigate('/app/home'); break;
      case 'inspire': navigate('/app/routines'); break;
      case 'tasks':
        navigate(banner.destination_id ? `/app/home/new?template=${banner.destination_id}` : '/app/home');
        break;
      case 'tasks_bank':
      case 'planner':
        navigate('/app/home');
        break;
      case 'breathe_exercise': navigate('/app/breathe'); break;
      case 'emotion': navigate('/app/emotion'); break;
      case 'mood': navigate('/app/mood'); break;
      case 'period': navigate('/app/period'); break;
      case 'chat': navigate('/app/chat'); break;
      case 'profile': navigate('/app/myprofile'); break;
      case 'custom_url':
        if (banner.custom_url) {
          smartOpenUrl(banner.custom_url, navigate);
        }
        break;
      case 'external_url':
        if (banner.custom_url) smartOpenUrl(banner.custom_url, navigate);
        break;
      case 'rate': navigate('/app/rate'); break;
      case 'onboarding':
        if (banner.custom_url === 'selfcare-quiz') {
          navigate('/app/onboarding/selfcare-quiz');
        } else if (banner.destination_id) {
          navigate(`/app/onboarding/${banner.destination_id}`);
        }
        break;
      case 'watch': navigate('/app/watch'); break;
      case 'video_playlist':
        navigate(banner.destination_id ? `/app/watch/playlist/${banner.destination_id}` : '/app/watch');
        break;
      case 'routine_player': navigate('/app/routineplayer'); break;
      case 'audio_track':
        if (banner.destination_id) navigate(`/app/player/${banner.destination_id}`);
        break;
      case 'video_track':
        if (banner.destination_id) navigate(`/app/watch/video/${banner.destination_id}`);
        break;
    }
  };
  
  const getAspectRatioClass = (ratio?: string) => {
    switch (ratio) {
      case '16:9': return 'aspect-video';
      case '1:1': return 'aspect-square';
      case '4:1': return 'aspect-[4/1]';
      case 'full': return 'aspect-[9/16]';
      default: return 'aspect-[3/1]';
    }
  };

  // Separate full-screen overlay banners from inline banners
  const fullScreenBanners = eligibleBanners.filter(b => b.aspect_ratio === 'full');
  const inlineBanners = eligibleBanners.filter(b => b.aspect_ratio !== 'full');

  // Page-time delay for full-screen overlay banners
  const [pageSeconds, setPageSeconds] = useState(0);
  const fullBannerCandidate = fullScreenBanners[0];
  const fullDelay = fullBannerCandidate?.display_delay_seconds || 0;

  useEffect(() => {
    if (!fullBannerCandidate || fullDelay <= 0) return;
    const interval = setInterval(() => {
      setPageSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [fullBannerCandidate?.id, fullDelay]);

  const fullBanner = fullBannerCandidate && (fullDelay <= 0 || pageSeconds >= fullDelay)
    ? fullBannerCandidate
    : null;

  const isVisible = eligibleBanners.length > 0;

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  const fullOverlay = fullBanner ? (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => { e.stopPropagation(); handleDismiss(e as any, fullBanner); }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        {/* Close X button — safe area aware */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss(e as any, fullBanner); }}
          className="absolute right-5 z-10 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <X className="h-5 w-5 text-white/70" />
        </button>
        <div
          className="relative w-full max-w-md mx-auto flex flex-col items-center px-4 animate-in slide-in-from-bottom-8 duration-500"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Banner Image */}
          <div
            className="w-full rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-2xl mb-6"
            onClick={() => handleTap(fullBanner)}
          >
            <img
              src={fullBanner.cover_image_url}
              alt="Promo"
              className="w-full object-cover"
            />
          </div>

          {/* Dismiss button */}
          <button
            onClick={(e) => handleDismiss(e as any, fullBanner)}
            className="text-white text-sm font-medium py-2 px-6 active:scale-95 transition-transform"
          >
            Maybe later
          </button>
        </div>
      </div>
    </OverlayPortal>
  ) : null;

  // Carousel mode for inline banners
  if (carousel && inlineBanners.length > 1) {
    return (
      <>
        {fullOverlay}
        <PromoBannerCarousel
          banners={inlineBanners}
          className={className}
          getAspectRatioClass={getAspectRatioClass}
          onTap={handleTap}
          onDismiss={handleDismiss}
        />
      </>
    );
  }

  // Single inline banner mode
  const banner = inlineBanners[0];

  if (!banner && !fullBanner) return null;

  return (
    <>
      {fullOverlay}
      {banner && (
        <div className={className || "px-4 py-2"}>
          <div
            key={banner.id}
            className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => handleTap(banner)}
          >
            <img
              src={banner.cover_image_url}
              alt="Promo"
              className={`w-full ${getAspectRatioClass(banner.aspect_ratio)} object-cover`}
            />
            {(forceShowClose || banner.display_frequency !== 'forever') && (
              <button
                onClick={(e) => handleDismiss(e, banner)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// --- Carousel sub-component ---

function PromoBannerCarousel({
  banners,
  className,
  getAspectRatioClass,
  onTap,
  onDismiss,
}: {
  banners: PromoBannerData[];
  className?: string;
  getAspectRatioClass: (ratio?: string) => string;
  onTap: (banner: PromoBannerData) => void;
  onDismiss: (e: React.MouseEvent, banner: PromoBannerData) => void;
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
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="relative min-w-0 flex-[0_0_100%] cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onTap(banner)}
            >
              <img
                src={banner.cover_image_url}
                alt="Promo"
                className={`w-full ${getAspectRatioClass(banner.aspect_ratio)} object-cover`}
              />
              {banner.display_frequency !== 'forever' && (
                <button
                  onClick={(e) => onDismiss(e, banner)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === selectedIndex
                ? "w-4 bg-foreground/70"
                : "w-1.5 bg-foreground/20"
            )}
          />
        ))}
      </div>
    </div>
  );
}
