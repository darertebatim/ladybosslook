import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock } from 'lucide-react';
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
        className="sm:max-w-md border-0 bg-gradient-to-b from-accent/30 to-background p-0 overflow-hidden rounded-3xl shadow-2xl"
      >
        {/* Image Section */}
        <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-accent/40 via-accent/20 to-accent/10">
          <img 
            src={tourWelcomeImage} 
            alt="Welcome to Simora" 
            className="w-full h-full object-cover"
          />
          {/* Subtle overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        {/* Content Section */}
        <div className="px-6 pb-6 pt-2 text-center space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to Simora! ✨
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              We're so glad you're here. Ready for a quick tour?
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleStartTour}
              className="w-full h-12 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-semibold text-base gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Show Me Around
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleLater}
              className="w-full h-11 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent/30 font-medium gap-2"
            >
              <Clock className="h-4 w-4" />
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to reset the tour prompt (for testing)
export const resetTourPrompt = () => {
  localStorage.removeItem(TOUR_PROMPT_KEY);
};
