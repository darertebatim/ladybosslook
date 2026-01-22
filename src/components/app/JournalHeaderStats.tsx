import { TrendingUp, Flame, Calendar } from 'lucide-react';

interface JournalHeaderStatsProps {
  totalEntries: number;
  streak: number;
  thisMonth: number;
}

export function JournalHeaderStats({ totalEntries, streak, thisMonth }: JournalHeaderStatsProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 text-xs">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">{totalEntries}</span>
        <span className="text-muted-foreground">entries</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 text-xs">
        <Flame className="h-3.5 w-3.5 text-orange-500" />
        <span className="font-medium">{streak}</span>
        <span className="text-muted-foreground">day streak</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 text-xs">
        <Calendar className="h-3.5 w-3.5 text-blue-500" />
        <span className="font-medium">{thisMonth}</span>
        <span className="text-muted-foreground">this month</span>
      </div>
    </div>
  );
}
