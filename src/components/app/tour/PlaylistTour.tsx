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
      description: 'All your audio content is here. Listen at your own pace.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'tracks',
      target: '.tour-track-list',
      title: 'Track List',
      description: 'Tap any track to start listening. Your progress is saved automatically.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-track-list'),
    },
    {
      id: 'continue',
      target: '.tour-continue-btn',
      title: 'Continue Listening',
      description: "Tap 'Continue' to pick up exactly where you left off.",
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-continue-btn'),
    },
    {
      id: 'add-to-routine',
      target: '.tour-add-to-routine',
      title: 'Add to Your Rituals',
      description: 'Tap to add this playlist to your daily rituals. Get reminders to listen.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-add-to-routine'),
    },
    {
      id: 'done',
      title: 'Every Listen Counts 🎵',
      description: 'Enjoy listening. Your progress builds over time.',
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
