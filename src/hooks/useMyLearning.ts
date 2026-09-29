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

  // Effective upcoming session: real scheduled session, else the round's
  // first_session_date while it's still in the future.
  const upcomingFor = (e: any): string | null => {
    if (e?.program_rounds?.is_self_paced) return null;
    const rid = e?.program_rounds?.id;
    const scheduled = rid ? nextSessionMap[rid] : null;
    if (scheduled) return scheduled;
    const first = e?.program_rounds?.first_session_date;
    if (first && new Date(first).getTime() > Date.now() - 2 * 60 * 60 * 1000) return first;
    return null;
  };

  // Prefer the enrollment with the nearest upcoming live session,
  // then the most recently enrolled program.
  const primary =
    [...active].sort((a: any, b: any) => {
      const ad = upcomingFor(a);
      const bd = upcomingFor(b);
      if (ad && !bd) return -1;
      if (!ad && bd) return 1;
      if (ad && bd) return new Date(ad).getTime() - new Date(bd).getTime();
      const ae = a.enrolled_at ? new Date(a.enrolled_at).getTime() : 0;
      const be = b.enrolled_at ? new Date(b.enrolled_at).getTime() : 0;
      return be - ae;
    })[0] || null;

  const roundId: string | undefined = primary?.program_rounds?.id || undefined;
  const nextSessionDate = primary ? upcomingFor(primary) : null;

  // Older self-paced programs attach their featured playlist directly to the catalog.
  const { data: programPlaylistId } = useQuery({
    queryKey: ['my-learning-program-playlist', primary?.program_slug],
    enabled: !!user && !!primary?.program_slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('audio_playlist_id')
        .eq('slug', primary.program_slug)
        .maybeSingle();
      if (error) throw error;
      return data?.audio_playlist_id || null;
    },
  });


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
    queryKey: ['my-learning-round-playlists-v3', roundId],
    enabled: !!user && !!roundId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_round_playlists')
        .select('playlist_id, playlist_type')
        .eq('round_id', roundId!);
      if (error) throw error;
      const rows = (data || []) as any[];

      const audioIds = rows
        .filter((r) => r.playlist_type !== 'video')
        .map((r) => r.playlist_id as string);
      const videoIds = rows
        .filter((r) => r.playlist_type === 'video')
        .map((r) => r.playlist_id as string);

      const [audioResult, videoResult] = await Promise.all([
        audioIds.length > 0
          ? supabase.from('audio_playlists').select('id, name').in('id', audioIds)
          : Promise.resolve({ data: [], error: null }),
        videoIds.length > 0
          ? supabase.from('video_playlists').select('id, name').in('id', videoIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (audioResult.error) throw audioResult.error;
      if (videoResult.error) throw videoResult.error;

      const audioById = new Map((audioResult.data || []).map((playlist) => [playlist.id, playlist]));
      const videoById = new Map((videoResult.data || []).map((playlist) => [playlist.id, playlist]));

      return {
        audio: audioIds.map((id) => audioById.get(id)).filter(Boolean),
        video: videoIds.map((id) => videoById.get(id)).filter(Boolean),
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

  const { data: programPlaylist } = useQuery({
    queryKey: ['my-learning-program-playlist-details', programPlaylistId],
    enabled: !!user && !!programPlaylistId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name')
        .eq('id', programPlaylistId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const audioPlaylists = [...(materials?.audio || [])];
  if (programPlaylist && !audioPlaylists.some((playlist) => playlist.id === programPlaylist.id)) {
    audioPlaylists.push(programPlaylist);
  }
  const videoPlaylists = materials?.video || [];
  const audioPlaylistIds = audioPlaylists.map((playlist) => playlist.id);
  const videoPlaylistIds = videoPlaylists.map((playlist) => playlist.id);

  return {
    isLoading,
    enrollment: primary,
    roundId,
    isSelfPaced: !primary?.program_rounds || !!primary.program_rounds.is_self_paced,
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
    audioPlaylists,
    videoPlaylists,
    audioPlaylistIds,
    videoPlaylistIds,
    audioCount: audioPlaylistIds.length,
    videoCount: videoPlaylistIds.length,
    hasProgram: !!primary,
  };
}

