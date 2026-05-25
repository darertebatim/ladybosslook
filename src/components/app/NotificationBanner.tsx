import { useState, useEffect, useCallback } from 'react';
import { Bell, X, ChevronRight, Leaf, Sparkles } from 'lucide-react';
import { checkPermissionStatus } from '@/lib/pushNotifications';
import { shouldShowPushUI } from '@/hooks/usePushNotificationFlow';

interface NotificationBannerProps {
  onEnableClick: () => void;
  /** Bypass all gating (debug/native/dismissal/permission) for admin previews */
  forceShow?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * Persistent banner on home page for users who haven't enabled notifications
 * Reappears daily after dismissal
 */
export function NotificationBanner({ onEnableClick, forceShow, onVisibilityChange }: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreEnrolled, setIsPreEnrolled] = useState(false);

  const checkVisibility = useCallback(async () => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }
    // Only show on native OR debug mode
    if (!shouldShowPushUI()) {
      setIsVisible(false);
      return;
    }

    // In debug mode, skip permission check
    const isDebug = new URLSearchParams(window.location.search).get('debugPush') === 'true';
    if (!isDebug) {
      const permission = await checkPermissionStatus();
      if (permission === 'granted') {
        setIsVisible(false);
        return;
      }
    }

    // Check if pre-enrolled (special tracking)
    const preEnrolled = localStorage.getItem('preEnrolledNeedsPush') === 'true';
    setIsPreEnrolled(preEnrolled);

    // Check dismissal timing
    const dismissedAt = localStorage.getItem('notificationBannerDismissed');
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      // Pre-enrolled users: show after 12 hours, regular users: 24 hours
      const threshold = preEnrolled ? 12 : 24;
      if (hoursSince < threshold) {
        setIsVisible(false);
        return;
      }
    }

    // Check if completed onboarding successfully
    const completed = localStorage.getItem('pushOnboardingCompleted') === 'true';
    if (completed) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
  }, [forceShow]);

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  // Check on mount
  useEffect(() => {
    checkVisibility();
  }, [checkVisibility]);

  // Re-check when tab becomes visible (user might have enabled PN in another flow)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVisibility();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkVisibility]);

  // Listen for custom event when PN is enabled (fired from onboarding)
  useEffect(() => {
    const handlePNEnabled = () => {
      setIsVisible(false);
    };

    window.addEventListener('pushNotificationsEnabled', handlePNEnabled);
    return () => window.removeEventListener('pushNotificationsEnabled', handlePNEnabled);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('notificationBannerDismissed', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="mx-4 mb-4">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-rose-100 via-pink-100 to-amber-100 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-amber-950/40 border border-rose-200/60 shadow-sm">
        {/* Soft decorative blob */}
        <div className="pointer-events-none absolute -top-8 -right-6 w-24 h-24 rounded-full bg-amber-300/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-6 w-20 h-20 rounded-full bg-rose-300/40 blur-2xl" />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-background/60 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-black/60" />
        </button>

        <button 
          onClick={onEnableClick}
          className="relative w-full flex items-center gap-4 p-4 pr-10 text-left"
        >
          {/* Icon */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-400 to-amber-400 flex items-center justify-center shadow-md ring-2 ring-background/60">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="absolute -bottom-1 -left-1">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
                <Leaf className="h-2.5 w-2.5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-black">
              {isPreEnrolled ? 'Stay close to your self-care 🌿' : 'A gentle nudge for your day'}
            </p>
            <p className="text-[12px] text-black mt-0.5 line-clamp-1 font-medium">
              {isPreEnrolled 
                ? 'Routine, mood & streak reminders'
                : 'Routine, mood check-in & streak reminders'
              }
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-black/70 shrink-0" />
        </button>
      </div>
    </div>
  );
}
