import { useRef, useEffect, useCallback } from 'react';

/**
 * Saves and restores scroll position for a scrollable container.
 * 
 * Two modes:
 * 1. Manual: call `saveScroll()` before navigating (wrap in navigateWithScroll)
 * 2. Auto: set `autoSave: true` to persist position continuously on scroll,
 *    restoring when the component remounts. Cleared after restore.
 * 
 * @param key - unique sessionStorage key for this page
 * @param options.autoSave - if true, saves position on every scroll (for pages
 *   where child components handle their own navigation)
 */
export function useScrollRestore(key: string, options?: { autoSave?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSave = options?.autoSave ?? false;

  // Restore on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    if (saved && scrollRef.current) {
      // Use requestAnimationFrame to ensure content is rendered
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = parseInt(saved, 10);
        }
      });
      sessionStorage.removeItem(key);
    }
  }, [key]);

  // Auto-save on scroll
  useEffect(() => {
    if (!autoSave || !scrollRef.current) return;
    const el = scrollRef.current;
    let timeout: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        sessionStorage.setItem(key, String(el.scrollTop));
      }, 150);
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => {
      clearTimeout(timeout);
      el.removeEventListener('scroll', handler);
    };
  }, [key, autoSave]);

  // Manual save
  const saveScroll = useCallback(() => {
    if (scrollRef.current) {
      sessionStorage.setItem(key, String(scrollRef.current.scrollTop));
    }
  }, [key]);

  return { scrollRef, saveScroll };
}
