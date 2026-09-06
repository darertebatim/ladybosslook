import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Play, Pause, Headphones, FileText, BookOpen, Check, Loader2,
  ExternalLink, ChevronLeft, ChevronRight, Paperclip, Download, Lock, Trophy, List,
} from 'lucide-react';
import { PageHeader } from '@/components/app/ui/PageHeader';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LessonVideo, LessonAudio, LessonPdf } from '@/components/app/learn/LessonMedia';
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

  const [listOpen, setListOpen] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  const flatLessons = useMemo(() => {
    if (!content) return [] as LearnLesson[];
    return content.modules.flatMap((m) => content.lessons.filter((l) => l.module_id === m.id));
  }, [content]);

  const index = flatLessons.findIndex((l) => l.id === lessonId);
  const lesson = index >= 0 ? flatLessons[index] : null;

  // Skip locked lessons when moving around.
  const prev = useMemo(() => {
    for (let i = index - 1; i >= 0; i--) {
      if (!lessonUnlockDate(flatLessons[i], startDate)) return flatLessons[i];
    }
    return null;
  }, [index, flatLessons, startDate]);
  const next = useMemo(() => {
    for (let i = index + 1; i < flatLessons.length; i++) {
      if (!lessonUnlockDate(flatLessons[i], startDate)) return flatLessons[i];
    }
    return null;
  }, [index, flatLessons, startDate]);

  const total = flatLessons.length;
  const doneCount = flatLessons.filter((l) => progress?.has(l.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const isDone = lesson ? !!progress?.has(lesson.id) : false;
  const unlockAt = lesson ? lessonUnlockDate(lesson, startDate) : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setListOpen(false);
  }, [lessonId]);

  const goTo = (l: LearnLesson | null) => {
    if (!l) return;
    setListOpen(false);
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
      if (!v?.file_url) {
        return (
          <div className="w-full aspect-video rounded-2xl bg-peach flex items-center justify-center">
            <span className="text-xs text-fg-warm-muted">Video coming soon</span>
          </div>
        );
      }
      return (
        <LessonVideo
          url={v.file_url}
          poster={v.thumbnail_url}
          title={lesson.title}
          isVertical={v.is_vertical}
        />
      );
    }

    if (lesson.lesson_type === 'audio') {
      const a = lesson.audio;
      if (!a?.file_url) {
        return (
          <div className="w-full aspect-square rounded-2xl bg-peach flex items-center justify-center">
            <span className="text-xs text-fg-warm-muted">Audio coming soon</span>
          </div>
        );
      }
      return (
        <LessonAudio
          url={a.file_url}
          cover={a.cover_image_url || course?.cover_image_url}
          title={a.title || lesson.title}
          durationSeconds={a.duration_seconds || lessonDurationSeconds(lesson)}
        />
      );
    }

    if (lesson.lesson_type === 'document') {
      const r = lesson.reading;
      if (!r?.id) return null;
      return (
        <button
          onClick={() =>
            navigate(`/app/read/${r.id}/reader`, {
              state: { from: `/app/learn/${courseId}/${lesson.id}` },
            })
          }
          className="w-full flex items-center gap-3 bg-background rounded-2xl p-4 text-left active:scale-[0.99] transition-transform min-h-[56px]"
        >
          <div className="w-12 h-12 rounded-xl bg-peach flex items-center justify-center shrink-0 overflow-hidden">
            {r.cover_url ? (
              <img src={r.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="h-6 w-6 text-brand" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-fg-warm truncate">{r.title || lesson.title}</p>
            <p className="text-xs text-fg-warm-muted">Tap to start reading</p>
          </div>
          <ChevronRight className="h-5 w-5 text-fg-warm-muted shrink-0" />
        </button>
      );
    }

    // pdf
    if (!lesson.pdf_url) return null;
    return <LessonPdf url={lesson.pdf_url} title={lesson.title} />;
  };

  if (isLoading) {
    return (
      <div className="app-theme min-h-screen bg-background">
        <PageHeader title="Lesson" back backStyle="plain" />
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="app-theme min-h-screen bg-background">
        <PageHeader title="Lesson" back backStyle="plain" onBack={() => navigate(`/app/learn/${courseId}`)} />
        <div className="px-4 py-6">
          <div className="bg-card-warm shadow-card-warm rounded-3xl p-8 text-center space-y-3">
            <p className="font-semibold text-fg-warm">Lesson not available</p>
            <p className="text-sm text-fg-warm-muted">It may have been removed or you don't have access yet.</p>
            <button
              className="rounded-full bg-brand text-white px-5 py-3 font-semibold shadow-ios min-h-[48px]"
              onClick={() => navigate(`/app/learn/${courseId}`)}
            >
              Back to course
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = LESSON_ICONS[lesson.lesson_type] || Play;
  const attachments = Array.isArray(lesson.attachments) ? lesson.attachments : [];

  return (
    <div className="app-theme min-h-screen bg-background pb-32">
      <PageHeader
        title={course?.title || 'Lesson'}
        back
        backStyle="plain"
        onBack={() => navigate(`/app/learn/${courseId}`)}
        right={
          <button
            onClick={() => setListOpen(true)}
            aria-label="All lessons"
            className="w-10 h-10 rounded-full bg-white text-brand shadow-ios flex items-center justify-center active:scale-95 transition-transform"
          >
            <List className="h-5 w-5" />
          </button>
        }
        subRow={
          <div className="flex items-center gap-2 w-full">
            <div className="h-1.5 flex-1 rounded-full bg-peach overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
            <span className="text-xs font-medium text-fg-warm-muted shrink-0">
              {index + 1}/{total}
            </span>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {unlockAt ? (
          <div className="bg-card-warm shadow-card-warm rounded-3xl p-8 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-peach flex items-center justify-center">
              <Lock className="h-7 w-7 text-brand" />
            </div>
            <p className="font-semibold text-fg-warm">{lesson.title}</p>
            <p className="text-sm text-fg-warm-muted">{formatUnlockLabel(unlockAt)}</p>
          </div>
        ) : (
          <div className="bg-card-warm shadow-card-warm rounded-3xl p-4 space-y-3.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-peach flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-fg-warm leading-tight break-words">{lesson.title}</h2>
                <p className="text-xs text-fg-warm-muted mt-0.5">
                  <span className="capitalize">{lesson.lesson_type}</span>
                  {lessonDurationSeconds(lesson)
                    ? ` · ${formatLessonDuration(lessonDurationSeconds(lesson))}`
                    : ''}
                </p>
              </div>
            </div>

            {renderMedia()}

            {lesson.description && (
              <p className="text-sm text-fg-warm-muted whitespace-pre-line">{lesson.description}</p>
            )}

            {lesson.content_html && (
              <div
                className="prose prose-sm max-w-none text-fg-warm [&_a]:text-brand [&_img]:rounded-2xl [&_p]:text-fg-warm [&_li]:text-fg-warm [&_h1]:text-fg-warm [&_h2]:text-fg-warm [&_h3]:text-fg-warm [&_strong]:text-fg-warm"
                dangerouslySetInnerHTML={{ __html: lesson.content_html }}
              />
            )}

            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-semibold text-fg-warm flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-brand" /> Attachments
                </p>
                {attachments.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => smartOpenUrl(a.url, navigate)}
                    className="w-full flex items-center gap-3 bg-background rounded-2xl p-3 text-left active:scale-[0.99] transition-transform min-h-[48px]"
                  >
                    <Download className="h-4 w-4 text-brand shrink-0" />
                    <span className="flex-1 min-w-0 truncate text-sm text-fg-warm">{a.name}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleComplete}
              disabled={setComplete.isPending}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-full font-semibold shadow-ios min-h-[52px] active:scale-[0.98] transition-transform',
                isDone ? 'bg-peach text-fg-warm' : 'bg-brand text-white'
              )}
            >
              {setComplete.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className={cn('h-4 w-4', isDone && 'text-brand')} />
              )}
              {isDone ? 'Completed — tap to undo' : next ? 'Complete & continue' : 'Mark as complete'}
            </button>
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
          <button
            disabled={!prev}
            onClick={() => goTo(prev)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-card-warm shadow-card-warm min-h-[48px] text-sm font-medium text-fg-warm disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            disabled={!next}
            onClick={() => goTo(next)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-card-warm shadow-card-warm min-h-[48px] text-sm font-medium text-fg-warm disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* All lessons sheet */}
      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto bg-background border-0">
          <SheetHeader className="text-left">
            <SheetTitle className="text-fg-warm">All lessons</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-3 pb-6">
            {content?.modules.map((mod) => {
              const lessons = content.lessons.filter((l) => l.module_id === mod.id);
              if (!lessons.length) return null;
              return (
                <div key={mod.id} className="space-y-1.5">
                  <p className="text-xs font-semibold text-fg-warm-muted px-1 uppercase tracking-wide">{mod.title}</p>
                  {lessons.map((l) => {
                    const lDone = progress?.has(l.id);
                    const lLock = lessonUnlockDate(l, startDate);
                    const active = l.id === lessonId;
                    const LIcon = LESSON_ICONS[l.lesson_type] || Play;
                    return (
                      <button
                        key={l.id}
                        disabled={!!lLock}
                        onClick={() => goTo(l)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-2xl text-left min-h-[48px] transition-all',
                          active ? 'bg-peach shadow-ios' : 'bg-card-warm shadow-card-warm',
                          lLock && 'opacity-60'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          lDone ? 'bg-brand' : 'bg-peach'
                        )}>
                          {lLock ? <Lock className="h-4 w-4 text-fg-warm-muted" />
                            : lDone ? <Check className="h-4 w-4 text-white" />
                            : <LIcon className="h-4 w-4 text-brand" />}
                        </div>
                        <span className="flex-1 min-w-0">
                          <span className="block truncate text-sm font-medium text-fg-warm">{l.title}</span>
                          {lLock && (
                            <span className="block text-xs text-fg-warm-muted">{formatUnlockLabel(lLock)}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
