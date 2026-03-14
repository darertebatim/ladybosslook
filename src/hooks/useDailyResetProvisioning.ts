import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const DAILY_RESET_FLAG = 'simora_daily_reset_enabled';
const DAILY_RESET_PROVISIONED = 'simora_daily_reset_provisioned';

const DAILY_RESET_TASKS = [
  { emoji: '📱', title: 'Open Ladyboss App', color: 'peach', tag: 'Daily Reset', pro_link_type: 'route' as const, pro_link_value: '/app' },
  { emoji: '🫁', title: 'Breathing exercise', color: 'sky', tag: 'Daily Reset', pro_link_type: 'breathe' as const, pro_link_value: null },
  { emoji: '🌤️', title: 'Check in with your mood', color: 'yellow', tag: 'Daily Reset', pro_link_type: 'mood' as const, pro_link_value: null },
  { emoji: '📝', title: 'Write a short journaling', color: 'lavender', tag: 'Daily Reset', pro_link_type: 'journal' as const, pro_link_value: null },
  { emoji: '✅', title: 'Complete onboarding', color: 'mint', tag: 'Daily Reset', pro_link_type: null, pro_link_value: null },
];

/**
 * After authentication, checks if the user opted into the "Daily Reset" routine
 * during onboarding and provisions the tasks into their planner.
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
          .eq('tag', 'Daily Reset')
          .limit(1);

        if (existing && existing.length > 0) {
          localStorage.setItem(DAILY_RESET_PROVISIONED, 'true');
          return;
        }

        // Get max order_index
        const { data: lastTask } = await supabase
          .from('user_tasks')
          .select('order_index')
          .eq('user_id', userId)
          .order('order_index', { ascending: false })
          .limit(1);

        const startOrder = (lastTask?.[0]?.order_index ?? -1) + 1;

        const rows = DAILY_RESET_TASKS.map((task, i) => ({
          user_id: userId,
          title: task.title,
          emoji: task.emoji,
          color: task.color,
          tag: task.tag,
          repeat_pattern: 'daily',
          is_active: true,
          order_index: startOrder + i,
          pro_link_type: task.pro_link_type,
          pro_link_value: task.pro_link_value,
        }));

        const { error } = await supabase.from('user_tasks').insert(rows);

        if (!error) {
          localStorage.setItem(DAILY_RESET_PROVISIONED, 'true');
          queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
          console.log('[DailyReset] Provisioned 5 tasks for new user');
        } else {
          console.error('[DailyReset] Insert error:', error);
          hasRun.current = false; // allow retry
        }
      } catch (err) {
        console.error('[DailyReset] Provisioning failed:', err);
        hasRun.current = false;
      }
    })();
  }, [userId, queryClient]);
}
