import { Bell, Settings, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { subscribeToPushNotifications, requestNotificationPermission, checkPermissionStatus } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeSettings, IOSSettings, AndroidSettings } from 'capacitor-native-settings';

interface CourseNotificationPromptProps {
  userId: string;
  programTitle: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Prompt shown when enrolled users access course content without notifications enabled
 * Emphasizes importance for class reminders
 */
export function CourseNotificationPrompt({ 
  userId, 
  programTitle, 
  open, 
  onClose 
}: CourseNotificationPromptProps) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [showSettingsOption, setShowSettingsOption] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const currentPermission = await checkPermissionStatus();
      
      if (currentPermission === 'denied') {
        // Already denied - show settings option
        setShowSettingsOption(true);
        setIsEnabling(false);
        return;
      }

      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(userId);
        
        if (result.success) {
          toast.success('🔔 Class reminders enabled!');
          localStorage.setItem('notificationsEnabled', 'true');
          localStorage.removeItem('preEnrolledNeedsPush');
          onClose();
        } else {
          setShowSettingsOption(true);
        }
      } else {
        setShowSettingsOption(true);
      }
    } catch (error) {
      console.error('[CoursePrompt] Error:', error);
      setShowSettingsOption(true);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      if (Capacitor.getPlatform() === 'ios') {
        await NativeSettings.openIOS({ option: IOSSettings.App });
      } else if (Capacitor.getPlatform() === 'android') {
        await NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
      }
      onClose();
    } catch (error) {
      console.error('Failed to open settings:', error);
      toast.error('Could not open settings');
    }
  };

  const handleChat = () => {
    window.location.href = '/app/chat';
    onClose();
  };

  const handleSkip = () => {
    // Track that they skipped on course page - we'll prompt again later
    localStorage.setItem('courseNotificationSkipped', Date.now().toString());
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[320px] p-0 rounded-2xl border-0 shadow-2xl overflow-hidden bg-gradient-to-b from-background to-muted/30">
        <AlertDialogHeader className="pt-8 pb-4 px-6">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-scale-in">
                <Bell className="h-9 w-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                !
              </div>
            </div>
          </div>
          
          <AlertDialogTitle className="text-center text-xl font-semibold leading-tight">
            Never Miss a Class
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2 leading-relaxed">
            Enable notifications to get reminders before your <span className="font-medium text-foreground">{programTitle}</span> sessions start.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Important callout */}
        <div className="px-6 pb-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200 text-center">
              ⏰ We'll notify you 1 hour before each live session
            </p>
          </div>
        </div>
        
        <AlertDialogFooter className="flex-col gap-0 sm:flex-col p-0 border-t border-border/50 bg-muted/20">
          {showSettingsOption ? (
            <>
              <Button 
                onClick={handleOpenSettings}
                className="w-full h-12 rounded-none border-0 bg-transparent text-primary hover:bg-primary/5 text-[17px] font-semibold transition-colors"
              >
                <Settings className="mr-2 h-5 w-5" />
                Open Settings
              </Button>
              <Button 
                variant="ghost"
                onClick={handleChat}
                className="w-full h-11 rounded-none border-0 border-t border-border/50 m-0 bg-transparent hover:bg-muted/30 text-[15px] font-normal text-muted-foreground"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Message Us for Help
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="w-full h-11 rounded-none border-0 border-t border-border/50 m-0 bg-transparent hover:bg-muted/30 text-[15px] font-normal text-muted-foreground"
              >
                Skip for Now
              </Button>
            </>
          ) : (
            <>
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
                  'Enable Reminders'
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="w-full h-11 rounded-none border-0 border-t border-border/50 m-0 bg-transparent hover:bg-muted/30 text-[15px] font-normal text-muted-foreground"
              >
                Maybe Later
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
