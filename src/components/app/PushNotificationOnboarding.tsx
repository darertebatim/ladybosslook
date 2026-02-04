import { useState } from 'react';
import { Bell, MessageCircle, Calendar, Sparkles, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscribeToPushNotifications, requestNotificationPermission } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { NativeSettings, IOSSettings, AndroidSettings } from 'capacitor-native-settings';
import appIcon from '@/assets/app-icon.png';

interface PushNotificationOnboardingProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
  isPreEnrolled?: boolean;
}

/**
 * Full-screen push notification onboarding - shown after login
 * Beautiful design similar to auth page for high conversion
 */
export function PushNotificationOnboarding({ 
  userId, 
  onComplete, 
  onSkip,
  isPreEnrolled = false 
}: PushNotificationOnboardingProps) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(userId);
        
        if (result.success) {
          toast.success('🎉 Notifications enabled!');
          // Mark as completed
          localStorage.setItem('pushOnboardingCompleted', 'true');
          localStorage.setItem('notificationsEnabled', 'true');
          onComplete();
        } else {
          setShowFallback(true);
        }
      } else if (permission === 'denied') {
        // Show fallback options for iOS Settings or Chat
        setShowFallback(true);
      } else {
        // Permission prompt was shown but not decided yet
        setShowFallback(true);
      }
    } catch (error) {
      console.error('[PushOnboarding] Error:', error);
      setShowFallback(true);
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
    } catch (error) {
      console.error('Failed to open settings:', error);
      toast.error('Could not open settings');
    }
  };

  const handleContactSupport = () => {
    // Navigate to chat for support
    window.location.href = '/app/chat';
  };

  const handleSkip = () => {
    localStorage.setItem('pushOnboardingDismissed', Date.now().toString());
    if (isPreEnrolled) {
      // For pre-enrolled users, we'll show banner more often
      localStorage.setItem('preEnrolledNeedsPush', 'true');
    }
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-[10001] flex flex-col justify-end">
      {/* Dimmed overlay */}
      <div 
        className="absolute inset-0 bg-black/40"
        onClick={handleSkip}
      />
      
      {/* Half-page sheet */}
      <div 
        className="relative bg-background rounded-t-3xl shadow-2xl animate-slide-up"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        {/* Hero Section with app icon */}
        <div className="relative flex flex-col items-center pt-6 pb-4 px-6">
          {/* Animated icon */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl overflow-hidden">
              <img src={appIcon} alt="App Icon" className="w-full h-full object-cover" />
            </div>
            {/* Bell badge */}
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-background shadow-lg flex items-center justify-center border-4 border-background">
              <Bell className="h-5 w-5 text-primary animate-pulse" />
            </div>
            {/* Sparkles */}
            <div className="absolute -top-2 -right-2 animate-pulse">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl font-bold text-center mb-2">
            {isPreEnrolled ? 'Welcome Back! 🎉' : 'Stay in the Loop'}
          </h1>
          <p className="text-muted-foreground text-center text-sm leading-relaxed max-w-xs">
            {isPreEnrolled 
              ? 'Enable notifications so you never miss class sessions or important updates.'
              : 'Get notified about class reminders, new content, and important updates.'
            }
          </p>
        </div>

        {/* Feature Cards */}
        <div className="px-6 space-y-2 mb-6">
          <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Class Reminders</p>
              <p className="text-xs text-muted-foreground">Never miss a live session</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Support Replies</p>
              <p className="text-xs text-muted-foreground">Know when Razie responds</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="font-medium text-sm">New Content</p>
              <p className="text-xs text-muted-foreground">Fresh courses & announcements</p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6">
          {showFallback ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground mb-3">
                Notifications are blocked. You can enable them in Settings, or message us for help.
              </p>
              <Button
                onClick={handleOpenSettings}
                className="w-full h-13 rounded-2xl text-base font-semibold"
              >
                <Settings className="mr-2 h-5 w-5" />
                Open iOS Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleContactSupport}
                className="w-full h-13 rounded-2xl text-base font-semibold"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Message Support
              </Button>
              <button
                onClick={handleSkip}
                className="w-full text-center text-muted-foreground text-sm py-2"
              >
                Skip for now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleEnable}
                disabled={isEnabling}
                className="w-full h-13 rounded-2xl text-base font-semibold"
              >
                {isEnabling ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Enabling...
                  </span>
                ) : (
                  <>
                    <Bell className="mr-2 h-5 w-5" />
                    Enable Notifications
                  </>
                )}
              </Button>
              <button
                onClick={handleSkip}
                className="w-full text-center text-muted-foreground text-sm py-2"
              >
                {isPreEnrolled ? "I'll do this later" : 'Maybe later'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
