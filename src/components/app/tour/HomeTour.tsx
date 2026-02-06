import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface HomeTourProps {
  hasEnrolledPrograms?: boolean;
  hasBanner?: boolean;
  hasSuggestedRituals?: boolean;
  hasWelcomeCard?: boolean;
  isFirstOpen?: boolean;
}

export function HomeTour({
  hasEnrolledPrograms = false,
  hasBanner = false,
  hasSuggestedRituals = false,
  hasWelcomeCard = false,
  isFirstOpen = false,
}: HomeTourProps) {
  // Build steps dynamically based on available content
  const steps = useMemo((): TourStep[] => {
    const baseSteps: TourStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to Simora ✨',
        description: 'Hi there! This is your home. Everything starts here.',
        position: 'center',
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
        title: 'Add Actions',
        target: '.tour-add-task',
        description: 'Tap + to add something small to your day.',
        position: 'left',
        action: 'tap',
      },
    ];

    // Conditionally add banner step ONLY if banner actually exists
    if (hasBanner) {
      baseSteps.push({
        id: 'banner',
        title: 'Announcements',
        target: '.tour-banner',
        description: 'Important updates and messages will appear here.',
        position: 'bottom',
        action: 'look',
        condition: () => !!document.querySelector('.tour-banner'),
      });
    }

    // Conditionally add suggested rituals step
    if (hasSuggestedRituals) {
      baseSteps.push({
        id: 'rituals',
        title: 'Suggested Rituals',
        target: '.tour-suggested-ritual',
        description: 'Quick rituals designed for you. Tap to preview and add.',
        position: 'top',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-suggested-ritual'),
      });
    }

    // Conditionally add programs step
    if (hasEnrolledPrograms) {
      baseSteps.push({
        id: 'programs',
        title: 'Your Programs',
        target: '.tour-programs-carousel',
        description: 'Your enrolled courses are here. Tap to access lessons.',
        position: 'top',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-programs-carousel'),
      });
    }

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

    // ===== FINAL STEP - Dynamic based on Welcome Card =====
    if (hasWelcomeCard) {
      baseSteps.push({
        id: 'welcome-card',
        title: 'Your First Action 🎯',
        target: '.tour-welcome-card',
        description: 'Ready? Flip the card below to pick your first action.',
        position: 'top',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-welcome-card'),
      });
    } else {
      baseSteps.push({
        id: 'done',
        title: 'Ready to Start! 👋',
        description: "Ready? Tap + to add your first action.",
        position: 'center',
        action: 'look',
      });
    }

    return baseSteps;
  }, [hasEnrolledPrograms, hasBanner, hasSuggestedRituals, hasWelcomeCard]);

  const tour = useFeatureTour({
    feature: 'home',
    steps,
    triggerOnMount: isFirstOpen,
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

// Export hook for external control
export { useFeatureTour } from '@/hooks/useFeatureTour';
