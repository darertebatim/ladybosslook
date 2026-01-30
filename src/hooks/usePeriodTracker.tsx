import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { 
  PeriodLog, 
  PeriodSettings, 
  getCycleStatus, 
  calculateAverageCycle,
  getPredictedPeriodDays,
  getPredictedOvulationDays,
  CycleStatus 
} from '@/lib/periodTracking';

// Fetch period settings
export function usePeriodSettings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['period-settings', user?.id],
    queryFn: async (): Promise<PeriodSettings | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('period_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching period settings:', error);
        throw error;
      }
      
      return data as PeriodSettings | null;
    },
    enabled: !!user?.id,
  });
}

// Fetch period logs for a date range
export function usePeriodLogs(startDate: Date, endDate: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['period-logs', user?.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async (): Promise<PeriodLog[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('period_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching period logs:', error);
        throw error;
      }
      
      return (data || []) as PeriodLog[];
    },
    enabled: !!user?.id,
  });
}

// Fetch period logs for current month
export function usePeriodLogsForMonth(currentMonth: Date) {
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  return usePeriodLogs(startDate, endDate);
}

// Fetch all period logs (for calculations)
export function useAllPeriodLogs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['period-logs-all', user?.id],
    queryFn: async (): Promise<PeriodLog[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('period_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching all period logs:', error);
        throw error;
      }
      
      return (data || []) as PeriodLog[];
    },
    enabled: !!user?.id,
  });
}

// Get current cycle status
export function useCycleStatus() {
  const { data: settings } = usePeriodSettings();
  const today = new Date();
  const { data: todayLogs = [] } = usePeriodLogs(today, today);
  
  if (!settings?.last_period_start) return null;
  
  return getCycleStatus(
    settings.last_period_start,
    settings.average_cycle,
    todayLogs
  );
}

// Hook to get cycle status with loading state
export function useCycleStatusWithLoading() {
  const { data: settings, isLoading: settingsLoading } = usePeriodSettings();
  const today = new Date();
  const { data: todayLogs = [], isLoading: logsLoading } = usePeriodLogs(today, today);
  
  const status = settings?.last_period_start 
    ? getCycleStatus(settings.last_period_start, settings.average_cycle, todayLogs)
    : null;
  
  return {
    status,
    settings,
    isLoading: settingsLoading || logsLoading,
    hasCompletedOnboarding: settings?.onboarding_done ?? false,
  };
}

// Upsert period settings
export function useUpsertPeriodSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<PeriodSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('period_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-settings'] });
    },
  });
}

// Log a period day
export function useLogPeriodDay() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      date,
      is_period_day,
      flow_intensity,
      symptoms,
      notes,
    }: {
      date: Date;
      is_period_day: boolean;
      flow_intensity?: 'light' | 'medium' | 'heavy' | null;
      symptoms?: string[];
      notes?: string | null;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('period_logs')
        .upsert({
          user_id: user.id,
          date: dateStr,
          is_period_day,
          flow_intensity: flow_intensity || null,
          symptoms: symptoms || [],
          notes: notes || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-logs'] });
      queryClient.invalidateQueries({ queryKey: ['period-logs-all'] });
    },
  });
}

// Delete a period log
export function useDeletePeriodLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (date: Date) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('period_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateStr);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-logs'] });
      queryClient.invalidateQueries({ queryKey: ['period-logs-all'] });
    },
  });
}

// Update last period start and recalculate average
export function useUpdateLastPeriodStart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allLogs = [] } = useAllPeriodLogs();
  
  return useMutation({
    mutationFn: async (lastPeriodStart: Date) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Calculate new average based on existing logs
      const newAverage = calculateAverageCycle(allLogs);
      
      const { data, error } = await supabase
        .from('period_settings')
        .upsert({
          user_id: user.id,
          last_period_start: format(lastPeriodStart, 'yyyy-MM-dd'),
          ...(newAverage && { average_cycle: newAverage }),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-settings'] });
    },
  });
}

// Hook to get predicted days for calendar display
export function usePredictedDays(currentMonth: Date) {
  const { data: settings } = usePeriodSettings();
  
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  
  if (!settings?.last_period_start) {
    return { predictedPeriodDays: new Set<string>(), ovulationDays: new Set<string>() };
  }
  
  const predictedPeriodDays = getPredictedPeriodDays(
    settings.last_period_start,
    settings.average_cycle,
    settings.average_period,
    startDate,
    endDate
  );
  
  const ovulationDays = getPredictedOvulationDays(
    settings.last_period_start,
    settings.average_cycle,
    startDate,
    endDate
  );
  
  return { predictedPeriodDays, ovulationDays };
}
