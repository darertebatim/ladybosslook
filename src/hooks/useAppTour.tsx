import { useState, useEffect, useCallback } from 'react';

const TOUR_COMPLETED_KEY = 'appTourCompleted';
const TOUR_DELAY_MS = 1500;

export const useAppTour = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // App tour is temporarily disabled - pending updates
  // TODO: Re-enable after tour changes are complete
  useEffect(() => {
    // Tour disabled - do nothing
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
