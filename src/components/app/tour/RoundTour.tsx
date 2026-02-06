import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface RoundTourProps {
  isFirstVisit?: boolean;
  hasAudioContent?: boolean;
  hasLiveSessions?: boolean;
  hasSupplements?: boolean;
}

export function RoundTour({ 
  isFirstVisit = false,
  hasAudioContent = false,
  hasLiveSessions = false,
  hasSupplements = false,
}: RoundTourProps) {
  const steps = useMemo((): TourStep[] => {
    const baseSteps: TourStep[] = [
      {
        id: 'welcome',
        title: 'Your Course 📚',
        description: 'Everything you need for this program is here.',
        position: 'center',
        action: 'look',
      },
    ];

    if (hasAudioContent) {
      baseSteps.push({
        id: 'audio',
        target: '.tour-audio-content',
        title: 'Audio Lessons',
        description: 'Listen at your own pace. New content unlocks as you go.',
        position: 'bottom',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-audio-content'),
      });
    }

    if (hasLiveSessions) {
      baseSteps.push({
        id: 'sessions',
        target: '.tour-live-sessions',
        title: 'Live Sessions',
        description: 'Join scheduled sessions with your coach.',
        position: 'bottom',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-live-sessions'),
      });
    }

    if (hasSupplements) {
      baseSteps.push({
        id: 'materials',
        target: '.tour-supplements',
        title: 'Course Materials',
        description: 'Worksheets, guides, and resources to support you.',
        position: 'bottom',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-supplements'),
      });
    }

    baseSteps.push({
      id: 'feed',
      target: '.tour-course-feed',
      title: 'Course Community',
      description: 'Connect with fellow students and share progress.',
      position: 'top',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-course-feed'),
    });

    baseSteps.push({
      id: 'done',
      title: "You've Got This! 🌟",
      description: 'One step at a time. Progress, not perfection.',
      position: 'center',
      action: 'look',
    });

    return baseSteps;
  }, [hasAudioContent, hasLiveSessions, hasSupplements]);

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
