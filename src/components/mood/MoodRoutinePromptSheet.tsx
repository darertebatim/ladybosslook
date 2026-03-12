import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { CalendarPlus, TrendingUp } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

const BENEFITS = [
  { emoji: '📊', text: 'Spot patterns in your emotions' },
  { emoji: '🎯', text: 'Understand your triggers better' },
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
        className="rounded-t-3xl border-0 px-5 pt-7 pb-6 bg-background"
        style={{ 
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Social proof pill */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent/60 border border-accent">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              73% feel more self-aware after 7 days
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-5">
          <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1.5">
            Make it a Daily Routine
          </h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
            A 10-second daily check-in that compounds into real insight about yourself.
          </p>
        </div>

        {/* Benefits */}
        <div className="flex flex-col gap-2.5 mb-6">
          {BENEFITS.map((b) => (
            <div
              key={b.text}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-muted/60 border border-border/50"
            >
              <FluentEmoji emoji={b.emoji} size={26} />
              <span className="text-[14px] font-medium text-foreground">{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleAdd}
          disabled={isLoading}
          className="w-full h-[52px] rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold text-[15px] gap-2 mb-3 shadow-md active:scale-[0.97] transition-all"
        >
          <CalendarPlus className="h-5 w-5" />
          Add to My Routines
        </Button>

        {/* Skip row */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleNever}
            className="flex-1 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all text-sm"
          >
            Never
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all text-sm"
          >
            Not now
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
