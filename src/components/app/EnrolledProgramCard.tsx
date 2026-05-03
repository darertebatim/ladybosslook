import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ChevronRight, Sparkles, Unlock } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { haptic } from '@/lib/haptics';
import { pickPeach } from '@/lib/peachPalette';
import { cn } from '@/lib/utils';

interface EnrolledProgramCardProps {
  enrollment: {
    id: string;
    course_name: string;
    program_slug: string;
    program_rounds?: {
      id: string;
      round_name: string;
      status: string;
      video_url?: string | null;
      first_session_date?: string | null;
      start_date?: string | null;
      important_message?: string | null;
    } | null;
    status?: string | null;
  };
  isCompleted?: boolean;
  nextSessionDate?: string | null;
  nextContent?: { title: string; countdownText: string } | null;
  hasNotification?: boolean;
  onMarkViewed?: () => void;
}

export const EnrolledProgramCard = memo(function EnrolledProgramCard({
  enrollment,
  isCompleted = false,
  nextSessionDate,
  nextContent,
  hasNotification = false,
  onMarkViewed,
}: EnrolledProgramCardProps) {
  const round = enrollment.program_rounds;
  const isSelfPaced = !round;

  const isUpcoming = round?.status === 'upcoming';
  const isActive = round?.status === 'active';
  
  const displayDate = nextSessionDate || round?.first_session_date;
  const isSessionToday = displayDate && isToday(new Date(displayDate));

  // Get first sentence of important_message
  const importantNote = round?.important_message
    ? round.important_message.split(/[.!?]/)[0]?.trim()
    : null;

  const peachBg = pickPeach(enrollment.program_slug || enrollment.id);

  return (
    <Link 
      to={`/app/programs/${enrollment.program_slug}${round?.id ? `/${round.id}` : ''}`}
      onClick={() => { haptic.light(); onMarkViewed?.(); }}
      className="block"
    >
      <div
        className={cn(
          'relative w-full rounded-2xl overflow-hidden shadow-ios transition-transform active:scale-[0.98]',
          hasNotification && !isCompleted && 'ring-2 ring-brand ring-offset-2',
          isCompleted && 'opacity-75'
        )}
        style={{ backgroundColor: isCompleted ? undefined : peachBg }}
      >
        {isCompleted && <div className="absolute inset-0 bg-muted/50 dark:bg-muted/30" />}

        <div className={cn('relative p-4 flex flex-col justify-between', isSelfPaced ? 'min-h-[72px]' : 'min-h-[120px]')}>
          {/* Top row: Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasNotification && !isCompleted && (
              <Badge className="bg-brand text-white text-[10px] px-2 py-0.5 h-5 border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Updated
              </Badge>
            )}
            {isCompleted ? (
              <Badge className="text-[10px] px-2 py-0.5 h-5 bg-muted text-muted-foreground border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            ) : round ? (
              <Badge
                className={cn(
                  'text-[10px] px-2 py-0.5 h-5 border-0 capitalize',
                  isActive ? 'bg-emerald-500 text-white' : 'bg-foreground/10 text-foreground/70'
                )}
              >
                {round.status}
              </Badge>
            ) : (
              <Badge className="text-[10px] px-2 py-0.5 h-5 bg-foreground/10 text-foreground/70 border-0">
                Self-Paced
              </Badge>
            )}
          </div>
          
          {/* Bottom content */}
          <div className="space-y-1">
            {/* Course name */}
            <h3 className="font-bold text-base leading-tight line-clamp-1 text-foreground">
              {enrollment.course_name}
            </h3>
            
            {/* Round name + View schedule link - only for cohort-based */}
            {round && (
              <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                <span className="truncate">{round.round_name}</span>
                <span>•</span>
                <span className="flex items-center whitespace-nowrap font-medium text-brand">
                  View schedule
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            )}
            
            {/* Next session info - only for cohort-based */}
            {!isCompleted && displayDate && (
              <p className={cn(
                'text-xs font-medium',
                isSessionToday ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground/70'
              )}>
                {isSessionToday 
                  ? `Next: Today at ${format(new Date(displayDate), 'h:mm a')}`
                  : isUpcoming 
                    ? `Starts: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                    : `Next: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                }
              </p>
            )}
            
            {/* Next content unlock info - only for cohort-based */}
            {!isCompleted && nextContent && (
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-700 dark:text-cyan-400">
                <Unlock className="h-3 w-3 flex-shrink-0" />
                <span className="line-clamp-1">
                  {nextContent.title} unlocks {nextContent.countdownText}
                </span>
              </div>
            )}
            
            {/* Important note (if exists) - only for cohort-based */}
            {!isCompleted && importantNote && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span className="line-clamp-1">{importantNote}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
