import { useState } from 'react';
import { Bell, Sparkles, Leaf, Heart, Flame } from 'lucide-react';
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

interface PushNotificationPromptProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export function PushNotificationPrompt({ userId, open, onClose }: PushNotificationPromptProps) {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      // CRITICAL: Request permission FIRST (same as Profile page)
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(userId);
        
        if (result.success) {
          toast.success('Notifications enabled!');
          onClose();
        } else if (result.error === 'Permission denied') {
          toast.error('Permission denied. Open Settings to enable notifications.');
        } else if (result.error === 'Registration timeout') {
          toast.error('Could not connect. Please try again from Profile settings.');
        } else {
          toast.error(result.error || 'Failed to enable notifications');
        }
      } else {
        toast.error('Please enable notifications in iOS Settings.');
      }
    } catch (error) {
      console.error('[PushPrompt] Error:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleMaybeLater = () => {
    localStorage.setItem('pushNotificationPromptDismissed', Date.now().toString());
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[320px] p-0 rounded-3xl border-0 shadow-2xl overflow-hidden bg-gradient-to-b from-rose-50 via-amber-50 to-background dark:from-rose-950/40 dark:via-amber-950/30 dark:to-background">
        {/* Soft decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 rounded-full bg-rose-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-amber-300/30 blur-3xl" />

        <AlertDialogHeader className="relative pt-8 pb-4 px-6">
          {/* Animated Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-[72px] h-[72px] rounded-3xl bg-gradient-to-br from-rose-400 via-pink-400 to-amber-400 flex items-center justify-center shadow-xl ring-4 ring-background/60 animate-scale-in">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 animate-pulse">
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              <div className="absolute -bottom-1 -left-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
                  <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
          
          <AlertDialogTitle className="text-center text-[20px] font-bold leading-tight bg-gradient-to-br from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
            Stay close to your self-care
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-[13px] text-muted-foreground mt-2 leading-relaxed">
            A gentle daily nudge for your routines and check-ins — never spammy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Feature pills */}
        <div className="relative px-5 pb-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 bg-background/70 backdrop-blur-sm border border-border/40 rounded-xl px-3 py-2">
              <Leaf className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="text-[12.5px] font-medium">Routine reminders</span>
            </div>
            <div className="flex items-center gap-2.5 bg-background/70 backdrop-blur-sm border border-border/40 rounded-xl px-3 py-2">
              <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="text-[12.5px] font-medium">Daily mood check-in</span>
            </div>
            <div className="flex items-center gap-2.5 bg-background/70 backdrop-blur-sm border border-border/40 rounded-xl px-3 py-2">
              <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              <span className="text-[12.5px] font-medium">Streak protection</span>
            </div>
          </div>
        </div>
        
        <AlertDialogFooter className="relative flex-col gap-0 sm:flex-col p-4 pt-0">
          <Button 
            onClick={handleEnable}
            disabled={isEnabling}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:opacity-95 text-white text-[15px] font-semibold shadow-lg shadow-rose-500/25 border-0 transition-opacity"
          >
            {isEnabling ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enabling…
              </span>
            ) : (
              'Yes, gently remind me'
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleMaybeLater}
            className="w-full h-10 mt-1 m-0 bg-transparent hover:bg-muted/30 text-[13.5px] font-normal text-muted-foreground"
          >
            Maybe another day
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
