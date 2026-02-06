import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface RitualsTourProps {
  isFirstVisit?: boolean;
}

export function RitualsTour({ isFirstVisit = false }: RitualsTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Your Rituals ✨',
      description: 'These are ready-made rituals. Pick what feels right.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'categories',
      target: '.tour-ritual-categories',
      title: 'Categories',
      description: 'Filter by type: morning, evening, focus, and more.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-ritual-categories'),
    },
    {
      id: 'ritual-card',
      target: '.tour-ritual-card',
      title: 'Preview Any Ritual',
      description: "Tap any ritual to see what's inside.",
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-ritual-card'),
    },
    {
      id: 'actions-section',
      target: '.tour-actions-section',
      title: 'Individual Actions',
      description: 'Individual actions live here. Add one at a time.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-actions-section'),
    },
    {
      id: 'done',
      title: 'Start Small 🌱',
      description: 'Start small. One action is enough.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'rituals',
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
