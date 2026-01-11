import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotebookPen, Bell, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

interface JournalReminderSettingsProps {
  className?: string;
}

const REMINDER_TIMES = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
];

export const JournalReminderSettings = ({ className }: JournalReminderSettingsProps) => {
  const { toast } = useToast();
  const [reminderEnabled, setReminderEnabled] = useState(() => {
    return localStorage.getItem('journalReminderEnabled') === 'true';
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('journalReminderTime') || '20:00';
  });

  useEffect(() => {
    localStorage.setItem('journalReminderEnabled', reminderEnabled.toString());
  }, [reminderEnabled]);

  useEffect(() => {
    localStorage.setItem('journalReminderTime', reminderTime);
  }, [reminderTime]);

  const handleToggleReminder = (enabled: boolean) => {
    setReminderEnabled(enabled);
    
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
  };

  const handleTimeChange = (newTime: string) => {
    setReminderTime(newTime);
    if (reminderEnabled) {
      const time = REMINDER_TIMES.find(t => t.value === newTime);
      toast({
        title: 'Reminder Time Updated',
        description: `You'll be reminded at ${time?.label || newTime}`,
      });
    }
  };

  // Only show on native platforms
  if (!Capacitor.isNativePlatform()) {
    return null;
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
          />
        </div>

        {reminderEnabled && (
          <div className="flex items-center justify-between pl-8">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">Remind me at</Label>
            </div>
            <Select value={reminderTime} onValueChange={handleTimeChange}>
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
            You'll receive a gentle reminder to reflect and write in your journal
          </p>
        )}
      </CardContent>
    </Card>
  );
};
