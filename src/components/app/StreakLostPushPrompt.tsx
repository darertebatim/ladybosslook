import { useState } from 'react';
import { Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { subscribeToPushNotifications, requestNotificationPermission } from '@/lib/pushNotifications';
import { toast } from 'sonner';

interface Props {
  userId: string;
  open: boolean;
  onClose: () => void;
  lostStreak: number;
}

/**
 * Shown after a user loses their streak — recovery-focused, urgent tone.
 * "Don't let this happen again."
 */
export function StreakLostPushPrompt({ userId, open, onClose, lostStreak }: Props) {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(userId);
        if (result.success) {
          toast.success("🛡️ You're protected — we'll remind you daily");
          window.dispatchEvent(new CustomEvent('pushNotificationsEnabled'));
          onClose();
          return;
        }
      }
      toast.error('Enable from iOS Settings to continue');
    } catch {
      toast.error('Could not enable right now');
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[320px] p-0 rounded-2xl border-0 shadow-2xl overflow-hidden bg-gradient-to-b from-background to-muted/30">
        <AlertDialogHeader className="pt-8 pb-4 px-6">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-lg animate-scale-in">
                <Shield className="h-9 w-9 text-white" />
              </div>
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl font-semibold leading-tight">
            Don't let this happen again
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2 leading-relaxed">
            You just lost a {lostStreak}-day streak. Enable reminders so we can catch you before tomorrow slips by.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6 pb-4">
          <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              ⏰ One gentle nudge per day — that's it.
            </p>
          </div>
        </div>
        <AlertDialogFooter className="flex-col gap-0 sm:flex-col p-0 border-t border-border/50 bg-muted/20">
          <Button
            onClick={handleEnable}
            disabled={isEnabling}
            className="w-full h-12 rounded-none border-0 bg-transparent text-primary hover:bg-primary/5 text-[17px] font-semibold transition-colors"
          >
            <Bell className="mr-2 h-4 w-4" />
            {isEnabling ? 'Enabling…' : 'Protect my streak'}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-11 rounded-none border-0 border-t border-border/50 m-0 bg-transparent hover:bg-muted/30 text-[15px] font-normal text-muted-foreground"
          >
            I'll risk it
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}