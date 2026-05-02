import { useEffect } from 'react';

interface Props {
  /** CSS selector or null for full dim (no cutout) */
  targetSelector: string | null;
  /** Padding around the target rect in px */
  padding?: number;
  /** Border radius of the cutout in px */
  radius?: number;
}

/**
 * Dynamic spotlight overlay:
 *  - Renders ONE full-screen dim scrim via portal (above app, below promoted target).
 *  - DOM-promotes the live target element above the scrim by writing inline
 *    `position: relative; z-index` + a glowing outline, then restores on cleanup.
 * This guarantees the target sits on top of EVERY ancestor (action sheets,
 * task detail rows, etc.) without each card needing its own `relative z-10`.
 */
export function SpotlightCutout({ targetSelector, padding = 8, radius = 16 }: Props) {
  // Highlight the live target element with a glowing outline.
  // We re-query on a short interval so list reorders / sheet open animations
 // don't leave us pointing at a stale node.
  useEffect(() => {
    if (!targetSelector) {
      return;
    }

    let currentEl: HTMLElement | null = null;
    const saved = new WeakMap<HTMLElement, {
      position: string;
      zIndex: string;
      boxShadow: string;
      borderRadius: string;
      transition: string;
    }>();

    const promote = (el: HTMLElement) => {
      if (saved.has(el)) return;
      saved.set(el, {
        position: el.style.position,
        zIndex: el.style.zIndex,
        boxShadow: el.style.boxShadow,
        borderRadius: el.style.borderRadius,
        transition: el.style.transition,
      });
      el.style.borderRadius = el.style.borderRadius || `${radius}px`;
      el.style.boxShadow =
        '0 0 0 3px rgba(250,204,21,0.65), 0 0 28px 10px rgba(250,204,21,0.35)';
      el.style.transition = 'box-shadow 200ms ease-out';
    };

    const restore = (el: HTMLElement) => {
      const prev = saved.get(el);
      if (!prev) return;
      el.style.position = prev.position;
      el.style.zIndex = prev.zIndex;
      el.style.boxShadow = prev.boxShadow;
      el.style.borderRadius = prev.borderRadius;
      el.style.transition = prev.transition;
      saved.delete(el);
    };

    const tick = () => {
      const el = document.querySelector(targetSelector) as HTMLElement | null;
      if (el === currentEl) return;
      if (currentEl) restore(currentEl);
      currentEl = el;
      if (el) promote(el);
    };

    tick();
    const id = setInterval(tick, 150);
    return () => {
      clearInterval(id);
      if (currentEl) restore(currentEl);
    };
  }, [targetSelector, radius]);

  // No scrim — the glowing outline + instructional pill guide the user.
  return null;
}
