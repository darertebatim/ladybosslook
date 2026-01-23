import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, AlertTriangle } from 'lucide-react';
import { ReminderSettings } from '@/hooks/useSessionReminderSettings';
import { isUrgentAlarmAvailable } from '@/lib/taskAlarm';

interface SessionReminderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  currentSettings: ReminderSettings;
  onSave: (settings: ReminderSettings) => void;
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
  title,
  description,
  currentSettings,
  onSave,
}: SessionReminderSheetProps) {
  const [enabled, setEnabled] = useState(currentSettings.enabled);
  const [reminderMinutes, setReminderMinutes] = useState(currentSettings.reminderMinutes.toString());
  const [isUrgent, setIsUrgent] = useState(currentSettings.isUrgent);
  
  const urgentAvailable = isUrgentAlarmAvailable();

  // Reset form when settings change or sheet opens
  useEffect(() => {
    if (open) {
      setEnabled(currentSettings.enabled);
      setReminderMinutes(currentSettings.reminderMinutes.toString());
      setIsUrgent(currentSettings.isUrgent);
    }
  }, [currentSettings, open]);

  const handleSave = () => {
    const settings: ReminderSettings = {
      enabled,
      reminderMinutes: parseInt(reminderMinutes),
      isUrgent,
    };
    onSave(settings);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {title}
          </SheetTitle>
          <SheetDescription>
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label className="font-medium">Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified before program events
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {/* Reminder Time Selection */}
          <div className={`space-y-3 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
                  onClick={() => enabled && setReminderMinutes(option.value)}
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
            <div className={`space-y-3 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
              {isUrgent && enabled && (
                <p className="text-xs text-muted-foreground px-1">
                  Uses calendar alarm to ensure you don't miss important events
                </p>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pb-safe">
          <Button onClick={handleSave} className="w-full" size="lg">
            Save Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
