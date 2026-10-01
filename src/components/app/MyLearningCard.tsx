import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import {
  GraduationCap,
  Play,
  CalendarClock,
  ChevronRight,
  Headset,
  LayoutGrid,
  MessageCircle,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { PathProfileQuickCard } from '@/components/app/PathProfileQuickCard';
import { supabase } from '@/integrations/supabase/client';

import { useAuth } from '@/hooks/useAuth';
import { useFirstName } from '@/hooks/useFirstName';
import { useMyLearning } from '@/hooks/useMyLearning';
import { useSupportChatSummary } from '@/hooks/useSupportChatSummary';
import { useUnreadChat } from '@/hooks/useUnreadChat';


/**
 * "My Learning" — the first thing a program buyer sees on Path.
 * Shows their program, the next lesson to continue, progress, next live
  * session and the materials unlocked by their program or round.
 */
export function MyLearningCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    enrollment,
    isSelfPaced,
    nextSessionDate,
    courseId,
    course,
    nextLesson,
    nextLessonModuleIndex,
    nextLessonIndexInModule,
    totalLessons,
    completedCount,
    waitingCount,
    documentCount,
    audioPlaylists,
    videoPlaylists,
    audioPlaylistIds,
    videoPlaylistIds,
    hasProgram,
  } = useMyLearning();

  const { data: supportSummary } = useSupportChatSummary('support');
  const { unreadCount: supportUnread } = useUnreadChat('support');

  // Build a clean one-line preview: strip link tokens, collapse whitespace
  const supportPreview = (() => {
    const raw = supportSummary?.lastMessage?.content ?? '';
    return raw
      .replace(/LINK_BUTTON:\S+?:([^\n]+)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  })();

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

  const firstName = useFirstName();

  // Round's linked community channel + unread posts
  const roundId = enrollment?.program_rounds?.id;
  const { data: roundChannel } = useQuery({
    queryKey: ['my-learning-round-channel', roundId],
    queryFn: async () => {
      if (!roundId) return null;
      const { data, error } = await supabase
        .from('feed_channels')
        .select('id, name, slug')
        .eq('round_id', roundId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!roundId,
  });

  const { data: channelUnreadCount } = useQuery({
    queryKey: ['my-learning-channel-unread', roundChannel?.id, user?.id],
    queryFn: async () => {
      if (!roundChannel?.id || !user?.id) return 0;
      const { data: allPosts } = await supabase
        .from('feed_posts')
        .select('id, content, created_at')
        .eq('channel_id', roundChannel.id)
        .order('created_at', { ascending: false });
      if (!allPosts || allPosts.length === 0) return 0;
      const { data: readPostIds } = await supabase
        .from('feed_post_reads')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', allPosts.map((p) => p.id));
      const readSet = new Set(readPostIds?.map((r) => r.post_id) || []);
      const unread = allPosts.filter((p) => !readSet.has(p.id));
      return {
        count: unread.length,
        latest: unread[0]?.content ?? '',
      };
    },
    enabled: !!roundChannel?.id && !!user?.id,
  }) as { data?: { count: number; latest: string } | undefined };

  const communityPreview = (() => {
    const raw = channelUnreadCount?.latest ?? '';
    return raw
      .replace(/LINK_BUTTON:\S+?:([^\n]+)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  })();

  if (!hasProgram || !enrollment) return null;

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
    !courseId && audioPlaylists.length > 0
      ? {
          to: `/app/player/playlist/${audioPlaylists[0].id}`,
          title: audioPlaylists[0].name,
          cover: audioPlaylists[0].cover_image_url,
          label: 'Continue listening',
        }
      : !courseId && videoPlaylists.length > 0
        ? {
            to: `/app/watch/playlist/${videoPlaylists[0].id}`,
            title: videoPlaylists[0].name,
            cover: videoPlaylists[0].cover_image_url,
            label: 'Continue watching',
          }
        : null;

  return (
    <div className="mb-4 overflow-hidden rounded-3xl border border-border-warm bg-gradient-to-b from-peach/50 to-card-warm shadow-card-warm">
      {/* Greeting */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand">
              {isNew ? "You're in 🎉" : 'My Learning'}
            </p>
            <h3 className="mt-1 text-[17px] font-bold leading-tight text-fg-warm line-clamp-2">
              {isNew
                ? `Welcome to ${enrollment.course_name}${firstName ? `, ${firstName}` : ''}`
                : `Welcome back${firstName ? `, ${firstName}` : ''}`}
            </h3>
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-orange shadow-ios">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
        </div>
        {/* Profile peek — between the welcome and the program name */}
        <PathProfileQuickCard variant="inset" className="mt-4" />
        <p className="mt-5 text-[13.5px] font-semibold leading-tight text-fg-warm line-clamp-1">
          {enrollment.course_name}
          {round?.round_name ? ` · ${round.round_name}` : ''}
          {isSelfPaced ? ' · Self-paced' : ''}
        </p>
      </div>

      {/* Continue where you left off */}
      {courseId && nextLesson && (
        <div className="mx-3 mt-1 overflow-hidden rounded-2xl border border-border-warm bg-card-warm">
          <div className="relative flex min-h-[88px] items-center gap-3 bg-gradient-orange px-4 py-3">
            {course?.cover_image_url && (
              <img src={course.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            )}
            <GraduationCap className="relative h-7 w-7 flex-shrink-0 text-white" />
            <p className="relative min-w-0 flex-1 text-[15px] font-extrabold leading-snug text-white line-clamp-2">
              {course?.title || enrollment.course_name}
            </p>
            {nextLessonModuleIndex && nextLessonIndexInModule ? (
              <span className="absolute bottom-2 right-2 rounded-full bg-black/35 px-2.5 py-0.5 text-[10.5px] font-bold text-white">
                Module {nextLessonModuleIndex} · Lesson {nextLessonIndexInModule}
              </span>
            ) : null}
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
                state: { from: location.pathname },
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
        <div className="mx-3 mt-1 overflow-hidden rounded-2xl border border-border-warm bg-card-warm">
          <div className="relative flex min-h-[88px] items-center gap-3 bg-gradient-orange px-4 py-3">
            {heroPlaylist.cover && (
              <img src={heroPlaylist.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            )}
            <Play className="relative h-7 w-7 flex-shrink-0 fill-white text-white" />
            <p className="relative min-w-0 flex-1 text-[15px] font-extrabold leading-snug text-white line-clamp-2">
              {heroPlaylist.title}
            </p>
          </div>
          <div className="p-3.5">
          <p className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-fg-warm-muted">
            Start here
          </p>

          <Link
            to={heroPlaylist.to}
            state={{ from: location.pathname }}
            onClick={() => haptic.light()}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-orange text-[14px] font-extrabold text-white shadow-ios transition-transform active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-white" />
            {heroPlaylist.label}
          </Link>
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


       {/* Next live session / self-paced learning + My Programs */}
      <div className="mx-3 mt-3 grid grid-cols-[3fr_1fr] gap-2">
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



      {/* Support */}
      {supportUnread > 0 && supportSummary?.lastMessage ? (
        <Link
          to="/app/chat"
          onClick={() => haptic.light()}
          className="mx-3 mb-3.5 mt-3 flex items-center gap-2.5 rounded-2xl bg-mint px-3 py-2.5 active:scale-[0.98] transition-transform"
        >
          <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-card-warm">
            <Headset className="h-4 w-4 text-brand" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-mint" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-[12.5px] font-extrabold leading-tight text-fg-warm">
                New message from Support
              </span>
              <span className="flex-shrink-0 text-[10.5px] font-semibold text-fg-warm-muted">
                {(() => {
                  const mins = Math.floor((Date.now() - new Date(supportSummary.lastMessage.created_at).getTime()) / 60000);
                  if (mins < 1) return 'now';
                  if (mins < 60) return `${mins}m`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h`;
                  return `${Math.floor(hrs / 24)}d`;
                })()}
              </span>
            </span>
            <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-fg-warm-muted">
              {supportPreview}
            </span>
          </span>
          <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
            {supportUnread > 99 ? '99+' : supportUnread}
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-fg-warm-muted" />
        </Link>
      ) : (
        <Link
          to="/app/chat"
          onClick={() => haptic.light()}
          className="mx-3 mb-3.5 mt-3 flex min-h-[40px] items-center justify-center gap-2 rounded-2xl bg-mint px-3 text-[12.5px] font-bold text-fg-warm active:scale-[0.98] transition-transform"
        >
          <Headset className="h-4 w-4" />
          Questions about the program? Chat with support
        </Link>
      )}

      {/* Community — new messages in the round's channel */}
      {roundChannel && !!channelUnreadCount?.count && (
        <Link
          to={`/app/channels/${roundChannel.slug}`}
          onClick={() => haptic.light()}
          className="mx-3 mb-3.5 mt-3 flex items-center gap-2.5 rounded-2xl bg-mint px-3 py-2.5 active:scale-[0.98] transition-transform"
        >
          <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-card-warm">
            <MessageCircle className="h-4 w-4 text-brand" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-mint" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-[12.5px] font-extrabold leading-tight text-fg-warm">
                New in {roundChannel.name}
              </span>
              <span className="flex-shrink-0 text-[10.5px] font-semibold text-fg-warm-muted">
                {communityPreview
                  ? (() => {
                      const ts = channelUnreadCount?.latest;
                      void ts;
                      return '';
                    })()
                  : ''}
              </span>
            </span>
            {communityPreview && (
              <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-fg-warm-muted">
                {communityPreview}
              </span>
            )}
          </span>
          <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
            {channelUnreadCount!.count > 99 ? '99+' : channelUnreadCount!.count}
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-fg-warm-muted" />
        </Link>
      )}

    </div>
  );
}
