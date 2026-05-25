import { ReactNode, createContext, useCallback, useContext, useState } from 'react';
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
  const pageClassName = ['slide-up-page', isClosing ? 'slide-up-page--closing' : '', className]
    .filter(Boolean)
    .join(' ');

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
      <div className={pageClassName} style={{ width: '100%', minHeight: '100%' }}>
        {children}
      </div>
    </SlideUpContext.Provider>
  );
}