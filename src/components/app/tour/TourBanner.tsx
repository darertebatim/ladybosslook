import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TOUR_PROMPT_KEY = 'simora_tour_prompt_shown';
const TOUR_PROMPT_DISMISSED_KEY = 'simora_tour_prompt_dismissed_at';
const TOUR_RE_PROMPT_DAYS = 3;
const TOUR_SERVER_FORCE_SEEN_KEY = 'simora_tour_server_force_seen_at';

interface TourBannerProps {
  isFirstOpen: boolean;
  onStartTour: () => void;
  forceShow?: boolean; // Server indicates new user (totalCompletions === 0)
}

export function TourBanner({ isFirstOpen, onStartTour, forceShow = false }: TourBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Check for reset flag on every render
  useEffect(() => {
    const checkForReset = () => {
      const justReset = localStorage.getItem('simora_tours_just_reset') === 'true';
      if (justReset) {
        localStorage.removeItem('simora_tours_just_reset');
        setIsVisible(true);
        return true;
      }
      return false;
    };

    if (checkForReset()) return;

    // Poll briefly in case the flag is set after mount
    const pollInterval = setInterval(() => {
      if (checkForReset()) {
        clearInterval(pollInterval);
      }
    }, 200);

    const stopPolling = setTimeout(() => clearInterval(pollInterval), 2000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(stopPolling);
    };
  }, []);

  // Check server-side force show setting for existing users
  useEffect(() => {
    const checkServerForce = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'force_tour_banner_until')
          .single();
        
        if (!data?.value) return;
        
        const forceUntil = new Date(data.value);
        const now = new Date();
        
        // If we're past the force period, don't show
        if (now > forceUntil) return;
        
        // Check if user already saw the banner after the force was set
        const lastSeenAt = localStorage.getItem(TOUR_SERVER_FORCE_SEEN_KEY);
        if (lastSeenAt) {
          const seenDate = new Date(lastSeenAt);
          // If they saw it after the current force period started, don't show again
          // The force period started 7 days before forceUntil
          const forceStarted = new Date(forceUntil.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (seenDate > forceStarted) return;
        }
        
        // Show banner for existing users
        setTimeout(() => setIsVisible(true), 500);
      } catch (error) {
        // Silently fail - not critical
      }
    };
    
    // Only check if not already showing for new users
    if (!isFirstOpen && !forceShow) {
      checkServerForce();
    }
  }, [isFirstOpen, forceShow]);

  // Normal first-open flow
  useEffect(() => {
    if (!isFirstOpen) return;

    // When server says totalCompletions === 0 (forceShow), ignore localStorage flags
    // This handles remote admin reset where the user's localStorage wasn't cleared
    if (forceShow) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }

    // Check if tour was completed
    const hasCompleted = localStorage.getItem(TOUR_PROMPT_KEY) === 'true';
    if (hasCompleted) return;

    // Check if dismissed - only re-prompt after X days
    const dismissedAt = localStorage.getItem(TOUR_PROMPT_DISMISSED_KEY);
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < TOUR_RE_PROMPT_DAYS) return;
    }

    // Show banner after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [isFirstOpen, forceShow]);

  const handleStartTour = () => {
    localStorage.setItem(TOUR_PROMPT_KEY, 'true');
    localStorage.setItem(TOUR_SERVER_FORCE_SEEN_KEY, new Date().toISOString());
    setIsVisible(false);
    setTimeout(() => {
      onStartTour();
    }, 300);
  };

  const handleDismiss = () => {
    localStorage.setItem(TOUR_PROMPT_DISMISSED_KEY, Date.now().toString());
    localStorage.setItem(TOUR_SERVER_FORCE_SEEN_KEY, new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 z-10 rounded-full bg-muted/80 p-1.5 text-muted-foreground active:scale-95"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 p-4 pr-12">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">New here?</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Start a quick Home tour and I’ll point out the main parts before you explore.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleStartTour}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
            >
              Show me around
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={handleDismiss}
              className="inline-flex min-h-10 items-center rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground active:scale-[0.98]"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to reset the tour prompt (for testing)
export const resetTourPrompt = () => {
  localStorage.removeItem(TOUR_PROMPT_KEY);
  localStorage.removeItem(TOUR_PROMPT_DISMISSED_KEY);
};
