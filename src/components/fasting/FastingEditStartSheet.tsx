import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface FastingEditStartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStartedAt: string;
  onSave: (newStartedAt: string) => void;
  isSaving?: boolean;
}

export const FastingEditStartSheet = ({ open, onOpenChange, currentStartedAt, onSave, isSaving }: FastingEditStartSheetProps) => {
  const currentDate = new Date(currentStartedAt);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentDate);
  const [hour, setHour] = useState(currentDate.getHours());
  const [minute, setMinute] = useState(currentDate.getMinutes());

  const handleSave = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setHours(hour, minute, 0, 0);
    onSave(newDate.toISOString());
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="border-b border-amber-100 dark:border-amber-900/30 shrink-0 py-3">
          <DrawerTitle className="text-amber-800 dark:text-amber-300">Edit Start Time</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          {/* Date picker */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-foreground text-sm">Date</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('font-normal border-amber-200 h-8')}
                >
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    haptic.light();
                    setSelectedDate(date);
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hour slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-foreground text-sm">Hour</span>
              </div>
              <span className="text-sm font-semibold text-amber-600">
                {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
              </span>
            </div>
            <Slider
              value={[hour]}
              onValueChange={(v) => { haptic.light(); setHour(v[0]); }}
              min={0}
              max={23}
              step={1}
              className="[&_[role=slider]]:bg-amber-500"
            />
          </div>

          {/* Minute slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground text-sm">Minute</span>
              <span className="text-sm font-semibold text-amber-600">{minute.toString().padStart(2, '0')}</span>
            </div>
            <Slider
              value={[minute]}
              onValueChange={(v) => { haptic.light(); setMinute(v[0]); }}
              min={0}
              max={59}
              step={5}
              className="[&_[role=slider]]:bg-amber-500"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSaving ? 'Saving...' : 'Update Start Time'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
