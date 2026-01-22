import { TrendingUp, Flame, Calendar } from 'lucide-react';

interface JournalHeaderStatsProps {
  totalEntries: number;
  streak: number;
  thisMonth: number;
}

export function JournalHeaderStats({ totalEntries, streak, thisMonth }: JournalHeaderStatsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/60 text-xs">
        <TrendingUp className="h-3 w-3 text-primary" />
        <span className="font-medium">{totalEntries}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/60 text-xs">
        <Flame className="h-3 w-3 text-orange-500" />
        <span className="font-medium">{streak}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/60 text-xs">
        <Calendar className="h-3 w-3 text-blue-500" />
        <span className="font-medium">{thisMonth}</span>
      </div>
    </div>
  );
}
