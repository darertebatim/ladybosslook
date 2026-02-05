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
  if (!authHeader) return { error: 'Missing authorization header' } as const;

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabaseUser.auth.getUser();
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

    // Check if a target user ID is provided (admin resetting another user)
    let targetUserId = callerUserId;
    
    try {
      const body = await req.json();
      if (body?.targetUserId) {
        targetUserId = body.targetUserId;
      }
    } catch {
      // No body or invalid JSON - reset the admin's own data
    }

    // -------- Planner (tasks/subtasks/completions/streak/tags) --------
    const { data: tasks, error: tasksErr } = await supabaseAdmin
      .from('user_tasks')
      .select('id')
      .eq('user_id', targetUserId);
    if (tasksErr) throw tasksErr;

    const taskIds = (tasks ?? []).map((t) => t.id as string);

    if (taskIds.length > 0) {
      const { data: subtasks, error: subtasksErr } = await supabaseAdmin
        .from('user_subtasks')
        .select('id')
        .in('task_id', taskIds);
      if (subtasksErr) throw subtasksErr;

      const subtaskIds = (subtasks ?? []).map((s) => s.id as string);

      await mustDeleteIn(supabaseAdmin, 'subtask_completions', 'subtask_id', subtaskIds);
      await mustDeleteIn(supabaseAdmin, 'user_subtasks', 'task_id', taskIds);
    }

    await mustDelete(supabaseAdmin, 'task_completions', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'user_tasks', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'user_streaks', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'user_tags', 'user_id', targetUserId);

    // -------- Routines / planner extras --------
    await mustDelete(supabaseAdmin, 'user_routine_plans', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'user_routines_bank', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'planner_program_completions', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'routine_plan_ratings', 'user_id', targetUserId);

    // -------- Feed --------
    await mustDelete(supabaseAdmin, 'feed_post_reads', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'feed_reactions', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'feed_comments', 'user_id', targetUserId);

    // -------- Audio --------
    await mustDelete(supabaseAdmin, 'audio_bookmarks', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'audio_progress', 'user_id', targetUserId);

    // -------- Journal --------
    await mustDelete(supabaseAdmin, 'journal_entries', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'journal_reminder_settings', 'user_id', targetUserId);

    // -------- Courses / content tracking --------
    await mustDelete(supabaseAdmin, 'course_enrollments', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'module_progress', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'user_content_views', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'user_celebrated_rounds', 'user_id', targetUserId);

    // -------- Push / installs --------
    await mustDelete(supabaseAdmin, 'push_subscriptions', 'user_id', targetUserId);
    await mustDelete(supabaseAdmin, 'app_installations', 'user_id', targetUserId);

    // -------- Wallet --------
    await mustDelete(supabaseAdmin, 'credit_transactions', 'user_id', targetUserId);
    const { error: walletErr } = await supabaseAdmin
      .from('user_wallets')
      .update({ credits_balance: 0 })
      .eq('user_id', targetUserId);
    if (walletErr) throw new Error(`[reset-user-data] update user_wallets: ${walletErr.message}`);

    // -------- Chat --------
    const { data: convs, error: convErr } = await supabaseAdmin
      .from('chat_conversations')
      .select('id')
      .eq('user_id', targetUserId);
    if (convErr) throw convErr;

    const convIds = (convs ?? []).map((c) => c.id as string);
    await mustDeleteIn(supabaseAdmin, 'chat_messages', 'conversation_id', convIds);
    await mustDelete(supabaseAdmin, 'chat_conversations', 'user_id', targetUserId);

    return json({ success: true });
  } catch (error) {
    console.error('[reset-user-data] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return json({ error: message }, 500);
  }
});
