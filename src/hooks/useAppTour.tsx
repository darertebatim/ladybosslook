import { useState, useEffect, useCallback } from 'react';

const TOUR_COMPLETED_KEY = 'appTourCompleted';
const TOUR_DELAY_MS = 1500;

export const useAppTour = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Check if first time user and start tour
  // Only start if push notification onboarding is NOT showing
  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    const pushOnboardingCompleted = localStorage.getItem('pushOnboardingCompleted');
    const pushOnboardingDismissed = localStorage.getItem('pushOnboardingDismissed');
    
    // Only show tour if:
    // 1. Tour hasn't been completed
    // 2. Push notification onboarding is done (completed or dismissed)
    const pnOnboardingDone = pushOnboardingCompleted === 'true' || !!pushOnboardingDismissed;
    
    if (!tourCompleted && pnOnboardingDone) {
      // Delay start to let UI render
      const timer = setTimeout(() => setRun(true), TOUR_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setRun(false);
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setStepIndex(0);
    setRun(true);
  }, []);

  const skipTour = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setRun(false);
  }, []);

  return { 
    run, 
    stepIndex, 
    setStepIndex, 
    completeTour, 
    restartTour, 
    skipTour,
    setRun 
  };
};

// Helper to clear tour from localStorage (for use in profile)
export const clearTourCompleted = () => {
  localStorage.removeItem(TOUR_COMPLETED_KEY);
};
