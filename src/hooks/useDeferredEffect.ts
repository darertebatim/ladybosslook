import { useEffect, useRef } from 'react';

/**
 * Runs an effect after a delay, freeing the main thread during initial render.
 * Useful for non-critical hooks that don't need to run immediately.
 */
export function useDeferredEffect(
  callback: () => void | (() => void),
  deps: any[],
  delayMs: number
) {
  const cleanupRef = useRef<(() => void) | void>();

  useEffect(() => {
    const timer = setTimeout(() => {
      cleanupRef.current = callback();
    }, delayMs);

    return () => {
      clearTimeout(timer);
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
