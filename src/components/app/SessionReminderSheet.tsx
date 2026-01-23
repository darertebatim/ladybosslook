import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarPlus, Bell, AlertTriangle } from 'lucide-react';
import { ReminderSettings } from '@/hooks/useSessionReminderSettings';
import { isUrgentAlarmAvailable } from '@/lib/taskAlarm';

interface SessionReminderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string;
  currentSettings: ReminderSettings;
  onSave: (settings: ReminderSettings) => void;
  onSaveAndAdd: (settings: ReminderSettings) => void;
  isAlreadySynced?: boolean;
}

const REMINDER_OPTIONS = [
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '120', label: '2 hours before' },
  { value: '1440', label: '1 day before' },
];

export function SessionReminderSheet({
  open,
  onOpenChange,
  sessionTitle,
  currentSettings,
  onSave,
  onSaveAndAdd,
  isAlreadySynced = false,
}: SessionReminderSheetProps) {
  const [reminderMinutes, setReminderMinutes] = useState(currentSettings.reminderMinutes.toString());
  const [isUrgent, setIsUrgent] = useState(currentSettings.isUrgent);
  
  const urgentAvailable = isUrgentAlarmAvailable();

  // Reset form when settings change
  useEffect(() => {
    setReminderMinutes(currentSettings.reminderMinutes.toString());
    setIsUrgent(currentSettings.isUrgent);
  }, [currentSettings, open]);

  const handleSave = () => {
    const settings: ReminderSettings = {
      reminderMinutes: parseInt(reminderMinutes),
      isUrgent,
    };
    onSave(settings);
    onOpenChange(false);
  };

  const handleSaveAndAdd = () => {
    const settings: ReminderSettings = {
      reminderMinutes: parseInt(reminderMinutes),
      isUrgent,
    };
    onSaveAndAdd(settings);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminder Settings
          </SheetTitle>
          <SheetDescription className="truncate">
            {sessionTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Reminder Time Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Remind me</Label>
            <RadioGroup
              value={reminderMinutes}
              onValueChange={setReminderMinutes}
              className="space-y-2"
            >
              {REMINDER_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => setReminderMinutes(option.value)}
                >
                  <RadioGroupItem value={option.value} id={`reminder-${option.value}`} />
                  <Label
                    htmlFor={`reminder-${option.value}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Urgent Alarm Toggle - Only show on native */}
          {urgentAvailable && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <Label className="font-medium">Urgent Alarm</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bypasses silent mode & Do Not Disturb
                  </p>
                </div>
                <Switch
                  checked={isUrgent}
                  onCheckedChange={setIsUrgent}
                />
              </div>
              {isUrgent && (
                <p className="text-xs text-muted-foreground px-1">
                  Uses calendar alarm to ensure you don't miss important sessions
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pb-safe">
          <Button onClick={handleSaveAndAdd} className="w-full" size="lg">
            <CalendarPlus className="h-4 w-4 mr-2" />
            {isAlreadySynced ? 'Update Calendar Event' : 'Add to Calendar'}
          </Button>
          <Button onClick={handleSave} variant="outline" className="w-full" size="lg">
            Save Settings Only
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
