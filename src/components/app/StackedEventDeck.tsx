import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Settings2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ProgramEvent,
  useCompleteProgramEvent,
  useUncompleteProgramEvent,
} from '@/hooks/usePlannerProgramEvents';
import { EVENT_STYLES } from '@/components/app/ProgramEventCard';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { SessionReminderSheet } from '@/components/app/SessionReminderSheet';
import { useSessionReminderSettings } from '@/hooks/useSessionReminderSettings';
import { isToday, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';

interface StackedEventDeckProps {
  events: ProgramEvent[];
  date: Date;
}

const STACK_DEPTH = 3; // number of visible card layers

export function StackedEventDeck({ events, date }: StackedEventDeckProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [exitingKeys, setExitingKeys] = useState<Set<string>>(new Set());

  const completeProgramEvent = useCompleteProgramEvent();
  const uncompleteProgramEvent = useUncompleteProgramEvent();

  // Events currently in the stack (not completed, not animating out)
  const stackEvents = events.filter((e) => {
    const key = `${e.type}-${e.id}`;
    return !e.isCompleted && !exitingKeys.has(key);
  });

  const totalRemaining = stackEvents.length;
  const topEvent = stackEvents[0];

  const markExiting = (event: ProgramEvent) => {
    const key = `${event.type}-${event.id}`;
    setExitingKeys((prev) => new Set([...prev, key]));
    setTimeout(() => {
      setExitingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 360);
  };

  const handleToggleComplete = (event: ProgramEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const isFutureDate = !isToday(date) && !isBefore(startOfDay(date), startOfDay(new Date()));
    if (isFutureDate) {
      haptic.light();
      toast("Let's focus on today's routines.", { icon: '☝️', duration: 2000 });
      return;
    }

    haptic.light();

    if (event.isCompleted) {
      uncompleteProgramEvent.mutate({
        eventType: event.type as 'session' | 'module' | 'track' | 'enrollment',
        eventId: event.id,
        date,
      });
    } else {
      markExiting(event);
      const eventType = event.type as
        | 'session'
        | 'module'
        | 'track'
        | 'enrollment'
        | 'playlist_save'
        | 'course_access'
        | 'lesson';
      completeProgramEvent.mutate({ eventType, eventId: event.id, date });
    }
  };

  const handleCardClick = async (event: ProgramEvent) => {
    haptic.light();

    const isRoundUpdate = event.type === 'round_update';
    const isPlaylistUpdate = event.type === 'playlist_update';
    const isCourseUpdate = event.type === 'course_update';
    const isSpecialCard = isRoundUpdate || isPlaylistUpdate || isCourseUpdate;
    const isFutureDate = !isToday(date) && !isBefore(startOfDay(date), startOfDay(new Date()));

    // Mark round_update as read on tap
    if (isRoundUpdate) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('round_notification_reads').insert({
            notification_id: event.id,
            user_id: user.id,
          });
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Mark playlist_update as read on tap
    if (isPlaylistUpdate && event.playlistId) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const ids =
            event.audioIds && event.audioIds.length > 0
              ? event.audioIds
              : event.audioId
                ? [event.audioId]
                : [];
          if (ids.length > 0) {
            await supabase.from('playlist_update_notification_reads').insert(
              ids.map((audio_id) => ({
                user_id: user.id,
                playlist_id: event.playlistId!,
                audio_id,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to mark playlist update as read:', err);
      }
    }

    // Mark course_update lessons as read on tap
    if (isCourseUpdate && event.courseId) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const ids = event.lessonIds || [];
        if (user && ids.length > 0) {
          await supabase.from('learn_course_update_reads').insert(
            ids.map((lesson_id) => ({
              user_id: user.id,
              course_id: event.courseId!,
              lesson_id,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to mark course update as read:', err);
      }
    }

    // Special cards exit on tap
    if (isSpecialCard) {
      markExiting(event);
    }

    // Auto-complete on tap (for completable event types)
    if (!event.isCompleted && !isFutureDate && !isSpecialCard) {
      const eventType = event.type as
        | 'session'
        | 'module'
        | 'track'
        | 'enrollment'
        | 'playlist_save'
        | 'course_access'
        | 'lesson';
      markExiting(event);
      completeProgramEvent.mutate({ eventType, eventId: event.id, date });
    }

    switch (event.type) {
      case 'enrollment':
      case 'round_update':
      case 'session':
      case 'module':
        navigate(`/app/course/${event.programSlug}`, { state: { from: location.pathname } });
        break;
      case 'track':
      case 'playlist_save':
      case 'playlist_update':
        if (event.playlistId) {
          navigate(`/app/player/playlist/${event.playlistId}`, { state: { from: location.pathname } });
        }
        break;
      case 'lesson':
        if (event.courseId && event.lessonId) {
          navigate(`/app/learn/${event.courseId}/${event.lessonId}`, { state: { from: location.pathname } });
        } else if (event.courseId) {
          navigate(`/app/learn/${event.courseId}`, { state: { from: location.pathname } });
        }
        break;
      case 'course_access':
      case 'course_update':
        if (event.courseId) {
          navigate(`/app/learn/${event.courseId}`, { state: { from: location.pathname } });
        }
        break;
    }
  };

  if (totalRemaining === 0) return null;

  return (
    <div className="px-4 pt-2 pb-3">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 pl-1">
        <div
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: '#EB5E33' }}
        >
          Today's events
        </div>
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, rgba(235,94,51,0.33), transparent)' }}
        />
      </div>

      {/* Stack */}
      <div className="relative h-[132px] w-full">
        <AnimatePresence mode="popLayout">
          {stackEvents.slice(0, STACK_DEPTH).map((event, index) => {
            const isTop = index === 0;
            const style = EVENT_STYLES[event.type];
            const depth = Math.min(index, STACK_DEPTH - 1);
            const scale = 1 - (STACK_DEPTH - 1 - depth) * 0.06;
            const translateY = (STACK_DEPTH - 1 - depth) * 10;
            const opacity = depth === 0 ? 1 : depth === 1 ? 0.7 : 0.4;

            if (isTop) {
              return (
                <motion.div
                  key={`${event.type}-${event.id}`}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 60, y: -20, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  onClick={() => handleCardClick(event)}
                  className={cn(
                    'absolute inset-0 rounded-[28px] p-4 cursor-pointer active:scale-[0.98] transition-transform',
                    'border border-black/5 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)]',
                    style.tintBg
                  )}
                  style={{ zIndex: 30 }}
                >
                  <TopCardContent event={event} date={date} onToggleComplete={handleToggleComplete} />
                </motion.div>
              );
            }

            return (
              <div
                key={`${event.type}-${event.id}`}
                className={cn(
                  'absolute inset-0 rounded-[28px] border border-black/5 shadow-sm pointer-events-none',
                  style.tintBg
                )}
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity,
                  zIndex: 30 - depth * 10,
                }}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Stack indicator */}
      {totalRemaining > 1 && (
        <div className="flex justify-center items-center mt-3 gap-1.5">
          <div className="w-6 h-1 rounded-full" style={{ background: '#b9785c' }} />
          {Array.from({ length: Math.min(totalRemaining - 1, 4) }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1 rounded-full"
              style={{ background: '#e5d5c8' }}
            />
          ))}
          <span className="ml-2 text-[10px] font-bold uppercase" style={{ color: '#b9785c' }}>
            {totalRemaining - 1} more
          </span>
        </div>
      )}
    </div>
  );
}

function TopCardContent({
  event,
  date,
  onToggleComplete,
}: {
  event: ProgramEvent;
  date: Date;
  onToggleComplete: (event: ProgramEvent, e?: React.MouseEvent) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  const style = EVENT_STYLES[event.type];

  const {
    sessionSettings,
    setSessionSettings,
    contentSettings,
    setContentSettings,
  } = useSessionReminderSettings(event.roundId);

  const isSession = event.type === 'session';
  const currentSettings = isSession ? sessionSettings : contentSettings;
  const saveSettings = isSession ? setSessionSettings : setContentSettings;

  const isEnrollment = event.type === 'enrollment';
  const isRoundUpdate = event.type === 'round_update';
  const isPlaylistSave = event.type === 'playlist_save';
  const isPlaylistUpdate = event.type === 'playlist_update';
  const isCourseAccess = event.type === 'course_access';
  const isCourseUpdate = event.type === 'course_update';
  const isLessonUnlock = event.type === 'lesson';
  const isCourseEvent = isCourseAccess || isCourseUpdate || isLessonUnlock;
  const isPlaylistEvent = isPlaylistSave || isPlaylistUpdate;
  const isSpecialCard = isRoundUpdate || isPlaylistUpdate || isCourseUpdate;

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    setShowReminderSheet(true);
  };

  const title = isPlaylistUpdate && event.audioTitle
    ? event.audioTitle
    : isCourseUpdate && event.lessonTitle
      ? event.lessonTitle
      : event.title;

  const subtitle = isEnrollment
    ? 'Tap to explore your program →'
    : isRoundUpdate
      ? 'Tap to see changes →'
      : isPlaylistSave
        ? 'Tap to start listening →'
        : isPlaylistUpdate
          ? `New in ${event.title} • Tap to listen →`
          : isCourseAccess
            ? 'Tap to start your course →'
            : isCourseUpdate
              ? `New in ${event.title} • Tap to open →`
              : isLessonUnlock
                ? `${event.courseTitle ?? 'Course'} • Tap to start →`
                : event.type === 'session'
                  ? 'Tap to join your session →'
                  : event.type === 'track'
                    ? 'Tap to listen →'
                    : event.type === 'module'
                      ? 'Tap to view module →'
                      : event.programTitle;

  return (
    <>
      <div className="flex items-center gap-3 h-full">
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
            style.doneBg
          )}
        >
          {event.type === 'playlist_save' && event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt=""
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
            />
          ) : (
            <FluentEmoji emoji={style.emoji} size={26} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-fg-warm-muted">{event.time || 'Anytime'}</span>
            <span
              className={cn(
                'text-[10px] font-semibold rounded px-1.5 py-0.5 leading-none whitespace-nowrap',
                style.badgeClass
              )}
            >
              {style.badge}
            </span>
            {!isPlaylistEvent && !isCourseEvent && (
              <button
                onClick={handleSettingsClick}
                className={cn('p-1 rounded-full transition-colors', style.settingsBg)}
              >
                <Settings2 className="h-3 w-3 text-fg-warm" />
              </button>
            )}
            {event.type === 'session' && isToday(date) && event.meetingLink && (
              <ExternalLink className="h-3 w-3 text-fg-warm-muted" />
            )}
          </div>
          <p className="text-fg-warm text-[15px] font-semibold leading-tight truncate pr-1">
            {title}
          </p>
          <p className="text-[11px] text-fg-warm-muted truncate">{subtitle}</p>
        </div>

        {/* Done action */}
        {!isSpecialCard && (
          <button
            onClick={(e) => onToggleComplete(event, e)}
            className="w-12 h-12 -m-1.5 flex items-center justify-center shrink-0"
          >
            {event.isCompleted ? (
              <div className="w-9 h-9 rounded-full bg-teal-400 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
            ) : (
              <span className="w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center" />
            )}
          </button>
        )}
      </div>

      <SessionReminderSheet
        open={showReminderSheet}
        onOpenChange={setShowReminderSheet}
        title={isSession ? 'Session Reminders' : 'Content Reminders'}
        description={
          isSession
            ? 'Control notifications for live sessions in your planner'
            : 'Control notifications for content unlock tasks in your planner'
        }
        currentSettings={currentSettings}
        onSave={saveSettings}
      />
    </>
  );
}
