import { useMemo, useEffect } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface BreatheTourProps {
  isFirstVisit?: boolean;
  onTourReady?: (startTour: () => void) => void;
}

export function BreatheTour({ isFirstVisit = false, onTourReady }: BreatheTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Take a Breath 🌬️',
      description: 'These exercises help calm your mind. Pick one that matches how you feel.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'categories',
      target: '.tour-categories',
      title: 'Filter by Goal',
      description: 'Tap to filter: Calm, Focus, Energy, or Sleep. Each category has different rhythms.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-categories'),
    },
    {
      id: 'exercises',
      target: '.tour-exercise-card',
      title: 'Start an Exercise',
      description: 'Tap any card to begin. Follow the circle animation to breathe in and out.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-exercise-card'),
    },
    {
      id: 'add-to-rituals',
      target: '.tour-add-to-routine',
      title: 'Add to Rituals',
      description: 'Tap the + button to add this breathing exercise to your Rituals (Planner) so you can repeat it daily.',
      position: 'left',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-add-to-routine'),
    },
    {
      id: 'done',
      title: 'Just One Minute 🧘',
      description: 'Even one minute makes a difference. Your sessions are tracked automatically.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'breathe',
    steps,
    triggerOnMount: false,
  });

  // Expose forceStartTour to parent
  useEffect(() => {
    if (onTourReady) {
      onTourReady(tour.forceStartTour);
    }
  }, [onTourReady, tour.forceStartTour]);

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
