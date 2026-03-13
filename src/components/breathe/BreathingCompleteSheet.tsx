import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import confetti from 'canvas-confetti';

interface BreathingCompleteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  durationSeconds: number;
}

export function BreathingCompleteSheet({
  open,
  onOpenChange,
  exerciseName,
  durationSeconds,
}: BreathingCompleteSheetProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      haptic.success();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#60A5FA', '#34D399'],
      });
    }
  }, [open]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  };

  const handleGoHome = () => {
    onOpenChange(false);
    navigate('/app/home');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-0 px-5 pt-8 pb-6 bg-gradient-to-b from-emerald-50 to-background"
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <FluentEmoji emoji="🧘" size={44} />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1">
            Well Done! 🎉
          </h2>

          <p className="text-sm text-muted-foreground mb-4">
            You completed your breathing session
          </p>

          <div className="bg-background rounded-2xl p-4 w-full border border-border/50">
            <p className="font-semibold text-foreground">{exerciseName}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDuration(durationSeconds)}
            </p>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleGoHome}
          className="w-full h-12 rounded-2xl text-base font-semibold"
        >
          Back to Home
        </Button>
      </SheetContent>
    </Sheet>
  );
}
