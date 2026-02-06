import { useMemo } from 'react';
import { useFeatureTour, TourStep } from '@/hooks/useFeatureTour';
import { TourOverlay } from './TourOverlay';

interface PeriodTourProps {
  isFirstVisit?: boolean;
}

export function PeriodTour({ isFirstVisit = false }: PeriodTourProps) {
  const steps = useMemo((): TourStep[] => [
    {
      id: 'welcome',
      title: 'Period Tracker 🌸',
      description: 'Track your cycle privately. Get predictions and insights to understand your body better.',
      position: 'center',
      action: 'look',
    },
    {
      id: 'log',
      target: '.tour-period-log',
      title: 'Log Your Days',
      description: 'Tap any day to log your period, symptoms, and notes. The more you log, the better the predictions.',
      position: 'bottom',
      action: 'tap',
      condition: () => !!document.querySelector('.tour-period-log'),
    },
    {
      id: 'insights',
      target: '.tour-period-insights',
      title: 'Cycle Insights',
      description: 'See where you are in your cycle and what to expect in the coming days.',
      position: 'top',
      action: 'look',
      condition: () => !!document.querySelector('.tour-period-insights'),
    },
    {
      id: 'done',
      title: 'Know Your Body 💪',
      description: 'Your data stays private. Use insights to plan your energy and self-care.',
      position: 'center',
      action: 'look',
    },
  ], []);

  const tour = useFeatureTour({
    feature: 'period',
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
