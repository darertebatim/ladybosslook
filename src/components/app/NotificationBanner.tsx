import { useState, useEffect } from 'react';
import { Bell, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkPermissionStatus } from '@/lib/pushNotifications';
import { Capacitor } from '@capacitor/core';

interface NotificationBannerProps {
  onEnableClick: () => void;
}

/**
 * Persistent banner on home page for users who haven't enabled notifications
 * Reappears daily after dismissal
 */
export function NotificationBanner({ onEnableClick }: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreEnrolled, setIsPreEnrolled] = useState(false);

  useEffect(() => {
    const checkVisibility = async () => {
      // Only show on native
      if (!Capacitor.isNativePlatform()) {
        setIsVisible(false);
        return;
      }

      // Check if already enabled
      const permission = await checkPermissionStatus();
      if (permission === 'granted') {
        setIsVisible(false);
        return;
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
    };

    checkVisibility();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('notificationBannerDismissed', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="mx-4 mb-4">
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 overflow-hidden">
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-background/50 transition-colors z-10"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <button 
          onClick={onEnableClick}
          className="w-full flex items-center gap-4 p-4 pr-10 text-left"
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Bell className="h-6 w-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              {isPreEnrolled ? '🔔 Don\'t miss your classes!' : 'Enable Notifications'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {isPreEnrolled 
                ? 'Get reminders for live sessions & updates'
                : 'Stay updated with reminders & announcements'
              }
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </button>
      </div>
    </div>
  );
}
