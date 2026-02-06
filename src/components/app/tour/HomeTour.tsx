import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface HomeTourProps {
  hasEnrolledPrograms?: boolean;
  hasBanner?: boolean;
  hasSuggestedRituals?: boolean;
  isFirstOpen?: boolean;
}

export function HomeTour({
  hasEnrolledPrograms = false,
  hasBanner = false,
  hasSuggestedRituals = false,
  isFirstOpen = false,
}: HomeTourProps) {
  // Build steps dynamically based on available content
  const steps = useMemo((): TourStep[] => {
    const baseSteps: TourStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to Simora! ✨',
        description: 'Let me show you around. This is your personal dashboard where everything happens.',
        position: 'center',
        action: 'look',
      },
      {
        id: 'menu',
        title: 'Your Menu',
        target: '.tour-menu-button',
        description: 'Tap here to access all app features: Listen, Journal, Breathe, Rituals, and more.',
        position: 'bottom',
        action: 'tap',
      },
      {
        id: 'calendar',
        title: 'Your Week',
        target: '.tour-calendar',
        description: 'Swipe to see different days. Flame icons 🔥 show when you honored your actions!',
        position: 'bottom',
        action: 'swipe',
      },
      {
        id: 'add-action',
        title: 'Add Actions',
        target: '.tour-add-task',
        description: 'Tap + to add daily actions. Start with just one small step!',
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
        description: 'Important updates and messages from your coach will appear here.',
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
        description: 'Quick rituals designed for you. Tap to preview and add actions to your day.',
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
        description: 'Your enrolled courses are here. Tap to access lessons, materials, and live sessions.',
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
      description: 'Discover programs, courses, and content. Browse everything Simora has to offer.',
      position: 'top',
      action: 'tap',
    });

    baseSteps.push({
      id: 'nav-listen',
      title: 'Listen 🎵',
      target: '.tour-nav-listen',
      description: 'Meditations, affirmations, and audio content. Listen while you relax or on the go.',
      position: 'top',
      action: 'tap',
    });

    baseSteps.push({
      id: 'nav-channels',
      title: 'Channels 👥',
      target: '.tour-nav-channels',
      description: 'Community feed and announcements. Connect with others on the same journey.',
      position: 'top',
      action: 'tap',
    });

    baseSteps.push({
      id: 'nav-support',
      title: 'Support 💬',
      target: '.tour-nav-support',
      description: 'Need help? Chat directly with our support team anytime. We\'re here for you!',
      position: 'top',
      action: 'tap',
    });

    // ===== FINAL STEP - ENCOURAGE SUPPORT MESSAGE =====
    baseSteps.push({
      id: 'done',
      title: "Say Hello! 👋",
      description: 'You\'re all set! Why not start by sending us a quick hello in Support? Introduce yourself — we\'d love to know what brought you here.',
      position: 'center',
      action: 'look',
    });

    return baseSteps;
  }, [hasEnrolledPrograms, hasBanner, hasSuggestedRituals]);

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
