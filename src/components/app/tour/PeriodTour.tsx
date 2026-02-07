import { useMemo, useEffect } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface PeriodTourProps {
  isFirstVisit?: boolean;
  onTourReady?: (startTour: () => void) => void;
}

export function PeriodTour({ isFirstVisit = false, onTourReady }: PeriodTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Period Tracker 🌸',
      description: 'Track your cycle privately.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'log',
      target: '.tour-period-log',
      title: 'Log Your Days',
      description: 'Tap a day to log.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-period-log'),
    },
    {
      id: 'insights',
      target: '.tour-period-insights',
      title: 'Cycle Insights',
      description: 'See patterns and predictions.',
      position: 'top',
      action: 'look',
      condition: () => !!document.querySelector('.tour-period-insights'),
    },
    {
      id: 'done',
      title: 'Know Your Body 💪',
      description: 'Understanding your body is strength.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'period',
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
