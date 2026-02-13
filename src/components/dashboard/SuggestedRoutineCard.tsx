import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SuggestedRoutineCardProps {
  routine: {
    id: string;
    title: string;
    subtitle?: string | null;
    totalDuration?: number;
    emoji?: string | null;
    color?: string | null;
  };
}

export function SuggestedRoutineCard({ routine }: SuggestedRoutineCardProps) {
  return (
    <Card className="p-4 border-dashed border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
          {routine.emoji ? (
            <span className="text-2xl">{routine.emoji}</span>
          ) : (
            <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mb-0.5">
            Need inspiration?
          </p>
          <h4 className="font-semibold text-foreground truncate">
            {routine.title}
          </h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{routine.totalDuration || 0} min</span>
          </div>
        </div>

        <Link to={`/app/rituals/${routine.id}`}>
          <Button 
            size="sm" 
            className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
          >
            Start
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
