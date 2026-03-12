import { useEffect, useCallback, RefObject } from 'react';
import { useKeyboard } from '@/hooks/useKeyboard';

/**
 * Multi-pass iOS keyboard scroll fix.
 * When the keyboard opens and the target element is focused,
 * scrolls it into view at multiple intervals to handle iOS keyboard animation.
 * 
 * Mirrors the proven pattern from QuickAddCard.
 */
export function useKeyboardScroll(
  ref: RefObject<HTMLElement | null>,
  options?: {
    /** Scroll block position (default: 'center') */
    block?: ScrollLogicalPosition;
    /** Whether the hook is active (default: true) */
    enabled?: boolean;
    /** Custom scroll container selector (optional) */
    scrollContainerSelector?: string;
  }
) {
  const { isKeyboardOpen } = useKeyboard();
  const block = options?.block ?? 'center';
  const enabled = options?.enabled ?? true;

  const findScrollableParent = useCallback((element: HTMLElement | null): HTMLElement | null => {
    let parent = element?.parentElement ?? null;
    while (parent) {
      const style = window.getComputedStyle(parent);
      const canScroll = /(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight;
      if (canScroll) return parent;
      parent = parent.parentElement;
    }
    return null;
  }, []);

  const scrollIntoView = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = ref.current;
    if (!el) return;

    // Try custom scroll container first
    const customContainer = options?.scrollContainerSelector
      ? document.querySelector(options.scrollContainerSelector) as HTMLElement | null
      : null;
    const scrollParent = customContainer ?? findScrollableParent(el);

    if (scrollParent) {
      const elRect = el.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      const preferredOffset = Math.max(24, parentRect.height * 0.28);
      const targetTop = scrollParent.scrollTop + (elRect.top - parentRect.top) - preferredOffset;
      scrollParent.scrollTo({ top: Math.max(0, targetTop), behavior });
      return;
    }

    el.scrollIntoView({ behavior, block, inline: 'nearest' });
  }, [ref, block, findScrollableParent, options?.scrollContainerSelector]);

  // Multi-pass scroll when keyboard state changes while element is focused
  useEffect(() => {
    if (!enabled || !isKeyboardOpen) return;
    if (document.activeElement !== ref.current) return;

    const t1 = setTimeout(() => scrollIntoView('smooth'), 60);
    const t2 = setTimeout(() => scrollIntoView('smooth'), 300);
    const t3 = setTimeout(() => scrollIntoView('smooth'), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isKeyboardOpen, enabled, scrollIntoView, ref]);

  /** Call this from onFocus to trigger multi-pass scroll */
  const handleFocus = useCallback(() => {
    if (!enabled) return;
    const t1 = setTimeout(() => scrollIntoView('smooth'), 60);
    const t2 = setTimeout(() => scrollIntoView('smooth'), 300);
    const t3 = setTimeout(() => scrollIntoView('smooth'), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [enabled, scrollIntoView]);

  return { handleFocus, scrollIntoView };
}
