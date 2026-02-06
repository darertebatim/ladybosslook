import { Clock, Moon, Sun } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface WakeSleepTimeSettingsProps {
  wakeTime: string;
  sleepTime: string;
  onWakeTimeChange: (time: string) => void;
  onSleepTimeChange: (time: string) => void;
  disabled?: boolean;
}

const TIME_OPTIONS = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', 
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'
];

const SLEEP_OPTIONS = [
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
  '23:00', '23:30', '00:00', '00:30', '01:00'
];

function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export function WakeSleepTimeSettings({
  wakeTime,
  sleepTime,
  onWakeTimeChange,
  onSleepTimeChange,
  disabled
}: WakeSleepTimeSettingsProps) {
  return (
    <div className="space-y-4 py-3 border-b border-border/30">
      <div className="flex items-start gap-3">
        <div className="text-muted-foreground mt-0.5">
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium">Quiet Hours</p>
            <p className="text-xs text-muted-foreground">
              We won't send notifications outside these times
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Wake Time */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sun className="h-3 w-3" />
                Wake up
              </Label>
              <select
                value={wakeTime}
                onChange={(e) => onWakeTimeChange(e.target.value)}
                disabled={disabled}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sleep Time */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Moon className="h-3 w-3" />
                Bedtime
              </Label>
              <select
                value={sleepTime}
                onChange={(e) => onSleepTimeChange(e.target.value)}
                disabled={disabled}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {SLEEP_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
