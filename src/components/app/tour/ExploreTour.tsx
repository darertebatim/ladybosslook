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
      description: 'Everything Simora offers is here.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'tools',
      target: '.tour-tools-section',
      title: 'Wellness Tools',
      description: 'Journal, Breathe, Water, Emotions. Tap any to start.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tools-section'),
    },
    {
      id: 'programs',
      target: '.tour-programs-section',
      title: 'Browse Programs',
      description: 'Courses and audio content. Browse freely.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-programs-section'),
    },
    {
      id: 'search',
      target: '.tour-search-button',
      title: 'Search Everything',
      description: 'Find what you need quickly.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-search-button'),
    },
    {
      id: 'done',
      title: 'Take Your Time ✨',
      description: 'Take your time. Explore what calls to you.',
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
