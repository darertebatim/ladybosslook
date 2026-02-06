import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface ExploreTourProps {
  isFirstVisit?: boolean;
}

export function ExploreTour({ isFirstVisit = false }: ExploreTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Explore Simora 🧭',
      description: 'Discover all the tools and resources available to support your wellness journey.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'tools',
      target: '.tour-tools-section',
      title: 'Wellness Tools',
      description: 'Quick access to journaling, breathing exercises, mood tracking, and more. Tap any tool to start!',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tools-section'),
    },
    {
      id: 'programs',
      target: '.tour-programs-section',
      title: 'Browse Programs',
      description: 'Explore courses, meditations, and audio content. Enroll in free programs to unlock them.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-programs-section'),
    },
    {
      id: 'search',
      target: '.tour-search-button',
      title: 'Search Everything',
      description: 'Looking for something specific? Use search to find tools and programs quickly.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-search-button'),
    },
    {
      id: 'done',
      title: 'Start Exploring! ✨',
      description: 'Everything you need is here. Take your time and discover what resonates with you.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'explore',
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
