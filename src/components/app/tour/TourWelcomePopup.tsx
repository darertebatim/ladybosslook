import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import tourWelcomeImage from '@/assets/tour-welcome.png';

const TOUR_PROMPT_KEY = 'simora_tour_prompt_shown';
const TOUR_PROMPT_DISMISSED_KEY = 'simora_tour_prompt_dismissed_at';
const TOUR_RE_PROMPT_DAYS = 3; // Re-prompt after 3 days
interface TourWelcomePopupProps {
  isFirstOpen: boolean;
  onStartTour: () => void;
  onSkipTour: () => void;
}

/**
 * Check if PN onboarding is currently active or about to show
 * Tour popup should wait until PN flow is resolved
 */
const isPNOnboardingPending = (): boolean => {
  // If PN onboarding already completed, we're clear
  if (localStorage.getItem('pushOnboardingCompleted') === 'true') return false;
  
  // If PN onboarding was dismissed, check if enough time has passed for re-show
  const dismissedAt = localStorage.getItem('pushOnboardingDismissed');
  if (dismissedAt) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
    // If dismissed less than 3 days ago, PN popup won't show, so we're clear
    if (daysSinceDismissed < 3) return false;
  }
  
  // Otherwise, PN popup might be pending (will show after 2s)
  return true;
};

export function TourWelcomePopup({ 
  isFirstOpen, 
  onStartTour, 
  onSkipTour 
}: TourWelcomePopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if tours were just reset - force show popup
    const justReset = localStorage.getItem('simora_tours_just_reset') === 'true';
    if (justReset) {
      localStorage.removeItem('simora_tours_just_reset');
      // Small delay to let page settle
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
    
    if (!isFirstOpen) return;
    
    // Check if tour was completed (started and finished)
    const hasCompleted = localStorage.getItem(TOUR_PROMPT_KEY) === 'true';
    if (hasCompleted) return;
    
    // Check if dismissed - if so, only re-prompt after X days
    const dismissedAt = localStorage.getItem(TOUR_PROMPT_DISMISSED_KEY);
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < TOUR_RE_PROMPT_DAYS) return;
    }
    
    // Wait for PN popup to resolve first (3.5s delay to ensure PN shows first at 2s)
    const delay = isPNOnboardingPending() ? 3500 : 500;
    const timer = setTimeout(() => {
      // Double-check PN isn't showing right now
      const pnPopupActive = document.querySelector('[data-pn-onboarding="true"]');
      if (pnPopupActive) {
        // PN popup is active, wait for it to close
        const observer = new MutationObserver(() => {
          if (!document.querySelector('[data-pn-onboarding="true"]')) {
            observer.disconnect();
            setTimeout(() => setIsOpen(true), 500);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return;
      }
      setIsOpen(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [isFirstOpen]);

  const handleStartTour = () => {
    localStorage.setItem(TOUR_PROMPT_KEY, 'true');
    setIsOpen(false);
    // Small delay before starting tour
    setTimeout(() => {
      onStartTour();
    }, 300);
  };

  const handleLater = () => {
    // Store dismissal timestamp - will re-prompt after TOUR_RE_PROMPT_DAYS
    localStorage.setItem(TOUR_PROMPT_DISMISSED_KEY, Date.now().toString());
    setIsOpen(false);
    onSkipTour();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        hideCloseButton
        className="w-[min(420px,calc(100vw-24px))] max-w-none border-0 bg-gradient-to-b from-accent/30 to-background p-0 overflow-hidden rounded-3xl shadow-2xl max-h-[92vh] sm:max-w-md"
      >
        {/* Image Section - Square */}
        <div className="relative w-full aspect-square overflow-hidden">
          <img 
            src={tourWelcomeImage} 
            alt="Take a Tour" 
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Buttons Only */}
        <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 flex flex-col gap-3">
          <Button 
            onClick={handleStartTour}
            className="w-full h-12 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-semibold text-base gap-2"
          >
            <Sparkles className="h-5 w-5" />
            Let's Go
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleLater}
            className="w-full h-11 rounded-2xl bg-accent/20 text-foreground/80 hover:text-foreground hover:bg-accent/30 font-medium"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to reset the tour prompt (for testing)
export const resetTourPrompt = () => {
  localStorage.removeItem(TOUR_PROMPT_KEY);
  localStorage.removeItem(TOUR_PROMPT_DISMISSED_KEY);
};
