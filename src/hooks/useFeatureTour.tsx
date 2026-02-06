import { useState, useEffect, useCallback } from 'react';

export type TourFeature = 
  | 'home' 
  | 'rituals' 
  | 'breathe' 
  | 'journal' 
  | 'player' 
  | 'period' 
  | 'programs' 
  | 'round';

const getTourKey = (feature: TourFeature) => `simora_tour_${feature}_done`;

export interface TourStep {
  id: string;
  target?: string; // CSS selector - optional for full-screen steps
  title: string;
  description: string;
  action?: 'tap' | 'swipe' | 'look';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  // For conditional steps (e.g., only show if element exists)
  condition?: () => boolean;
  // Callback when step completes
  onComplete?: () => void;
  // Auto-advance after delay (ms)
  autoAdvance?: number;
}

interface UseFeatureTourOptions {
  feature: TourFeature;
  steps: TourStep[];
  // Trigger conditions
  triggerOnMount?: boolean;
  triggerOnFirstAction?: boolean;
  // Dependencies that might affect step visibility
  dependencies?: any[];
}

export function useFeatureTour({
  feature,
  steps,
  triggerOnMount = false,
  triggerOnFirstAction = false,
  dependencies = [],
}: UseFeatureTourOptions) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(() => {
    return localStorage.getItem(getTourKey(feature)) === 'true';
  });

  // Filter steps based on conditions
  const activeSteps = steps.filter(step => !step.condition || step.condition());
  const currentStep = activeSteps[currentStepIndex];
  const totalSteps = activeSteps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Start tour
  const startTour = useCallback(() => {
    if (hasCompleted) return;
    setCurrentStepIndex(0);
    setIsActive(true);
  }, [hasCompleted]);

  // Force start (ignores completion status)
  const forceStartTour = useCallback(() => {
    localStorage.removeItem(getTourKey(feature));
    setHasCompleted(false);
    setCurrentStepIndex(0);
    setIsActive(true);
  }, [feature]);

  // Next step
  const nextStep = useCallback(() => {
    if (currentStep?.onComplete) {
      currentStep.onComplete();
    }
    
    if (isLastStep) {
      completeTour();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStep, isLastStep]);

  // Previous step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  // Skip/complete tour
  const completeTour = useCallback(() => {
    localStorage.setItem(getTourKey(feature), 'true');
    setHasCompleted(true);
    setIsActive(false);
    setCurrentStepIndex(0);
  }, [feature]);

  // Skip without marking complete (temporary dismiss)
  const dismissTour = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  // Trigger on mount if enabled
  useEffect(() => {
    if (triggerOnMount && !hasCompleted) {
      // Small delay to ensure elements are rendered
      const timer = setTimeout(() => {
        startTour();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [triggerOnMount, hasCompleted, startTour]);

  // Auto-advance if step has autoAdvance
  useEffect(() => {
    if (isActive && currentStep?.autoAdvance) {
      const timer = setTimeout(() => {
        nextStep();
      }, currentStep.autoAdvance);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, nextStep]);

  return {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    isLastStep,
    hasCompleted,
    startTour,
    forceStartTour,
    nextStep,
    prevStep,
    completeTour,
    dismissTour,
  };
}

// Helper to check if any tour is active (prevent overlapping tours)
let globalTourActive = false;

export const setGlobalTourActive = (active: boolean) => {
  globalTourActive = active;
};

export const isGlobalTourActive = () => globalTourActive;

// Helper to reset a specific tour
export const resetTour = (feature: TourFeature) => {
  localStorage.removeItem(getTourKey(feature));
};

// Helper to reset all tours
export const resetAllTours = () => {
  const features: TourFeature[] = ['home', 'rituals', 'breathe', 'journal', 'player', 'period', 'programs', 'round'];
  features.forEach(f => localStorage.removeItem(getTourKey(f)));
};
