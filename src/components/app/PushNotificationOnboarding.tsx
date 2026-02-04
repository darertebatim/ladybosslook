/**
 * Push Notification Onboarding - STUBBED (Capacitor removed)
 * 
 * This component is hidden when Capacitor is removed.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

interface PushNotificationOnboardingProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
  isPreEnrolled?: boolean;
}

export function PushNotificationOnboarding({ 
  onSkip 
}: PushNotificationOnboardingProps) {
  // Auto-skip when Capacitor is removed
  onSkip();
  return null;
}
