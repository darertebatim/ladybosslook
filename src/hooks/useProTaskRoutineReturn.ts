import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useFocusPlayer } from '@/components/app/FocusPlayerProvider';

type FocusRoutineLocationState = {
  fromFocusRoutine?: boolean;
};

/**
 * Unified, fail-safe helper for pro tools launched from the Focus routine player.
 * It survives state races by treating either route state OR active pro-task mode as routine context.
 */
export function useProTaskRoutineReturn() {
  const location = useLocation();
  const { isProTaskActive, completeProTask } = useFocusPlayer();

  const fromFocusRoutine = Boolean((location.state as FocusRoutineLocationState | null)?.fromFocusRoutine);
  const shouldReturnToRoutine = fromFocusRoutine || isProTaskActive;

  const returnToRoutinePlayer = useCallback(() => {
    if (!shouldReturnToRoutine) return false;
    completeProTask();
    return true;
  }, [shouldReturnToRoutine, completeProTask]);

  return {
    fromFocusRoutine,
    shouldReturnToRoutine,
    returnToRoutinePlayer,
  };
}
