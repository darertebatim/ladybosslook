import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getCurrentZone } from '@/lib/fastingZones';
import { format } from 'date-fns';

interface FastingSession {
  id: string;
  protocol: string;
  fasting_hours: number;
  started_at: string;
  ended_at: string | null;
}

interface FastingStatsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: FastingSession[];
}

function formatDuration(startedAt: string, endedAt: string): string {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function FastingStatsSheet({ open, onOpenChange, sessions }: FastingStatsSheetProps) {
  const completed = sessions.filter(s => s.ended_at);
  const totalFasts = completed.length;
  const avgDuration = totalFasts > 0
    ? completed.reduce((sum, s) => {
        return sum + (new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime());
      }, 0) / totalFasts / 3600000
    : 0;
  const longestFast = totalFasts > 0
    ? Math.max(...completed.map(s => new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime())) / 3600000
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10 max-h-[85vh] overflow-y-auto" hideCloseButton>
        <SheetHeader className="mb-4">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
          <SheetTitle className="text-center">Fasting Stats</SheetTitle>
        </SheetHeader>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-2xl bg-muted/30">
            <p className="text-2xl font-bold">{totalFasts}</p>
            <p className="text-xs text-muted-foreground">Total Fasts</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-muted/30">
            <p className="text-2xl font-bold">{avgDuration.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-muted/30">
            <p className="text-2xl font-bold">{longestFast.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Longest</p>
          </div>
        </div>

        {/* History */}
        <h3 className="font-semibold text-sm mb-3">History</h3>
        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No fasts completed yet</p>
        ) : (
          <div className="space-y-2">
            {completed.map(session => {
              const elapsedHours = (new Date(session.ended_at!).getTime() - new Date(session.started_at).getTime()) / 3600000;
              const zone = getCurrentZone(elapsedHours);
              return (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                  <span className="text-xl">{zone.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {formatDuration(session.started_at, session.ended_at!)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {format(new Date(session.started_at), 'MMM d, yyyy')} · {session.protocol}
                    </p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: zone.color }}>{zone.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
