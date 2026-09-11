import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCoursesData } from '@/hooks/useAppData';
import {
  useLearnCourse,
  useLearnCourseContent,
  useLearnCourseStartDate,
  useLearnProgress,
  makeLessonLocker,
  type LearnLesson,
} from '@/hooks/useLearn';

/**
 * Data behind the "My Learning" section on Path.
 * Picks the learner's most relevant enrolled program (nearest live session first)
 * and resolves the course, next lesson, progress and attached materials for it.
 */
export function useMyLearning() {
  const { user } = useAuth();
  const { enrollments, nextSessionMap, isLoading } = useCoursesData();

  // Active (non-completed) enrollments, excluding the Plus subscription
  const active = (enrollments || []).filter(
    (e: any) =>
      e.program_slug !== 'simora-plus' &&
      e.status !== 'completed' &&
      e.program_rounds?.status !== 'completed',
  );

  // Prefer the enrollment with the nearest upcoming live session
  const primary =
    [...active].sort((a: any, b: any) => {
      const ad = a.program_rounds?.id ? nextSessionMap[a.program_rounds.id] : null;
      const bd = b.program_rounds?.id ? nextSessionMap[b.program_rounds.id] : null;
      if (ad && !bd) return -1;
      if (!ad && bd) return 1;
      if (ad && bd) return new Date(ad).getTime() - new Date(bd).getTime();
      return 0;
    })[0] || null;

  const roundId: string | undefined = primary?.program_rounds?.id || undefined;
  const nextSessionDate = roundId ? nextSessionMap[roundId] || null : null;

  // Course attached to this round
  const { data: courseId } = useQuery({
    queryKey: ['my-learning-round-course', roundId],
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

  // Playlists attached to this round (audio / video materials)
  const { data: materials } = useQuery({
    queryKey: ['my-learning-round-playlists-v2', roundId],
    enabled: !!user && !!roundId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_round_playlists')
        .select('playlist_id, playlist_type')
        .eq('round_id', roundId!);
      if (error) throw error;
      const rows = (data || []) as any[];
      return {
        audio: rows.filter((r) => r.playlist_type !== 'video').map((r) => r.playlist_id as string),
        video: rows.filter((r) => r.playlist_type === 'video').map((r) => r.playlist_id as string),
      };
    },
  });

  const { data: course } = useLearnCourse(courseId || undefined);
  const { data: content } = useLearnCourseContent(courseId || undefined);
  const { data: startDate } = useLearnCourseStartDate(courseId || undefined);
  const { data: progress } = useLearnProgress();

  // Flatten lessons in module order
  const flatLessons: LearnLesson[] = (content?.modules || []).flatMap((m) =>
    (content?.lessons || []).filter((l) => l.module_id === m.id),
  );

  const isLocked = makeLessonLocker({
    flatLessons,
    startDate,
    progress,
    sequential: !!course?.sequential_lessons,
    modules: content?.modules,
  });

  const unlockedLessons = flatLessons.filter((l) => !isLocked(l));
  const completedCount = flatLessons.filter((l) => progress?.has(l.id)).length;
  const nextLesson = unlockedLessons.find((l) => !progress?.has(l.id)) || null;
  const waitingCount = unlockedLessons.filter((l) => !progress?.has(l.id)).length;

  const documentCount = flatLessons.filter((l: any) =>
    ['pdf', 'document'].includes(String(l.content_type || '')),
  ).length;

  const nextLessonModule = nextLesson
    ? content?.modules.find((m) => m.id === nextLesson.module_id) || null
    : null;
  const nextLessonModuleIndex = nextLessonModule
    ? (content?.modules || []).findIndex((m) => m.id === nextLessonModule.id) + 1
    : null;
  const nextLessonIndexInModule = nextLesson
    ? (content?.lessons || [])
        .filter((l) => l.module_id === nextLesson.module_id)
        .findIndex((l) => l.id === nextLesson.id) + 1
    : null;

  const audioPlaylistIds = materials?.audio || [];
  const videoPlaylistIds = materials?.video || [];

  return {
    isLoading,
    enrollment: primary,
    roundId,
    isSelfPaced: !!primary?.program_rounds?.is_self_paced,
    enrolledAt: (primary?.enrolled_at as string) || null,
    nextSessionDate,
    courseId: courseId || null,
    course: course || null,
    nextLesson,
    nextLessonModuleIndex,
    nextLessonIndexInModule,
    totalLessons: flatLessons.length,
    completedCount,
    waitingCount,
    documentCount,
    audioPlaylistIds,
    videoPlaylistIds,
    audioCount: audioPlaylistIds.length,
    videoCount: videoPlaylistIds.length,
    hasProgram: !!primary,
  };
}

