import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface PlayerTourProps {
  isFirstVisit?: boolean;
}

export function PlayerTour({ isFirstVisit = false }: PlayerTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Your Audio Library 🎧',
      description: 'Access podcasts, audiobooks, and guided sessions. Listen while you work, exercise, or relax.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'playlists',
      target: '.tour-playlists',
      title: 'Playlists & Courses',
      description: 'Browse organized collections. Free content is always available; premium content unlocks with your programs.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-playlists'),
    },
    {
      id: 'continue',
      target: '.tour-continue-listening',
      title: 'Continue Where You Left Off',
      description: 'Your progress is saved automatically. Resume any track exactly where you stopped.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-continue-listening'),
    },
    {
      id: 'done',
      title: 'Listen & Learn 📚',
      description: 'The more you listen, the more you grow. Every session counts!',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'player',
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
