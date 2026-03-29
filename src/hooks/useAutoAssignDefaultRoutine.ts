import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAddRoutineFromBank } from '@/hooks/useRoutinesBank';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_ROUTINE_ID = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6'; // Daily Reset
const STORAGE_KEY = 'simora_default_routine_assigned';

/**
 * Auto-assigns the "Daily Reset" routine to users who have zero tasks.
 * Runs once per user session — skips if already assigned or user has tasks.
 */
export function useAutoAssignDefaultRoutine() {
  const { user } = useAuth();
  const addRoutine = useAddRoutineFromBank();
  const attempted = useRef(false);

  useEffect(() => {
    if (!user || attempted.current) return;
    if (addRoutine.isPending) return;

    // Already assigned for this user
    if (localStorage.getItem(`${STORAGE_KEY}_${user.id}`) === 'true') return;

    attempted.current = true;

    const checkAndAssign = async () => {
      try {
        // Check if user has ANY tasks at all
        const { count, error } = await supabase
          .from('user_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error || (count ?? 0) > 0) {
          // Has tasks or error — mark as done so we don't retry
          localStorage.setItem(`${STORAGE_KEY}_${user.id}`, 'true');
          return;
        }

        // Also check if they already have the routine in their bank
        const { data: existing } = await supabase
          .from('user_routines_bank')
          .select('id')
          .eq('user_id', user.id)
          .eq('routine_id', DEFAULT_ROUTINE_ID)
          .maybeSingle();

        if (existing) {
          localStorage.setItem(`${STORAGE_KEY}_${user.id}`, 'true');
          return;
        }

        // No tasks, no routine — auto-assign Daily Reset
        console.log('[AutoAssign] Assigning default "Daily Reset" routine');
        await addRoutine.mutateAsync({ routineId: DEFAULT_ROUTINE_ID });
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, 'true');
      } catch (err) {
        console.error('[AutoAssign] Failed to assign default routine:', err);
        // Don't mark as done on error so it retries next session
        attempted.current = false;
      }
    };

    // Delay slightly to let auth settle
    const timer = setTimeout(checkAndAssign, 1500);
    return () => clearTimeout(timer);
  }, [user, addRoutine]);
}
