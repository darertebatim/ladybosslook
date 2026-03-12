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
        className="rounded-t-3xl border-0 px-5 pt-7 pb-6"
        style={{ 
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          background: 'hsl(30 40% 96%)',
        }}
      >
        {/* Heading */}
        <div className="text-center mb-2">
          <h2 className="text-[22px] font-bold text-foreground leading-tight">
            Make Mood Check-in<br />a Daily Routine
          </h2>
        </div>

        {/* Description */}
        <p className="text-[15px] font-medium text-foreground text-center leading-snug max-w-[300px] mx-auto mb-5">
          A 10-second daily check-in that compounds into real insight about yourself.
        </p>

        {/* Benefits */}
        <div className="flex flex-col gap-2.5 mb-4">
          {BENEFITS.map((b) => (
            <div
              key={b.text}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-background/80 border border-border/40"
            >
              <FluentEmoji emoji={b.emoji} size={26} />
              <span className="text-[14px] font-medium text-foreground">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Social proof pill — below benefits */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background/70">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              73% feel more self-aware after 7 days
            </span>
          </div>
        </div>

        {/* CTA — urgency orange */}
        <Button
          onClick={handleAdd}
          disabled={isLoading}
          className="w-full h-[52px] rounded-full bg-urgency text-urgency-foreground hover:bg-urgency-light font-semibold text-[15px] gap-2 mb-3 active:scale-[0.97] transition-all"
          style={{ boxShadow: 'var(--shadow-cta)' }}
        >
          <CalendarPlus className="h-5 w-5" />
          Add to My Routines
        </Button>

        {/* Skip row — visible on hover/active */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleNever}
            className="flex-1 h-10 rounded-full text-transparent hover:text-muted-foreground active:text-muted-foreground hover:bg-foreground/5 active:bg-foreground/5 active:scale-95 transition-all text-sm"
          >
            Never
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1 h-10 rounded-full text-transparent hover:text-muted-foreground active:text-muted-foreground hover:bg-foreground/5 active:bg-foreground/5 active:scale-95 transition-all text-sm"
          >
            Not now
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
