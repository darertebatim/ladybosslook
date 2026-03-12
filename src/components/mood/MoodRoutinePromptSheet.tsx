import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { CalendarPlus, TrendingUp } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

const BENEFITS = [
  { emoji: '📊', text: 'Spot patterns in your emotions' },
  { emoji: '🎯', text: 'Understand your triggers' },
  { emoji: '💪', text: 'Build emotional resilience' },
];

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-0 px-5 pt-8 pb-6 bg-background"
        style={{ 
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Social proof badge */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              73% feel more self-aware after 7 days
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground leading-snug mb-1.5">
            Make it a Daily Ritual
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A 10-second daily check-in that compounds into real insight.
          </p>
        </div>

        {/* Benefits list */}
        <div className="flex flex-col gap-3 mb-7">
          {BENEFITS.map((b) => (
            <div
              key={b.text}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50"
            >
              <FluentEmoji emoji={b.emoji} size={24} />
              <span className="text-sm font-medium text-foreground">{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
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
            className="flex-1 h-10 rounded-full text-muted-foreground hover:text-foreground/60 hover:bg-muted/60 active:scale-95 transition-all text-sm"
          >
            Never
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1 h-10 rounded-full text-muted-foreground hover:text-foreground/60 hover:bg-muted/60 active:scale-95 transition-all text-sm"
          >
            Not now
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
