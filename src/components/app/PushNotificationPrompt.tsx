import { useState } from 'react';
import { Bell, Sparkles } from 'lucide-react';
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
      <AlertDialogContent className="max-w-[300px] p-0 rounded-2xl border-0 shadow-2xl overflow-hidden bg-gradient-to-b from-background to-muted/30">
        <AlertDialogHeader className="pt-8 pb-4 px-6">
          {/* Animated Icon */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg animate-scale-in">
                <Bell className="h-9 w-9 text-primary-foreground" />
              </div>
              {/* Sparkle decorations */}
              <div className="absolute -top-1 -right-1 animate-pulse">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="absolute -bottom-1 -left-2 animate-pulse" style={{ animationDelay: '0.5s' }}>
                <Sparkles className="h-4 w-4 text-primary/70" />
              </div>
            </div>
          </div>
          
          <AlertDialogTitle className="text-center text-xl font-semibold leading-tight">
            Keep your ritual alive
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2 leading-relaxed">
            A gentle nudge to keep your streak, routines, and check-ins on track.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Feature list */}
        <div className="px-6 pb-4">
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Streak protection reminders</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Routine & task nudges</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Daily mood check-in</span>
            </div>
          </div>
        </div>
        
        <AlertDialogFooter className="flex-col gap-0 sm:flex-col p-0 border-t border-border/50 bg-muted/20">
          <Button 
            onClick={handleEnable}
            disabled={isEnabling}
            className="w-full h-12 rounded-none border-0 bg-transparent text-primary hover:bg-primary/5 text-[17px] font-semibold transition-colors"
          >
            {isEnabling ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Enabling...
              </span>
            ) : (
              'Enable Notifications'
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleMaybeLater}
            className="w-full h-11 rounded-none border-0 border-t border-border/50 m-0 bg-transparent hover:bg-muted/30 text-[15px] font-normal text-muted-foreground"
          >
            Maybe Later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
