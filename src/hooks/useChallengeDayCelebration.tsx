import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChallengeDayCelebrationData {
  challengeTitle: string;
  challengeEmoji: string;
  currentDay: number;
  totalDays: number;
  routineId: string;
  badgeImageUrl: string | null;
}

interface ChallengeRoutineInfo {
  routineId: string;
  title: string;
  emoji: string;
  totalDays: number;
  taskIds: string[];
  hasStarted: boolean;
  badgeImageUrl: string | null;
}

/**
 * Detects when all challenge tasks for today are completed
 * and triggers the ChallengeDayCelebration overlay.
 * Awards badge when challenge is fully completed.
 */
export function useChallengeDayCelebration(
  allTasks: { id: string; title: string }[],
  completedTaskIds: Set<string>,
  dateKey: string,
) {
  const { user } = useAuth();
  const [celebrationData, setCelebrationData] = useState<ChallengeDayCelebrationData | null>(null);
  const initializedRef = useRef(false);
  const initTimeRef = useRef(0);
  const prevDateRef = useRef(dateKey);
  const prevCompletedCountRef = useRef(0);

  // Fetch challenge routines with their task titles
  const { data: challengeInfos } = useQuery({
    queryKey: ['challenge-routine-infos', user?.id],
    queryFn: async (): Promise<ChallengeRoutineInfo[]> => {
      if (!user) return [];

      const { data: userRoutines } = await supabase
        .from('user_routines_bank')
        .select('routine_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!userRoutines?.length) return [];

      const routineIds = userRoutines.map(r => r.routine_id);

      const { data: routines } = await supabase
        .from('routines_bank')
        .select('id, title, emoji, end_after_days, challenge_start_date, start_day_of_week, badge_image_url')
        .in('id', routineIds)
        .eq('is_challenge', true);

      if (!routines?.length) return [];

      // Fetch user's own tasks by source_routine_id (not bank templates)
      const { data: userTasks } = await supabase
        .from('user_tasks')
        .select('id, source_routine_id, title')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .in('source_routine_id', routines.map(r => r.id));

      const taskIdsByRoutine = new Map<string, string[]>();
      (userTasks || []).forEach(t => {
        const rid = (t as any).source_routine_id;
        if (!rid) return;
        const ids = taskIdsByRoutine.get(rid) || [];
        ids.push(t.id);
        taskIdsByRoutine.set(rid, ids);
      });

      return routines.map(r => ({
        routineId: r.id,
        title: r.title,
        emoji: r.emoji || '✨',
        totalDays: (r as any).end_after_days || (taskIdsByRoutine.get(r.id)?.length || 0),
        taskIds: taskIdsByRoutine.get(r.id) || [],
        hasStarted: true,
        badgeImageUrl: (r as any).badge_image_url || null,
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  // Reset on date change
  useEffect(() => {
    if (prevDateRef.current !== dateKey) {
      prevDateRef.current = dateKey;
      initializedRef.current = false;
      initTimeRef.current = 0;
      prevCompletedCountRef.current = 0;
    }
  }, [dateKey]);

  // Detect challenge day completion
  useEffect(() => {
    if (!challengeInfos?.length || !allTasks.length) return;

    const totalCompleted = completedTaskIds.size;

    if (!initializedRef.current) {
      prevCompletedCountRef.current = totalCompleted;
      initializedRef.current = true;
      initTimeRef.current = Date.now();
      return;
    }

    if (Date.now() - initTimeRef.current < 1000) {
      prevCompletedCountRef.current = totalCompleted;
      return;
    }

    const isNewCompletion = totalCompleted > prevCompletedCountRef.current;
    prevCompletedCountRef.current = totalCompleted;
    if (!isNewCompletion) return;

    // Check each challenge — now using task IDs directly
    for (const challenge of challengeInfos) {
      if (!challenge.hasStarted || challenge.taskIds.length === 0) continue;

      const celebratedKey = `simora_challenge_day_celebrated_${challenge.routineId}_${dateKey}`;
      if (localStorage.getItem(celebratedKey) === 'true') continue;

      // Direct ID matching — no title lookup needed
      const allCompleted = challenge.taskIds.every(id => completedTaskIds.has(id));

      if (allCompleted) {
        localStorage.setItem(celebratedKey, 'true');
        
        // Count completed challenge days from localStorage
        let dayCount = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = `simora_challenge_day_celebrated_${challenge.routineId}_${d.toISOString().split('T')[0]}`;
          if (localStorage.getItem(key) === 'true') dayCount++;
        }

        const currentDay = Math.min(dayCount, challenge.totalDays);
        const isComplete = currentDay >= challenge.totalDays;

        // Award badge if challenge is complete and has a badge
        if (isComplete && challenge.badgeImageUrl && user) {
          awardChallengeBadge(user.id, challenge.routineId, challenge.badgeImageUrl, challenge.title, challenge.emoji);
        }

        setCelebrationData({
          challengeTitle: challenge.title,
          challengeEmoji: challenge.emoji,
          currentDay,
          totalDays: challenge.totalDays,
          routineId: challenge.routineId,
          badgeImageUrl: challenge.badgeImageUrl,
        });
        return;
      }
    }
  }, [challengeInfos, allTasks, completedTaskIds, dateKey, user]);

  const closeCelebration = useCallback(() => {
    setCelebrationData(null);
  }, []);

  return {
    celebrationData,
    closeCelebration,
    showCelebration: !!celebrationData,
  };
}

/** Insert badge into user_challenge_badges (ignore duplicates) */
async function awardChallengeBadge(
  userId: string,
  routineId: string,
  badgeImageUrl: string,
  routineTitle: string,
  routineEmoji: string,
) {
  try {
    await supabase
      .from('user_challenge_badges')
      .insert({
        user_id: userId,
        routine_id: routineId,
        badge_image_url: badgeImageUrl,
        routine_title: routineTitle,
        routine_emoji: routineEmoji,
      });
  } catch {
    // Ignore duplicate or other errors
  }
}
