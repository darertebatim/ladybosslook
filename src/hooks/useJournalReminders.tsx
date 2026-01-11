import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface JournalReminderSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  reminder_time: string;
  timezone: string;
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateReminderSettings {
  enabled?: boolean;
  reminder_time?: string;
  timezone?: string;
}

export const useJournalReminderSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['journal-reminder-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('journal_reminder_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as JournalReminderSettings | null;
    },
    enabled: !!user?.id,
  });
};

export const useUpsertJournalReminder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: UpdateReminderSettings) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const { data, error } = await supabase
        .from('journal_reminder_settings')
        .upsert({
          user_id: user.id,
          enabled: settings.enabled ?? false,
          reminder_time: settings.reminder_time ?? '20:00:00',
          timezone: settings.timezone ?? timezone,
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data as JournalReminderSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-reminder-settings'] });
    },
  });
};
