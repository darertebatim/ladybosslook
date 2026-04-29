import { supabase } from '@/integrations/supabase/client';
import { whatIsRiloFlow } from '@/data/onboarding-flows/what-is-rilo';
import type { OnboardingAnswers } from '@/types/onboarding';

const BUCKET_TO_TIME_PERIOD: Record<string, string> = {
  'wir-pick-morning': 'morning',
  'wir-pick-afternoon': 'afternoon',
  'wir-pick-evening': 'evening',
};

// Round-robin task colors used elsewhere in the app
const COLOR_CYCLE = ['sky', 'mint', 'lavender', 'pink', 'lime', 'yellow', 'peach'];

const MY_RILO_TITLE = 'My Rilo';
const MY_RILO_EMOJI = '🔥';
const MY_RILO_COLOR = 'pink';

/**
 * Build a label -> emoji lookup from the picker step definitions in the flow.
 */
function buildLabelEmojiMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const s of whatIsRiloFlow.steps as any[]) {
    if (s.type === 'rilo-pick-tasks' && Array.isArray(s.pickerTasks)) {
      for (const t of s.pickerTasks) map[t.label] = t.emoji;
    }
  }
  return map;
}

/**
 * Persists the user's onboarding picks as a single user-owned routine
 * called "My Rilo" — exactly the same shape a user would get from the
 * Routine Builder (a row in `user_routines_bank` with `is_user_created=true`,
 * child tasks with `source_routine_id`, and a routine-launcher task with
 * `pro_link_type='routine'`). Idempotent: if "My Rilo" already exists for
 * this user, no-op.
 */
export async function provisionRiloPicks(
  userId: string,
  answers: OnboardingAnswers
): Promise<{ inserted: number; skipped: number; routineId?: string }> {
  if (!userId) return { inserted: 0, skipped: 0 };

  const labelEmoji = buildLabelEmojiMap();

  // Flatten picks in display order: morning -> afternoon -> evening
  type Row = { title: string; emoji: string; time_period: string };
  const rows: Row[] = [];
  for (const [stepId, period] of Object.entries(BUCKET_TO_TIME_PERIOD)) {
    const a = answers[stepId];
    const arr = Array.isArray(a) ? a : a ? [a] : [];
    for (const label of arr) {
      if (!label || typeof label !== 'string') continue;
      rows.push({
        title: label,
        emoji: labelEmoji[label] || '✨',
        time_period: period,
      });
    }
  }

  if (rows.length === 0) return { inserted: 0, skipped: 0 };

  // Idempotency: if "My Rilo" already exists, return its id without inserting
  try {
    const { data: existingRoutine } = await supabase
      .from('user_routines_bank')
      .select('routine_id')
      .eq('user_id', userId)
      .eq('title', MY_RILO_TITLE)
      .eq('is_user_created', true)
      .limit(1)
      .maybeSingle();
    if (existingRoutine?.routine_id) {
      return { inserted: 0, skipped: rows.length, routineId: existingRoutine.routine_id };
    }
  } catch (_) {
    /* ignore — fall through and try to create */
  }

  // 1) Create the user-owned routine row (mirrors Routine Builder save flow)
  const { data: newRoutine, error: routineError } = await supabase
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

  if (routineError || !newRoutine) {
    console.warn('[provisionRiloPicks] Routine create failed:', routineError?.message);
    return { inserted: 0, skipped: rows.length };
  }
  const routineId = (newRoutine as any).routine_id as string;

  // 2) Determine starting order_index so new tasks land at the bottom
  let startOrder = 0;
  try {
    const { data: maxRow } = await supabase
      .from('user_tasks')
      .select('order_index')
      .eq('user_id', userId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    startOrder = (maxRow?.order_index ?? -1) + 1;
  } catch (_) {
    startOrder = 0;
  }

  // 3) Insert child tasks (linked via source_routine_id)
  const childInserts = rows.map((r, i) => ({
    user_id: userId,
    title: r.title,
    emoji: r.emoji,
    color: COLOR_CYCLE[i % COLOR_CYCLE.length],
    repeat_pattern: 'daily',
    time_period: r.time_period,
    tag: MY_RILO_TITLE,
    is_active: true,
    order_index: startOrder + i,
    source_routine_id: routineId,
  }));

  const { error: childErr } = await supabase
    .from('user_tasks')
    .insert(childInserts as any);
  if (childErr) {
    console.warn('[provisionRiloPicks] Child task insert failed:', childErr.message);
  }

  // 4) Insert the routine-launcher task that appears in the planner
  const { error: launcherErr } = await supabase.from('user_tasks').insert({
    user_id: userId,
    title: MY_RILO_TITLE,
    emoji: MY_RILO_EMOJI,
    color: MY_RILO_COLOR,
    repeat_pattern: 'daily',
    tag: MY_RILO_TITLE,
    pro_link_type: 'routine',
    pro_link_value: routineId,
    is_active: true,
    order_index: startOrder + rows.length,
    source_routine_id: null,
  } as any);
  if (launcherErr) {
    console.warn('[provisionRiloPicks] Launcher insert failed:', launcherErr.message);
  }

  return { inserted: rows.length, skipped: 0, routineId };
}