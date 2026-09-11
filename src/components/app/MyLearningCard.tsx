import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import {
  GraduationCap,
  Play,
  CalendarClock,
  ChevronRight,
  Headset,
  BookOpen,
  Music,
  Video,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMyLearning } from '@/hooks/useMyLearning';

/**
 * "My Learning" — the first thing a program buyer sees on Path.
 * Shows their program, the next lesson to continue, progress, next live
 * session and the materials unlocked by their round.
 */
export function MyLearningCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    enrollment,
    roundId,
    nextSessionDate,
    courseId,
    nextLesson,
    nextLessonModuleIndex,
    nextLessonIndexInModule,
    totalLessons,
    completedCount,
    waitingCount,
    audioCount,
    videoCount,
    hasProgram,
  } = useMyLearning();

  const [isNew, setIsNew] = useState(false);

  const enrollmentId = enrollment?.id;
  useEffect(() => {
    if (!enrollmentId) return;
    const key = `rilo_learning_seen_${enrollmentId}`;
    if (!localStorage.getItem(key)) {
      setIsNew(true);
      localStorage.setItem(key, String(Date.now()));
    }
  }, [enrollmentId]);

  if (!hasProgram || !enrollment) return null;

  const firstName =
    (user?.user_metadata?.full_name || user?.user_metadata?.name || '')
      .toString()
      .trim()
      .split(' ')[0] || '';

  const round = enrollment.program_rounds;
  const programPath = `/app/programs/${enrollment.program_slug}${round?.id ? `/${round.id}` : ''}`;
  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const sessionDate = nextSessionDate || round?.first_session_date || null;

  return (
    <div className="bg-card-warm shadow-card-warm rounded-3xl overflow-hidden mb-4">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand">
            {isNew ? "You're in 🎉" : 'My Learning'}
          </p>
          <h3 className="mt-1 text-[17px] font-bold leading-tight text-fg-warm line-clamp-2">
            {isNew
              ? `Welcome to ${enrollment.course_name}${firstName ? `, ${firstName}` : ''}`
              : `Welcome back${firstName ? `, ${firstName}` : ''}`}
          </h3>
          <p className="mt-0.5 text-xs text-fg-warm-muted line-clamp-1">
            {enrollment.course_name}
            {round?.round_name ? ` · ${round.round_name}` : ' · Self-paced'}
          </p>
        </div>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-orange shadow-ios">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Continue where you left off */}
      {courseId && nextLesson && (
        <div className="mx-3 mt-1 overflow-hidden rounded-2xl bg-card shadow-ios">
          <div className="relative flex aspect-[16/6] items-center justify-center bg-gradient-orange">
            <GraduationCap className="h-9 w-9 text-white/90" />
            {nextLessonModuleIndex && (
              <span className="absolute bottom-2 right-2.5 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold text-white">
                Module {nextLessonModuleIndex} · Lesson {nextLessonIndexInModule}
              </span>
            )}
          </div>
          <div className="p-3.5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-fg-warm-muted">
              {completedCount > 0 ? 'Continue where you left off' : 'Start here'}
            </p>
            <p className="mt-1 mb-2.5 text-sm font-bold leading-snug text-fg-warm line-clamp-2">
              {nextLesson.title}
            </p>
            <button
              onClick={() => {
                haptic.light();
                navigate(`/app/learn/${courseId}/${nextLesson.id}`, {
                  state: { from: programPath },
                });
              }}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white shadow-ios transition-transform active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-white" />
              {completedCount > 0 ? 'Continue lesson' : 'Start lesson'}
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {totalLessons > 0 && (
        <div className="px-4 pt-3">
          <div className="mb-1.5 flex justify-between text-[11.5px] font-semibold">
            <span className="text-fg-warm">
              {completedCount} of {totalLessons} lessons done
            </span>
            {waitingCount > 0 && (
              <span className="text-fg-warm-muted">{waitingCount} unlocked &amp; waiting</span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-peach">
            <div
              className="h-full rounded-full bg-gradient-orange transition-[width] duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Next live session */}
      {sessionDate && (
        <Link
          to={programPath}
          onClick={() => haptic.light()}
          className="mx-3 mt-3 flex items-center gap-2.5 rounded-2xl bg-peach px-3 py-2.5 active:opacity-90"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-card">
            <CalendarClock className="h-4 w-4 text-brand" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-bold text-fg-warm">Next live session</span>
            <span className="block text-[11.5px] text-fg-warm-muted">
              {isToday(new Date(sessionDate))
                ? `Today · ${format(new Date(sessionDate), 'h:mm a')}`
                : format(new Date(sessionDate), "EEE, MMM d · h:mm a")}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-fg-warm-muted" />
        </Link>
      )}

      {/* Materials */}
      <div className="grid grid-cols-3 gap-2 px-3 pt-3">
        <MaterialTile
          to={courseId ? `/app/learn/${courseId}` : programPath}
          icon={<BookOpen className="h-4 w-4" />}
          label="Course"
          className="bg-peach text-brand"
        />
        <MaterialTile
          to="/app/player"
          icon={<Music className="h-4 w-4" />}
          label="Audio"
          className="bg-chip-lavender text-fg-warm"
          disabled={audioCount === 0}
        />
        <MaterialTile
          to="/app/watch"
          icon={<Video className="h-4 w-4" />}
          label="Video"
          className="bg-chip-pink text-fg-warm"
          disabled={videoCount === 0}
        />
      </div>

      {/* Support */}
      <Link
        to="/app/chats"
        onClick={() => haptic.light()}
        className="mx-3 mb-3.5 mt-3 flex min-h-[40px] items-center justify-center gap-2 rounded-2xl border border-dashed border-fg-warm/20 px-3 text-[12.5px] font-semibold text-fg-warm-muted active:opacity-80"
      >
        <Headset className="h-4 w-4" />
        Questions about the program? Chat with support
      </Link>
    </div>
  );
}

function MaterialTile({
  to,
  icon,
  label,
  className,
  disabled,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  if (disabled) return null;
  return (
    <Link
      to={to}
      onClick={() => haptic.light()}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-2xl py-2.5 active:opacity-90',
        className,
      )}
    >
      {icon}
      <span className="text-[10.5px] font-extrabold text-fg-warm">{label}</span>
    </Link>
  );
}
