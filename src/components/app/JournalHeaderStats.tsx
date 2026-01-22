import { TrendingUp, Flame, Calendar } from 'lucide-react';

interface JournalHeaderStatsProps {
  totalEntries: number;
  streak: number;
  thisMonth: number;
}

export function JournalHeaderStats({ totalEntries, streak, thisMonth }: JournalHeaderStatsProps) {
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
        <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{streak}</span>
          <span className="text-[10px] text-muted-foreground">day streak</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/70">
        <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{thisMonth}</span>
          <span className="text-[10px] text-muted-foreground">this month</span>
        </div>
      </div>
    </div>
  );
}
