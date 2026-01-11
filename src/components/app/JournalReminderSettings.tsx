import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface JournalReminderSettingsProps {
  className?: string;
}

const REMINDER_TIMES = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
];

export const JournalReminderSettings = ({ className }: JournalReminderSettingsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch settings from database
  const { data: settings } = useQuery({
    queryKey: ['journal-reminder-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('journal_reminder_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ enabled, reminderTime }: { enabled: boolean; reminderTime: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const { error } = await supabase
        .from('journal_reminder_settings')
        .upsert({
          user_id: user.id,
          enabled,
          reminder_time: reminderTime,
          timezone,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-reminder-settings'] });
    },
  });

  const reminderEnabled = settings?.enabled ?? false;
  const reminderTime = settings?.reminder_time ?? '20:00';

  const handleToggleReminder = async (enabled: boolean) => {
    try {
      await updateSettingsMutation.mutateAsync({ enabled, reminderTime });
      
      if (enabled) {
        const time = REMINDER_TIMES.find(t => t.value === reminderTime);
        toast.success(`Daily reminder set for ${time?.label || reminderTime}`);
      } else {
        toast.success('Daily reminder turned off');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleTimeChange = async (newTime: string) => {
    try {
      await updateSettingsMutation.mutateAsync({ enabled: reminderEnabled, reminderTime: newTime });
      
      const time = REMINDER_TIMES.find(t => t.value === newTime);
      toast.success(`Reminder time updated to ${time?.label || newTime}`);
    } catch (error) {
      console.error('Failed to update time:', error);
      toast.error('Failed to update time');
    }
  };

  // Only show on native platforms
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="journal-reminder" className="text-sm font-medium">
              Daily Reminder
            </Label>
          </div>
          <Switch
            id="journal-reminder"
            checked={reminderEnabled}
            onCheckedChange={handleToggleReminder}
            disabled={updateSettingsMutation.isPending}
          />
        </div>

        {reminderEnabled && (
          <div className="flex items-center justify-between pl-8">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">Remind me at</Label>
            </div>
            <Select 
              value={reminderTime} 
              onValueChange={handleTimeChange}
              disabled={updateSettingsMutation.isPending}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_TIMES.map((time) => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {reminderEnabled && (
          <p className="text-xs text-muted-foreground pl-8">
            You'll receive a gentle reminder to reflect and write
          </p>
        )}
      </div>
    </div>
  );
};