import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import tourWelcomeImage from '@/assets/tour-welcome.png';

const TOUR_PROMPT_KEY = 'simora_tour_prompt_shown';

interface TourWelcomePopupProps {
  isFirstOpen: boolean;
  onStartTour: () => void;
  onSkipTour: () => void;
}

export function TourWelcomePopup({ 
  isFirstOpen, 
  onStartTour, 
  onSkipTour 
}: TourWelcomePopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show if it's first open and we haven't shown the prompt before
    if (isFirstOpen) {
      const hasShown = localStorage.getItem(TOUR_PROMPT_KEY);
      if (!hasShown) {
        // Small delay to let the page render first
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
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
    localStorage.setItem(TOUR_PROMPT_KEY, 'true');
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
};
