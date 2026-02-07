import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourHelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function TourHelpButton({ onClick, className }: TourHelpButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 w-9 flex items-center justify-center rounded-full",
        "text-muted-foreground hover:text-foreground transition-colors",
        "active:scale-95",
        className
      )}
      aria-label="Start page tour"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}
