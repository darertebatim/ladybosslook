import { useMemo, useEffect } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface PlayerTourProps {
  isFirstVisit?: boolean;
  onTourReady?: (startTour: () => void) => void;
}

export function PlayerTour({ isFirstVisit = false, onTourReady }: PlayerTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Your Audio Library 🎧',
      description: 'Welcome to Listen! All your audio content lives here — meditations, courses, soundscapes, and more.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'search',
      target: '.tour-player-search',
      title: 'Quick Search 🔍',
      description: 'Looking for something specific? Tap here to search all audio content.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-player-search'),
    },
    {
      id: 'categories',
      target: '.tour-player-categories',
      title: 'Browse by Category',
      description: 'Filter by type: Meditate, Workout, Soundscape, Courses, and more. Tap any circle to explore.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-player-categories'),
    },
    {
      id: 'progress-filter',
      target: '.tour-player-progress-filter',
      title: 'Track Your Progress',
      description: "Filter by 'In Progress' to continue where you left off, or 'Completed' to revisit favorites.",
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-player-progress-filter'),
    },
    {
      id: 'continue',
      target: '.tour-continue-listening',
      title: 'Continue Listening ▶️',
      description: 'Pick up exactly where you left off. Your progress is always saved.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-continue-listening'),
    },
    {
      id: 'playlists-header',
      target: '.tour-playlists-header',
      title: 'All Playlists 📚',
      description: 'Browse all available content. Free playlists are always accessible!',
      position: 'bottom',
      action: 'look',
      condition: () => !!document.querySelector('.tour-playlists-header'),
    },
    {
      id: 'free-playlist',
      target: '.tour-free-playlist',
      title: 'Free Content 🆓',
      description: "Look for the 'Free' badge — these playlists are yours to enjoy anytime, no enrollment needed.",
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-free-playlist'),
    },
    {
      id: 'locked-playlist',
      target: '.tour-locked-playlist',
      title: 'Premium Content 🔒',
      description: 'Locked playlists belong to programs. Tap to preview and enroll to unlock full access.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-locked-playlist'),
    },
    {
      id: 'done',
      title: 'Ready to Listen! 🎵',
      description: 'Explore, listen, and grow. Every session counts toward your wellness journey.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'player',
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
