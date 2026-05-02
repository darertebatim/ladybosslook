import { useEffect, useState } from 'react';
import { OverlayPortal } from '@/components/app/OverlayPortal';

interface Props {
  /** CSS selector or null for full dim (no cutout) */
  targetSelector: string | null;
  /** Optional extra layer to keep visible above the scrim during the tour */
  contextSelector?: string | null;
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
export function SpotlightCutout({
  targetSelector,
  contextSelector = null,
  padding = 8,
  radius = 16,
}: Props) {
  const [hasTarget, setHasTarget] = useState(false);

  // Promote the live target element above the scrim using inline styles.
  // We re-query on a short interval so list reorders / sheet open animations
 // don't leave us pointing at a stale node.
  useEffect(() => {
    if (!targetSelector) {
      setHasTarget(false);
      return;
    }

    let currentTargetEl: HTMLElement | null = null;
    let currentContextEl: HTMLElement | null = null;
    const saved = new WeakMap<HTMLElement, {
      position: string;
      zIndex: string;
      boxShadow: string;
      borderRadius: string;
      transition: string;
    }>();

    const promote = (el: HTMLElement, zIndex: string, forcedRadius?: string) => {
      if (saved.has(el)) return;
      saved.set(el, {
        position: el.style.position,
        zIndex: el.style.zIndex,
        boxShadow: el.style.boxShadow,
        borderRadius: el.style.borderRadius,
        transition: el.style.transition,
      });
      // position:relative is required for z-index to apply on non-positioned elements.
      // 10055 sits above the scrim (10050), while 10056 is reserved for
      // context sheets/modals that must stay readable above the dim layer too.
      el.style.position = el.style.position || 'relative';
      el.style.zIndex = zIndex;
      el.style.borderRadius = el.style.borderRadius || forcedRadius || `${radius}px`;
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
      const targetEl = document.querySelector(targetSelector) as HTMLElement | null;
      const contextEl = contextSelector
        ? (document.querySelector(contextSelector) as HTMLElement | null)
        : null;

      if (targetEl !== currentTargetEl) {
        if (currentTargetEl) restore(currentTargetEl);
        currentTargetEl = targetEl;
        if (targetEl) {
          promote(targetEl, '10055');
        }
      }

      if (contextEl !== currentContextEl) {
        if (currentContextEl) restore(currentContextEl);
        currentContextEl = contextEl;
        if (contextEl) {
          promote(contextEl, '10056', '24px');
        }
      }

      if (targetEl) {
        setHasTarget(true);
      } else {
        setHasTarget(false);
      }
    };

    tick();
    const id = setInterval(tick, 150);
    return () => {
      clearInterval(id);
      if (currentTargetEl) restore(currentTargetEl);
      if (currentContextEl) restore(currentContextEl);
    };
  }, [targetSelector, contextSelector, radius]);

  const dim = 'rgba(0,0,0,0.6)';

  return (
    <OverlayPortal>
      <div
        aria-hidden
        className="fixed inset-0 z-[10050] pointer-events-none animate-in fade-in duration-200"
        style={{ background: dim }}
      />
      {/* Suppress unused warning for hasTarget; reserved for future cutout fade. */}
      {hasTarget ? null : null}
    </OverlayPortal>
  );
}
