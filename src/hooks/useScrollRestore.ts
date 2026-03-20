import { useRef, useEffect, useCallback } from 'react';

/**
 * Saves and restores scroll position for a scrollable container
 * when navigating away and coming back.
 * 
 * @param key - unique sessionStorage key for this page
 */
export function useScrollRestore(key: string) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    if (saved && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(saved, 10);
      sessionStorage.removeItem(key);
    }
  }, [key]);

  // Save current position
  const saveScroll = useCallback(() => {
    if (scrollRef.current) {
      sessionStorage.setItem(key, String(scrollRef.current.scrollTop));
    }
  }, [key]);

  return { scrollRef, saveScroll };
}
