import { useState, useCallback, useRef, useEffect } from 'react';
import { BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';
import { BadgeCelebrationLevel } from '@/components/app/BadgeCelebration';

interface UseBadgeCelebrationOptions {
  currentBadgeLevel: BadgeLevel;
  completedCount: number;
  totalCount: number;
  dateKey: string; // Used to track celebrations per day
}

// Helper to get/set celebrated levels from localStorage
function getCelebratedLevels(dateKey: string): Set<string> {
  try {
    const stored = localStorage.getItem(`simora_celebrated_${dateKey}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCelebratedLevel(dateKey: string, level: string) {
  try {
    const current = getCelebratedLevels(dateKey);
    current.add(level);
    localStorage.setItem(`simora_celebrated_${dateKey}`, JSON.stringify([...current]));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook to manage badge celebration state and triggers
 * 
 * Priority order (highest first):
 * 1. Gold celebration (100% complete)
 * 2. Almost Gold toast (1 task away from gold)
 * 3. Silver toast (50% progress)
 * 4. Action toast (any other completion)
 * 
 * Uses localStorage to persist milestone celebrations so they don't re-show on navigation.
 * Action celebrations are NOT persisted — they show on every completion.
 */
export function useBadgeCelebration({
  currentBadgeLevel,
  completedCount,
  totalCount,
  dateKey,
}: UseBadgeCelebrationOptions) {
  const [celebrationType, setCelebrationType] = useState<BadgeCelebrationLevel | null>(null);
  
  // Track previous completed count to detect new completions
  const prevCompletedRef = useRef<number>(completedCount);
  const prevDateKeyRef = useRef<string>(dateKey);
  const initializedRef = useRef(false);

  // Reset when date changes
  useEffect(() => {
    if (prevDateKeyRef.current !== dateKey) {
      prevDateKeyRef.current = dateKey;
      prevCompletedRef.current = 0;
      initializedRef.current = false;
    }
  }, [dateKey]);

  // Detect completions and determine which celebration to show
  useEffect(() => {
    // Skip on initial mount - don't celebrate existing state
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevCompletedRef.current = completedCount;
      return;
    }

    const prevCompleted = prevCompletedRef.current;
    const isNewCompletion = completedCount > prevCompleted;
    prevCompletedRef.current = completedCount;

    if (!isNewCompletion) return;

    const celebratedLevels = getCelebratedLevels(dateKey);

    // Priority 1: Gold badge (100% progress)
    if (
      currentBadgeLevel === 'gold' &&
      !celebratedLevels.has('gold')
    ) {
      setCelebrationType('gold');
      saveCelebratedLevel(dateKey, 'gold');
      return;
    }

    // Priority 2: Almost gold (1 task away)
    if (
      totalCount > 0 &&
      completedCount === totalCount - 1 &&
      !celebratedLevels.has('almostGold') &&
      !celebratedLevels.has('gold')
    ) {
      setCelebrationType('almostGold');
      saveCelebratedLevel(dateKey, 'almostGold');
      return;
    }

    // Priority 3: Silver badge (50% progress)
    if (
      currentBadgeLevel === 'silver' &&
      !celebratedLevels.has('silver')
    ) {
      setCelebrationType('silver');
      saveCelebratedLevel(dateKey, 'silver');
      return;
    }

    // Priority 4: Action celebration (every other completion)
    setCelebrationType('action');
  }, [currentBadgeLevel, completedCount, totalCount, dateKey]);

  const closeCelebration = useCallback(() => {
    setCelebrationType(null);
  }, []);

  // Manual trigger for testing or specific scenarios
  const triggerCelebration = useCallback((type: BadgeCelebrationLevel) => {
    setCelebrationType(type);
  }, []);

  return {
    celebrationType,
    closeCelebration,
    triggerCelebration,
    completedCount,
    totalCount,
  };
}
