import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type LessonType = 'video' | 'audio' | 'document' | 'pdf' | 'link' | 'session';

export interface LessonAttachment {
  name: string;
  url: string;
}

export interface LearnCourse {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string | null;
  intro_note?: string | null;
  language?: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  sequential_lessons?: boolean | null;
  sort_order: number;
}

export interface LearnModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_published?: boolean;
}

export interface LearnLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_html?: string | null;
  lesson_type: LessonType;
  video_id: string | null;
  audio_id: string | null;
  reading_id: string | null;
  pdf_url: string | null;
  link_url?: string | null;
  link_label?: string | null;
  session_url?: string | null;
  session_at?: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_published?: boolean;
  is_free_preview?: boolean;
  drip_days?: number | null;
  drip_date?: string | null;
  attachments?: LessonAttachment[] | null;
  video?: {
    id: string;
    title: string;
    file_url: string | null;
    thumbnail_url: string | null;
    is_vertical: boolean | null;
    duration_seconds: number | null;
  } | null;
  audio?: {
    id: string;
    title: string;
    file_url: string | null;
    cover_image_url: string | null;
    duration_seconds: number | null;
  } | null;
  reading?: {
    id: string;
    title: string;
    cover_url: string | null;
  } | null;
}

export interface LearnCourseContent {
  modules: LearnModule[];
  lessons: LearnLesson[];
}

/** Courses the current user can access (RLS enforces enrollment via linked rounds). */
export function useLearnCourses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['learn-courses', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learn_courses')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');
      if (error) throw error;
      return data as LearnCourse[];
    },
  });
}

/** A single course record. */
export function useLearnCourse(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['learn-course', courseId],
    enabled: !!user && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learn_courses')
        .select('*')
        .eq('id', courseId!)
        .maybeSingle();
      if (error) throw error;
      return (data as LearnCourse) ?? null;
    },
  });
}

/** Modules + lessons (with joined media) for one course. */
export function useLearnCourseContent(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['learn-course-content', courseId],
    enabled: !!user && !!courseId,
    queryFn: async () => {
      const { data: modules, error: mErr } = await supabase
        .from('learn_modules')
        .select('*')
        .eq('course_id', courseId!)
        .order('sort_order');
      if (mErr) throw mErr;

      const visibleModules = ((modules || []) as LearnModule[]).filter(
        (m) => m.is_published !== false
      );

      const moduleIds = visibleModules.map((m) => m.id);
      let lessons: LearnLesson[] = [];
      if (moduleIds.length > 0) {
        const { data, error: lErr } = await supabase
          .from('learn_lessons')
          .select(
            `*,
             video:video_content!learn_lessons_video_id_fkey(id, title, file_url, thumbnail_url, is_vertical, duration_seconds),
             audio:audio_content!learn_lessons_audio_id_fkey(id, title, file_url, cover_image_url, duration_seconds),
             reading:reading_content!learn_lessons_reading_id_fkey(id, title, cover_url)`
          )
          .in('module_id', moduleIds)
          .order('sort_order');
        if (lErr) throw lErr;
        lessons = ((data || []) as unknown as LearnLesson[]).filter(
          (l) => l.is_published !== false
        );
      }
      return { modules: visibleModules, lessons } as LearnCourseContent;
    },
  });
}

/**
 * Earliest enrollment date for the rounds linked to a course.
 * Used to work out when drip-scheduled lessons unlock.
 */
export function useLearnCourseStartDate(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['learn-course-start', courseId, user?.id],
    enabled: !!user && !!courseId,
    queryFn: async () => {
      const { data: links, error: lErr } = await supabase
        .from('learn_course_rounds')
        .select('round_id')
        .eq('course_id', courseId!);
      if (lErr) throw lErr;
      const roundIds = (links || []).map((l) => l.round_id);
      if (!roundIds.length) return null;
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('enrolled_at')
        .in('round_id', roundIds)
        .order('enrolled_at', { ascending: true })
        .limit(1);
      if (error) throw error;
      return (data?.[0]?.enrolled_at as string) ?? null;
    },
  });
}

/** null = unlocked, otherwise the Date it unlocks. */
export function lessonUnlockDate(
  lesson: LearnLesson,
  startDate: string | null | undefined
): Date | null {
  if (lesson.drip_date) {
    const d = new Date(lesson.drip_date);
    return d.getTime() > Date.now() ? d : null;
  }
  if (lesson.drip_days && startDate) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + lesson.drip_days);
    return d.getTime() > Date.now() ? d : null;
  }
  return null;
}

export interface LessonLock {
  type: 'drip' | 'sequence';
  label: string;
}

/**
 * Returns a lock checker for a course.
 * Drip schedule always applies; when `sequential` is on, a lesson also stays
 * locked until every earlier (non-preview, already-released) lesson is done.
 */
export function makeLessonLocker(opts: {
  flatLessons: LearnLesson[];
  startDate: string | null | undefined;
  progress: Set<string> | undefined;
  sequential: boolean;
}) {
  const { flatLessons, startDate, progress, sequential } = opts;
  return (lesson: LearnLesson): LessonLock | null => {
    const d = lessonUnlockDate(lesson, startDate);
    if (d) return { type: 'drip', label: formatUnlockLabel(d) };
    if (!sequential || lesson.is_free_preview) return null;
    const idx = flatLessons.findIndex((l) => l.id === lesson.id);
    for (let i = 0; i < idx; i++) {
      const prev = flatLessons[i];
      if (prev.is_free_preview) continue;
      if (lessonUnlockDate(prev, startDate)) continue;
      if (!progress?.has(prev.id)) {
        return { type: 'sequence', label: 'Finish the previous lesson first' };
      }
    }
    return null;
  };
}

export function formatUnlockLabel(date: Date): string {
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days <= 1) return 'Unlocks tomorrow';
  return `Unlocks in ${days} days`;
}

/** Set of completed lesson ids for the current user. */
export function useLearnProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['learn-progress', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learn_lesson_progress')
        .select('lesson_id');
      if (error) throw error;
      return new Set((data || []).map((r) => r.lesson_id));
    },
  });
}

export function useSetLessonComplete() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, complete }: { lessonId: string; complete: boolean }) => {
      if (!user) throw new Error('Not signed in');
      if (complete) {
        const { error } = await supabase
          .from('learn_lesson_progress')
          .upsert(
            { user_id: user.id, lesson_id: lessonId },
            { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('learn_lesson_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learn-progress'] });
    },
  });
}

/** Course linked to a program round (for the course detail Quick Actions). */
export function useRoundCourse(roundId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['learn-round-course', roundId],
    enabled: !!user && !!roundId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learn_course_rounds')
        .select('course_id')
        .eq('round_id', roundId!)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.course_id as string) ?? null;
    },
  });
}

export function formatLessonDuration(seconds: number | null | undefined): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "1h 20m" / "45m" for a whole course. */
export function formatTotalDuration(seconds: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function lessonDurationSeconds(l: LearnLesson): number | null {
  return l.duration_seconds ?? l.video?.duration_seconds ?? l.audio?.duration_seconds ?? null;
}
