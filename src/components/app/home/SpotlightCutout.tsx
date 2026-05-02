import { useEffect, useState } from 'react';
import { OverlayPortal } from '@/components/app/OverlayPortal';

interface Props {
  /** CSS selector or null for full dim (no cutout) */
  targetSelector: string | null;
  /** Padding around the target rect in px */
  padding?: number;
  /** Border radius of the cutout in px */
  radius?: number;
}

/**
 * Renders a dark scrim with a "hole" cut around a target element.
 * Uses 4 fixed panels (top/bottom/left/right of the rect) instead of
 * a full overlay + z-index elevation, which is unreliable on iOS WebKit
 * inside scrolling containers (creates stacking context that traps the
 * "elevated" element below the scrim).
 */
export function SpotlightCutout({ targetSelector, padding = 8, radius = 16 }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetSelector) {
      setRect(null);
      return;
    }
    let raf = 0;
    const update = () => {
      const el = document.querySelector(targetSelector);
      if (!el) {
        setRect(null);
        return;
      }
      setRect(el.getBoundingClientRect());
    };
    const tick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', tick, true);
    window.addEventListener('resize', tick);
    const id = setInterval(update, 200);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', tick, true);
      window.removeEventListener('resize', tick);
      clearInterval(id);
    };
  }, [targetSelector]);

  const dim = 'rgba(0,0,0,0.6)';

  // No target → render full scrim
  if (!rect) {
    return (
      <OverlayPortal>
        <div
          aria-hidden
          className="fixed inset-0 z-[10050] pointer-events-none animate-in fade-in duration-200"
          style={{ background: dim }}
        />
      </OverlayPortal>
    );
  }

  const top = Math.max(0, rect.top - padding);
  const left = Math.max(0, rect.left - padding);
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;
  const right = left + width;
  const bottom = top + height;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return (
    <OverlayPortal>
      {/* Four panels around the rect */}
      <div aria-hidden className="fixed inset-0 z-[10050] pointer-events-none animate-in fade-in duration-200">
        {/* Top */}
        <div style={{ position: 'fixed', top: 0, left: 0, width: vw, height: top, background: dim }} />
        {/* Bottom */}
        <div style={{ position: 'fixed', top: bottom, left: 0, width: vw, height: Math.max(0, vh - bottom), background: dim }} />
        {/* Left */}
        <div style={{ position: 'fixed', top, left: 0, width: left, height, background: dim }} />
        {/* Right */}
        <div style={{ position: 'fixed', top, left: right, width: Math.max(0, vw - right), height, background: dim }} />
        {/* Glow ring around the cutout */}
        <div
          style={{
            position: 'fixed',
            top,
            left,
            width,
            height,
            borderRadius: radius,
            boxShadow: '0 0 0 2px rgba(250,204,21,0.55), 0 0 24px 6px rgba(250,204,21,0.25)',
          }}
        />
      </div>
    </OverlayPortal>
  );
}
