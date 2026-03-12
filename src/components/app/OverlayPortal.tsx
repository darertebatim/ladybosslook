import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/**
 * Renders children into document.body via a React portal.
 * This ensures fixed overlays (celebrations, paywalls) escape
 * stacking contexts created by overflow:auto scroll containers on iOS.
 */
export function OverlayPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
