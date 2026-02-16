import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type JsonResponse = Record<string, unknown>;

const json = (body: JsonResponse, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function requireAuthUser(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing authorization header' } as const;
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabaseUser.auth.getUser(token);
  if (error || !data?.user) return { error: 'Unauthorized' } as const;

  return { user: data.user } as const;
}

async function requireAdmin(userId: string, supabaseAdmin: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data?.role !== 'admin') return false;
  return true;
}

async function mustDelete(
  supabaseAdmin: ReturnType<typeof createClient>,
  table: string,
  column: string,
  value: string
) {
  const { error } = await supabaseAdmin.from(table).delete().eq(column, value);
  if (error) throw new Error(`[reset-user-data] delete ${table}.${column}=${value}: ${error.message}`);
}

async function mustDeleteIn(
  supabaseAdmin: ReturnType<typeof createClient>,
  table: string,
  column: string,
  values: string[]
) {
  if (values.length === 0) return;
  const { error } = await supabaseAdmin.from(table).delete().in(column, values);
  if (error) throw new Error(`[reset-user-data] delete ${table}.${column} IN(...): ${error.message}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const auth = await requireAuthUser(req);
    if ('error' in auth) return json({ error: auth.error }, 401);

    const callerUserId = auth.user.id;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const isAdmin = await requireAdmin(callerUserId, supabaseAdmin);
    if (!isAdmin) return json({ error: 'Forbidden' }, 403);

    let targetUserId = callerUserId;
    
    try {
      const body = await req.json();
      if (body?.targetUserId) {
        targetUserId = body.targetUserId;
      }
    } catch {
      // No body or invalid JSON - reset the admin's own data
    }

    console.log(`[reset-user-data] FULL RESET for user: ${targetUserId}`);

    // -------- Planner: subtask completions first (FK deps) --------
    const { data: tasks } = await supabaseAdmin
      .from('user_tasks')
      .select('id')
      .eq('user_id', targetUserId);

    const taskIds = (tasks ?? []).map((t) => t.id as string);

    if (taskIds.length > 0) {
      const { data: subtasks } = await supabaseAdmin
        .from('user_subtasks')
        .select('id')
        .in('task_id', taskIds);

      const subtaskIds = (subtasks ?? []).map((s) => s.id as string);

      await mustDeleteIn(supabaseAdmin, 'subtask_completions', 'subtask_id', subtaskIds);
      await mustDeleteIn(supabaseAdmin, 'user_subtasks', 'task_id', taskIds);
    }

    // -------- Chat messages before conversations (FK dep) --------
    const { data: convs } = await supabaseAdmin
      .from('chat_conversations')
      .select('id')
      .eq('user_id', targetUserId);

    const convIds = (convs ?? []).map((c) => c.id as string);
    await mustDeleteIn(supabaseAdmin, 'chat_messages', 'conversation_id', convIds);
    await mustDelete(supabaseAdmin, 'chat_conversations', 'user_id', targetUserId);

    // -------- Delete from ALL user-data tables --------
    const tablesToWipe = [
      'task_completions',
      'task_skips',
      'task_reminder_logs',
      'user_tasks',
      'user_streaks',
      'user_tags',
      'user_routine_plans',
      'user_routines_bank',
      'planner_program_completions',
      'routine_plan_ratings',
      'feed_post_reads',
      'feed_reactions',
      'feed_comments',
      'audio_bookmarks',
      'audio_progress',
      'journal_entries',
      'journal_reminder_settings',
      'course_enrollments',
      'module_progress',
      'user_content_views',
      'user_celebrated_rounds',
      'push_subscriptions',
      'app_installations',
      'app_return_events',
      'app_update_logs',
      'credit_transactions',
      'emotion_logs',
      'fasting_preferences',
      'fasting_sessions',
      'breathing_sessions',
      'period_logs',
      'period_settings',
      'playlist_saves',
      'local_notification_events',
      'pn_schedule_logs',
      'user_notification_preferences',
      'user_subscriptions',
      'user_coach_access',
      'weight_logs',
      'subtask_completions',
      // orders intentionally kept for financial/legal compliance
    ];

    for (const table of tablesToWipe) {
      try {
        await mustDelete(supabaseAdmin, table, 'user_id', targetUserId);
      } catch (e) {
        // Log but continue - some tables may not have data
        console.warn(`[reset-user-data] Warning on ${table}:`, (e as Error).message);
      }
    }

    // -------- Reset wallet to 0 (don't delete, trigger re-creates it) --------
    await supabaseAdmin
      .from('user_wallets')
      .update({ credits_balance: 0 })
      .eq('user_id', targetUserId);

    // -------- Reset profile fields to defaults (keep the row) --------
    await supabaseAdmin
      .from('profiles')
      .update({
        avatar_url: null,
        bio: null,
        city: null,
        country: null,
        state: null,
        phone: null,
        timezone: null,
        last_active_date: null,
        return_count: 0,
        this_month_active_days: 0,
        total_active_days: 0,
      })
      .eq('id', targetUserId);

    console.log(`[reset-user-data] ✓ Complete reset done for user: ${targetUserId}`);

    return json({ success: true });
  } catch (error) {
    console.error('[reset-user-data] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return json({ error: message }, 500);
  }
});
