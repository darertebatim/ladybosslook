import { TrendingUp, Calendar, Flame } from 'lucide-react';

interface JournalHeaderStatsProps {
  totalEntries: number;
  thisMonth: number;
  streak?: number;
}

/**
 * Journal Header Stats - Strength-first metrics
 */
export function JournalHeaderStats({ totalEntries, thisMonth, streak = 0 }: JournalHeaderStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
        <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{totalEntries}</span>
          <span className="text-[10px] text-muted-foreground">entries</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
        <Calendar className="h-4 w-4 text-violet-500 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{thisMonth}</span>
          <span className="text-[10px] text-muted-foreground">this month</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
        <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{streak}</span>
          <span className="text-[10px] text-muted-foreground">streak</span>
        </div>
      </div>
    </div>
  );
}
