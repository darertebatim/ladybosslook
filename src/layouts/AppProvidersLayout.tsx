import { Outlet } from 'react-router-dom';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { RoutinePlayerProvider } from '@/components/app/RoutinePlayerProvider';
import { useClaimPendingDedication } from '@/hooks/useClaimPendingDedication';

function DedicationClaimer() {
  useClaimPendingDedication();
  return null;
}

/**
 * Wraps ALL /app/* routes with AudioPlayer and RoutinePlayer providers.
 * This ensures player state survives navigation between tabbed pages
 * and full-screen tool pages (journal, breathe, fasting, etc.).
 */
export function AppProvidersLayout() {
  return (
    <AudioPlayerProvider>
      <RoutinePlayerProvider>
        <DedicationClaimer />
        <Outlet />
      </RoutinePlayerProvider>
    </AudioPlayerProvider>
  );
}
