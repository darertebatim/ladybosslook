import { supabase } from '@/integrations/supabase/client';

export const MY_RILO_TITLE = 'My Rilo Self Care';
export const MY_RILO_EMOJI = '🔥';
export const MY_RILO_COLOR = 'pink';

const inflight = new Map<string, Promise<string>>();

/**
 * Returns the routine_id of the user's "My Rilo" routine. If it doesn't
 * exist yet, creates the routines_bank row AND the planner launcher task.
 * Idempotent + coalesced across concurrent callers.
 */
export async function getOrCreateMyRilo(userId: string): Promise<string> {
  if (!userId) throw new Error('getOrCreateMyRilo: missing userId');
  const cached = inflight.get(userId);
  if (cached) return cached;

  const run = (async (): Promise<string> => {
    // 1. Look up existing
    const { data: existing } = await supabase
      .from('user_routines_bank')
      .select('routine_id')
      .eq('user_id', userId)
      .eq('title', MY_RILO_TITLE)
      .eq('is_user_created', true)
      .order('routine_id', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existing?.routine_id) return existing.routine_id as string;

    // 2. Create routine row
    const { data: created, error } = await supabase
      .from('user_routines_bank')
      .insert({
        user_id: userId,
        title: MY_RILO_TITLE,
        emoji: MY_RILO_EMOJI,
        color: MY_RILO_COLOR,
        is_active: true,
        is_user_created: true,
        category: null,
      } as any)
      .select('routine_id')
      .single();
    if (error || !created) throw error || new Error('Failed to create My Rilo');
    const routineId = (created as any).routine_id as string;

    // 3. Ensure planner launcher task exists
    await ensureLauncherTask(userId, routineId);

    return routineId;
  })();

  inflight.set(userId, run);
  try {
    return await run;
  } finally {
    inflight.delete(userId);
  }
}

async function ensureLauncherTask(userId: string, routineId: string) {
  const { data: existingLauncher } = await supabase
    .from('user_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('pro_link_type', 'routine')
    .eq('pro_link_value', routineId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (existingLauncher?.id) return;

  const { data: minRow } = await supabase
    .from('user_tasks')
    .select('order_index')
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();
  const minOrder = minRow?.order_index ?? 0;

  await supabase.from('user_tasks').insert({
    user_id: userId,
    title: MY_RILO_TITLE,
    emoji: MY_RILO_EMOJI,
    color: MY_RILO_COLOR,
    repeat_pattern: 'daily',
    tag: MY_RILO_TITLE,
    pro_link_type: 'routine',
    pro_link_value: routineId,
    is_active: true,
    order_index: minOrder - 1,
    source_routine_id: null,
  } as any);
}

/**
 * Returns the set of lowercased titles already present in My Rilo for dedupe.
 */
export async function fetchMyRiloTaskTitles(
  userId: string,
  routineId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_tasks')
    .select('title')
    .eq('user_id', userId)
    .eq('source_routine_id', routineId)
    .eq('is_active', true);
  return new Set((data || []).map((r: any) => (r.title || '').trim().toLowerCase()));
}

/**
 * Returns the next order_index to use when appending tasks to user_tasks.
 */
export async function getNextOrderIndex(userId: string): Promise<number> {
  const { data } = await supabase
    .from('user_tasks')
    .select('order_index')
    .eq('user_id', userId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.order_index as number | undefined) ?? -1) + 1;
}