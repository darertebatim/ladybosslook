import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logScreenView } from '@/lib/firebaseAnalytics';

/**
 * Auto-fires `screen_view` to Firebase Analytics on every React Router route change.
 * Mount once near the root of the authenticated app tree.
 */
export function useFirebaseScreenTracking() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (lastPath.current === path) return;
    lastPath.current = path;

    // Derive a clean, human-readable screen name from the route.
    // e.g. "/app/home" -> "app_home", "/app/journal/123" -> "app_journal_detail"
    const screenName = pathToScreenName(path);
    logScreenView(screenName);
  }, [location.pathname]);
}

function pathToScreenName(path: string): string {
  // Replace UUIDs and numeric ids with ":id" for cleaner aggregation
  const normalized = path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');

  const cleaned = normalized.replace(/^\/+|\/+$/g, '') || 'root';
  return cleaned.replace(/[\/\-:]/g, '_').slice(0, 80);
}
