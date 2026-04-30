import { ReactNode, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useGoBack } from '@/hooks/useGoBack';
import { haptic } from '@/lib/haptics';

interface SlideUpPageContext {
  /** Slide the page down then navigate back. */
  slideClose: (to?: string) => void;
}

let pageCtx: SlideUpPageContext | null = null;

/**
 * Imperative helper any descendant can use to trigger the slide-down exit.
 * Returns true if a SlideUpPage is mounted, false otherwise (caller should
 * fall back to a regular navigate).
 */
export function slideClosePage(to?: string): boolean {
  if (!pageCtx) return false;
  pageCtx.slideClose(to);
  return true;
}

interface SlideUpPageProps {
  children: ReactNode;
  /** Default route to send the user back to. */
  defaultBack?: string;
  /** Optional className for the motion wrapper. */
  className?: string;
}

/**
 * Wraps a tool page in a slide-up enter / slide-down exit transition.
 * Pair with <SlideUpBackButton /> (or call slideClosePage()) so the back
 * gesture animates the sheet down before navigation, mirroring AppAIPlanner.
 */
export function SlideUpPage({ children, defaultBack = '/app/home', className }: SlideUpPageProps) {
  const goBack = useGoBack(defaultBack);
  const [isClosing, setIsClosing] = useState(false);

  const slideClose = useCallback((to?: string) => {
    haptic.light();
    setIsClosing(true);
    setTimeout(() => {
      if (to) {
        // Lazy import to avoid circular deps with router
        window.history.replaceState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        goBack();
      }
    }, 320);
  }, [goBack]);

  // Register context for descendants (single page mounted at a time in practice)
  pageCtx = { slideClose };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: isClosing ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
      className={className}
      style={{ height: '100dvh', width: '100%' }}
    >
      {children}
    </motion.div>
  );
}