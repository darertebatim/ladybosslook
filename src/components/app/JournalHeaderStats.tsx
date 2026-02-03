import { TrendingUp, Calendar, Sparkles } from 'lucide-react';

interface JournalHeaderStatsProps {
  totalEntries: number;
  thisMonth: number;
  returnCount?: number;
}

/**
 * Journal Header Stats - Strength-first metrics
 * Replaced "streak" with "this month" (depth of return)
 */
export function JournalHeaderStats({ totalEntries, thisMonth, returnCount = 0 }: JournalHeaderStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/70">
        <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{totalEntries}</span>
          <span className="text-[10px] text-muted-foreground">entries</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/70">
        <Calendar className="h-4 w-4 text-violet-500 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{thisMonth}</span>
          <span className="text-[10px] text-muted-foreground">this month</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/70">
        <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{returnCount}</span>
          <span className="text-[10px] text-muted-foreground">returns</span>
        </div>
      </div>
    </div>
  );
}
