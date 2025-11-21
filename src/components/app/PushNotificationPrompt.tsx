import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { subscribeToPushNotifications } from '@/lib/pushNotifications';
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
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-left">Enable Notifications</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Get notified about new courses and class reminders.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button 
            onClick={handleEnable}
            disabled={isEnabling}
            className="w-full"
          >
            {isEnabling ? 'Enabling...' : 'Enable'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleMaybeLater}
            className="w-full"
          >
            Maybe Later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
