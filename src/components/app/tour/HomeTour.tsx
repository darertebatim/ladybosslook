import { useEffect, useMemo } from 'react';
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
        description: 'Tap the + button to add daily actions. Start with just one small action!',
        position: 'left',
        action: 'tap',
      },
    ];

    // Conditionally add banner step
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

    // Quick actions grid
    baseSteps.push({
      id: 'quick-actions',
      title: 'Quick Access',
      target: '.tour-quick-actions',
      description: 'Fast access to Listen, Journal, Channels, and Rituals. Everything you need, one tap away.',
      position: 'top',
      action: 'tap',
    });

    // Final encouragement
    baseSteps.push({
      id: 'done',
      title: "You're All Set! 🎉",
      description: 'Start with one small action today. Remember: showing up is the goal, not perfection.',
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
