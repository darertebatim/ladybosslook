import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface PlaylistTourProps {
  isFirstVisit?: boolean;
}

export function PlaylistTour({ isFirstVisit = false }: PlaylistTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Your Playlist 🎧',
      description: 'This is your playlist. Listen at your pace.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'tracks',
      target: '.tour-track-list',
      title: 'Tracks',
      description: 'Tap any track to play.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-track-list'),
    },
    {
      id: 'add-to-routine',
      target: '.tour-add-to-routine',
      title: 'Add to Your Rituals',
      description: 'Want to remember this? Add it to your rituals.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-add-to-routine'),
    },
    {
      id: 'done',
      title: 'Enjoy Listening 🎵',
      description: 'Enjoy. Every listen counts.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'playlist',
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
