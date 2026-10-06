import { Outlet } from 'react-router-dom';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { RoutinePlayerProvider } from '@/components/app/RoutinePlayerProvider';
import { useClaimPendingDedication } from '@/hooks/useClaimPendingDedication';
import { useClaimPendingPlaylistGift } from '@/hooks/useClaimPendingPlaylistGift';
import { useSupportDeepLink } from '@/hooks/useSupportDeepLink';
import { GlobalCelebrationHost } from '@/components/app/GlobalCelebrationHost';
import { PopupQueueProvider } from '@/contexts/PopupQueueContext';
import { useApertureAdminLockSync } from '@/aperture/hooks/useApertureAdminLockSync';

function DedicationClaimer() {
  useClaimPendingDedication();
  useClaimPendingPlaylistGift();
  useSupportDeepLink();
  useApertureAdminLockSync();
  return null;
}

/**
 * Wraps ALL /app/* routes with AudioPlayer and RoutinePlayer providers.
 * This ensures player state survives navigation between tabbed pages
 * and full-screen tool pages (journal, breathe, fasting, etc.).
 */
export function AppProvidersLayout() {
  return (
    <PopupQueueProvider>
    <AudioPlayerProvider>
      <RoutinePlayerProvider>
        <DedicationClaimer />
        <Outlet />
        <GlobalCelebrationHost />
      </RoutinePlayerProvider>
    </AudioPlayerProvider>
    </PopupQueueProvider>
  );
}
