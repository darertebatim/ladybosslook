import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UnseenContentState {
  unseenEnrollments: Set<string>;
  unseenRounds: Set<string>;
  hasUnseenCourses: boolean;
  hasUnseenRounds: boolean;
  markEnrollmentViewed: (enrollmentId: string) => Promise<void>;
  markRoundViewed: (roundId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useUnseenContent = (): UnseenContentState => {
  const { user } = useAuth();
  const [unseenEnrollments, setUnseenEnrollments] = useState<Set<string>>(new Set());
  const [unseenRounds, setUnseenRounds] = useState<Set<string>>(new Set());

  const fetchUnseenContent = useCallback(async () => {
    if (!user?.id) {
      setUnseenEnrollments(new Set());
      setUnseenRounds(new Set());
      return;
    }

    try {
      // Fetch all user's active enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('id, enrolled_at, round_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (enrollmentsError) throw enrollmentsError;

      // Fetch all user's content views
      const { data: views, error: viewsError } = await supabase
        .from('user_content_views')
        .select('content_type, content_id, last_viewed_at, content_updated_at')
        .eq('user_id', user.id);

      if (viewsError) throw viewsError;

      // Create a map of viewed content
      const viewedEnrollments = new Map<string, { lastViewed: Date; contentUpdated: Date | null }>();
      const viewedRounds = new Map<string, { lastViewed: Date; contentUpdated: Date | null }>();

      views?.forEach((view) => {
        const data = {
          lastViewed: new Date(view.last_viewed_at),
          contentUpdated: view.content_updated_at ? new Date(view.content_updated_at) : null
        };
        if (view.content_type === 'enrollment') {
          viewedEnrollments.set(view.content_id, data);
        } else if (view.content_type === 'round') {
          viewedRounds.set(view.content_id, data);
        }
      });

      // Determine unseen enrollments
      const unseen = new Set<string>();
      const unseenRoundIds = new Set<string>();

      enrollments?.forEach((enrollment) => {
        const view = viewedEnrollments.get(enrollment.id);
        
        // Never viewed = unseen
        if (!view) {
          unseen.add(enrollment.id);
        } else if (view.contentUpdated && view.contentUpdated > view.lastViewed) {
          // Content was updated after last view = unseen
          unseen.add(enrollment.id);
        }

        // Check round if exists
        if (enrollment.round_id) {
          const roundView = viewedRounds.get(enrollment.round_id);
          if (!roundView) {
            unseenRoundIds.add(enrollment.round_id);
          } else if (roundView.contentUpdated && roundView.contentUpdated > roundView.lastViewed) {
            unseenRoundIds.add(enrollment.round_id);
          }
        }
      });

      setUnseenEnrollments(unseen);
      setUnseenRounds(unseenRoundIds);
    } catch (error) {
      console.error('Error fetching unseen content:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnseenContent();

    if (!user?.id) return;

    // Subscribe to real-time changes
    const enrollmentsChannel = supabase
      .channel('unseen-enrollments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_enrollments',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnseenContent();
        }
      )
      .subscribe();

    const viewsChannel = supabase
      .channel('unseen-views')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_content_views',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnseenContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(enrollmentsChannel);
      supabase.removeChannel(viewsChannel);
    };
  }, [user?.id, fetchUnseenContent]);

  const markEnrollmentViewed = useCallback(async (enrollmentId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_content_views')
        .upsert({
          user_id: user.id,
          content_type: 'enrollment',
          content_id: enrollmentId,
          last_viewed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,content_type,content_id'
        });

      if (error) throw error;

      // Immediately update local state
      setUnseenEnrollments(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    } catch (error) {
      console.error('Error marking enrollment viewed:', error);
    }
  }, [user?.id]);

  const markRoundViewed = useCallback(async (roundId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_content_views')
        .upsert({
          user_id: user.id,
          content_type: 'round',
          content_id: roundId,
          last_viewed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,content_type,content_id'
        });

      if (error) throw error;

      // Immediately update local state
      setUnseenRounds(prev => {
        const next = new Set(prev);
        next.delete(roundId);
        return next;
      });
    } catch (error) {
      console.error('Error marking round viewed:', error);
    }
  }, [user?.id]);

  return {
    unseenEnrollments,
    unseenRounds,
    hasUnseenCourses: unseenEnrollments.size > 0,
    hasUnseenRounds: unseenRounds.size > 0,
    markEnrollmentViewed,
    markRoundViewed,
    refetch: fetchUnseenContent
  };
};
