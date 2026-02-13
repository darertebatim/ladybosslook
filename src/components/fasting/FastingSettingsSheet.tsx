import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, Bell, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FASTING_ZONES } from '@/lib/fastingZones';

interface FastingSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FastingSettingsSheet = ({ open, onOpenChange }: FastingSettingsSheetProps) => {
  const { user } = useAuth();
  const [showOnHome, setShowOnHome] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderZone, setReminderZone] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load current settings when sheet opens
  useEffect(() => {
    if (!open || !user) return;
    const load = async () => {
      const { data } = await supabase
        .from('fasting_preferences' as any)
        .select('show_on_home, reminder_enabled, reminder_zone')
        .eq('user_id', user.id)
        .limit(1);
      const pref = (data as any)?.[0];
      if (pref) {
        setShowOnHome(pref.show_on_home ?? true);
        setReminderEnabled(pref.reminder_enabled ?? false);
        setReminderZone(pref.reminder_zone ?? null);
      }
    };
    load();
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase
        .from('fasting_preferences' as any)
        .upsert({
          user_id: user.id,
          show_on_home: showOnHome,
          reminder_enabled: reminderEnabled,
          reminder_zone: reminderEnabled ? reminderZone : null,
        } as any, { onConflict: 'user_id' });
      haptic.success();
      toast.success('Fasting settings saved');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving fasting settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="border-b border-amber-100 dark:border-amber-900/30 shrink-0 py-3">
          <DrawerTitle className="text-amber-800 dark:text-amber-300">Fasting Settings</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          {/* Show on home */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-500" />
              <div>
                <p className="font-medium text-foreground text-sm">Show on Home</p>
                <p className="text-xs text-muted-foreground">Display fasting card on home page</p>
              </div>
            </div>
            <Switch
              checked={showOnHome}
              onCheckedChange={(checked) => {
                haptic.light();
                setShowOnHome(checked);
              }}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          {/* Zone reminders */}
          <div className="border-t border-amber-100 dark:border-amber-900/30 pt-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-medium text-foreground text-sm">Zone Reminders</p>
                  <p className="text-xs text-muted-foreground">Get notified when entering a zone</p>
                </div>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={(checked) => {
                  haptic.light();
                  setReminderEnabled(checked);
                  if (checked && !reminderZone) setReminderZone('fat-burning');
                }}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>

            {reminderEnabled && (
              <div className="ml-6 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Notify me when I reach:</p>
                {FASTING_ZONES.filter(z => z.id !== 'anabolic').map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      haptic.light();
                      setReminderZone(zone.id);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all',
                      reminderZone === zone.id
                        ? 'bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-400'
                        : 'bg-muted/50 hover:bg-muted'
                    )}
                  >
                    <span className="text-lg">{zone.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{zone.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        After {zone.minHours}h of fasting
                      </p>
                    </div>
                    <Zap className={cn(
                      'h-4 w-4 shrink-0',
                      reminderZone === zone.id ? 'text-amber-500' : 'text-muted-foreground/40'
                    )} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="pt-3 border-t border-amber-100 dark:border-amber-900/30">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
