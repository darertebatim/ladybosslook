/**
 * App Update Checker hook - STUBBED (Capacitor removed)
 * 
 * Returns safe defaults.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

interface UpdateStatus {
  updateAvailable: boolean;
  latestVersion: string | null;
  storeUrl: string;
  isChecking: boolean;
  isDismissed: boolean;
  dismiss: () => void;
}

export function useAppUpdateChecker(): UpdateStatus {
  return {
    updateAvailable: false,
    latestVersion: null,
    storeUrl: 'https://apps.apple.com/app/id6746970920',
    isChecking: false,
    isDismissed: false,
    dismiss: () => {},
  };
}
