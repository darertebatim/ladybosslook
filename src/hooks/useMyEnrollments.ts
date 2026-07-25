import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns the set of program slugs the current user is actively enrolled in.
 * Used to disable "Add to Cart"/"Enroll Free" buttons on public marketing pages.
 */
export function useMyEnrollments() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['my-enrollments', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('program_slug, status')
        .eq('user_id', user!.id);
      if (error) throw error;
      const slugs = new Set<string>();
      (data || []).forEach((r: any) => {
        if (r.program_slug && (r.status === 'active' || r.status === 'completed' || !r.status)) {
          slugs.add(String(r.program_slug).toLowerCase());
        }
      });
      return slugs;
    },
  });

  const enrolledSlugs = query.data ?? new Set<string>();
  const isEnrolled = (slug?: string | null) =>
    !!slug && enrolledSlugs.has(String(slug).toLowerCase());

  return { enrolledSlugs, isEnrolled, isLoading: query.isLoading };
}