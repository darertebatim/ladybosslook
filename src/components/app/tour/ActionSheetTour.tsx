import { useMemo, useEffect } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface ActionSheetTourProps {
  isOpen: boolean;
}

export function ActionSheetTour({ isOpen }: ActionSheetTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'suggestions',
      title: 'Quick Actions 💡',
      description: 'Browse pre-made actions organized by category. Tap the + to add any action to your day.',
      target: '.tour-action-suggestions',
      position: 'top',
      action: 'tap',
    },
    {
      id: 'buttons',
      title: 'Try Something New 🎲',
      description: 'Tap "Random" for a surprise action, or "Browse All" to see the full collection.',
      target: '.tour-action-buttons',
      position: 'bottom',
      action: 'tap',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'action-sheet',
    steps,
    triggerOnMount: false,
  });

  // Trigger tour when sheet opens (only if not completed)
  useEffect(() => {
    if (isOpen && !tour.hasCompleted) {
      // Small delay to ensure sheet is fully rendered
      const timer = setTimeout(() => {
        tour.startTour();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, tour.hasCompleted, tour.startTour]);

  // Dismiss tour when sheet closes
  useEffect(() => {
    if (!isOpen && tour.isActive) {
      tour.dismissTour();
    }
  }, [isOpen, tour.isActive, tour.dismissTour]);

  if (!isOpen) return null;

  return (
    <TourOverlay
      isActive={tour.isActive}
      currentStep={tour.currentStep}
      currentStepIndex={tour.currentStepIndex}
      totalSteps={tour.totalSteps}
      isLastStep={tour.isLastStep}
      onNext={tour.nextStep}
      onPrev={tour.prevStep}
      onSkip={tour.completeTour}
      onComplete={tour.completeTour}
    />
  );
}
