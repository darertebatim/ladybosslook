import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';
import { TourBanner } from './TourBanner';

interface HomeTourProps {
  hasEnrolledPrograms?: boolean;
  hasSuggestedRoutines?: boolean;
  isFirstOpen?: boolean;
  /** Server indicates 0 completions - bypass localStorage flags */
  forceShow?: boolean;
  // Portal target ID for banner placement
  bannerPortalId?: string;
  // Callback to expose the tour trigger function
  onTourReady?: (startTour: () => void) => void;
}

export function HomeTour({
  hasEnrolledPrograms = false,
  hasSuggestedRoutines = false,
  isFirstOpen = false,
  forceShow = false,
  bannerPortalId = 'tour-banner-slot',
  onTourReady,
}: HomeTourProps) {
  const [userWantsTour, setUserWantsTour] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Find portal target after mount
  useEffect(() => {
    const target = document.getElementById(bannerPortalId);
    setPortalTarget(target);
  }, [bannerPortalId]);

  // Build steps dynamically based on available content
  const steps = useMemo((): TourStep[] => {
    const baseSteps: TourStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to Rilo ✨',
        description: 'Hi there! This is your Home. Everything starts here.',
        target: '.tour-nav-home',
        position: 'top',
        action: 'look',
      },
      {
        id: 'menu',
        title: 'Your Menu',
        target: '.tour-menu-button',
        description: 'Tap the menu to see all your tools.',
        position: 'bottom',
        action: 'tap',
      },
      {
        id: 'calendar',
        title: 'Your Week',
        target: '.tour-calendar',
        description: 'Swipe to pick a day. The flame shows days you showed up.',
        position: 'bottom',
        action: 'swipe',
      },
      {
        id: 'add-action',
        title: 'Add Tasks',
        target: '.tour-add-task',
        description: 'Tap + to add something small to your day.',
        position: 'left',
        action: 'tap',
      },
    ];

    // Banner step removed - announcements no longer part of tour

    // Conditionally add suggested routines step
    if (hasSuggestedRoutines) {
      baseSteps.push({
        id: 'rituals',
        title: 'Suggested Routines',
        target: '.tour-suggested-ritual',
        description: 'Quick routines designed for you. Tap to preview and add.',
        position: 'top',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-suggested-ritual'),
      });
    }

    // Programs carousel removed — program events now appear as planner cards

    // ===== BOTTOM NAV EXPLANATIONS =====
    baseSteps.push({
      id: 'nav-explore',
      title: 'Explore 🧭',
      target: '.tour-nav-explore',
      description: 'Find new tools and content here.',
      position: 'top',
      action: 'tap',
    });

    baseSteps.push({
      id: 'nav-listen',
      title: 'Listen 🎵',
      target: '.tour-nav-listen',
      description: 'Audio for calm, focus, or movement.',
      position: 'top',
      action: 'tap',
    });

    baseSteps.push({
      id: 'nav-channels',
      title: 'Channels 👥',
      target: '.tour-nav-channels',
      description: 'See updates from your community.',
      position: 'top',
      action: 'tap',
    });

    baseSteps.push({
      id: 'nav-support',
      title: 'Support 💬',
      target: '.tour-nav-support',
      description: "We're here if you need anything.",
      position: 'top',
      action: 'tap',
    });

    // ===== FINAL STEP =====
    baseSteps.push({
      id: 'done',
       title: 'Ready to Start! 👋',
       description: "Ready? Tap + to add your first task.",
      position: 'center',
      action: 'look',
    });

    return baseSteps;
  }, [hasEnrolledPrograms, hasSuggestedRoutines]);

  const tour = useFeatureTour({
    feature: 'home',
    steps,
    // Don't auto-trigger - wait for user to click banner
    triggerOnMount: false,
  });

  // Handle user clicking banner to start tour
  const handleStartTour = useCallback(() => {
    setUserWantsTour(true);
    setTimeout(() => {
      tour.forceStartTour();
    }, 100);
  }, [tour.forceStartTour]);

  // Track if we've already called onTourReady to prevent infinite loops
  const hasCalledTourReady = useRef(false);

  // Expose tour trigger to parent - only call once
  useEffect(() => {
    if (onTourReady && !hasCalledTourReady.current) {
      hasCalledTourReady.current = true;
      onTourReady(handleStartTour);
    }
  }, [onTourReady, handleStartTour]);

  return (
    <>
      {/* Actual tour overlay */}
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
    </>
  );
}

// Export hook for external control
export { useFeatureTour } from '@/hooks/useFeatureTour';
