import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotebookPen, Bell, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { useJournalReminderSettings, useUpsertJournalReminder } from '@/hooks/useJournalReminders';

interface JournalReminderSettingsProps {
  className?: string;
}

const REMINDER_TIMES = [
  { value: '06:00:00', label: '6:00 AM' },
  { value: '07:00:00', label: '7:00 AM' },
  { value: '08:00:00', label: '8:00 AM' },
  { value: '09:00:00', label: '9:00 AM' },
  { value: '12:00:00', label: '12:00 PM' },
  { value: '18:00:00', label: '6:00 PM' },
  { value: '19:00:00', label: '7:00 PM' },
  { value: '20:00:00', label: '8:00 PM' },
  { value: '21:00:00', label: '9:00 PM' },
  { value: '22:00:00', label: '10:00 PM' },
];

export const JournalReminderSettings = ({ className }: JournalReminderSettingsProps) => {
  const { toast } = useToast();
  const { data: settings, isLoading } = useJournalReminderSettings();
  const upsertMutation = useUpsertJournalReminder();
  
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00:00');

  // Sync state with database
  useEffect(() => {
    if (settings) {
      setReminderEnabled(settings.enabled);
      setReminderTime(settings.reminder_time);
    }
  }, [settings]);

  const handleToggleReminder = async (enabled: boolean) => {
    setReminderEnabled(enabled);
    
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    try {
      await upsertMutation.mutateAsync({
        enabled,
        reminder_time: reminderTime,
        timezone,
      });
      
      if (enabled) {
        const time = REMINDER_TIMES.find(t => t.value === reminderTime);
        toast({
          title: 'Journal Reminder Set',
          description: `You'll be reminded to write at ${time?.label || reminderTime} daily`,
        });
      } else {
        toast({
          title: 'Reminder Disabled',
          description: 'Daily journal reminders have been turned off',
        });
      }
    } catch (error) {
      console.error('Failed to update reminder settings:', error);
      setReminderEnabled(!enabled); // Revert on error
      toast({
        title: 'Error',
        description: 'Failed to update reminder settings',
        variant: 'destructive',
      });
    }
  };

  const handleTimeChange = async (newTime: string) => {
    setReminderTime(newTime);
    
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    try {
      await upsertMutation.mutateAsync({
        enabled: reminderEnabled,
        reminder_time: newTime,
        timezone,
      });
      
      if (reminderEnabled) {
        const time = REMINDER_TIMES.find(t => t.value === newTime);
        toast({
          title: 'Reminder Time Updated',
          description: `You'll be reminded at ${time?.label || newTime}`,
        });
      }
    } catch (error) {
      console.error('Failed to update reminder time:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reminder time',
        variant: 'destructive',
      });
    }
  };

  // Only show on native platforms
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <NotebookPen className="h-5 w-5" />
            Journal Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} id="journal-reminder-section">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="h-5 w-5" />
          Journal Reminders
        </CardTitle>
        <CardDescription>Get daily prompts to write in your journal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="journal-reminder" className="text-sm">
              Daily Reminder
            </Label>
          </div>
          <Switch
            id="journal-reminder"
            checked={reminderEnabled}
            onCheckedChange={handleToggleReminder}
            disabled={upsertMutation.isPending}
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
              disabled={upsertMutation.isPending}
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
            You'll receive a push notification at your chosen time to reflect and write in your journal
          </p>
        )}
      </CardContent>
    </Card>
  );
};
