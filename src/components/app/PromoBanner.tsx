import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type DisplayLocation = 'home_top' | 'home_rituals' | 'explore' | 'listen' | 'player' | 'all';

interface PromoBannerData {
  id: string;
  cover_image_url: string;
  destination_type: 'routine' | 'playlist' | 'journal' | 'programs' | 'breathe' | 'water' | 'channels' | 'home' | 'inspire' | 'custom_url' | 'tasks' | 'routines_hub' | 'tasks_bank' | 'breathe_exercise' | 'external_url' | 'emotion' | 'period' | 'chat' | 'profile' | 'planner';
  destination_id: string | null;
  custom_url: string | null;
  display_frequency: 'once' | 'daily' | 'weekly';
  aspect_ratio: '3:1' | '16:9' | '1:1';
  target_type: 'all' | 'enrolled' | 'custom';
  include_programs: string[];
  exclude_programs: string[];
  include_playlists: string[];
  exclude_playlists: string[];
  include_tools: string[];
  exclude_tools: string[];
  display_location: DisplayLocation;
  target_playlist_ids: string[];
}

interface PromoBannerProps {
  location?: DisplayLocation;
  currentPlaylistId?: string;
  className?: string;
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
  
  const now = Date.now();
  const hoursSinceDismissal = (now - dismissedAt) / (1000 * 60 * 60);
  
  switch (banner.display_frequency) {
    case 'once':
      return false; // Never show again
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
  className 
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
      
      // Check journal entries
      const { count: journalCount } = await supabase
        .from('journal_entries')
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

  // Filter banners based on location and targeting
  const eligibleBanners = useMemo(() => {
    if (!banners) return [];
    
    return banners.filter(banner => {
      // Always check dismiss status first
      if (!shouldShowBanner(banner) || dismissedIds.has(banner.id)) {
        return false;
      }
      
      // Location filter - banner must be for this location or 'all'
      const bannerLocation = banner.display_location || 'home';
      if (bannerLocation !== 'all' && bannerLocation !== location) {
        return false;
      }
      
      // For player location: check playlist targeting
      if (location === 'player' && banner.target_playlist_ids?.length > 0) {
        if (!currentPlaylistId || !banner.target_playlist_ids.includes(currentPlaylistId)) {
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
        
        return shouldShow;
      }
      
      return true;
    });
  }, [banners, dismissedIds, location, currentPlaylistId, userEnrollments, userPlaylists, userTools]);

  // Get first eligible banner
  const activeBanner = eligibleBanners[0];

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeBanner) {
      setDismissal(activeBanner.id);
      setDismissedIds(prev => new Set([...prev, activeBanner.id]));
    }
  };

  const handleTap = () => {
    if (!activeBanner) return;
    
    // Also dismiss the banner when tapped (not just when X is clicked)
    setDismissal(activeBanner.id);
    setDismissedIds(prev => new Set([...prev, activeBanner.id]));

    switch (activeBanner.destination_type) {
      case 'routine':
        if (activeBanner.destination_id) {
          navigate(`/app/routines/${activeBanner.destination_id}`);
        }
        break;
      case 'playlist':
        if (activeBanner.destination_id) {
          navigate(`/app/playlist/${activeBanner.destination_id}`);
        }
        break;
      case 'journal':
        navigate('/app/journal');
        break;
      case 'programs':
        navigate('/app/programs');
        break;
      case 'breathe':
        navigate('/app/breathe');
        break;
      case 'water':
        navigate('/app/water');
        break;
      case 'channels':
        navigate('/app/channels');
        break;
      case 'home':
        navigate('/app/home');
        break;
      case 'inspire':
        navigate('/app/routines');
        break;
      case 'tasks':
        if (activeBanner.destination_id) {
          // Navigate to task creation with pre-selected template
          navigate(`/app/tasks/create?template=${activeBanner.destination_id}`);
        }
        break;
      case 'routines_hub':
        if (activeBanner.destination_id) {
          navigate(`/app/routines/bank/${activeBanner.destination_id}`);
        } else {
          navigate('/app/routines');
        }
        break;
      case 'tasks_bank':
        navigate('/app/tasks/bank');
        break;
      case 'breathe_exercise':
        if (activeBanner.destination_id) {
          navigate(`/app/breathe/${activeBanner.destination_id}`);
        } else {
          navigate('/app/breathe');
        }
        break;
      case 'emotion':
        navigate('/app/emotion');
        break;
      case 'period':
        navigate('/app/period');
        break;
      case 'chat':
        navigate('/app/chat');
        break;
      case 'profile':
        navigate('/app/profile');
        break;
      case 'planner':
        navigate('/app/home'); // Planner is on home
        break;
      case 'custom_url':
        if (activeBanner.custom_url) {
          if (activeBanner.custom_url.startsWith('http')) {
            window.open(activeBanner.custom_url, '_blank');
          } else {
            navigate(activeBanner.custom_url);
          }
        }
        break;
      case 'external_url':
        if (activeBanner.custom_url) {
          window.open(activeBanner.custom_url, '_blank');
        }
        break;
    }
  };
  
  const getAspectRatioClass = () => {
    switch (activeBanner?.aspect_ratio) {
      case '16:9': return 'aspect-video';
      case '1:1': return 'aspect-square';
      default: return 'aspect-[3/1]';
    }
  };

  if (!activeBanner) return null;

  return (
    <div className={className || "px-4 py-2"}>
      <div
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        onClick={handleTap}
      >
        {/* Banner Image */}
        <img
          src={activeBanner.cover_image_url}
          alt="Promo"
          className={`w-full ${getAspectRatioClass()} object-cover`}
        />
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
