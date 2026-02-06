import { useEffect, useState, useRef } from 'react';
import { TourStep, setGlobalTourActive } from '@/hooks/useFeatureTour';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface TourOverlayProps {
  isActive: boolean;
  currentStep: TourStep | undefined;
  currentStepIndex: number;
  totalSteps: number;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay({
  isActive,
  currentStep,
  currentStepIndex,
  totalSteps,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TourOverlayProps) {
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Update global tour state
  useEffect(() => {
    setGlobalTourActive(isActive);
    return () => setGlobalTourActive(false);
  }, [isActive]);

  // Calculate spotlight position
  useEffect(() => {
    if (!isActive || !currentStep) {
      setSpotlightRect(null);
      return;
    }

    if (!currentStep.target) {
      // Full-screen step (no spotlight)
      setSpotlightRect(null);
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(currentStep.target!);
      if (!element) {
        setSpotlightRect(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      setSpotlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Calculate tooltip position
      const position = currentStep.position || 'bottom';
      let tooltipTop = 0;
      let tooltipLeft = rect.left + rect.width / 2;

      switch (position) {
        case 'top':
          tooltipTop = rect.top - 16;
          break;
        case 'bottom':
          tooltipTop = rect.bottom + 16;
          break;
        case 'left':
          tooltipTop = rect.top + rect.height / 2;
          tooltipLeft = rect.left - 16;
          break;
        case 'right':
          tooltipTop = rect.top + rect.height / 2;
          tooltipLeft = rect.right + 16;
          break;
        case 'center':
          tooltipTop = window.innerHeight / 2;
          tooltipLeft = window.innerWidth / 2;
          break;
      }

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
    };

    updatePosition();
    
    // Recalculate on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, currentStep]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex, onSkip, onNext, onPrev]);

  const handleNext = () => {
    haptic.light();
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  const handlePrev = () => {
    haptic.light();
    onPrev();
  };

  const handleSkip = () => {
    haptic.light();
    onSkip();
  };

  if (!isActive || !currentStep) return null;

  const position = currentStep.position || 'bottom';
  const isCenter = position === 'center' || !currentStep.target;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Backdrop with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight ring */}
      {spotlightRect && (
        <div
          className="absolute rounded-xl ring-4 ring-primary/50 ring-offset-2 ring-offset-transparent animate-pulse"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "absolute bg-card rounded-2xl shadow-2xl p-5 max-w-[300px] w-[90vw] border border-border/50",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          isCenter && "-translate-x-1/2 -translate-y-1/2",
          position === 'top' && "-translate-x-1/2 -translate-y-full",
          position === 'bottom' && "-translate-x-1/2",
          position === 'left' && "-translate-x-full -translate-y-1/2",
          position === 'right' && "-translate-y-1/2"
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Action indicator */}
        {currentStep.action && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
            <Sparkles className="h-3 w-3" />
            {currentStep.action === 'tap' && 'Try tapping'}
            {currentStep.action === 'swipe' && 'Try swiping'}
            {currentStep.action === 'look' && 'Take a look'}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-foreground text-lg pr-6 mb-1">
          {currentStep.title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === currentStepIndex ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="h-8 px-4"
            >
              {isLastStep ? "Got it!" : "Next"}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
