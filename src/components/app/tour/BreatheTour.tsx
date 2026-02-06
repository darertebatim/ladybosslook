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
      description: 'Breathing exercises to calm your mind.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'exercises',
      target: '.tour-exercise-card',
      title: 'Choose an Exercise',
      description: 'Each one has a different purpose. Try one.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-exercise-card'),
    },
    {
      id: 'add-to-routine',
      target: '.tour-add-to-routine',
      title: 'Add to Your Day',
      description: 'Add this to your daily plan.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-add-to-routine'),
    },
    {
      id: 'done',
      title: 'Just Breathe 🧘',
      description: 'Even one minute helps.',
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
