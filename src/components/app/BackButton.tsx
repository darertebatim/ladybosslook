import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Fallback navigation path if no history state. If not provided, uses browser history */
  to?: string;
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
 */
export function BackButton({ 
  to, 
  label = 'Back',
  showLabel = true,
  onClick, 
  className 
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from;

  const handleClick = () => {
    haptic.light();
    
    if (onClick) {
      onClick();
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

  const handleClick = () => {
    haptic.light();
    
    if (onClick) {
      onClick();
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
