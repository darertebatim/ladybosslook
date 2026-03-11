import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { CalendarPlus } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

interface MoodData {
  emoji: string;
  bgColor: string;
  celebrationText: string;
}

const MOOD_CONFIG: Record<string, MoodData> = {
  great: {
    emoji: '😄',
    bgColor: 'bg-yellow-100',
    celebrationText: 'Amazing! You feel great!',
  },
  good: {
    emoji: '🙂',
    bgColor: 'bg-green-100',
    celebrationText: "Nice! You're feeling good!",
  },
  okay: {
    emoji: '😐',
    bgColor: 'bg-blue-100',
    celebrationText: "You're feeling okay.",
  },
  not_great: {
    emoji: '😔',
    bgColor: 'bg-purple-100',
    celebrationText: "It's okay to feel not great.",
  },
  bad: {
    emoji: '😢',
    bgColor: 'bg-red-100',
    celebrationText: "It's okay to have tough days.",
  },
};

interface MoodRoutinePromptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mood: string | null;
  onAddToRoutine: () => void;
  onSkip: () => void;
  onNever: () => void;
  isLoading?: boolean;
}

export function MoodRoutinePromptSheet({
  open,
  onOpenChange,
  mood,
  onAddToRoutine,
  onSkip,
  onNever,
  isLoading,
}: MoodRoutinePromptSheetProps) {
  const moodData = mood ? MOOD_CONFIG[mood] : null;

  const handleAdd = () => {
    haptic.medium();
    onAddToRoutine();
  };

  const handleSkip = () => {
    haptic.light();
    onSkip();
  };

  const handleNever = () => {
    haptic.light();
    onNever();
  };

  if (!moodData) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-3xl border-0 px-5 pt-8 pb-6",
          moodData.bgColor
        )}
        style={{ 
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          minHeight: '480px',
        }}
      >
        {/* Vertically centered content */}
        <div className="flex flex-col items-center justify-center flex-1" style={{ minHeight: '340px' }}>
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-3",
              moodData.bgColor.replace('100', '200')
            )}>
              <FluentEmoji emoji={moodData.emoji} size={40} />
            </div>
            <p className="text-sm font-medium text-foreground/50 mb-1">
              {moodData.celebrationText}
            </p>
            <h2 className="text-xl font-bold text-foreground leading-snug mb-2">
              Make it a Daily Habit
            </h2>
            <p className="text-sm text-foreground/50 leading-relaxed max-w-[280px]">
              Checking in with your mood daily helps you spot patterns, understand triggers, and build emotional awareness over time.
            </p>
          </div>
        </div>

        {/* Add Button */}
        <Button
          onClick={handleAdd}
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold text-base gap-2 mb-3"
        >
          <CalendarPlus className="h-5 w-5" />
          Add to My Routines
        </Button>

        {/* Skip buttons */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleNever}
            className="flex-1 h-10 rounded-full text-foreground/40 hover:text-foreground/60 hover:bg-foreground/10 active:scale-95 transition-all text-sm"
          >
            Never
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1 h-10 rounded-full text-foreground/40 hover:text-foreground/60 hover:bg-foreground/10 active:scale-95 transition-all text-sm"
          >
            Not now
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
