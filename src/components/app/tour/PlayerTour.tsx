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
      description: 'Your audio library. Listen anytime, anywhere.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'playlists',
      target: '.tour-playlists',
      title: 'Playlists & Courses',
      description: 'Browse by category. Free content is always here.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-playlists'),
    },
    {
      id: 'continue',
      target: '.tour-continue-listening',
      title: 'Continue Listening',
      description: 'Pick up where you left off.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-continue-listening'),
    },
    {
      id: 'done',
      title: 'Enjoy Listening 📚',
      description: 'Every listen is a step forward.',
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
