import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MyProgramCourse {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  language: string | null;
  lessonCount: number;
  completedLessons: number;
  totalDuration: number;
  /** 'program' = reached via enrollment, 'shared' = listed on Player via show_on_player */
  source: 'program' | 'shared';
  isFree: boolean;
  requiresSubscription: boolean;
}

/**
 * Courses the user can reach through any active program enrollment —
 * attached to their round (learn_course_rounds) or directly to the program
 * (program_content_links). Deduplicated by course ID.
 */
export function useMyProgramCourses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-program-courses', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MyProgramCourse[]> => {
      const { data: enr, error } = await supabase
        .from('course_enrollments')
        .select('program_slug, round_id')
        .eq('status', 'active');
      if (error) throw error;
      const slugs = [...new Set((enr || []).map((e) => e.program_slug).filter(Boolean))] as string[];
      const roundIds = [...new Set((enr || []).map((e) => e.round_id).filter(Boolean))] as string[];
      const [roundRes, linkRes] = await Promise.all([
        roundIds.length
          ? supabase.from('learn_course_rounds').select('course_id').in('round_id', roundIds)
          : Promise.resolve({ data: [], error: null } as any),
        slugs.length
          ? supabase.from('program_content_links').select('content_id').eq('content_type', 'course').in('program_slug', slugs)
          : Promise.resolve({ data: [], error: null } as any),
      ]);
      const { data: shared } = await supabase.from('learn_courses').select('id')
        .eq('show_on_player', true).eq('is_published', true);
      if (roundRes.error) throw roundRes.error;
      if (linkRes.error) throw linkRes.error;
      const ids = [...new Set([
        ...(roundRes.data || []).map((r: any) => r.course_id),
        ...(linkRes.data || []).map((r: any) => r.content_id),
      ].filter(Boolean))] as string[];
      const programIds = new Set(ids);
      for (const r of (shared || []) as any[]) if (!programIds.has(r.id)) ids.push(r.id);
      if (!ids.length) return [];

      const [{ data: courses, error: cErr }, { data: modules, error: mErr }] = await Promise.all([
        supabase.from('learn_courses')
          .select('id, title, description, cover_image_url, language, sort_order, is_free, requires_subscription')
          .in('id', ids).eq('is_published', true).order('sort_order'),
        supabase.from('learn_modules').select('id, course_id').in('course_id', ids).eq('is_published', true),
      ]);
      if (cErr) throw cErr;
      if (mErr) throw mErr;
      const moduleToCourse = new Map((modules || []).map((m) => [m.id, m.course_id]));
      const moduleIds = [...moduleToCourse.keys()];
      const [{ data: lessons }, { data: progress }] = await Promise.all([
        moduleIds.length
          ? supabase.from('learn_lessons').select('id, module_id, duration_seconds').in('module_id', moduleIds).eq('is_published', true)
          : Promise.resolve({ data: [] } as any),
        supabase.from('learn_lesson_progress').select('lesson_id'),
      ]);
      const done = new Set((progress || []).map((p: any) => p.lesson_id));
      const stats: Record<string, { n: number; c: number; d: number }> = {};
      for (const l of (lessons || []) as any[]) {
        const cid = moduleToCourse.get(l.module_id);
        if (!cid) continue;
        const s = (stats[cid] ||= { n: 0, c: 0, d: 0 });
        s.n += 1;
        s.d += l.duration_seconds || 0;
        if (done.has(l.id)) s.c += 1;
      }
      return (courses || []).map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        cover_image_url: c.cover_image_url,
        language: c.language,
        lessonCount: stats[c.id]?.n || 0,
        completedLessons: stats[c.id]?.c || 0,
        totalDuration: stats[c.id]?.d || 0,
        source: programIds.has(c.id) ? 'program' : 'shared',
        isFree: !!(c as any).is_free,
        requiresSubscription: !!(c as any).requires_subscription,
      }));
    },
  });
}
