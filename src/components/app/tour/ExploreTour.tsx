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
      description: 'Everything you need for daily wellness is here. Let me show you each tool.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'journal',
      target: '.tour-tool-journal',
      title: 'Journal',
      description: 'Write daily reflections. Even a few words help you understand yourself better.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-journal'),
    },
    {
      id: 'breathe',
      target: '.tour-tool-breathe',
      title: 'Breathe',
      description: 'Guided breathing exercises. Use when stressed, anxious, or need to focus.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-breathe'),
    },
    {
      id: 'water',
      target: '.tour-tool-water',
      title: 'Water Tracker',
      description: 'Track your daily water intake. Tap to log each glass you drink.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-water'),
    },
    {
      id: 'emotions',
      target: '.tour-tool-emotions',
      title: 'Emotions',
      description: 'Name how you feel each day. Tracking emotions helps you see patterns.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-emotions'),
    },
    {
      id: 'period',
      target: '.tour-tool-period',
      title: 'Period Tracker',
      description: 'Track your cycle privately. See predictions and understand your patterns.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-period'),
    },
    {
      id: 'meditate',
      target: '.tour-tool-meditate',
      title: 'Meditate',
      description: 'Guided meditations for any moment. Short sessions available for busy days.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-meditate'),
    },
    {
      id: 'soundscape',
      target: '.tour-tool-soundscape',
      title: 'Soundscapes',
      description: 'Ambient sounds for focus, relaxation, or sleep. Mix and match.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-soundscape'),
    },
    {
      id: 'programs',
      target: '.tour-programs-section',
      title: 'Browse Programs',
      description: 'Courses, audiobooks, and more. Tap any to preview and enroll.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-programs-section'),
    },
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
      title: 'Start Small ✨',
      description: 'Pick one tool that feels right today. You can always explore more later.',
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
