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
        description: 'Your enrolled programs live here.',
        position: 'center',
        action: 'look',
      },
    ];

    if (hasPrograms) {
      baseSteps.push({
        id: 'program-card',
        target: '.tour-program-card',
        title: 'Your Active Programs',
        description: 'Tap to open lessons and materials.',
        position: 'bottom',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-program-card'),
      });
      
      baseSteps.push({
        id: 'progress',
        target: '.tour-program-progress',
        title: 'Track Your Progress',
        description: "See how far you've come.",
        position: 'bottom',
        action: 'look',
        condition: () => !!document.querySelector('.tour-program-progress'),
      });
    } else {
      baseSteps.push({
        id: 'browse',
        target: '.tour-browse-programs',
        title: 'Explore Programs',
        description: 'Browse available courses. Start with free content!',
        position: 'bottom',
        action: 'tap',
        condition: () => !!document.querySelector('.tour-browse-programs'),
      });
    }

    baseSteps.push({
      id: 'done',
      title: 'Keep Learning 📈',
      description: 'One lesson at a time.',
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
