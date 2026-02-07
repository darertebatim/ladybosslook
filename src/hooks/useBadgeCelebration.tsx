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
 * Tracks badge level transitions and triggers appropriate celebrations:
 * - none → bronze: No celebration (just starting)
 * - none/bronze → silver: Silver toast celebration
 * - silver → almostGold: "Almost there" toast (when 1 task away from gold)
 * - almostGold/silver → gold: Full-screen gold celebration
 * 
 * Uses localStorage to persist celebrated levels so they don't re-show on navigation
 */
export function useBadgeCelebration({
  currentBadgeLevel,
  completedCount,
  totalCount,
  dateKey,
}: UseBadgeCelebrationOptions) {
  const [celebrationType, setCelebrationType] = useState<BadgeCelebrationLevel | null>(null);
  
  // Track previous badge level for transitions within same session
  const prevBadgeLevelRef = useRef<BadgeLevel>(currentBadgeLevel);
  const prevDateKeyRef = useRef<string>(dateKey);
  const initializedRef = useRef(false);

  // Reset when date changes
  useEffect(() => {
    if (prevDateKeyRef.current !== dateKey) {
      prevBadgeLevelRef.current = 'none';
      prevDateKeyRef.current = dateKey;
      initializedRef.current = false;
    }
  }, [dateKey]);

  // Check for badge level transitions
  useEffect(() => {
    // Skip on initial mount - don't celebrate existing state
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevBadgeLevelRef.current = currentBadgeLevel;
      return;
    }

    const prevLevel = prevBadgeLevelRef.current;
    const celebratedLevels = getCelebratedLevels(dateKey);
    
    // Check for "almost gold" first (1 task away)
    if (
      currentBadgeLevel === 'silver' && 
      totalCount > 0 && 
      completedCount === totalCount - 1 &&
      !celebratedLevels.has('almostGold') &&
      !celebratedLevels.has('gold')
    ) {
      setCelebrationType('almostGold');
      saveCelebratedLevel(dateKey, 'almostGold');
      prevBadgeLevelRef.current = currentBadgeLevel;
      return;
    }
    
    // Skip if already celebrated this badge level today
    if (celebratedLevels.has(currentBadgeLevel)) {
      prevBadgeLevelRef.current = currentBadgeLevel;
      return;
    }

    // Check for silver badge (50% progress)
    if (currentBadgeLevel === 'silver' && prevLevel !== 'silver' && prevLevel !== 'gold') {
      setCelebrationType('silver');
      saveCelebratedLevel(dateKey, 'silver');
    }
    // Check for gold badge (100% progress)
    else if (currentBadgeLevel === 'gold' && prevLevel !== 'gold') {
      setCelebrationType('gold');
      saveCelebratedLevel(dateKey, 'gold');
    }

    prevBadgeLevelRef.current = currentBadgeLevel;
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
