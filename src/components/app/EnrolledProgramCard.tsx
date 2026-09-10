import { memo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ChevronRight, Sparkles, Unlock, CalendarClock } from 'lucide-react';
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

/** Small warm pill used for status/meta chips */
function Chip({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode;
  tone?: 'muted' | 'brand' | 'solid';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-semibold capitalize',
        tone === 'solid' && 'bg-brand text-white',
        tone === 'brand' && 'bg-brand/12 text-brand',
        tone === 'muted' && 'bg-fg-warm/8 text-fg-warm-muted',
      )}
    >
      {children}
    </span>
  );
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
          'relative w-full rounded-3xl overflow-hidden shadow-card-warm transition-transform active:scale-[0.98]',
          isCompleted && 'opacity-70'
        )}
        style={{ backgroundColor: isCompleted ? undefined : peachBg }}
      >
        {isCompleted && <div className="absolute inset-0 bg-muted/50 dark:bg-muted/30" />}

        {/* Updated indicator — small brand dot instead of a heavy ring */}
        {hasNotification && !isCompleted && (
          <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand" />
          </span>
        )}

        <div className={cn('relative p-4 flex flex-col justify-between gap-2', isSelfPaced ? 'min-h-[64px]' : 'min-h-[112px]')}>
          {/* Top row: single status chip */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasNotification && !isCompleted && (
              <Chip tone="solid">
                <Sparkles className="h-3 w-3" />
                Updated
              </Chip>
            )}
            {isCompleted ? (
              <Chip tone="muted">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </Chip>
            ) : round ? (
              <Chip tone={isActive ? 'brand' : 'muted'}>
                {round.status}
              </Chip>
            ) : (
              <Chip tone="muted">Self-Paced</Chip>
            )}
          </div>

          {/* Bottom content */}
          <div className="space-y-1">
            {/* Course name */}
            <h3 className="font-bold text-base leading-tight line-clamp-1 text-fg-warm">
              {enrollment.course_name}
            </h3>

            {/* Round name + View schedule link - only for cohort-based */}
            {round && (
              <div className="flex items-center gap-1.5 text-xs text-fg-warm-muted">
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
                'flex items-center gap-1.5 text-xs font-medium',
                isSessionToday ? 'text-brand' : 'text-fg-warm-muted'
              )}>
                <CalendarClock className="h-3 w-3 flex-shrink-0" />
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
              <div className="flex items-center gap-1.5 text-[11px] text-fg-warm-muted">
                <Unlock className="h-3 w-3 flex-shrink-0 text-brand" />
                <span className="line-clamp-1">
                  {nextContent.title} unlocks {nextContent.countdownText}
                </span>
              </div>
            )}

            {/* Important note (if exists) - only for cohort-based */}
            {!isCompleted && importantNote && (
              <div className="flex items-center gap-1.5 text-[11px] text-fg-warm-muted">
                <AlertCircle className="h-3 w-3 flex-shrink-0 text-brand" />
                <span className="line-clamp-1">{importantNote}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
