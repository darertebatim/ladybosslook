import { useMemo, useImperativeHandle, forwardRef } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

export interface RitualsTourRef {
  startTour: () => void;
}

export const RitualsTour = forwardRef<RitualsTourRef>(function RitualsTour(_, ref) {
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
      target: '.tour-actions-section-header',
      title: 'Individual Actions',
      description: 'Individual actions live here. Each one can be added to your planner separately.',
      position: 'top',
      action: 'look',
      condition: () => !!document.querySelector('.tour-actions-section-header'),
    },
    {
      id: 'add-action-btn',
      target: '.tour-action-add-btn',
      title: 'Add to My Rituals',
      description: 'Tap the + button to add any action to your daily planner. Customize time, repeat, and reminders.',
      position: 'left',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-action-add-btn'),
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
    triggerOnMount: false, // On-demand only
  });

  // Expose startTour to parent via ref
  useImperativeHandle(ref, () => ({
    startTour: () => tour.forceStartTour(),
  }), [tour]);

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
});
