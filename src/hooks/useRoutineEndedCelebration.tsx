import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateStr } from '@/lib/localDate';
import { addRoutineToUserPlanner } from '@/hooks/useRoutinesBank';

export interface RoutineEndedData {
  routineId: string;
  routineTitle: string;
  routineEmoji: string;
  totalDays: number | null;
  badgeImageUrl: string | null;
}

const LS_KEY = (userId: string, routineId: string, endDate: string) =>
  `simora_routine_ended_celebrated_${userId}_${routineId}_${endDate}`;

/**
 * Detects when a user's active routine reaches its end date / end_after_days.
 * Surfaces a celebration sheet that asks if the user wants to add it back.
 */
export function useRoutineEndedCelebration(dateKey: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [endedData, setEndedData] = useState<RoutineEndedData | null>(null);
  const [isAddingAgain, setIsAddingAgain] = useState(false);

  const { data: candidates } = useQuery({
    queryKey: ['routine-ended-candidates', user?.id, dateKey],
    queryFn: async (): Promise<RoutineEndedData[]> => {
      if (!user) return [];

      const { data: userRoutines } = await supabase
        .from('user_routines_bank')
        .select('routine_id, added_at')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!userRoutines?.length) return [];

      const routineIds = userRoutines.map((r) => r.routine_id);
      const addedAtMap = new Map(userRoutines.map((r) => [r.routine_id, r.added_at as string]));

      const { data: routines } = await supabase
        .from('routines_bank')
        .select('id, title, emoji, end_mode, end_after_days, end_date, challenge_start_date, badge_image_url')
        .in('id', routineIds);

      if (!routines?.length) return [];

      const today = getLocalDateStr();
      const ended: (RoutineEndedData & { endDate: string })[] = [];

      for (const r of routines as any[]) {
        if (!r.end_mode || r.end_mode === 'never') continue;

        let endDateStr: string | null = null;
        if (r.end_mode === 'date' && r.end_date) {
          endDateStr = r.end_date as string;
        } else if (r.end_mode === 'after_days' && r.end_after_days) {
          const start = r.challenge_start_date
            ? new Date(r.challenge_start_date)
            : new Date(addedAtMap.get(r.id) || Date.now());
          const end = new Date(start);
          end.setDate(end.getDate() + Number(r.end_after_days));
          endDateStr = getLocalDateStr(end);
        }
        if (!endDateStr) continue;
        if (today < endDateStr) continue; // not ended yet

        const key = LS_KEY(user.id, r.id, endDateStr);
        if (localStorage.getItem(key) === 'true') continue;

        ended.push({
          routineId: r.id,
          routineTitle: r.title,
          routineEmoji: r.emoji || '✨',
          totalDays: r.end_after_days ?? null,
          badgeImageUrl: r.badge_image_url ?? null,
          endDate: endDateStr,
        });
      }

      return ended;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (endedData) return;
    const next = candidates?.find((c) => {
      if (!user) return false;
      const endDate = (c as any).endDate || getLocalDateStr();
      return localStorage.getItem(LS_KEY(user.id, c.routineId, endDate)) !== 'true';
    });
    if (next) setEndedData(next);
  }, [candidates, endedData, user]);

  const closeCelebration = useCallback(() => {
    if (endedData && user) {
      // Mark this routine's end as celebrated so it doesn't reappear.
      const todayKey = getLocalDateStr();
      const candidate = candidates?.find((c) => c.routineId === endedData.routineId);
      const endDate = (candidate as any)?.endDate || todayKey;
      localStorage.setItem(LS_KEY(user.id, endedData.routineId, endDate), 'true');
    }
    setEndedData(null);
    queryClient.invalidateQueries({ queryKey: ['routine-ended-candidates'] });
  }, [endedData, candidates, user, queryClient]);

  const addAgain = useCallback(async () => {
    if (!endedData || !user) return;
    setIsAddingAgain(true);
    try {
      // Start the re-added routine from tomorrow so today's planner
      // isn't suddenly doubled with tasks the user already saw.
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await addRoutineToUserPlanner(user.id, endedData.routineId, { startDate: tomorrow });
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
      queryClient.invalidateQueries({ queryKey: ['routine-ended-candidates'] });
    } finally {
      setIsAddingAgain(false);
      closeCelebration();
    }
  }, [endedData, user, queryClient, closeCelebration]);

  return {
    endedData,
    showCelebration: !!endedData,
    closeCelebration,
    addAgain,
    isAddingAgain,
  };
}