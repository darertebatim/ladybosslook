import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

interface PromoBanner {
  id: string;
  cover_image_url: string;
  destination_type: 'routine' | 'playlist' | 'journal' | 'programs' | 'breathe' | 'water' | 'channels' | 'home' | 'inspire' | 'custom_url' | 'tasks' | 'routines_hub' | 'tasks_bank' | 'breathe_exercise' | 'external_url' | 'emotion' | 'period' | 'chat' | 'profile' | 'planner';
  destination_id: string | null;
  custom_url: string | null;
  display_frequency: 'once' | 'daily' | 'weekly';
  aspect_ratio: '3:1' | '16:9' | '1:1';
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

function shouldShowBanner(banner: PromoBanner): boolean {
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

export function PromoBanner() {
  const navigate = useNavigate();
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
      return data as PromoBanner[];
    },
  });

  // Find the first banner that should be shown
  const activeBanner = banners?.find(
    (banner) => shouldShowBanner(banner) && !dismissedIds.has(banner.id)
  );

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
    <div className="px-4 py-2">
      <div
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        onClick={handleTap}
      >
        {/* Banner Image */}
        <img
          src={activeBanner.cover_image_url}
          alt="Promo"
          className="w-full aspect-[3/1] object-cover"
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
