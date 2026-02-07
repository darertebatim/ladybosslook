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
    // Quick Actions Section
    {
      id: 'quick-actions',
      target: '.tour-quick-actions',
      title: 'Quick Actions',
      description: 'All your most-used buttons are here. Community, lessons, live sessions, and more.',
      position: 'bottom',
      action: 'look',
      condition: () => !!document.querySelector('.tour-quick-actions'),
    },
    {
      id: 'community',
      target: '.tour-community-btn',
      title: 'Join the Community',
      description: 'Tap to chat with fellow students. Ask questions, share wins, get support from the group.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-community-btn'),
    },
    {
      id: 'playlist',
      target: '.tour-playlist-btn',
      title: 'Audio Lessons',
      description: 'Access all audio content for this round. New lessons unlock as you progress through the course.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-playlist-btn'),
    },
    {
      id: 'meet',
      target: '.tour-meet-btn',
      title: 'Live Sessions',
      description: 'Join live video sessions with your coach. The link opens Google Meet directly.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-meet-btn'),
    },
    {
      id: 'calendar-add',
      target: '.tour-calendar-btn',
      title: 'Add to Calendar',
      description: 'Add the next session to your phone calendar so you get a reminder before it starts.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-calendar-btn'),
    },
    {
      id: 'sync-all',
      target: '.tour-sync-all-btn',
      title: 'Sync All Sessions',
      description: 'Add ALL sessions to your calendar at once. Great for planning your schedule ahead.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-sync-all-btn'),
    },
    {
      id: 'drive',
      target: '.tour-drive-btn',
      title: 'Course Materials',
      description: 'Access worksheets, PDFs, and other resources shared by your coach in Google Drive.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-drive-btn'),
    },
    {
      id: 'support',
      target: '.tour-support-btn',
      title: 'Get Help',
      description: 'Need assistance? Tap here to reach your coach or support team directly.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-support-btn'),
    },
    // Calendar Sync Banner
    {
      id: 'sync-banner',
      target: '.tour-sync-banner',
      title: 'Calendar Sync Reminder',
      description: 'When new sessions are added, this banner will appear. Tap to sync them to your calendar.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-sync-banner'),
    },
    // Sessions Section
    {
      id: 'sessions',
      target: '.tour-sessions-header',
      title: 'Session Schedule',
      description: "All your scheduled live sessions. Today's session is highlighted. Past sessions are dimmed.",
      position: 'top',
      action: 'look',
      condition: () => !!document.querySelector('.tour-sessions-header'),
    },
    {
      id: 'session-reminder-settings',
      target: '.tour-session-reminder-btn',
      title: 'Session Reminders',
      description: 'Customize when you want to be reminded before each session. Set it once, applies to all.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-session-reminder-btn'),
    },
    {
      id: 'session-calendar-icon',
      target: '.tour-session-calendar-icon',
      title: 'Add Single Session',
      description: 'Tap the calendar icon next to any session to add just that one to your calendar.',
      position: 'left',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-session-calendar-icon'),
    },
    // Content Schedule Section
    {
      id: 'content-schedule',
      target: '.tour-content-schedule-header',
      title: 'Content Unlocks',
      description: 'See when new lessons and materials become available. Locked content shows the unlock date.',
      position: 'top',
      action: 'look',
      condition: () => !!document.querySelector('.tour-content-schedule-header'),
    },
    {
      id: 'content-reminder-settings',
      target: '.tour-content-reminder-btn',
      title: 'Content Reminders',
      description: 'Get notified when new content unlocks. Never miss a new lesson or chapter.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-content-reminder-btn'),
    },
    {
      id: 'content-bell-icon',
      target: '.tour-content-bell-icon',
      title: 'Set Content Reminder',
      description: 'Tap the bell icon next to locked content to get reminded when it unlocks.',
      position: 'left',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-content-bell-icon'),
    },
    // Program Info
    {
      id: 'program-info',
      target: '.tour-program-info',
      title: 'Program Details',
      description: 'Full program description, start/end dates, and your enrollment status.',
      position: 'top',
      action: 'look',
      condition: () => !!document.querySelector('.tour-program-info'),
    },
    // Done
    {
      id: 'done',
      title: "You're Ready! 🌟",
      description: 'Start by visiting the Community to introduce yourself. Enjoy your learning journey!',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'round',
    steps,
    triggerOnMount: isFirstVisit,
  });

  const handleComplete = () => {
    tour.completeTour();
    // Scroll to top after completing the tour
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <TourOverlay
      isActive={tour.isActive}
      currentStep={tour.currentStep}
      currentStepIndex={tour.currentStepIndex}
      totalSteps={tour.totalSteps}
      isLastStep={tour.isLastStep}
      onNext={tour.nextStep}
      onPrev={tour.prevStep}
      onSkip={handleComplete}
      onComplete={handleComplete}
    />
  );
}
