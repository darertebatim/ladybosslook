import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface BreatheTourProps {
  isFirstVisit?: boolean;
  onTourReady?: (startTour: () => void) => void;
}

export function BreatheTour({ isFirstVisit = false, onTourReady }: BreatheTourProps) {
  const { t } = useTranslation();
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: t('tour.breathe.welcomeTitle'),
      description: t('tour.breathe.welcomeDesc'),
      position: 'center',
      action: 'look',
    },
    {
      id: 'exercises',
      target: '.tour-exercise-card',
      title: t('tour.breathe.exercisesTitle'),
      description: t('tour.breathe.exercisesDesc'),
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-exercise-card'),
    },
    {
      id: 'add-to-routines',
      target: '.tour-add-to-routine',
      title: t('tour.breathe.addRoutineTitle'),
      description: t('tour.breathe.addRoutineDesc'),
      position: 'left',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-add-to-routine'),
    },
    {
      id: 'done',
      title: t('tour.breathe.doneTitle'),
      description: t('tour.breathe.doneDesc'),
      position: 'center',
      action: 'look',
    },
  ], [t]);

  const tour = useFeatureTour({
    feature: 'breathe',
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
