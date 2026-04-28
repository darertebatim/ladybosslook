import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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

  return (
    <Sheet open={isVisible} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t-0 px-6 pt-8 pb-10 max-h-[88vh]"
      >
        <div className="flex flex-col items-center text-center -mx-6 -mt-8 -mb-10">
          <div className="w-full bg-gradient-to-b from-primary/20 via-accent/20 to-background px-6 pt-8 pb-4 flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-4 ring-primary/30 shadow-xl shadow-primary/20">
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-foreground">
              Welcome to Rilo!
            </h2>

            <p className="mt-2 text-sm text-foreground/70 max-w-sm">
              Let me give you a quick tour of your Home — I'll point out the main parts so you feel right at ease.
            </p>
          </div>

          <div className="w-full px-6 pb-10 flex flex-col items-center">
            <div className="mt-6 w-full rounded-2xl bg-gradient-to-br from-accent/40 via-secondary/20 to-primary/15 p-5 space-y-3 text-left border border-primary/10 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                What you'll discover
              </p>
              <div className="flex items-start gap-3">
                <span className="text-xl">📋</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Your daily planner</p>
                  <p className="text-xs text-foreground/65">Routines and tasks built for your day.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Self-care shortcuts</p>
                  <p className="text-xs text-foreground/65">Quick access to mood, breathe, and more.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Streaks & badges</p>
                  <p className="text-xs text-foreground/65">Celebrate your daily wins.</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartTour}
              className="mt-6 w-full h-12 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-primary-foreground shadow-md shadow-primary/30"
            >
              Show me around
            </Button>

            <button
              onClick={handleDismiss}
              className="mt-3 text-sm font-medium text-muted-foreground active:scale-[0.98]"
            >
              Maybe later
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper to reset the tour prompt (for testing)
export const resetTourPrompt = () => {
  localStorage.removeItem(TOUR_PROMPT_KEY);
  localStorage.removeItem(TOUR_PROMPT_DISMISSED_KEY);
};
