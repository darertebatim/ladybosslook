import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { getCurrentZone } from '@/lib/fastingZones';
import { format } from 'date-fns';
import { Share2 } from 'lucide-react';
import { useShareContent } from '@/hooks/useShareContent';
import { haptic } from '@/lib/haptics';

interface CompletedSession {
  id: string;
  started_at: string;
  ended_at: string;
  fasting_hours: number;
  protocol: string;
}

interface FastingCompletionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CompletedSession | null;
  onSave: () => void;
  onDelete: () => void;
}

function formatDuration(startedAt: string, endedAt: string): string {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function FastingCompletionSheet({ open, onOpenChange, session, onSave, onDelete }: FastingCompletionSheetProps) {
  const durationMs = session ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime() : 0;
  const elapsedHours = durationMs / 3600000;
  const zone = getCurrentZone(elapsedHours);
  const durationLabel = session ? formatDuration(session.started_at, session.ended_at) : '';

  const { handleShare } = useShareContent({
    title: `Completed a ${durationLabel} fast on Rilo`,
    text: `🥗 Just completed a ${durationLabel} fast — reached ${zone.name} zone. Tracking my fasts on Rilo!`,
    source: 'fasting_complete',
    contentId: durationLabel,
  });

  if (!session) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10" hideCloseButton>
        <SheetHeader className="mb-4">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
          <SheetTitle className="text-center">Nice effort! 🎉</SheetTitle>
        </SheetHeader>

        <div className="text-center mb-6">
          <span className="text-5xl mb-2 block">{zone.emoji}</span>
          <p className="text-2xl font-bold mt-2">{formatDuration(session.started_at, session.ended_at)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Zone reached: <span className="font-medium" style={{ color: zone.color }}>{zone.name}</span>
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
            <span className="text-sm text-muted-foreground">Started</span>
            <span className="text-sm font-medium">{format(new Date(session.started_at), 'MMM d, h:mm a')}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
            <span className="text-sm text-muted-foreground">Ended</span>
            <span className="text-sm font-medium">{format(new Date(session.ended_at), 'MMM d, h:mm a')}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => {
              onDelete();
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
          <Button
            variant="outline"
            className="rounded-xl px-4"
            onClick={() => { haptic.light(); handleShare(); }}
            aria-label="Share fast"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            className="flex-1 rounded-xl"
            onClick={() => {
              onSave();
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
