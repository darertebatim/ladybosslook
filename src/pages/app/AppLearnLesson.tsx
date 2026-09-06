import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Play, Pause, Headphones, FileText, BookOpen, Check, Loader2,
  ExternalLink, ChevronLeft, ChevronRight, Paperclip, Download, Lock, Trophy,
} from 'lucide-react';
import { PageHeader } from '@/components/app/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AppVideoPlayer } from '@/components/app/AppVideoPlayer';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { isNativeApp } from '@/lib/platform';
import { smartOpenUrl } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';
import {
  useLearnCourse, useLearnCourseContent, useLearnProgress, useSetLessonComplete,
  useLearnCourseStartDate, lessonUnlockDate, formatUnlockLabel, formatLessonDuration,
  lessonDurationSeconds, type LearnLesson, type LessonType,
} from '@/hooks/useLearn';

const LESSON_ICONS: Record<LessonType, typeof Play> = {
  video: Play,
  audio: Headphones,
  document: BookOpen,
  pdf: FileText,
};

export default function AppLearnLesson() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { data: course } = useLearnCourse(courseId);
  const { data: content, isLoading } = useLearnCourseContent(courseId);
  const { data: progress } = useLearnProgress();
  const { data: startDate } = useLearnCourseStartDate(courseId);
  const setComplete = useSetLessonComplete();
  const audioPlayer = useAudioPlayer();

  const [videoOpen, setVideoOpen] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  const flatLessons = useMemo(() => {
    if (!content) return [] as LearnLesson[];
    return content.modules.flatMap((m) => content.lessons.filter((l) => l.module_id === m.id));
  }, [content]);

  const index = flatLessons.findIndex((l) => l.id === lessonId);
  const lesson = index >= 0 ? flatLessons[index] : null;
  const prev = index > 0 ? flatLessons[index - 1] : null;
  const next = index >= 0 && index < flatLessons.length - 1 ? flatLessons[index + 1] : null;

  const total = flatLessons.length;
  const doneCount = flatLessons.filter((l) => progress?.has(l.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const isDone = lesson ? !!progress?.has(lesson.id) : false;
  const unlockAt = lesson ? lessonUnlockDate(lesson, startDate) : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setVideoOpen(false);
  }, [lessonId]);

  const goTo = (l: LearnLesson | null) => {
    if (!l) return;
    navigate(`/app/learn/${courseId}/${l.id}`, { replace: true });
  };

  const handleComplete = () => {
    if (!lesson) return;
    const completing = !isDone;
    setComplete.mutate(
      { lessonId: lesson.id, complete: completing },
      {
        onSuccess: () => {
          if (!completing) return;
          const willBeDone = doneCount + 1;
          if (willBeDone >= total && !celebrated) {
            setCelebrated(true);
            confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
            return;
          }
          if (next) goTo(next);
        },
      }
    );
  };

  const renderMedia = () => {
    if (!lesson) return null;

    if (lesson.lesson_type === 'video') {
      const v = lesson.video;
      return (
        <>
          <button
            onClick={() => v?.file_url && setVideoOpen(true)}
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-bg-warm active:opacity-90 transition-opacity"
          >
            {v?.thumbnail_url ? (
              <img src={v.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="h-10 w-10 text-fg-warm-muted" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-brand shadow-ios flex items-center justify-center">
                <Play className="h-7 w-7 text-white fill-white ml-0.5" />
              </div>
            </div>
          </button>
          {v?.file_url && (
            <AppVideoPlayer
              isOpen={videoOpen}
              onClose={() => {
                setVideoOpen(false);
                if (!isDone) setComplete.mutate({ lessonId: lesson.id, complete: true });
              }}
              url={v.file_url}
              title={lesson.title}
              description={lesson.description || undefined}
              isVertical={v.is_vertical || undefined}
              videoId={v.id}
            />
          )}
        </>
      );
    }

    if (lesson.lesson_type === 'audio') {
      const a = lesson.audio;
      const isThisTrack = audioPlayer.currentTrack?.id === a?.id;
      const playing = isThisTrack && audioPlayer.isPlaying;
      return (
        <div className="flex items-center gap-3 bg-bg-warm rounded-2xl p-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-peach shrink-0 flex items-center justify-center">
            {a?.cover_image_url ? (
              <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Headphones className="h-6 w-6 text-brand" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-fg-warm truncate">{a?.title || lesson.title}</p>
            {lessonDurationSeconds(lesson) && (
              <p className="text-xs text-fg-warm-muted">{formatLessonDuration(lessonDurationSeconds(lesson))}</p>
            )}
          </div>
          <button
            onClick={() => {
              if (!a?.file_url) return;
              if (isThisTrack) {
                if (playing) audioPlayer.pause();
                else audioPlayer.resume();
              } else {
                audioPlayer.playTrack({
                  id: a.id,
                  title: a.title || lesson.title,
                  coverImageUrl: a.cover_image_url || undefined,
                  fileUrl: a.file_url,
                  duration: a.duration_seconds || undefined,
                });
              }
            }}
            className="w-12 h-12 rounded-full bg-brand shadow-ios flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            {playing ? (
              <Pause className="h-5 w-5 text-white fill-white" />
            ) : (
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            )}
          </button>
        </div>
      );
    }

    if (lesson.lesson_type === 'document') {
      const r = lesson.reading;
      return (
        <button
          onClick={() => r?.id && navigate(`/app/read/${r.id}/reader`)}
          className="w-full flex items-center gap-3 bg-bg-warm rounded-2xl p-4 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-peach flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-fg-warm">{r?.title || lesson.title}</p>
            <p className="text-xs text-fg-warm-muted">Tap to start reading</p>
          </div>
          <ChevronRight className="h-5 w-5 text-fg-warm-muted shrink-0" />
        </button>
      );
    }

    // pdf
    return (
      <div className="space-y-2">
        {!isNativeApp() && lesson.pdf_url && (
          <div className="w-full h-[50vh] bg-bg-warm rounded-2xl overflow-hidden">
            <iframe src={lesson.pdf_url} className="w-full h-full" title={lesson.title} />
          </div>
        )}
        <Button
          onClick={() => lesson.pdf_url && smartOpenUrl(lesson.pdf_url, navigate)}
          className="w-full rounded-full gap-2 bg-brand text-white border-0"
        >
          <ExternalLink className="h-4 w-4" />
          Open / download file
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-warm">
        <PageHeader title="Lesson" back />
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-bg-warm">
        <PageHeader title="Lesson" back />
        <div className="px-4 py-6">
          <div className="bg-card-warm shadow-card-warm rounded-3xl p-8 text-center space-y-3">
            <p className="font-semibold text-fg-warm">Lesson not available</p>
            <p className="text-sm text-fg-warm-muted">It may have been removed or you don't have access.</p>
            <Button className="rounded-full" onClick={() => navigate(`/app/learn/${courseId}`)}>
              Back to course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = LESSON_ICONS[lesson.lesson_type] || Play;
  const attachments = Array.isArray(lesson.attachments) ? lesson.attachments : [];

  return (
    <div className="min-h-screen bg-bg-warm pb-32">
      <PageHeader
        title={course?.title || 'Lesson'}
        back
        onBack={() => navigate(`/app/learn/${courseId}`)}
        subRow={
          <div className="flex items-center gap-2 w-full">
            <Progress value={pct} className="h-1.5 flex-1" />
            <span className="text-xs text-fg-warm-muted shrink-0">
              {index + 1}/{total}
            </span>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {unlockAt ? (
          <div className="bg-white rounded-3xl shadow-ios p-8 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-peach flex items-center justify-center">
              <Lock className="h-7 w-7 text-brand" />
            </div>
            <p className="font-semibold text-fg-warm">{lesson.title}</p>
            <p className="text-sm text-fg-warm-muted">{formatUnlockLabel(unlockAt)}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-ios p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-peach flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-brand" />
              </div>
              <h1 className="font-bold text-fg-warm flex-1 min-w-0">{lesson.title}</h1>
            </div>

            {renderMedia()}

            {lesson.description && (
              <p className="text-sm text-fg-warm-muted">{lesson.description}</p>
            )}

            {lesson.content_html && (
              <div
                className="prose prose-sm max-w-none text-fg-warm [&_a]:text-brand [&_img]:rounded-2xl"
                dangerouslySetInnerHTML={{ __html: lesson.content_html }}
              />
            )}

            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-semibold text-fg-warm flex items-center gap-2">
                  <Paperclip className="h-4 w-4" /> Attachments
                </p>
                {attachments.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => smartOpenUrl(a.url, navigate)}
                    className="w-full flex items-center gap-3 bg-bg-warm rounded-2xl p-3 text-left active:scale-[0.99] transition-transform min-h-[48px]"
                  >
                    <Download className="h-4 w-4 text-brand shrink-0" />
                    <span className="flex-1 min-w-0 truncate text-sm text-fg-warm">{a.name}</span>
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={handleComplete}
              disabled={setComplete.isPending}
              className={cn(
                'w-full rounded-full gap-2 shadow-ios border-0 h-12',
                isDone ? 'bg-mint text-fg-warm' : 'bg-brand text-white'
              )}
            >
              {setComplete.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isDone ? 'Completed — tap to undo' : next ? 'Complete & continue' : 'Mark as complete'}
            </Button>
          </div>
        )}

        {doneCount >= total && total > 0 && (
          <div className="bg-mint rounded-3xl p-6 text-center space-y-2">
            <Trophy className="h-8 w-8 text-brand mx-auto" />
            <p className="font-bold text-fg-warm">Course complete!</p>
            <p className="text-sm text-fg-warm-muted">You finished every lesson in {course?.title}.</p>
          </div>
        )}

        {/* Prev / next */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            disabled={!prev}
            onClick={() => goTo(prev)}
            className="flex-1 rounded-full bg-white shadow-ios h-12 gap-2 text-fg-warm"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button
            variant="ghost"
            disabled={!next}
            onClick={() => goTo(next)}
            className="flex-1 rounded-full bg-white shadow-ios h-12 gap-2 text-fg-warm"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
