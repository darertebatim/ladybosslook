import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TourHelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function TourHelpButton({ onClick, className }: TourHelpButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("h-9 w-9", className)}
      aria-label="Start page tour"
    >
      <HelpCircle className="h-5 w-5 text-muted-foreground" />
    </Button>
  );
}
