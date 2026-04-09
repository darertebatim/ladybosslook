import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => Capacitor.isNativePlatform();
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Centralized haptic feedback utility for native iOS/Android feel.
 * All methods are safe to call on web - they simply no-op.
 */
export const haptic = {
  /** Light tap - for selections, toggles, small interactions */
  light: () => {
    if (isNative()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  },
  
  /** Medium tap - for confirmations, drag start */
  medium: () => {
    if (isNative()) {
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    }
  },
  
  /** Heavy tap - for major actions */
  heavy: () => {
    if (isNative()) {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    }
  },
  
  /** Success notification - task complete, achievement */
  success: () => {
    if (isNative()) {
      Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    }
  },
  
  /** Warning notification - prevented action, alert */
  warning: () => {
    if (isNative()) {
      Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
    }
  },
  
  /** Error notification - failed action, destructive */
  error: () => {
    if (isNative()) {
      Haptics.notification({ type: NotificationType.Error }).catch(() => {});
    }
  },
  
  /** Selection change - picker wheels, star ratings */
  selection: () => {
    if (isNative()) {
      Haptics.selectionChanged().catch(() => {});
    }
  },

  // ── Compound patterns ──────────────────────────────────

  /** Two quick light taps — task detail open, card expand */
  doubleTap: () => {
    if (!isNative()) return;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    delay(60).then(() => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}));
  },

  /** Medium → light → light rapid cascade — satisfying completion burst */
  successBurst: () => {
    if (!isNative()) return;
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    delay(80).then(() => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}));
    delay(160).then(() => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}));
  },

  /** Light → medium rising feel — opening add-task sheet */
  softRise: () => {
    if (!isNative()) return;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    delay(100).then(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}));
  },

  /** Warning notification + heavy tap — delete confirmation */
  deleteSweep: () => {
    if (!isNative()) return;
    Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
    delay(120).then(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}));
  },

  /** Success notification + medium + light cascade — streak / badge moments */
  celebrate: () => {
    if (!isNative()) return;
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    delay(100).then(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}));
    delay(200).then(() => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}));
  },
};
