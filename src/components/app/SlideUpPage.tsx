import { ReactNode, createContext, useCallback, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGoBack } from '@/hooks/useGoBack';
import { haptic } from '@/lib/haptics';

interface SlideUpCtx {
  /** Animate slide-down then navigate. If `to` is omitted, uses default back. */
  slideClose: (to?: string) => void;
  isClosing: boolean;
}

const SlideUpContext = createContext<SlideUpCtx | null>(null);

/**
 * Hook for descendants (e.g. BackButton) to trigger the page's slide-down
 * exit. Returns null if not inside a SlideUpPage.
 */
export function useSlideClose(): SlideUpCtx | null {
  return useContext(SlideUpContext);
}

interface SlideUpPageProps {
  children: ReactNode;
  defaultBack?: string;
  className?: string;
}

/**
 * Wraps a tool page in a slide-up enter / slide-down exit transition,
 * mirroring AppAIPlanner. Children can call `useSlideClose().slideClose()`
 * to animate the page down before navigation.
 */
export function SlideUpPage({ children, defaultBack = '/app/home', className }: SlideUpPageProps) {
  const goBack = useGoBack(defaultBack);
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  const slideClose = useCallback((to?: string) => {
    if (isClosing) return;
    haptic.light();
    setIsClosing(true);
    setTimeout(() => {
      if (to) navigate(to);
      else goBack();
    }, 320);
  }, [goBack, navigate, isClosing]);

  return (
    <SlideUpContext.Provider value={{ slideClose, isClosing }}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: isClosing ? '100%' : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
        className={className}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </SlideUpContext.Provider>
  );
}