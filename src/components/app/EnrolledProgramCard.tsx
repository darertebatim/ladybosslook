import { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Unlock,
  CalendarClock,
  GraduationCap,
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { haptic } from '@/lib/haptics';
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
  const isUpcoming = round?.status === 'upcoming';
  const isActive = round?.status === 'active';

  const displayDate = nextSessionDate || round?.first_session_date;
  const isSessionToday = displayDate && isToday(new Date(displayDate));

  const importantNote = round?.important_message
    ? round.important_message.split(/[.!?]/)[0]?.trim()
    : null;

  const to = `/app/programs/${enrollment.program_slug}${round?.id ? `/${round.id}` : ''}`;

  const statusLabel = isCompleted
    ? 'Completed'
    : round
      ? isActive
        ? 'Active'
        : isUpcoming
          ? 'Upcoming'
          : round.status
      : 'Self-paced';

  return (
    <div
      className={cn(
        'bg-card-warm shadow-card-warm rounded-3xl overflow-hidden',
        isCompleted && 'opacity-75',
      )}
    >
      <Link
        to={to}
        onClick={() => {
          haptic.light();
          onMarkViewed?.();
        }}
        className="block active:opacity-90 transition-opacity"
      >
        {/* Gradient header */}
        <div
          className={cn(
            'relative h-24 flex items-center justify-center bg-gradient-orange',
            isCompleted && 'opacity-80',
          )}
        >
          <GraduationCap className="h-9 w-9 text-white" />

          {/* Status pill */}
          <span
            className={cn(
              'absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold shadow-ios capitalize',
              isCompleted ? 'bg-white/95 text-fg-warm-muted' : 'bg-white/95 text-brand',
            )}
          >
            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
            {statusLabel}
          </span>

          {/* Updated pill */}
          {hasNotification && !isCompleted && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-brand shadow-ios">
              <Sparkles className="h-3 w-3" />
              Updated
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-lg leading-tight text-fg-warm line-clamp-2">
            {enrollment.course_name}
          </h3>

          {round && (
            <p className="text-sm text-fg-warm-muted line-clamp-1">{round.round_name}</p>
          )}

          {!isCompleted && displayDate && (
            <p
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium',
                isSessionToday ? 'text-brand' : 'text-fg-warm-muted',
              )}
            >
              <CalendarClock className="h-4 w-4 flex-shrink-0 text-brand" />
              {isSessionToday
                ? `Today at ${format(new Date(displayDate), 'h:mm a')}`
                : isUpcoming
                  ? `Starts ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                  : `Next ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`}
            </p>
          )}

          {!isCompleted && nextContent && (
            <p className="flex items-center gap-1.5 text-sm text-fg-warm-muted">
              <Unlock className="h-4 w-4 flex-shrink-0 text-brand" />
              <span className="line-clamp-1">
                {nextContent.title} unlocks {nextContent.countdownText}
              </span>
            </p>
          )}

          {!isCompleted && importantNote && (
            <p className="flex items-center gap-1.5 text-sm text-fg-warm-muted">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-brand" />
              <span className="line-clamp-1">{importantNote}</span>
            </p>
          )}
        </div>
      </Link>

      <div className="px-4 pb-4">
        <Link
          to={to}
          onClick={() => {
            haptic.light();
            onMarkViewed?.();
          }}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 rounded-full py-3.5 font-semibold min-h-[48px] active:scale-[0.98] transition-transform',
            isCompleted
              ? 'bg-peach text-brand'
              : 'bg-brand text-white shadow-ios',
          )}
        >
          {isCompleted ? 'Review program' : 'Open program'}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
});
