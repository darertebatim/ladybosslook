import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Video, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface TodayFocusCardProps {
  todayTasksCount: number;
  todayCompletedCount: number;
  hasLiveSession?: boolean;
  sessionTime?: string;
}

export function TodayFocusCard({ 
  todayTasksCount, 
  todayCompletedCount,
  hasLiveSession,
  sessionTime 
}: TodayFocusCardProps) {
  const today = new Date();
  const pendingTasks = todayTasksCount - todayCompletedCount;
  const allDone = todayTasksCount > 0 && pendingTasks === 0;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/30 dark:via-background dark:to-indigo-950/30">
      <div className="p-5">
        {/* Date Header */}
        <div className="flex items-center justify-between mb-4">
          <Badge 
            variant="secondary" 
            className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-medium"
          >
            <Calendar className="h-3 w-3 mr-1.5" />
            {format(today, 'EEEE, MMMM d')}
          </Badge>
          {allDone && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All done!
            </Badge>
          )}
        </div>

        {/* Focus Content */}
        <div className="space-y-3">
          {/* Task Summary */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {todayTasksCount === 0 
                  ? "No actions scheduled"
                  : allDone 
                    ? "You've honored all your actions!"
                    : `${pendingTasks} action${pendingTasks !== 1 ? 's' : ''} remaining`
                }
              </p>
              {todayTasksCount > 0 && !allDone && (
                <p className="text-sm text-muted-foreground">
                  {todayCompletedCount} of {todayTasksCount} honored
                </p>
              )}
            </div>
          </div>

          {/* Live Session Alert */}
          {hasLiveSession && sessionTime && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-100/50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-indigo-900 dark:text-indigo-100">
                  Live session today
                </p>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  {sessionTime}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Link to="/app/home">
          <Button 
            className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white"
            size="lg"
          >
            Open Home
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
