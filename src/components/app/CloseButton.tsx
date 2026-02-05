import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface CloseButtonProps {
  /** Explicit destination. If not provided, checks location.state.from, then falls back to /app/home */
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
 */
export function CloseButton({ 
  to, 
  onClick, 
  variant = 'dark',
  className 
}: CloseButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine destination: explicit to > referrer state > fallback home
  const destination = to || (location.state as { from?: string })?.from || '/app/home';

  const handleClick = () => {
    haptic.light();
    onClick?.();
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
