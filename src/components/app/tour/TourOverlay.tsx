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
    const safeMargin = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const isMobile = viewportWidth <= 430;
    const maxTooltipHeight = Math.max(220, viewportHeight - safeMargin * 2);

    // For center position or no target
    if (position === 'center' || !targetRect) {
      const width = Math.min(viewportWidth - safeMargin * 2, 360);
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${width}px`,
        maxHeight: `${maxTooltipHeight}px`,
      };
    }

    // Mobile: always pin to bottom so it never goes off-screen (prevents "stuck" tours)
    if (isMobile) {
      return {
        top: 'auto',
        left: `${safeMargin}px`,
        right: `${safeMargin}px`,
        bottom: `${safeMargin}px`,
        transform: 'none',
        maxHeight: `${maxTooltipHeight}px`,
      };
    }

    const tooltipWidth = Math.min(viewportWidth - padding * 2, 320);
    const measuredHeight = tooltipEl?.offsetHeight || 200;
    const tooltipHeight = Math.min(measuredHeight, maxTooltipHeight);

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
      maxHeight: `${maxTooltipHeight}px`,
    };
  }, []);

  // Calculate spotlight position and elevate target element
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

    let targetElement: Element | null = null;
    let originalZIndex: string | null = null;
    let originalPosition: string | null = null;

    const updatePosition = () => {
      const element = document.querySelector(currentStep.target!);
      if (!element) {
        setSpotlightRect(null);
        setTooltipStyle(calculateTooltipPosition(null, 'center', tooltipRef.current));
        return;
      }

      // Store reference and elevate z-index to bring element above overlay backdrop
      if (element !== targetElement) {
        // Restore previous element if different
        if (targetElement instanceof HTMLElement && originalZIndex !== null) {
          targetElement.style.zIndex = originalZIndex;
          if (originalPosition) targetElement.style.position = originalPosition;
        }
        
        targetElement = element;
        if (element instanceof HTMLElement) {
          originalZIndex = element.style.zIndex;
          originalPosition = element.style.position;
          // Elevate element above the overlay backdrop (z-99999) but below tooltip (z-100001)
          element.style.zIndex = '99998';
          // Ensure it has a position context for z-index to work
          const computedPosition = window.getComputedStyle(element).position;
          if (computedPosition === 'static') {
            element.style.position = 'relative';
          }
        }
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

    // Scroll element into view first, then update position
    const element = document.querySelector(currentStep.target!);
    if (element) {
      // Scroll the element into view with padding
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Wait for scroll to complete before calculating positions
      const scrollTimer = setTimeout(updatePosition, 400);
      
      // Recalculate on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        clearTimeout(scrollTimer);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        
        // Restore original z-index when step changes or tour ends
        if (targetElement instanceof HTMLElement && originalZIndex !== null) {
          targetElement.style.zIndex = originalZIndex;
          if (originalPosition) targetElement.style.position = originalPosition;
        }
      };
    } else {
      // Element not found, show centered
      setSpotlightRect(null);
      setTooltipStyle(calculateTooltipPosition(null, 'center', tooltipRef.current));
    }
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
    <div className="fixed inset-0 z-[99999] pointer-events-auto">
      {/* Backdrop with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 99999 }}>
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

      {/* Spotlight ring - visual highlight */}
      {spotlightRect && (
        <div
          className="absolute rounded-xl ring-4 ring-primary/50 ring-offset-2 ring-offset-transparent animate-pulse pointer-events-none"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            zIndex: 100000,
          }}
        />
      )}

      {/* Tooltip - Mobile optimized - highest z-index */}
      <div
        ref={tooltipRef}
        className={cn(
          "absolute bg-card rounded-2xl shadow-2xl border border-border/50",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          // Mobile-first padding
          "p-4 sm:p-5",
          // Prevent long text from pushing buttons off-screen
          "flex flex-col max-h-[calc(100vh-24px)] overflow-hidden"
        )}
        style={{ ...tooltipStyle, zIndex: 100001 }}
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

        {/* Scrollable body (keeps buttons visible) */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="text-foreground text-sm leading-relaxed pb-4">
            {currentStep.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3">
          {/* Progress indicator - compact for many steps */}
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">
              {currentStepIndex + 1} / {totalSteps}
            </span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
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
            </div>
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
