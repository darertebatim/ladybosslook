import { Outlet } from 'react-router-dom';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { FocusPlayerProvider } from '@/components/app/FocusPlayerProvider';

/**
 * Wraps ALL /app/* routes with AudioPlayer and FocusPlayer providers.
 * This ensures player state survives navigation between tabbed pages
 * and full-screen tool pages (journal, breathe, fasting, etc.).
 */
export function AppProvidersLayout() {
  return (
    <AudioPlayerProvider>
      <FocusPlayerProvider>
        <Outlet />
      </FocusPlayerProvider>
    </AudioPlayerProvider>
  );
}
