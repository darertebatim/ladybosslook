import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface RoundTourProps {
  isFirstVisit?: boolean;
}

export function RoundTour({ isFirstVisit = false }: RoundTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Your Course Hub 📚',
      description: 'Everything for this program is on this page. Let me show you around.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'community',
      target: '.tour-community-btn',
      title: 'Join the Community',
      description: 'Tap to chat with fellow students. Ask questions, share wins, get support.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-community-btn'),
    },
    {
      id: 'playlist',
      target: '.tour-playlist-btn',
      title: 'Audio Lessons',
      description: 'Tap to access all audio content. New lessons unlock as you progress.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-playlist-btn'),
    },
    {
      id: 'meet',
      target: '.tour-meet-btn',
      title: 'Live Sessions',
      description: 'Join live video sessions with your coach. Check the schedule for times.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-meet-btn'),
    },
    {
      id: 'calendar',
      target: '.tour-calendar-btn',
      title: 'Sync to Calendar',
      description: 'Tap to add sessions to your phone calendar. Never miss a live session.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-calendar-btn'),
    },
    {
      id: 'sessions',
      target: '.tour-sessions-list',
      title: 'Session Schedule',
      description: "See all scheduled sessions. Today's session is highlighted. Tap calendar icon to add each one.",
      position: 'top',
      action: 'look',
      condition: () => !!document.querySelector('.tour-sessions-list'),
    },
    {
      id: 'content-schedule',
      target: '.tour-content-schedule',
      title: 'Content Unlocks',
      description: 'Track when new lessons become available. Set reminders so you never miss new content.',
      position: 'top',
      action: 'look',
      condition: () => !!document.querySelector('.tour-content-schedule'),
    },
    {
      id: 'done',
      title: "You're Ready! 🌟",
      description: 'Start by visiting the Community to introduce yourself. One step at a time.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'round',
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
