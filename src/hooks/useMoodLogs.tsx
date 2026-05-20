import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import { Analytics } from '@/lib/firebaseAnalytics';
import { runWithOfflineFallback } from '@/lib/offline/runWithOfflineFallback';
import {
  WELLNESS_EXECUTOR_TYPES,
  type CreateEmotionLogPayload,
} from '@/lib/offline/executors/wellnessExecutors';
import { recordMoment } from '@/lib/moments';

export interface MoodLog {
  id: string;
  mood: string;
  content: string;
  created_at: string;
  submoods?: string[];
  contexts?: string[];
  notes?: string | null;
}

export interface MoodDay {
  date: string;
  mood: string;
  count: number;
  entries?: MoodLog[];
}

export interface CreateMoodLogInput {
  mood: string;
  content?: string;
  submoods?: string[];
  contexts?: string[];
  note?: string;
}

const MOOD_VALENCE_MAP: Record<string, string> = {
  great: 'positive',
  good: 'positive',
  okay: 'neutral',
  not_great: 'negative',
  bad: 'negative',
};

const toDefaultMoodContent = (mood: string) => {
  const normalizedMood = mood.replace(/_/g, ' ').toLowerCase();
  return `Feeling ${normalizedMood} today.`;
};

/**
 * Log a mood check-in to emotion_logs (not journal entries)
 */
export function useCreateMoodLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mood, content, submoods, contexts, note }: CreateMoodLogInput): Promise<MoodLog> => {
      if (!user?.id) throw new Error('Not authenticated');

      const clientId = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const valence = MOOD_VALENCE_MAP[mood] ?? 'neutral';

      const noteText = note?.trim() || content || null;

      const payload: CreateEmotionLogPayload = {
        clientId,
        userId: user.id,
        category: 'mood_checkin',
        emotion: mood,
        valence,
        contexts: contexts ?? [],
        notes: noteText,
        submoods: submoods ?? [],
      };

      const result = await runWithOfflineFallback({
        type: WELLNESS_EXECUTOR_TYPES.CREATE_EMOTION_LOG,
        payload,
        fastPath: async () => {
          const { data, error } = await supabase
            .from('emotion_logs')
            .insert({
              id: clientId,
              user_id: user.id,
              category: 'mood_checkin',
              emotion: mood,
              valence,
              notes: noteText,
              contexts: contexts ?? [],
              submoods: submoods ?? [],
            } as any)
            .select('id, emotion, notes, created_at, contexts, submoods')
            .single();
          if (error) throw error;
          return data;
        },
      });

      // Whether we wrote directly or queued, return a usable MoodLog so the
      // UI can render the new check-in immediately.
      return result.data
        ? {
            id: result.data.id,
            mood: result.data.emotion,
            content: result.data.notes || toDefaultMoodContent(result.data.emotion),
            created_at: result.data.created_at,
            submoods: (result.data as any).submoods ?? submoods ?? [],
            contexts: (result.data as any).contexts ?? contexts ?? [],
            notes: result.data.notes ?? null,
          }
        : {
            id: clientId,
            mood,
            content: noteText || toDefaultMoodContent(mood),
            created_at: nowIso,
            submoods: submoods ?? [],
            contexts: contexts ?? [],
            notes: noteText,
          };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mood-logs'] });
      queryClient.invalidateQueries({ queryKey: ['mood-logs-month'] });
      queryClient.invalidateQueries({ queryKey: ['today-mood'] });
      try { Analytics.moodLogged(data.mood); } catch { /* ignore */ }
      if (user?.id) {
        void recordMoment({
          userId: user.id,
          kind: 'mood',
          title: 'A mood check-in',
          emoji: '💗',
          payload: { ref_id: data.id, mood: data.mood },
        });
      }
    },
    onError: (error) => {
      console.error('Failed to log mood:', error);
      toast.error('Failed to log mood');
    },
  });
}

/**
 * Fetch all mood logs for the current user
 */
export function useMoodLogs() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ['mood-logs', user?.id],
    queryFn: async (): Promise<MoodLog[]> => {
      if (!user?.id) return [];

      const [emotionResult, journalResult] = await Promise.all([
        supabase
          .from('emotion_logs')
          .select('id, emotion, notes, created_at, contexts, submoods')
          .eq('user_id', user.id)
          .eq('category', 'mood_checkin')
          .order('created_at', { ascending: false }),
        supabase
          .from('free_form_reflections')
          .select('id, mood, content, created_at')
          .eq('user_id', user.id)
          .not('mood', 'is', null)
          .order('created_at', { ascending: false }),
      ]);

      if (emotionResult.error) throw emotionResult.error;
      if (journalResult.error) throw journalResult.error;

      const emotionLogs: MoodLog[] = (emotionResult.data || []).map((entry: any) => ({
        id: entry.id,
        mood: entry.emotion,
        content: entry.notes || toDefaultMoodContent(entry.emotion),
        created_at: entry.created_at,
        submoods: entry.submoods ?? [],
        contexts: entry.contexts ?? [],
        notes: entry.notes ?? null,
      }));

      const journalLogs: MoodLog[] = (journalResult.data || []).map((entry) => ({
        id: entry.id,
        mood: entry.mood || 'okay',
        content: entry.content,
        created_at: entry.created_at,
      }));

      return [...emotionLogs, ...journalLogs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !loading && !!user?.id,
  });
}

/**
 * Fetch mood logs for a specific month (for calendar display)
 */
export function useMoodLogsForMonth(month: Date) {
  const { user, loading } = useAuth();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  return useQuery({
    queryKey: ['mood-logs-month', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async (): Promise<Map<string, MoodDay>> => {
      if (!user?.id) return new Map();

      const [emotionResult, journalResult] = await Promise.all([
        supabase
          .from('emotion_logs')
          .select('id, emotion, created_at')
          .eq('user_id', user.id)
          .eq('category', 'mood_checkin')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('free_form_reflections')
          .select('id, mood, created_at')
          .eq('user_id', user.id)
          .not('mood', 'is', null)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
          .order('created_at', { ascending: false }),
      ]);

      if (emotionResult.error) throw emotionResult.error;
      if (journalResult.error) throw journalResult.error;

      const mergedEntries = [
        ...(emotionResult.data || []).map((entry) => ({
          mood: entry.emotion,
          created_at: entry.created_at,
        })),
        ...(journalResult.data || []).map((entry) => ({
          mood: entry.mood || 'okay',
          created_at: entry.created_at,
        })),
      ];

      // Group by date, taking the most recent mood for each day
      const moodMap = new Map<string, MoodDay>();

      mergedEntries.forEach((entry) => {
        const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
        const existing = moodMap.get(dateKey);

        if (existing) {
          existing.count += 1;
        } else {
          moodMap.set(dateKey, {
            date: dateKey,
            mood: entry.mood,
            count: 1,
          });
        }
      });

      return moodMap;
    },
    enabled: !loading && !!user?.id,
  });
}

/**
 * Check if mood has been logged today
 */
export function useTodayMood() {
  const { user, loading } = useAuth();
  const today = new Date();

  return useQuery({
    queryKey: ['today-mood', user?.id, format(today, 'yyyy-MM-dd')],
    queryFn: async (): Promise<MoodLog | null> => {
      if (!user?.id) return null;

      const dayStart = startOfDay(today);
      const dayEnd = endOfDay(today);

      const [emotionResult, journalResult] = await Promise.all([
        supabase
          .from('emotion_logs')
          .select('id, emotion, notes, created_at')
          .eq('user_id', user.id)
          .eq('category', 'mood_checkin')
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('free_form_reflections')
          .select('id, mood, content, created_at')
          .eq('user_id', user.id)
          .not('mood', 'is', null)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (emotionResult.error) throw emotionResult.error;
      if (journalResult.error) throw journalResult.error;

      const emotionLog = emotionResult.data
        ? {
            id: emotionResult.data.id,
            mood: emotionResult.data.emotion,
            content: emotionResult.data.notes || toDefaultMoodContent(emotionResult.data.emotion),
            created_at: emotionResult.data.created_at,
          }
        : null;

      const journalLog = journalResult.data
        ? {
            id: journalResult.data.id,
            mood: journalResult.data.mood || 'okay',
            content: journalResult.data.content,
            created_at: journalResult.data.created_at,
          }
        : null;

      if (!emotionLog && !journalLog) return null;
      if (!emotionLog) return journalLog;
      if (!journalLog) return emotionLog;

      return new Date(emotionLog.created_at) > new Date(journalLog.created_at)
        ? emotionLog
        : journalLog;
    },
    enabled: !loading && !!user?.id,
  });
}

