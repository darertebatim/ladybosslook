import { useState, useEffect, useCallback } from 'react';

const TOUR_COMPLETED_KEY = 'appTourCompleted';
const TOUR_DELAY_MS = 1500;

export const useAppTour = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!hasCompleted) {
      // Delay tour start to let the page render
      const timer = setTimeout(() => {
        setRun(true);
      }, TOUR_DELAY_MS);
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
