import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, differenceInDays, startOfMonth, startOfDay } from 'date-fns';

/**
 * User presence data - replaces streak-based metrics with "depth of return" philosophy
 * 
 * Philosophy: "Simora measures depth of return, not length of absence."
 * - No "streak broken" anxiety
 * - Returning after a gap is celebrated, not punished
 * - Measures strength through return, not continuity
 */

export interface UserPresence {
  totalActiveDays: number;      // All-time count of unique days with activity
  returnCount: number;          // Number of times returned after 2+ day gap
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
  let returnCount = profile?.return_count || 0;
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

  // Check if this is a "return" (gap > 2 days)
  let isReturn = false;
  if (lastActive) {
    const daysSinceActive = differenceInDays(
      startOfDay(parseISO(today)),
      startOfDay(parseISO(lastActive))
    );
    isReturn = daysSinceActive > 2;
    if (isReturn) {
      returnCount += 1;
    }
  }

  // Update profile
  await supabase
    .from('profiles')
    .update({
      total_active_days: totalActiveDays,
      return_count: returnCount,
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
