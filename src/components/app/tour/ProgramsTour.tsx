import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface ProgramsTourProps {
  isFirstVisit?: boolean;
  hasPrograms?: boolean;
}

export function ProgramsTour({ isFirstVisit = false, hasPrograms = false }: ProgramsTourProps) {
  const steps = useMemo((): TourStep[] => {
    const baseSteps: TourStep[] = [
      {
        id: 'welcome',
        title: 'My Programs 🎓',
        description: 'All your enrolled courses and programs in one place. Track progress and access materials.',
        position: 'center',
        action: 'look',
      },
    ];

    if (hasPrograms) {
      baseSteps.push({
        id: 'program-card',
        target: '.tour-program-card',
        title: 'Your Active Programs',
        description: 'Tap any program to access lessons, live sessions, and downloadable materials.',
        position: 'bottom',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-program-card'),
      });
      
      baseSteps.push({
        id: 'progress',
        target: '.tour-program-progress',
        title: 'Track Your Progress',
        description: 'See how far you\'ve come. Complete lessons and sessions to grow your progress.',
        position: 'bottom',
        action: 'look',
        condition: () => !!document.querySelector('.tour-program-progress'),
      });
    } else {
      baseSteps.push({
        id: 'browse',
        target: '.tour-browse-programs',
        title: 'Explore Programs',
        description: 'Browse available courses and coaching programs. Start with free content!',
        position: 'bottom',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-browse-programs'),
      });
    }

    baseSteps.push({
      id: 'done',
      title: 'Keep Learning 📈',
      description: 'Your growth journey is unique. Take it one lesson at a time.',
      position: 'center',
      action: 'look',
    });

    return baseSteps;
  }, [hasPrograms]);

  const tour = useFeatureTour({
    feature: 'programs',
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
