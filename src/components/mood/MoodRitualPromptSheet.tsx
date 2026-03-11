import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { CalendarPlus } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

interface MoodRitualPromptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToRitual: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function MoodRitualPromptSheet({
  open,
  onOpenChange,
  onAddToRitual,
  onSkip,
  isLoading,
}: MoodRitualPromptSheetProps) {

  const handleAdd = () => {
    haptic.medium();
    onAddToRitual();
  };

  const handleSkip = () => {
    haptic.light();
    onSkip();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-0 px-5 pt-8 pb-6 bg-amber-50 dark:bg-amber-950/40"
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        hideCloseButton
      >
        {/* Illustration */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
            <FluentEmoji emoji="🌟" size={48} />
          </div>

          <h2 className="text-xl font-bold text-foreground leading-snug mb-2">
            Make it a Daily Habit
          </h2>
          <p className="text-sm text-foreground/60 leading-relaxed max-w-[280px]">
            Checking in with your mood daily helps you spot patterns, understand triggers, and build emotional awareness over time.
          </p>
        </div>

        {/* Add Button */}
        <Button
          onClick={handleAdd}
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold text-base gap-2 mb-3"
        >
          <CalendarPlus className="h-5 w-5" />
          Add to My Rituals
        </Button>

        {/* Skip */}
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="w-full h-10 rounded-full text-foreground/40 hover:bg-foreground/5 text-sm"
        >
          Not now
        </Button>
      </SheetContent>
    </Sheet>
  );
}
