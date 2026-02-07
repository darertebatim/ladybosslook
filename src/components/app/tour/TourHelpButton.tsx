import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourHelpButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * A "?" help button that triggers a page's tour when tapped.
 * Place in page headers beside search/action buttons.
 */
export function TourHelpButton({ onClick, className }: TourHelpButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-full hover:bg-muted/50 active:bg-muted/70 transition-colors",
        className
      )}
      aria-label="Take a tour"
    >
      <HelpCircle className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}
