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
 * Persists the user's onboarding picks (morning / afternoon / evening) as
 * real daily-recurring tasks on their planner. Idempotent on the (user_id,
 * title, time_period) key — re-running won't create duplicates.
 */
export async function provisionRiloPicks(
  userId: string,
  answers: OnboardingAnswers
): Promise<{ inserted: number; skipped: number }> {
  if (!userId) return { inserted: 0, skipped: 0 };

  const labelEmoji = buildLabelEmojiMap();

  // Flatten all picks into rows
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

  // Determine the next order_index so new tasks land at the bottom
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

  // Skip tasks the user already has with the same (title, time_period)
  let existingTitles = new Set<string>();
  try {
    const { data: existing } = await supabase
      .from('user_tasks')
      .select('title, time_period')
      .eq('user_id', userId)
      .in('time_period', ['morning', 'afternoon', 'evening']);
    existingTitles = new Set(
      (existing || []).map((r: any) => `${r.time_period}:${r.title}`)
    );
  } catch (_) {
    /* ignore */
  }

  const inserts = rows
    .filter((r) => !existingTitles.has(`${r.time_period}:${r.title}`))
    .map((r, i) => ({
      user_id: userId,
      title: r.title,
      emoji: r.emoji,
      color: COLOR_CYCLE[(startOrder + i) % COLOR_CYCLE.length],
      repeat_pattern: 'daily',
      time_period: r.time_period,
      is_active: true,
      order_index: startOrder + i,
    }));

  const skipped = rows.length - inserts.length;
  if (inserts.length === 0) return { inserted: 0, skipped };

  const { error } = await supabase.from('user_tasks').insert(inserts as any);
  if (error) {
    console.warn('[provisionRiloPicks] Insert failed:', error.message);
    return { inserted: 0, skipped };
  }

  return { inserted: inserts.length, skipped };
}