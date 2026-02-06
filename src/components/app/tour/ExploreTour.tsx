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
      title: 'Your Toolkit 🧭',
      description: 'Everything you need for daily wellness is here. Let me show you around.',
      position: 'center',
      action: 'look',
    },
    // Navigation buttons first
    {
      id: 'nav-home',
      target: '.tour-nav-home',
      title: 'Home',
      description: 'Your daily rituals and tasks live here. This is your starting point.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-nav-home'),
    },
    {
      id: 'nav-listen',
      target: '.tour-nav-listen',
      title: 'Listen',
      description: 'Your audio library. Meditations, soundscapes, and more.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-nav-listen'),
    },
    {
      id: 'nav-channels',
      target: '.tour-nav-channels',
      title: 'Channels',
      description: 'Community feed and course updates from your enrolled programs.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-nav-channels'),
    },
    {
      id: 'nav-support',
      target: '.tour-nav-support',
      title: 'Support',
      description: 'Chat directly with Razie. Get help whenever you need it.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-nav-support'),
    },
    // Tools section
    {
      id: 'tools-section',
      target: '.tour-tools-section',
      title: 'Quick Tools',
      description: 'Daily wellness tools at your fingertips. Journal, breathe, track water & more.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tools-section'),
    },
    // Programs section
    {
      id: 'programs',
      target: '.tour-programs-section',
      title: 'Programs',
      description: 'Courses, audiobooks, coaching. Tap any to preview and enroll.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-programs-section'),
    },
    // Search
    {
      id: 'search',
      target: '.tour-search-button',
      title: 'Quick Search',
      description: "Can't find something? Tap here to search all tools and programs.",
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-search-button'),
    },
    {
      id: 'done',
      title: "You're All Set ✨",
      description: 'Pick one thing to try today. You can always come back and explore more.',
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
