import { Button } from '@/components/ui/button';
import { Check, CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface AddedToRoutineButtonProps {
  isAdded: boolean;
  onAddClick: () => void;
  isLoading?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  /** Variant for different visual styles */
  variant?: 'default' | 'emotion' | 'outline';
  /** Custom add button text */
  addText?: string;
  /** Show only the icon without text */
  iconOnly?: boolean;
}

/**
 * A button that shows "Add to My Rituals" when not added, 
 * and "Added — Go to Planner" + a re-add button when already added.
 */
export const AddedToRoutineButton = ({
  isAdded,
  onAddClick,
  isLoading,
  className,
  size = 'default',
  variant = 'default',
  addText = 'Add to My Rituals',
  iconOnly = false,
}: AddedToRoutineButtonProps) => {
  const navigate = useNavigate();

  const handleGoToPlanner = () => {
    haptic.light();
    navigate('/app/home');
  };

  const handleAddAgain = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    onAddClick();
  };

  // Different style presets
  const getAddedStyles = () => {
    switch (variant) {
      case 'emotion':
        return "bg-success/30 text-white";
      case 'outline':
        return "bg-success/10 border-success/30 text-success hover:bg-success/20";
      default:
        return "bg-success/10 hover:bg-success/20 text-success";
    }
  };

  const getNotAddedStyles = () => {
    switch (variant) {
      case 'emotion':
        return "bg-white/20 text-white";
      case 'outline':
        return "bg-[#F4ECFE] hover:bg-[#E8DCF8] text-foreground";
      default:
        return "bg-[#F4ECFE] hover:bg-[#E8DCF8]";
    }
  };

  // Icon-only mode when added - just show checkmark icon button
  if (isAdded && iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleGoToPlanner}
        className={cn(
          "rounded-full bg-success/20 text-success hover:bg-success/30 shrink-0",
          className
        )}
        title="Added — Go to Planner"
      >
        <Check className="h-5 w-5" />
      </Button>
    );
  }

  // Icon-only mode when not added - just show calendar plus icon button
  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onAddClick}
        disabled={isLoading}
        className={cn(
          "rounded-full bg-foreground text-background hover:bg-foreground/90 shrink-0",
          className
        )}
        title="Add to My Rituals"
      >
        <CalendarPlus className="h-5 w-5" />
      </Button>
    );
  }

  if (isAdded) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Main "Added — Go to Planner" button */}
        <Button
          variant={variant === 'outline' ? 'outline' : 'ghost'}
          size={size}
          onClick={handleGoToPlanner}
          className={cn(
            "flex-1 gap-2",
            getAddedStyles()
          )}
        >
          <Check className="h-4 w-4" />
          <span className="text-sm">Added — Go to Planner</span>
        </Button>

        {/* Small re-add button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleAddAgain}
          disabled={isLoading}
          className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground/90 shrink-0"
          title="Add again to my rituals"
        >
          <CalendarPlus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={onAddClick}
      disabled={isLoading}
      className={cn(
        "w-full gap-2",
        getNotAddedStyles(),
        className
      )}
    >
      <CalendarPlus className="h-4 w-4" />
      <span className="text-sm">{addText}</span>
    </Button>
  );
};
