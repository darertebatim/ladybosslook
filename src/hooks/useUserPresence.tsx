import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, differenceInDays, startOfMonth, startOfDay } from 'date-fns';
import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * User presence data - replaces streak-based metrics with "depth of return" philosophy
 * 
 * Philosophy: "Simora measures depth of return, not length of absence."
 * - No "streak broken" anxiety
 * - Returning after a gap is celebrated, not punished
 * - Measures strength through return, not continuity
 * 
 * Returns: Now counts every app open/resume, encouraging healthy habit of
 * coming back to Simora instead of scrolling social media.
 */

export interface UserPresence {
  totalActiveDays: number;      // All-time count of unique days with activity
  returnCount: number;          // Number of times user opened/returned to the app
  lastActiveDate: string | null; // Last date user showed up
  thisMonthActiveDays: number;  // Days active in current month
  showedUpToday: boolean;       // Did user show up today?
  isReturning: boolean;         // Is this a "welcome back" moment (gap > 2 days)?
}

/**
 * Hook to get user's presence data
 */
export const useUserPresence = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-presence', user?.id],
    queryFn: async (): Promise<UserPresence | null> => {
      if (!user?.id) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('total_active_days, return_count, last_active_date, this_month_active_days')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!profile) return null;

      const today = format(new Date(), 'yyyy-MM-dd');
      const lastActive = profile.last_active_date;
      
      // Calculate if this is a "return" moment (gap > 2 days)
      let isReturning = false;
      if (lastActive) {
        const daysSinceActive = differenceInDays(
          startOfDay(new Date()),
          startOfDay(parseISO(lastActive))
        );
        isReturning = daysSinceActive > 2;
      }

      return {
        totalActiveDays: profile.total_active_days || 0,
        returnCount: profile.return_count || 0,
        lastActiveDate: lastActive,
        thisMonthActiveDays: profile.this_month_active_days || 0,
        showedUpToday: lastActive === today,
        isReturning,
      };
    },
    enabled: !!user?.id,
  });
};

/**
 * Update presence when user completes an activity
 * 
 * Unlike streaks, this:
 * - Never "resets" anything
 * - Celebrates returning after gaps
 * - Tracks depth (total days), not continuity
 */
export async function updatePresence(userId: string, completedDateStr: string): Promise<{ 
  showedUp: boolean; 
  isReturn: boolean;
  message: string;
}> {
  // Get current profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_active_days, return_count, last_active_date, this_month_active_days')
    .eq('id', userId)
    .maybeSingle();

  const today = completedDateStr;
  const currentMonth = format(parseISO(today), 'yyyy-MM');

  // Default values
  let totalActiveDays = profile?.total_active_days || 0;
  let thisMonthActiveDays = profile?.this_month_active_days || 0;
  const lastActive = profile?.last_active_date;

  // Already showed up today - no change needed
  if (lastActive === today) {
    return { 
      showedUp: false, 
      isReturn: false,
      message: "You've already shown up today."
    };
  }

  // Check if this is a new month (reset monthly counter)
  let isNewMonth = false;
  if (lastActive) {
    const lastActiveMonth = format(parseISO(lastActive), 'yyyy-MM');
    isNewMonth = lastActiveMonth !== currentMonth;
    if (isNewMonth) {
      thisMonthActiveDays = 0;
    }
  }

  // Increment counters
  totalActiveDays += 1;
  thisMonthActiveDays += 1;

  // Check if this is a "return" (gap > 2 days) for welcome-back messaging
  let isReturn = false;
  if (lastActive) {
    const daysSinceActive = differenceInDays(
      startOfDay(parseISO(today)),
      startOfDay(parseISO(lastActive))
    );
    isReturn = daysSinceActive > 2;
  }

  // Update profile (return_count is now managed separately by useTrackAppReturn)
  await supabase
    .from('profiles')
    .update({
      total_active_days: totalActiveDays,
      last_active_date: today,
      this_month_active_days: thisMonthActiveDays,
    })
    .eq('id', userId);

  // Return appropriate message based on context
  let message = "You showed up. That's strength.";
  
  if (isReturn) {
    message = "Welcome back. Your strength is still here.";
  } else if (thisMonthActiveDays >= 7) {
    message = `${thisMonthActiveDays} days this month. You keep showing up.`;
  } else if (thisMonthActiveDays > 1) {
    message = "You're here again. ✨";
  }

  return { 
    showedUp: true, 
    isReturn,
    message
  };
}

/**
 * Track app returns - increments return_count every time the app opens or resumes.
 * Encourages healthy habit of coming back to Simora instead of scrolling social media.
 */
export const useTrackAppReturn = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const hasTrackedMount = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const incrementReturn = async () => {
      try {
        // Log individual return event for weekly tracking
        await supabase
          .from('app_return_events')
          .insert({ user_id: userId });

        // Also increment the total counter on profiles
        const { data } = await supabase
          .from('profiles')
          .select('return_count')
          .eq('id', userId)
          .maybeSingle();
        
        const current = data?.return_count || 0;
        await supabase
          .from('profiles')
          .update({ return_count: current + 1 })
          .eq('id', userId);
        
        queryClient.invalidateQueries({ queryKey: ['user-presence'] });
        queryClient.invalidateQueries({ queryKey: ['presence-stats'] });
      } catch (e) {
        console.warn('[TrackAppReturn] Failed to increment:', e);
      }
    };

    // Track initial app open (only once per mount)
    if (!hasTrackedMount.current) {
      hasTrackedMount.current = true;
      incrementReturn();
    }

    // Track returns from background (Capacitor native only)
    if (Capacitor.isNativePlatform()) {
      let listener: any;
      import('@capacitor/app').then(({ App }) => {
        listener = App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            incrementReturn();
          }
        });
      }).catch(() => {});
      
      return () => {
        if (listener) {
          listener.then?.((l: any) => l.remove());
        }
      };
    }
  }, [userId, queryClient]);
};

/**
 * Calculate monthly presence from a list of entries with dates
 */
export function calculateMonthlyPresence(entries: { created_at: string }[]): number {
  if (!entries || entries.length === 0) return 0;

  const now = new Date();
  const monthStart = startOfMonth(now);

  // Get unique days this month
  const uniqueDays = new Set<string>();
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.created_at);
    if (entryDate >= monthStart) {
      uniqueDays.add(format(entryDate, 'yyyy-MM-dd'));
    }
  });

  return uniqueDays.size;
}
