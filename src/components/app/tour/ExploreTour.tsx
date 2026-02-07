import { useMemo, useEffect } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface ExploreTourProps {
  isFirstVisit?: boolean;
  onTourReady?: (startTour: () => void) => void;
}

export function ExploreTour({ isFirstVisit = false, onTourReady }: ExploreTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Your Toolkit 🧭',
      description: 'Everything you need for daily wellness is here. Let me show you each tool.',
      position: 'center',
      action: 'look',
    },
    // Search button
    {
      id: 'search',
      target: '.tour-search-button',
      title: 'Quick Search 🔍',
      description: "Can't find something? Tap here to search all tools and programs.",
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-search-button'),
    },
    // ===== INDIVIDUAL TOOLS =====
    {
      id: 'tool-journal',
      target: '.tour-tool-journal',
      title: 'Journal 📓',
      description: 'Write daily reflections and thoughts. Build a journaling habit.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-journal'),
    },
    {
      id: 'tool-breathe',
      target: '.tour-tool-breathe',
      title: 'Breathe 🌬️',
      description: 'Guided breathing exercises to calm your mind and body.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-breathe'),
    },
    {
      id: 'tool-water',
      target: '.tour-tool-water',
      title: 'Water 💧',
      description: 'Track your daily water intake. Stay hydrated!',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-water'),
    },
    {
      id: 'tool-emotions',
      target: '.tour-tool-emotions',
      title: 'Emotions 💜',
      description: 'Name and track your feelings. Build emotional awareness.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-emotions'),
    },
    {
      id: 'tool-period',
      target: '.tour-tool-period',
      title: 'Period 🌸',
      description: 'Track your cycle, predict periods, and log symptoms.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-period'),
    },
    {
      id: 'tool-routines',
      target: '.tour-tool-routines',
      title: 'Rituals ✨',
      description: 'Browse and build daily rituals to structure your day.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-routines'),
    },
    {
      id: 'tool-programs',
      target: '.tour-tool-programs',
      title: 'My Programs 🎓',
      description: 'Access your enrolled courses and coaching programs.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-programs'),
    },
    {
      id: 'tool-profile',
      target: '.tour-tool-profile',
      title: 'My Profile 👤',
      description: 'Manage your account, settings, and preferences.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-profile'),
    },
    // Audio Tools
    {
      id: 'tool-meditate',
      target: '.tour-tool-meditate',
      title: 'Meditate 🧘',
      description: 'Guided meditations for focus, calm, and sleep.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-meditate'),
    },
    {
      id: 'tool-soundscape',
      target: '.tour-tool-soundscape',
      title: 'Sounds 🎵',
      description: 'Ambient soundscapes for relaxation and focus.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-tool-soundscape'),
    },
    // Programs section overview
    {
      id: 'programs-section',
      target: '.tour-programs-section-header',
      title: 'Browse Programs 📚',
      description: 'Explore courses, audiobooks, and coaching. Tap any to preview.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-programs-section-header'),
    },
    {
      id: 'done',
      title: "You're All Set! ✨",
      description: 'Pick one tool to try today. You can always come back to explore more.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'explore',
    steps,
    triggerOnMount: false,
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
