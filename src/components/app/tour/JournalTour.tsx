import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface JournalTourProps {
  isFirstVisit?: boolean;
}

export function JournalTour({ isFirstVisit = false }: JournalTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Your Journal 📝',
      description: 'Your private space to reflect.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'new-entry',
      target: '.tour-new-entry',
      title: 'Start Writing',
      description: 'Tap + to start writing.',
      position: 'left',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-new-entry'),
    },
    {
      id: 'mood',
      target: '.tour-mood-selector',
      title: 'Track Your Mood',
      description: 'Track how you feel over time.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-mood-selector'),
    },
    {
      id: 'done',
      title: 'Your Story Matters 💜',
      description: 'A few words each day make a difference.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'journal',
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
