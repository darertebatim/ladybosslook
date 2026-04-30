import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { useSlideClose } from '@/components/app/SlideUpPage';

interface BackButtonProps {
  /** Fallback navigation path if no history state. If not provided, uses browser history */
  to?: string;
  /** Replace current history entry instead of pushing a new one */
  replace?: boolean;
  /** Text to show next to the icon (default: "Back") */
  label?: string;
  /** Whether to show the label (default: true) */
  showLabel?: boolean;
  /** Optional click handler that runs before navigation */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * iOS-style back button with ChevronLeft icon and optional label.
 * Uses location.state.from when available to return to the actual previous page.
 * If a focus routine is active & minimized, maximizes the player instead.
 */
export function BackButton({ 
  to, 
  replace = false,
  label = 'Back',
  showLabel = true,
  onClick, 
  className 
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from;

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* provider not available */ }
  const slideCtx = useSlideClose();

  const handleClick = () => {
    haptic.light();
    
    if (onClick) {
      onClick();
    }

    // If routine player is running & minimized, navigate home then show the player
    if (routinePlayer?.isActive && routinePlayer?.isMinimized) {
      navigate('/app/home');
      routinePlayer.maximize();
      return;
    }

    // If wrapped in a SlideUpPage, animate the slide-down exit before navigating
    if (slideCtx) {
      slideCtx.slideClose(from || to);
      return;
    }
    
    if (from) {
      navigate(from, { replace });
    } else if (to) {
      navigate(to, { replace });
    } else {
      navigate(-1);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={cn(
        'flex items-center gap-0.5 min-h-[44px] min-w-[44px] px-1 -ml-1',
        'text-primary hover:bg-transparent active:opacity-70',
        'transition-opacity',
        className
      )}
    >
      <ChevronLeft className="h-7 w-7 shrink-0" />
      {showLabel && (
        <span className="text-[17px]">{label}</span>
      )}
    </button>
  );
}

interface BackButtonCircleProps {
  /** Custom navigation path. If not provided, uses browser history */
  to?: string;
  /** Optional click handler that runs before navigation */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Circular back button for overlay headers (e.g., over images).
 * Semi-transparent background with blur effect.
 */
export function BackButtonCircle({ 
  to,
  onClick,
  className 
}: BackButtonCircleProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from;

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* provider not available */ }
  const slideCtx = useSlideClose();

  const handleClick = () => {
    haptic.light();
    
    if (onClick) {
      onClick();
    }

    // If routine player is running & minimized, navigate home then show the player
    if (routinePlayer?.isActive && routinePlayer?.isMinimized) {
      navigate('/app/home');
      routinePlayer.maximize();
      return;
    }

    if (slideCtx) {
      slideCtx.slideClose(from || to);
      return;
    }
    
    if (from) {
      navigate(from);
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm',
        'flex items-center justify-center',
        'text-white active:scale-95 transition-transform',
        className
      )}
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}
