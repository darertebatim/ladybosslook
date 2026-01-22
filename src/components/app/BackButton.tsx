import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';

interface BackButtonProps {
  /** Custom navigation path. If not provided, uses browser history */
  to?: string;
  /** Optional click handler that runs before navigation */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function BackButton({ to, onClick, className }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    haptic.light();
    
    if (onClick) {
      onClick();
    }
    
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleClick}
      className={className}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
