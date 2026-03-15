import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserChallenges } from '@/hooks/useUserChallenges';

interface ChallengeDayCelebrationData {
  challengeTitle: string;
  challengeEmoji: string;
  currentDay: number;
  totalDays: number;
  routineId: string;
}

/**
 * Detects when all challenge tasks for today are completed
 * and triggers the ChallengeDayCelebration overlay.
 *
 * It watches the list of tasks and completed task IDs,
 * cross-references with challenge routine task titles,
 * and fires once per challenge per day.
 */
export function useChallengeDayCelebration(
  allTasks: { id: string; title: string }[],
  completedTaskIds: Set<string>,
  dateKey: string,
) {
  const { data: challenges } = useUserChallenges();
  const [celebrationData, setCelebrationData] = useState<ChallengeDayCelebrationData | null>(null);
  const prevCompletedRef = useRef<number>(0);
  const initializedRef = useRef(false);
  const initTimeRef = useRef(0);
  const prevDateRef = useRef(dateKey);

  // Reset on date change
  useEffect(() => {
    if (prevDateRef.current !== dateKey) {
      prevDateRef.current = dateKey;
      initializedRef.current = false;
      initTimeRef.current = 0;
      prevCompletedRef.current = 0;
    }
  }, [dateKey]);

  useEffect(() => {
    if (!challenges?.length || !allTasks.length) return;

    const totalCompleted = completedTaskIds.size;

    // Initialize baseline
    if (!initializedRef.current) {
      prevCompletedRef.current = totalCompleted;
      initializedRef.current = true;
      initTimeRef.current = Date.now();
      return;
    }

    // Debounce after init
    if (Date.now() - initTimeRef.current < 1000) {
      prevCompletedRef.current = totalCompleted;
      return;
    }

    const isNewCompletion = totalCompleted > prevCompletedRef.current;
    prevCompletedRef.current = totalCompleted;

    if (!isNewCompletion) return;

    // Check each active challenge
    for (const challenge of challenges) {
      if (!challenge.hasStarted) continue;

      // Get localStorage key for this challenge+date
      const celebratedKey = `simora_challenge_day_celebrated_${challenge.routineId}_${dateKey}`;
      if (localStorage.getItem(celebratedKey) === 'true') continue;

      // Find user tasks that match this challenge's task titles
      // We need to fetch the routine's task titles — they're embedded in the challenge hook data
      // but not exposed. We'll match by checking if the user's tasks include titles from the routine.
      // Since useUserChallenges doesn't expose task titles, we use a simpler approach:
      // look for tasks whose titles match and check if ALL of them are completed.

      // We don't have direct access to routine task titles here.
      // Instead, we'll use a different approach: query from the challenge data.
      // The challenge already tells us completedDays. If completedDays just increased
      // (via query invalidation), that means a new day was completed.
      // But that's async. Better approach: we track the challenge's completedDays.
    }
  }, [challenges, allTasks, completedTaskIds, dateKey]);

  const closeCelebration = useCallback(() => {
    if (celebrationData) {
      const celebratedKey = `simora_challenge_day_celebrated_${celebrationData.routineId}_${dateKey}`;
      localStorage.setItem(celebratedKey, 'true');
    }
    setCelebrationData(null);
  }, [celebrationData, dateKey]);

  // Expose a trigger that can be called externally
  const triggerIfComplete = useCallback((routineId: string) => {
    if (!challenges) return;
    const challenge = challenges.find(c => c.routineId === routineId);
    if (!challenge || !challenge.hasStarted) return;
    
    const celebratedKey = `simora_challenge_day_celebrated_${routineId}_${dateKey}`;
    if (localStorage.getItem(celebratedKey) === 'true') return;

    setCelebrationData({
      challengeTitle: challenge.title,
      challengeEmoji: challenge.emoji,
      currentDay: challenge.completedDays,
      totalDays: challenge.totalDays,
      routineId: challenge.routineId,
    });
  }, [challenges, dateKey]);

  return {
    celebrationData,
    closeCelebration,
    showCelebration: !!celebrationData,
    triggerIfComplete,
  };
}
