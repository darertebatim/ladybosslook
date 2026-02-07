import { useMemo, useEffect } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface JournalTourProps {
  isFirstVisit?: boolean;
  onTourReady?: (startTour: () => void) => void;
}

export function JournalTour({ isFirstVisit = false, onTourReady }: JournalTourProps) {
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
      id: 'add-to-routine',
      target: '.tour-journal-add-routine',
      title: 'Add to My Rituals',
      description: 'Tap to add daily journaling to your planner. Get reminders to write each day.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-journal-add-routine'),
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
