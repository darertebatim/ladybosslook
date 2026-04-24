import { useState } from 'react';
import { Flame, Sparkles } from 'lucide-react';
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
  /** Optional context: streak day count just earned, or goal just set */
  streakDay?: number;
  streakGoal?: number;
}

/**
 * High-intent nudge after a task is completed or streak goal is set.
 * Streak/habit-focused tone.
 */
export function TaskCompletionPushNudge({ userId, open, onClose, streakDay, streakGoal }: Props) {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(userId);
        if (result.success) {
          toast.success("🔥 You're set — we've got your back");
          window.dispatchEvent(new CustomEvent('pushNotificationsEnabled'));
          onClose();
          return;
        }
      }
      toast.error('Enable from iOS Settings to continue');
    } catch (e) {
      toast.error('Could not enable right now');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('taskCompletionNudgeDismissed', Date.now().toString());
    onClose();
  };

  const title = streakGoal
    ? `Protect your ${streakGoal}-day goal 🔥`
    : streakDay && streakDay > 1
      ? `Don't break your ${streakDay}-day streak`
      : "Keep this streak alive 🔥";

  const desc = streakGoal
    ? "We'll send a gentle daily nudge so you stay on track to hit it."
    : "Get a gentle daily reminder so you don't forget your routine tomorrow.";

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[320px] p-0 rounded-2xl border-0 shadow-2xl overflow-hidden bg-gradient-to-b from-background to-muted/30">
        <AlertDialogHeader className="pt-8 pb-4 px-6">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg animate-scale-in">
                <Flame className="h-9 w-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 animate-pulse">
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl font-semibold leading-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2 leading-relaxed">
            {desc}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-0 sm:flex-col p-0 border-t border-border/50 bg-muted/20">
          <Button
            onClick={handleEnable}
            disabled={isEnabling}
            className="w-full h-12 rounded-none border-0 bg-transparent text-primary hover:bg-primary/5 text-[17px] font-semibold transition-colors"
          >
            {isEnabling ? 'Enabling…' : 'Yes, remind me daily'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full h-11 rounded-none border-0 border-t border-border/50 m-0 bg-transparent hover:bg-muted/30 text-[15px] font-normal text-muted-foreground"
          >
            Not now
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}