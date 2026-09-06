import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type LessonType = 'video' | 'audio' | 'document' | 'pdf';

export interface LearnCourse {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  sort_order: number;
}

export interface LearnModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface LearnLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  lesson_type: LessonType;
  video_id: string | null;
  audio_id: string | null;
  reading_id: string | null;
  pdf_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
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

      const moduleIds = (modules || []).map((m) => m.id);
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
        lessons = (data || []) as unknown as LearnLesson[];
      }
      return { modules: (modules || []) as LearnModule[], lessons } as LearnCourseContent;
    },
  });
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
