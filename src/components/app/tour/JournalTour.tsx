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
      title: 'Your Private Journal 📝',
      description: 'A safe space to reflect, process emotions, and track your growth. Everything here is private.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'new-entry',
      target: '.tour-new-entry',
      title: 'Start Writing',
      description: 'Tap the + button to create a new entry. Use prompts for inspiration or write freely.',
      position: 'left',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-new-entry'),
    },
    {
      id: 'mood',
      target: '.tour-mood-selector',
      title: 'Track Your Mood',
      description: 'Add a mood to each entry. Over time, you\'ll see patterns in how you feel.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-mood-selector'),
    },
    {
      id: 'done',
      title: 'Your Story Matters 💜',
      description: 'Just a few sentences each day can transform your self-awareness.',
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
