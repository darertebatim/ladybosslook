import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Preloads secondary page chunks after the user has settled on a tab.
 * Runs once per route, after a 2s idle delay to avoid competing with the current page.
 */
const SECONDARY_IMPORTS: Record<string, (() => Promise<unknown>)[]> = {
  '/app/home': [
    () => import('@/pages/app/AppTaskCreate'),
    () => import('@/pages/app/AppActions'),
    () => import('@/pages/app/AppProfile'),
  ],
  '/app/routines': [
    () => import('@/pages/app/AppInspireDetail'),
    () => import('@/pages/app/AppRoutineCategory'),
    () => import('@/pages/app/AppRoutinePlayer'),
  ],
  '/app/player': [
    () => import('@/pages/app/AppPlaylistDetail'),
    () => import('@/pages/app/AppAudioPlayer'),
  ],
  '/app/channels': [
    () => import('@/pages/app/AppChannelDetail'),
    () => import('@/pages/app/AppFeedPost'),
  ],
  '/app/tools': [
    () => import('@/pages/app/AppBrowsePrograms'),
    () => import('@/pages/app/AppCourseDetail'),
  ],
};

export function useRoutePreloader() {
  const { pathname } = useLocation();
  const preloaded = useRef(new Set<string>());

  useEffect(() => {
    // Match the base tab path
    const basePath = Object.keys(SECONDARY_IMPORTS).find(
      (key) => pathname === key || pathname.startsWith(key + '/')
    );
    if (!basePath || preloaded.current.has(basePath)) return;

    const timer = setTimeout(() => {
      preloaded.current.add(basePath);
      const imports = SECONDARY_IMPORTS[basePath];
      if (imports) {
        // Use requestIdleCallback if available, else just fire
        const load = () => imports.forEach((fn) => fn().catch(() => {}));
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(load, { timeout: 4000 });
        } else {
          load();
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [pathname]);
}
