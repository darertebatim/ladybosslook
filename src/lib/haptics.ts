import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Centralized haptic feedback utility for native iOS/Android feel.
 * All methods are safe to call on web - they simply no-op.
 */
export const haptic = {
  /** Light tap - for selections, toggles, small interactions */
  light: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  },
  
  /** Medium tap - for confirmations, drag start */
  medium: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    }
  },
  
  /** Heavy tap - for major actions */
  heavy: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    }
  },
  
  /** Success notification - task complete, achievement */
  success: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    }
  },
  
  /** Warning notification - prevented action, alert */
  warning: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
    }
  },
  
  /** Error notification - failed action, destructive */
  error: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.notification({ type: NotificationType.Error }).catch(() => {});
    }
  },
  
  /** Selection change - picker wheels, star ratings */
  selection: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.selectionChanged().catch(() => {});
    }
  },
};
