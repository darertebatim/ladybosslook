import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Bell, Eye, RotateCcw, Power } from 'lucide-react';
import { usePeriodSettings, useUpsertPeriodSettings } from '@/hooks/usePeriodTracker';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface PeriodSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PeriodSettingsSheet = ({ open, onOpenChange }: PeriodSettingsSheetProps) => {
  const navigate = useNavigate();
  const { data: settings } = usePeriodSettings();
  const upsertSettings = useUpsertPeriodSettings();

  const [averageCycle, setAverageCycle] = useState(28);
  const [averagePeriod, setAveragePeriod] = useState(5);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState(2);
  const [showOnHome, setShowOnHome] = useState(true);
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | undefined>(undefined);

  // Load settings when sheet opens
  useEffect(() => {
    if (open && settings) {
      setAverageCycle(settings.average_cycle);
      setAveragePeriod(settings.average_period);
      setReminderEnabled(settings.reminder_enabled);
      setReminderDays(settings.reminder_days);
      setShowOnHome(settings.show_on_home);
      setLastPeriodStart(settings.last_period_start ? new Date(settings.last_period_start) : undefined);
    }
  }, [open, settings]);

  const handleSave = async () => {
    try {
      await upsertSettings.mutateAsync({
        average_cycle: averageCycle,
        average_period: averagePeriod,
        reminder_enabled: reminderEnabled,
        reminder_days: reminderDays,
        show_on_home: showOnHome,
        last_period_start: lastPeriodStart ? format(lastPeriodStart, 'yyyy-MM-dd') : null,
      });

      haptic.success();
      toast.success('Settings saved');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleDeactivate = async () => {
    try {
      await upsertSettings.mutateAsync({
        onboarding_done: false,
        show_on_home: false,
        reminder_enabled: false,
      });
      haptic.success();
      toast.success('Period tracker deactivated');
      onOpenChange(false);
      navigate('/app/home');
    } catch (error) {
      console.error('Error deactivating:', error);
      toast.error('Failed to deactivate');
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-pink-100 shrink-0">
          <DrawerTitle className="text-pink-800">Period Settings</DrawerTitle>
        </DrawerHeader>

        <div 
          className="flex-1 p-4 space-y-6 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Last period start */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-pink-500" />
              <span className="font-medium text-foreground">Last Period Start</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal border-pink-200',
                    !lastPeriodStart && 'text-muted-foreground'
                  )}
                >
                  {lastPeriodStart ? format(lastPeriodStart, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={lastPeriodStart}
                  onSelect={(date) => {
                    haptic.light();
                    setLastPeriodStart(date);
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Average cycle length */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-pink-500" />
                <span className="font-medium text-foreground">Average Cycle Length</span>
              </div>
              <span className="text-sm font-semibold text-pink-600">{averageCycle} days</span>
            </div>
            <Slider
              value={[averageCycle]}
              onValueChange={(value) => {
                haptic.light();
                setAverageCycle(value[0]);
              }}
              min={21}
              max={45}
              step={1}
              className="[&_[role=slider]]:bg-pink-500"
            />
          </div>

          {/* Average period length */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Average Period Length</span>
              <span className="text-sm font-semibold text-pink-600">{averagePeriod} days</span>
            </div>
            <Slider
              value={[averagePeriod]}
              onValueChange={(value) => {
                haptic.light();
                setAveragePeriod(value[0]);
              }}
              min={2}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-pink-500"
            />
          </div>

          {/* Reminder settings */}
          <div className="space-y-4 border-t border-pink-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-pink-500" />
                <div>
                  <p className="font-medium text-foreground">Period Reminders</p>
                  <p className="text-xs text-muted-foreground">Get notified before your period</p>
                </div>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={(checked) => {
                  haptic.light();
                  setReminderEnabled(checked);
                }}
                className="data-[state=checked]:bg-pink-500"
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-2 ml-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Days before to remind</span>
                  <span className="text-sm font-semibold text-pink-600">{reminderDays} days</span>
                </div>
                <Slider
                  value={[reminderDays]}
                  onValueChange={(value) => {
                    haptic.light();
                    setReminderDays(value[0]);
                  }}
                  min={1}
                  max={7}
                  step={1}
                  className="[&_[role=slider]]:bg-pink-500"
                />
              </div>
            )}
          </div>

          {/* Show on home */}
          <div className="flex items-center justify-between border-t border-pink-100 pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-pink-500" />
              <div>
                <p className="font-medium text-foreground">Show on Home</p>
                <p className="text-xs text-muted-foreground">Display status card on home page</p>
              </div>
            </div>
            <Switch
              checked={showOnHome}
              onCheckedChange={(checked) => {
                haptic.light();
                setShowOnHome(checked);
              }}
              className="data-[state=checked]:bg-pink-500"
            />
          </div>

          {/* Deactivate section */}
          <div className="border-t border-pink-100 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Power className="h-4 w-4 mr-2" />
                  Deactivate Period Tracker
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate Period Tracker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will hide the period tracker from your app. Your data will be kept and you can reactivate it anytime from Tools.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivate}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Save button - with safe area */}
        <div 
          className="shrink-0 p-4 border-t border-pink-100"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <Button
            onClick={handleSave}
            disabled={upsertSettings.isPending}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
          >
            {upsertSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
