import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const DAILY_RESET_FLAG = 'simora_daily_reset_enabled';
const DAILY_RESET_PROVISIONED = 'simora_daily_reset_provisioned';
const DAILY_RESET_ROUTINE_TITLE = 'Daily Reset';

/**
 * After authentication, checks if the user opted into the "Daily Reset" routine
 * during onboarding and dynamically provisions tasks from the admin routines bank.
 */
export function useDailyResetProvisioning(userId: string | undefined) {
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!userId || hasRun.current) return;

    const shouldProvision =
      localStorage.getItem(DAILY_RESET_FLAG) === 'true' &&
      localStorage.getItem(DAILY_RESET_PROVISIONED) !== 'true';

    if (!shouldProvision) return;

    hasRun.current = true;

    (async () => {
      try {
        // Check if user already has Daily Reset tasks (prevent duplicates)
        const { data: existing } = await supabase
          .from('user_tasks')
          .select('id')
          .eq('user_id', userId)
          .eq('tag', DAILY_RESET_ROUTINE_TITLE)
          .limit(1);

        if (existing && existing.length > 0) {
          localStorage.setItem(DAILY_RESET_PROVISIONED, 'true');
          return;
        }

        // 1. Find the Daily Reset routine in routines_bank
        const { data: routine } = await supabase
          .from('routines_bank')
          .select('id')
          .eq('title', DAILY_RESET_ROUTINE_TITLE)
          .limit(1)
          .single();

        if (!routine) {
          console.warn('[DailyReset] No routine found with title:', DAILY_RESET_ROUTINE_TITLE);
          hasRun.current = false;
          return;
        }

        // 2. Fetch tasks from routines_bank_tasks, joined with admin_task_bank for metadata
        const { data: routineTasks } = await supabase
          .from('routines_bank_tasks')
          .select('title, emoji, color, task_id, task_order, schedule_days')
          .eq('routine_id', routine.id)
          .order('task_order', { ascending: true });

        if (!routineTasks || routineTasks.length === 0) {
          console.warn('[DailyReset] No tasks found for routine:', routine.id);
          hasRun.current = false;
          return;
        }

        // 3. Fetch extra metadata from task bank for linked tasks
        const linkedIds = routineTasks.filter(t => t.task_id).map(t => t.task_id!);
        let bankMap: Record<string, { pro_link_type: string | null; pro_link_value: string | null }> = {};
        if (linkedIds.length > 0) {
          const { data: bankTasks } = await supabase
            .from('admin_task_bank')
            .select('id, pro_link_type, pro_link_value')
            .in('id', linkedIds);
          if (bankTasks) {
            bankMap = Object.fromEntries(bankTasks.map(b => [b.id, { pro_link_type: b.pro_link_type, pro_link_value: b.pro_link_value }]));
          }
        }

        // 4. Get max order_index
        const { data: lastTask } = await supabase
          .from('user_tasks')
          .select('order_index')
          .eq('user_id', userId)
          .order('order_index', { ascending: false })
          .limit(1);

        const startOrder = (lastTask?.[0]?.order_index ?? -1) + 1;

        // 5. Build rows
        const rows = routineTasks.map((task, i) => {
          const bank = task.task_id ? bankMap[task.task_id] : null;
          const scheduleDays = task.schedule_days || [];
          const repeatPattern = scheduleDays.length === 7 || scheduleDays.length === 0 ? 'daily' : 'weekly';

          return {
            user_id: userId,
            title: task.title,
            emoji: task.emoji || '📝',
            color: task.color || 'sky',
            tag: DAILY_RESET_ROUTINE_TITLE,
            repeat_pattern: repeatPattern,
            repeat_days: scheduleDays.length > 0 && scheduleDays.length < 7 ? scheduleDays : null,
            is_active: true,
            order_index: startOrder + i,
            pro_link_type: bank?.pro_link_type || null,
            pro_link_value: bank?.pro_link_value || null,
          };
        });

        const { error } = await supabase.from('user_tasks').insert(rows);

        if (!error) {
          localStorage.setItem(DAILY_RESET_PROVISIONED, 'true');
          queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
          console.log(`[DailyReset] Provisioned ${rows.length} tasks from admin routine`);
        } else {
          console.error('[DailyReset] Insert error:', error);
          hasRun.current = false;
        }
      } catch (err) {
        console.error('[DailyReset] Provisioning failed:', err);
        hasRun.current = false;
      }
    })();
  }, [userId, queryClient]);
}
