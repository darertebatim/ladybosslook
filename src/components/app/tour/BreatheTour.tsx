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
      title: 'Breathing Exercises 🌬️',
      description: 'Calm your mind with guided breathing. Just a few minutes can reduce stress and improve focus.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'exercises',
      target: '.tour-exercise-card',
      title: 'Choose an Exercise',
      description: 'Each technique has different benefits: relaxation, energy, focus, or sleep.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-exercise-card'),
    },
    {
      id: 'done',
      title: 'Breathe & Be Present 🧘',
      description: 'Start with 1-2 minutes. Consistency matters more than duration.',
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
