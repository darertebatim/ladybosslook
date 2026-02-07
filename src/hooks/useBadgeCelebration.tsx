import { useState, useCallback, useRef, useEffect } from 'react';
import { BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';
import { BadgeCelebrationLevel } from '@/components/app/BadgeCelebration';

interface UseBadgeCelebrationOptions {
  currentBadgeLevel: BadgeLevel;
  completedCount: number;
  totalCount: number;
  dateKey: string; // Used to track celebrations per day
}

/**
 * Hook to manage badge celebration state and triggers
 * 
 * Tracks badge level transitions and triggers appropriate celebrations:
 * - none → bronze: No celebration (just starting)
 * - none/bronze → silver: Silver toast celebration
 * - silver → almostGold: "Almost there" toast (when 1 task away from gold)
 * - almostGold/silver → gold: Full-screen gold celebration
 */
export function useBadgeCelebration({
  currentBadgeLevel,
  completedCount,
  totalCount,
  dateKey,
}: UseBadgeCelebrationOptions) {
  const [celebrationType, setCelebrationType] = useState<BadgeCelebrationLevel | null>(null);
  
  // Track previous badge level and what we've celebrated
  const prevBadgeLevelRef = useRef<BadgeLevel>('none');
  const celebratedLevelsRef = useRef<Set<string>>(new Set());
  const prevDateKeyRef = useRef<string>(dateKey);

  // Reset celebrations when date changes
  useEffect(() => {
    if (prevDateKeyRef.current !== dateKey) {
      celebratedLevelsRef.current.clear();
      prevBadgeLevelRef.current = 'none';
      prevDateKeyRef.current = dateKey;
    }
  }, [dateKey]);

  // Check for badge level transitions
  useEffect(() => {
    const prevLevel = prevBadgeLevelRef.current;
    const celebrationKey = `${dateKey}-${currentBadgeLevel}`;
    
    // Check for "almost gold" first (1 task away) - this is independent of badge level changes
    // Must check before the badge level transitions
    if (
      currentBadgeLevel === 'silver' && 
      totalCount > 0 && 
      completedCount === totalCount - 1 &&
      !celebratedLevelsRef.current.has(`${dateKey}-almostGold`) &&
      !celebratedLevelsRef.current.has(`${dateKey}-gold`)
    ) {
      setCelebrationType('almostGold');
      celebratedLevelsRef.current.add(`${dateKey}-almostGold`);
      prevBadgeLevelRef.current = currentBadgeLevel;
      return;
    }
    
    // Skip if already celebrated this badge level today
    if (celebratedLevelsRef.current.has(celebrationKey)) {
      prevBadgeLevelRef.current = currentBadgeLevel;
      return;
    }

    // Check for silver badge (50% progress)
    if (currentBadgeLevel === 'silver' && prevLevel !== 'silver' && prevLevel !== 'gold') {
      setCelebrationType('silver');
      celebratedLevelsRef.current.add(celebrationKey);
    }
    // Check for gold badge (100% progress)
    else if (currentBadgeLevel === 'gold' && prevLevel !== 'gold') {
      setCelebrationType('gold');
      celebratedLevelsRef.current.add(celebrationKey);
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
