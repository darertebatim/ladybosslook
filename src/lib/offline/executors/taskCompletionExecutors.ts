/**
 * Offline executors for task completion writes.
 *
 * Registered at module import — wired in `src/lib/offline/registerExecutors.ts`
 * which is imported once from App.tsx before `initOfflineMutationQueue()`.
 *
 * Each executor must be IDEMPOTENT: the queue may retry it after a network
 * blip, and Supabase has no built-in idempotency keys. We rely on the
 * (user_id, task_id, completed_date) shape being unique per row + safe to
 * upsert/delete repeatedly.
 */
import { supabase } from '@/integrations/supabase/client';
import { registerExecutor } from '@/lib/offline/offlineMutationQueue';
import { updatePresence } from '@/hooks/useUserPresence';
import { updateStreak } from '@/hooks/useTaskPlanner';
import { checkAndUnlockNextProjectStep } from '@/hooks/useProjectStepUnlock';

// ---------------------------------------------------------------------------
// Payload shapes (kept tiny + JSON-safe so they survive IDB serialisation)
// ---------------------------------------------------------------------------

export interface CompleteTaskPayload {
  userId: string;
  taskId: string;
  dateStr: string; // 'yyyy-MM-dd'
}

export interface UncompleteTaskPayload {
  userId: string;
  taskId: string;
  dateStr: string;
}

export interface CompleteSubtaskPayload {
  userId: string;
  subtaskId: string;
  dateStr: string;
}

export interface UncompleteSubtaskPayload {
  userId: string;
  subtaskId: string;
  dateStr: string;
}

// ---------------------------------------------------------------------------
// Executors
// ---------------------------------------------------------------------------

/**
 * Insert a task_completions row. Idempotent: if a row already exists for
 * (user_id, task_id, completed_date) we treat the conflict as success.
 */
async function execCompleteTask(p: CompleteTaskPayload): Promise<void> {
  const { error } = await supabase
    .from('task_completions')
    .insert({
      user_id: p.userId,
      task_id: p.taskId,
      completed_date: p.dateStr,
    });

  if (error) {
    // Unique violation = already completed (e.g. retry after partial success).
    // 23505 is Postgres' unique_violation code; Supabase exposes it on `code`.
    const code = (error as { code?: string }).code;
    if (code !== '23505') throw error;
  }

  // Side-effects — best-effort, must not block the queue draining.
  // updateStreak / updatePresence / project step unlock are server reads + writes;
  // we don't surface their errors because the primary completion already
  // succeeded.
  try { await updateStreak(p.userId, p.dateStr); } catch (e) { console.warn('[exec] streak:', e); }
  try { await updatePresence(p.userId, p.dateStr); } catch (e) { console.warn('[exec] presence:', e); }
  try { await checkAndUnlockNextProjectStep(p.userId, p.taskId, p.dateStr); } catch (e) { console.warn('[exec] step:', e); }
}

async function execUncompleteTask(p: UncompleteTaskPayload): Promise<void> {
  const { error } = await supabase
    .from('task_completions')
    .delete()
    .eq('task_id', p.taskId)
    .eq('user_id', p.userId)
    .eq('completed_date', p.dateStr);

  // Delete is naturally idempotent — missing row is fine.
  if (error) throw error;
}

async function execCompleteSubtask(p: CompleteSubtaskPayload): Promise<void> {
  const { error } = await supabase
    .from('subtask_completions')
    .insert({
      user_id: p.userId,
      subtask_id: p.subtaskId,
      completed_date: p.dateStr,
    });

  if (error) {
    const code = (error as { code?: string }).code;
    if (code !== '23505') throw error;
  }
}

async function execUncompleteSubtask(p: UncompleteSubtaskPayload): Promise<void> {
  const { error } = await supabase
    .from('subtask_completions')
    .delete()
    .eq('subtask_id', p.subtaskId)
    .eq('user_id', p.userId)
    .eq('completed_date', p.dateStr);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Type keys — re-exported so callers reference them, not strings
// ---------------------------------------------------------------------------

export const TASK_EXECUTOR_TYPES = {
  COMPLETE_TASK: 'task.complete',
  UNCOMPLETE_TASK: 'task.uncomplete',
  COMPLETE_SUBTASK: 'subtask.complete',
  UNCOMPLETE_SUBTASK: 'subtask.uncomplete',
} as const;

/** Idempotent registration — safe to call multiple times. */
export function registerTaskExecutors(): void {
  registerExecutor<CompleteTaskPayload>(TASK_EXECUTOR_TYPES.COMPLETE_TASK, execCompleteTask);
  registerExecutor<UncompleteTaskPayload>(TASK_EXECUTOR_TYPES.UNCOMPLETE_TASK, execUncompleteTask);
  registerExecutor<CompleteSubtaskPayload>(TASK_EXECUTOR_TYPES.COMPLETE_SUBTASK, execCompleteSubtask);
  registerExecutor<UncompleteSubtaskPayload>(TASK_EXECUTOR_TYPES.UNCOMPLETE_SUBTASK, execUncompleteSubtask);
}