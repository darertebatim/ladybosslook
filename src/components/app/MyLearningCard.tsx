import { useEffect, useState, type ReactNode } from 'react';
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
  Folder,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';

import { useAuth } from '@/hooks/useAuth';
import { useMyLearning } from '@/hooks/useMyLearning';

/**
 * "My Learning" — the first thing a program buyer sees on Path.
 * Shows their program, the next lesson to continue, progress, next live
 * session (or self-paced start date) and the materials unlocked by their round.
 */
export function MyLearningCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    enrollment,
    isSelfPaced,
    enrolledAt,
    nextSessionDate,
    courseId,
    nextLesson,
    nextLessonModuleIndex,
    nextLessonIndexInModule,
    totalLessons,
    completedCount,
    waitingCount,
    documentCount,
    audioPlaylistIds,
    videoPlaylistIds,
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

  const sessionDate = !isSelfPaced ? nextSessionDate || round?.first_session_date || null : null;

  // Where each material tile should land
  const audioTo =
    audioPlaylistIds.length === 1
      ? `/app/player/playlist/${audioPlaylistIds[0]}`
      : audioPlaylistIds.length > 1
        ? programPath
        : null;
  const videoTo =
    videoPlaylistIds.length === 1
      ? `/app/watch/playlist/${videoPlaylistIds[0]}`
      : videoPlaylistIds.length > 1
        ? programPath
        : null;
  const courseTo = courseId ? `/app/learn/${courseId}` : null;

  // Hero fallback for rounds without a course but with playlists
  const heroPlaylist =
    !courseId && audioPlaylistIds.length > 0
      ? { to: `/app/player/playlist/${audioPlaylistIds[0]}`, label: 'Continue listening' }
      : !courseId && videoPlaylistIds.length > 0
        ? { to: `/app/watch/playlist/${videoPlaylistIds[0]}`, label: 'Continue watching' }
        : null;

  return (
    <div className="mb-4 overflow-hidden rounded-3xl border border-border-warm bg-gradient-to-b from-peach/50 to-card-warm shadow-card-warm">
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
            {round?.round_name ? ` · ${round.round_name}` : ''}
            {isSelfPaced ? ' · Self-paced' : ''}
          </p>
        </div>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-orange shadow-ios">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Continue where you left off */}
      {courseId && nextLesson && (
        <div className="mx-3 mt-1 overflow-hidden rounded-2xl border border-border-warm bg-card-warm">
          <div className="relative flex h-16 items-center justify-center rounded-2xl bg-gradient-orange">
            <GraduationCap className="h-7 w-7 text-white/90" />
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
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-orange text-[14px] font-extrabold text-white shadow-ios transition-transform active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-white" />
              {completedCount > 0 ? 'Continue lesson' : 'Start lesson'}
            </button>
          </div>
        </div>
      )}

      {/* Hero for playlist-only rounds */}
      {heroPlaylist && (
        <div className="mx-3 mt-1">
          <Link
            to={heroPlaylist.to}
            onClick={() => haptic.light()}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-orange text-[14px] font-extrabold text-white shadow-ios transition-transform active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-white" />
            {heroPlaylist.label}
          </Link>
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

      {/* Just unlocked */}
      {waitingCount > 0 && nextLesson && (
        <div className="mx-3 mt-3 rounded-2xl bg-mint/60 px-3 py-2.5">
          <p className="mb-1 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-fg-warm">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Just unlocked
          </p>
          <p className="text-[12.5px] font-semibold text-fg-warm line-clamp-1">
            {nextLesson.title}
            {waitingCount > 1 ? ` +${waitingCount - 1} more` : ''}
          </p>
        </div>
      )}

      {/* Next live session / self-paced start + My Programs */}
      <div className="mx-3 mt-3 grid grid-cols-[2fr_1fr] gap-2">
        {sessionDate ? (
          <Link
            to={programPath}
            onClick={() => haptic.light()}
            className="flex items-center gap-2.5 rounded-2xl bg-peach px-3 py-2.5 active:opacity-90"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-card-warm">
              <CalendarClock className="h-4 w-4 text-brand" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-bold leading-tight text-fg-warm line-clamp-1">
                Next live session
              </span>
              <span className="block text-[11.5px] leading-tight text-fg-warm-muted line-clamp-1">
                {isToday(new Date(sessionDate))
                  ? `Today · ${format(new Date(sessionDate), 'h:mm a')}`
                  : format(new Date(sessionDate), 'EEE, MMM d · h:mm a')}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-fg-warm-muted" />
          </Link>
        ) : (
          <Link
            to={programPath}
            onClick={() => haptic.light()}
            className="flex items-center gap-2.5 rounded-2xl bg-peach px-3 py-2.5 active:opacity-90"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-card-warm">
              <CalendarClock className="h-4 w-4 text-brand" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-bold leading-tight text-fg-warm line-clamp-1">
                Learn at your own pace
              </span>
              <span className="block text-[11.5px] leading-tight text-fg-warm-muted line-clamp-1">
                {enrolledAt ? `Started ${format(new Date(enrolledAt), 'MMM d, yyyy')}` : 'No live sessions'}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-fg-warm-muted" />
          </Link>
        )}
        <Link
          to="/app/programs"
          onClick={() => haptic.light()}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-peach py-2.5 text-brand active:opacity-90"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="text-[10.5px] font-extrabold text-fg-warm">My Programs</span>
        </Link>
      </div>

      {/* Materials — keep My Programs + the 2 highest-priority attachments */}
      {(() => {
        const filesTo = documentCount > 0 && courseTo ? courseTo : null;
        const attachmentTiles = [
          { to: courseTo, icon: <BookOpen className="h-4 w-4" />, label: 'Course', key: 'course' },
          { to: audioTo, icon: <Music className="h-4 w-4" />, label: 'Audio', key: 'audio' },
          { to: videoTo, icon: <Video className="h-4 w-4" />, label: 'Video', key: 'video' },
          { to: filesTo, icon: <Folder className="h-4 w-4" />, label: 'Files', key: 'files' },
        ].filter((t) => t.to) as { to: string; icon: ReactNode; label: string; key: string }[];

        const shown = attachmentTiles.slice(0, 2);
        const tiles = [
          ...shown,
          { to: '/app/programs', icon: <LayoutGrid className="h-4 w-4" />, label: 'My Programs', key: 'programs' },
        ];
        const cols = tiles.length >= 3 ? 'grid-cols-3' : tiles.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

        return (
          <div className={`grid ${cols} gap-2 px-3 pt-3`}>
            {tiles.map((t) => (
              <MaterialTile key={t.key} to={t.to} icon={t.icon} label={t.label} />
            ))}
          </div>
        );
      })()}


      {/* Support */}
      <Link
        to="/app/chat"
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
}: {
  to: string | null;
  icon: ReactNode;
  label: string;
}) {
  if (!to) return null;
  return (
    <Link
      to={to}
      onClick={() => haptic.light()}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-peach py-2.5 text-brand active:opacity-90"
    >
      {icon}
      <span className="text-[10.5px] font-extrabold text-fg-warm">{label}</span>
    </Link>
  );
}
