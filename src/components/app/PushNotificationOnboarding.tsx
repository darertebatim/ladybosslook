import { useState } from 'react';
import { Bell, Flame, Sparkles, Settings, MessageCircle, Heart, Sunrise, Leaf } from 'lucide-react';
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
          // Dispatch event to notify banner to hide
          window.dispatchEvent(new CustomEvent('pushNotificationsEnabled'));
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
    <div 
      className="fixed inset-0 flex flex-col justify-end z-40"
      data-pn-onboarding="true"
      style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
    >
      {/* Dimmed overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Half-page sheet with warm self-care gradient */}
      <div 
        className="relative rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden bg-gradient-to-b from-rose-50 via-amber-50 to-background dark:from-rose-950/40 dark:via-amber-950/30 dark:to-background"
        style={{ paddingBottom: '20px' }}
      >
        {/* Soft decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-rose-300/30 blur-3xl" />
        <div className="pointer-events-none absolute top-10 -right-12 w-44 h-44 rounded-full bg-amber-300/30 blur-3xl" />

        {/* Hero Section with app icon */}
        <div className="relative flex flex-col items-center pt-7 pb-5 px-6">
          {/* Animated icon */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-rose-400 via-pink-400 to-amber-400 flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-background/60">
              <img src={appIcon} alt="App Icon" className="w-full h-full object-cover" />
            </div>
            {/* Bell badge */}
            <div className="absolute -bottom-1.5 -right-1.5 w-11 h-11 rounded-full bg-background shadow-lg flex items-center justify-center border-4 border-background">
              <Bell className="h-5 w-5 text-rose-500 animate-pulse" />
            </div>
            {/* Leaf accent */}
            <div className="absolute -top-3 -left-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
                <Leaf className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            {/* Sparkles */}
            <div className="absolute -top-1 -right-2 animate-pulse">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-[26px] leading-tight font-bold text-center mb-2 bg-gradient-to-br from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
            {isPreEnrolled ? 'Welcome back to your self-care 🌿' : 'Your self-care, gently on track'}
          </h1>
          <p className="text-muted-foreground text-center text-[13.5px] leading-relaxed max-w-[280px]">
            {isPreEnrolled 
              ? 'Kind reminders so your routines and self-care moments stay part of every day.'
              : 'Soft, never spammy — reminders for your routines, mood check-ins, and self-care goals.'
            }
          </p>
        </div>

        {/* Feature Cards */}
        <div className="relative px-6 space-y-2 mb-6">
          <div className="flex items-center gap-3 bg-background/70 backdrop-blur-sm border border-border/40 rounded-2xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Leaf className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-[13.5px]">Stay on your routines</p>
              <p className="text-[11.5px] text-muted-foreground">Morning, evening & focus reminders</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-background/70 backdrop-blur-sm border border-border/40 rounded-2xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <Heart className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <p className="font-semibold text-[13.5px]">Mood & reflection</p>
              <p className="text-[11.5px] text-muted-foreground">A daily check-in to feel seen</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-background/70 backdrop-blur-sm border border-border/40 rounded-2xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-[13.5px]">Protect your streak</p>
              <p className="text-[11.5px] text-muted-foreground">A soft nudge before the day slips by</p>
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
                className="w-full h-13 rounded-2xl text-base font-semibold bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:opacity-95 text-white shadow-lg shadow-rose-500/25 border-0"
              >
                {isEnabling ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enabling…
                  </span>
                ) : (
                  <>
                    <Bell className="mr-2 h-5 w-5" />
                    Yes, gently remind me
                  </>
                )}
              </Button>
              <button
                onClick={handleSkip}
                className="w-full text-center text-muted-foreground text-sm py-2"
              >
                {isPreEnrolled ? 'Maybe another day' : 'Not right now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
