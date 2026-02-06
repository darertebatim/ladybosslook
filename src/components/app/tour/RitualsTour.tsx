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
      title: 'Your Rituals Library ✨',
      description: 'Browse ready-made daily rituals designed to build healthy habits. Each ritual contains multiple actions you can add to your day.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'categories',
      target: '.tour-ritual-categories',
      title: 'Categories',
      description: 'Filter rituals by category: Morning, Evening, Focus, Self-care, and more.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-ritual-categories'),
    },
    {
      id: 'ritual-card',
      target: '.tour-ritual-card',
      title: 'Preview Any Ritual',
      description: 'Tap a ritual card to preview its actions. You can add individual actions or the whole ritual at once.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-ritual-card'),
    },
    {
      id: 'done',
      title: 'Build Your Perfect Day 🌟',
      description: 'Mix and match actions from different rituals to create a routine that works for you.',
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
