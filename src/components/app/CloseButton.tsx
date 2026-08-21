import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';

interface CloseButtonProps {
  /** Explicit destination. If not provided, checks location.state.from, then falls back to /app/path */
  to?: string;
  /** Optional click handler that runs before navigation */
  onClick?: () => void;
  /** Visual variant */
  variant?: 'dark' | 'light' | 'muted';
  /** Additional CSS classes */
  className?: string;
}

/**
 * iOS-style close button for tool dashboards.
 * 44px minimum tap target, circular background, no hover effects.
 * Supports referrer tracking via location.state.from.
 * If a focus routine is active & minimized, maximizes the player instead.
 */
export function CloseButton({ 
  to, 
  onClick, 
  variant = 'dark',
  className 
}: CloseButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* provider not available */ }

  // Determine destination: explicit to > referrer state > fallback My Rilo (new home base)
  const destination = to || (location.state as { from?: string })?.from || '/app/path';

  const handleClick = () => {
    haptic.light();
    onClick?.();

    // If routine player is running & minimized, navigate home then show the player
    if (routinePlayer?.isActive && routinePlayer?.isMinimized) {
      navigate('/app/home');
      routinePlayer.maximize();
      return;
    }

    navigate(destination);
  };

  const variantStyles = {
    dark: 'bg-black/20 text-white',
    light: 'bg-white/60 text-gray-700',
    muted: 'bg-muted text-foreground',
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-10 h-10 min-w-[44px] min-h-[44px] rounded-full',
        'flex items-center justify-center',
        'active:scale-95 transition-transform',
        variantStyles[variant],
        className
      )}
    >
      <X className="h-5 w-5" />
    </button>
  );
}
