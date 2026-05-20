/**
 * Offline executors for wellness writes:
 *  - mood check-ins (emotion_logs row, category='mood_checkin')
 *  - emotion logs (emotion_logs row, any other category)
 *  - free-form reflections (insert/update/delete)
 *  - focus sessions (insert)
 *  - breathing sessions (insert)
 *
 * Each payload includes a client-generated id (`clientId`) so that:
 *  1) Optimistic UI rows can be matched + replaced after the queued write
 *     finally lands, and
 *  2) Retries are idempotent: we INSERT with the chosen `id` so a duplicate
 *     attempt hits a unique-violation we can swallow.
 */
import { supabase } from '@/integrations/supabase/client';
import { registerExecutor } from '@/lib/offline/offlineMutationQueue';

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

export interface CreateEmotionLogPayload {
  clientId: string;
  userId: string;
  category: string;
  emotion: string;
  valence: string;
  contexts: string[];
  notes: string | null;
  submoods?: string[] | null;
}

export interface DeleteEmotionLogPayload {
  userId: string;
  logId: string;
}

export interface CreateReflectionPayload {
  clientId: string;
  userId: string;
  title: string;
  content: string;
  mood: string | null;
}

export interface UpdateReflectionPayload {
  userId: string;
  id: string;
  title: string;
  content: string;
}

export interface DeleteReflectionPayload {
  userId: string;
  id: string;
}

export interface SaveFocusSessionPayload {
  clientId: string;
  userId: string;
  durationSeconds: number;
  sessionType: 'timer' | 'pomodoro';
  theme: string | null;
  pomodoroRounds: number | null;
  completed: boolean;
  startedAt: string; // ISO
}

export interface SaveBreathingSessionPayload {
  clientId: string;
  userId: string;
  exerciseId: string;
  durationSeconds: number;
}

export interface StartFastingSessionPayload {
  clientId: string;
  userId: string;
  protocol: string;
  fastingHours: number;
  startedAt: string; // ISO
}

export interface EndFastingSessionPayload {
  userId: string;
  sessionId: string;
  endedAt: string; // ISO
}

export interface UpdateFastingSessionPayload {
  userId: string;
  sessionId: string;
  startedAt?: string;
  fastingHours?: number;
}

export interface DeleteFastingSessionPayload {
  userId: string;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True for Postgres unique_violation — we treat it as success on retries. */
function isDuplicate(err: { code?: string } | null | undefined): boolean {
  return err?.code === '23505';
}

// ---------------------------------------------------------------------------
// Executors
// ---------------------------------------------------------------------------

async function execCreateEmotionLog(p: CreateEmotionLogPayload): Promise<void> {
  const { error } = await supabase
    .from('emotion_logs')
    .insert({
      id: p.clientId,
      user_id: p.userId,
      category: p.category,
      emotion: p.emotion,
      valence: p.valence,
      contexts: p.contexts,
      notes: p.notes,
      submoods: p.submoods ?? null,
    } as any);
  if (error && !isDuplicate(error)) throw error;
}

async function execDeleteEmotionLog(p: DeleteEmotionLogPayload): Promise<void> {
  const { error } = await supabase
    .from('emotion_logs')
    .delete()
    .eq('id', p.logId)
    .eq('user_id', p.userId);
  if (error) throw error;
}

async function execCreateReflection(p: CreateReflectionPayload): Promise<void> {
  const { error } = await supabase
    .from('free_form_reflections')
    .insert({
      id: p.clientId,
      user_id: p.userId,
      title: p.title,
      content: p.content,
      mood: p.mood,
    });
  if (error && !isDuplicate(error)) throw error;
}

async function execUpdateReflection(p: UpdateReflectionPayload): Promise<void> {
  const { error } = await supabase
    .from('free_form_reflections')
    .update({ title: p.title, content: p.content })
    .eq('id', p.id)
    .eq('user_id', p.userId);
  if (error) throw error;
}

async function execDeleteReflection(p: DeleteReflectionPayload): Promise<void> {
  const { error } = await supabase
    .from('free_form_reflections')
    .delete()
    .eq('id', p.id)
    .eq('user_id', p.userId);
  if (error) throw error;
}

async function execSaveFocusSession(p: SaveFocusSessionPayload): Promise<void> {
  const { error } = await supabase
    .from('focus_sessions')
    .insert({
      id: p.clientId,
      user_id: p.userId,
      duration_seconds: p.durationSeconds,
      session_type: p.sessionType,
      theme: p.theme,
      pomodoro_rounds: p.pomodoroRounds,
      completed: p.completed,
      started_at: p.startedAt,
    });
  if (error && !isDuplicate(error)) throw error;
}

async function execSaveBreathingSession(p: SaveBreathingSessionPayload): Promise<void> {
  const { error } = await supabase
    .from('breathing_sessions')
    .insert({
      id: p.clientId,
      user_id: p.userId,
      exercise_id: p.exerciseId,
      duration_seconds: p.durationSeconds,
    });
  if (error && !isDuplicate(error)) throw error;
}

async function execStartFastingSession(p: StartFastingSessionPayload): Promise<void> {
  const { error } = await supabase
    .from('fasting_sessions' as any)
    .insert({
      id: p.clientId,
      user_id: p.userId,
      protocol: p.protocol,
      fasting_hours: p.fastingHours,
      started_at: p.startedAt,
    } as any);
  if (error && !isDuplicate(error)) throw error;
}

async function execEndFastingSession(p: EndFastingSessionPayload): Promise<void> {
  const { error } = await supabase
    .from('fasting_sessions' as any)
    .update({ ended_at: p.endedAt } as any)
    .eq('id', p.sessionId)
    .eq('user_id', p.userId);
  if (error) throw error;
}

async function execUpdateFastingSession(p: UpdateFastingSessionPayload): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (p.startedAt) updates.started_at = p.startedAt;
  if (typeof p.fastingHours === 'number') updates.fasting_hours = p.fastingHours;
  if (Object.keys(updates).length === 0) return;
  const { error } = await supabase
    .from('fasting_sessions' as any)
    .update(updates as any)
    .eq('id', p.sessionId)
    .eq('user_id', p.userId);
  if (error) throw error;
}

async function execDeleteFastingSession(p: DeleteFastingSessionPayload): Promise<void> {
  const { error } = await supabase
    .from('fasting_sessions' as any)
    .delete()
    .eq('id', p.sessionId)
    .eq('user_id', p.userId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Type keys + registration
// ---------------------------------------------------------------------------

export const WELLNESS_EXECUTOR_TYPES = {
  CREATE_EMOTION_LOG: 'emotion.create',
  DELETE_EMOTION_LOG: 'emotion.delete',
  CREATE_REFLECTION: 'reflection.create',
  UPDATE_REFLECTION: 'reflection.update',
  DELETE_REFLECTION: 'reflection.delete',
  SAVE_FOCUS_SESSION: 'focus.save',
  SAVE_BREATHING_SESSION: 'breathing.save',
  START_FASTING_SESSION: 'fasting.start',
  END_FASTING_SESSION: 'fasting.end',
  UPDATE_FASTING_SESSION: 'fasting.update',
  DELETE_FASTING_SESSION: 'fasting.delete',
} as const;

export function registerWellnessExecutors(): void {
  registerExecutor<CreateEmotionLogPayload>(WELLNESS_EXECUTOR_TYPES.CREATE_EMOTION_LOG, execCreateEmotionLog);
  registerExecutor<DeleteEmotionLogPayload>(WELLNESS_EXECUTOR_TYPES.DELETE_EMOTION_LOG, execDeleteEmotionLog);
  registerExecutor<CreateReflectionPayload>(WELLNESS_EXECUTOR_TYPES.CREATE_REFLECTION, execCreateReflection);
  registerExecutor<UpdateReflectionPayload>(WELLNESS_EXECUTOR_TYPES.UPDATE_REFLECTION, execUpdateReflection);
  registerExecutor<DeleteReflectionPayload>(WELLNESS_EXECUTOR_TYPES.DELETE_REFLECTION, execDeleteReflection);
  registerExecutor<SaveFocusSessionPayload>(WELLNESS_EXECUTOR_TYPES.SAVE_FOCUS_SESSION, execSaveFocusSession);
  registerExecutor<SaveBreathingSessionPayload>(WELLNESS_EXECUTOR_TYPES.SAVE_BREATHING_SESSION, execSaveBreathingSession);
  registerExecutor<StartFastingSessionPayload>(WELLNESS_EXECUTOR_TYPES.START_FASTING_SESSION, execStartFastingSession);
  registerExecutor<EndFastingSessionPayload>(WELLNESS_EXECUTOR_TYPES.END_FASTING_SESSION, execEndFastingSession);
  registerExecutor<UpdateFastingSessionPayload>(WELLNESS_EXECUTOR_TYPES.UPDATE_FASTING_SESSION, execUpdateFastingSession);
  registerExecutor<DeleteFastingSessionPayload>(WELLNESS_EXECUTOR_TYPES.DELETE_FASTING_SESSION, execDeleteFastingSession);
}