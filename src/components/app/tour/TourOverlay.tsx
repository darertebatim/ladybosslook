import { useEffect, useState, useRef, useCallback } from 'react';
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
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Update global tour state
  useEffect(() => {
    setGlobalTourActive(isActive);
    return () => setGlobalTourActive(false);
  }, [isActive]);

  // Calculate tooltip position with viewport bounds checking
  const calculateTooltipPosition = useCallback((
    targetRect: DOMRect | null,
    position: string,
    tooltipEl: HTMLDivElement | null
  ): React.CSSProperties => {
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // For center position or no target
    if (position === 'center' || !targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const tooltipWidth = Math.min(viewportWidth - padding * 2, 320);
    const tooltipHeight = tooltipEl?.offsetHeight || 200;
    
    let top: number;
    let left: number;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
      default:
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    }

    // Keep tooltip within viewport bounds (mobile-optimized)
    const safeMargin = 12;
    
    // Horizontal bounds
    if (left < safeMargin) {
      left = safeMargin;
    } else if (left + tooltipWidth > viewportWidth - safeMargin) {
      left = viewportWidth - tooltipWidth - safeMargin;
    }

    // Vertical bounds - if tooltip goes off screen, flip position
    if (top < safeMargin) {
      // If top position doesn't fit, try bottom
      if (position === 'top' && targetRect) {
        top = targetRect.bottom + padding;
      } else {
        top = safeMargin;
      }
    } else if (top + tooltipHeight > viewportHeight - safeMargin) {
      // If bottom doesn't fit, try top
      if (position === 'bottom' && targetRect) {
        top = targetRect.top - tooltipHeight - padding;
        if (top < safeMargin) top = safeMargin;
      } else {
        top = viewportHeight - tooltipHeight - safeMargin;
      }
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    };
  }, []);

  // Calculate spotlight position
  useEffect(() => {
    if (!isActive || !currentStep) {
      setSpotlightRect(null);
      return;
    }

    if (!currentStep.target) {
      // Full-screen step (no spotlight)
      setSpotlightRect(null);
      setTooltipStyle(calculateTooltipPosition(null, 'center', tooltipRef.current));
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(currentStep.target!);
      if (!element) {
        setSpotlightRect(null);
        setTooltipStyle(calculateTooltipPosition(null, 'center', tooltipRef.current));
        return;
      }

      const rect = element.getBoundingClientRect();
      const spotlightPadding = 8;
      
      setSpotlightRect({
        top: rect.top - spotlightPadding,
        left: rect.left - spotlightPadding,
        width: rect.width + spotlightPadding * 2,
        height: rect.height + spotlightPadding * 2,
      });

      const position = currentStep.position || 'bottom';
      setTooltipStyle(calculateTooltipPosition(rect, position, tooltipRef.current));
    };

    // Initial update with small delay for tooltip to render
    const initialTimer = setTimeout(updatePosition, 50);
    updatePosition();
    
    // Recalculate on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, currentStep, calculateTooltipPosition]);

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
  }, [isActive, currentStepIndex, onSkip]);

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

  const isCenter = currentStep.position === 'center' || !currentStep.target;

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
          className="absolute rounded-xl ring-4 ring-primary/50 ring-offset-2 ring-offset-transparent animate-pulse pointer-events-none"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}

      {/* Tooltip - Mobile optimized */}
      <div
        ref={tooltipRef}
        className={cn(
          "absolute bg-card rounded-2xl shadow-2xl border border-border/50",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          // Mobile-first padding
          "p-4 sm:p-5"
        )}
        style={tooltipStyle}
      >
        {/* Skip button - larger touch target for mobile */}
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95 rounded-full hover:bg-muted/50"
          aria-label="Skip tour"
        >
          <X className="h-5 w-5" />
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
        <h3 className="font-semibold text-foreground text-base sm:text-lg pr-6 mb-1">
          {currentStep.title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          {/* Progress dots */}
          <div className="flex gap-1.5 flex-shrink-0">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors",
                  i === currentStepIndex ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {currentStepIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="h-9 w-9 p-0 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="h-9 px-4 active:scale-95"
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
