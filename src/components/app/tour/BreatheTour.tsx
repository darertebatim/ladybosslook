import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface BreatheTourProps {
  isFirstVisit?: boolean;
}

export function BreatheTour({ isFirstVisit = false }: BreatheTourProps) {
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
    triggerOnMount: isFirstVisit,
  });

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
