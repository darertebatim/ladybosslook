import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Pause, Headphones, FileText, BookOpen, Check, CheckCircle2,
  Loader2, ExternalLink, ChevronRight, GraduationCap,
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
  useLearnCourseContent, useLearnProgress, useSetLessonComplete,
  formatLessonDuration, type LearnLesson, type LessonType,
} from '@/hooks/useLearn';

const LESSON_ICONS: Record<LessonType, typeof Play> = {
  video: Play,
  audio: Headphones,
  document: BookOpen,
  pdf: FileText,
};

export default function AppLearnCourse() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: content, isLoading } = useLearnCourseContent(courseId);
  const { data: progress } = useLearnProgress();
  const setComplete = useSetLessonComplete();
  const audioPlayer = useAudioPlayer();

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const flatLessons = useMemo(() => {
    if (!content) return [];
    const byModule = new Map<string, LearnLesson[]>();
    for (const l of content.lessons) {
      const arr = byModule.get(l.module_id) || [];
      arr.push(l);
      byModule.set(l.module_id, arr);
    }
    return content.modules.flatMap((m) => byModule.get(m.id) || []);
  }, [content]);

  // Current lesson: explicit selection, else first incomplete, else first
  const currentLesson = useMemo(() => {
    if (flatLessons.length === 0) return null;
    if (selectedLessonId) {
      const found = flatLessons.find((l) => l.id === selectedLessonId);
      if (found) return found;
    }
    return flatLessons.find((l) => !progress?.has(l.id)) || flatLessons[0];
  }, [flatLessons, selectedLessonId, progress]);

  const total = flatLessons.length;
  const doneCount = flatLessons.filter((l) => progress?.has(l.id)).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const isCurrentComplete = currentLesson ? !!progress?.has(currentLesson.id) : false;
  const nextLesson = currentLesson
    ? flatLessons[flatLessons.findIndex((l) => l.id === currentLesson.id) + 1]
    : null;

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkComplete = () => {
    if (!currentLesson) return;
    const completing = !isCurrentComplete;
    setComplete.mutate(
      { lessonId: currentLesson.id, complete: completing },
      {
        onSuccess: () => {
          if (completing && nextLesson) setSelectedLessonId(nextLesson.id);
        },
      }
    );
  };

  const lessonDuration = (l: LearnLesson) =>
    l.duration_seconds ?? l.video?.duration_seconds ?? l.audio?.duration_seconds ?? null;

  const renderPlayer = () => {
    if (!currentLesson) return null;
    const Icon = LESSON_ICONS[currentLesson.lesson_type];

    let body: React.ReactNode = null;

    if (currentLesson.lesson_type === 'video') {
      const v = currentLesson.video;
      body = (
        <>
          <button
            onClick={() => v?.file_url && setVideoOpen(true)}
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-bg-warm active:opacity-90 transition-opacity"
          >
            {v?.thumbnail_url ? (
              <img src={v.thumbnail_url} alt={currentLesson.title} className="w-full h-full object-cover" />
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
              onClose={() => setVideoOpen(false)}
              url={v.file_url}
              title={currentLesson.title}
              description={currentLesson.description || undefined}
              isVertical={v.is_vertical || undefined}
              videoId={v.id}
            />
          )}
        </>
      );
    } else if (currentLesson.lesson_type === 'audio') {
      const a = currentLesson.audio;
      const isThisTrack = audioPlayer.currentTrack?.id === a?.id;
      const playing = isThisTrack && audioPlayer.isPlaying;
      body = (
        <div className="flex items-center gap-3 bg-bg-warm rounded-2xl p-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-peach shrink-0 flex items-center justify-center">
            {a?.cover_image_url ? (
              <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Headphones className="h-6 w-6 text-brand" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-fg-warm truncate">{a?.title || currentLesson.title}</p>
            {lessonDuration(currentLesson) && (
              <p className="text-xs text-fg-warm-muted">{formatLessonDuration(lessonDuration(currentLesson))}</p>
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
                  title: a.title || currentLesson.title,
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
    } else if (currentLesson.lesson_type === 'document') {
      const r = currentLesson.reading;
      body = (
        <button
          onClick={() => r?.id && navigate(`/app/read/${r.id}/reader`)}
          className="w-full flex items-center gap-3 bg-bg-warm rounded-2xl p-4 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-peach flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-fg-warm">{r?.title || currentLesson.title}</p>
            <p className="text-xs text-fg-warm-muted">Tap to start reading</p>
          </div>
          <ChevronRight className="h-5 w-5 text-fg-warm-muted shrink-0" />
        </button>
      );
    } else if (currentLesson.lesson_type === 'pdf') {
      body = isNativeApp() ? (
        <div className="flex flex-col items-center py-8 gap-3 bg-bg-warm rounded-2xl">
          <FileText className="h-12 w-12 text-fg-warm-muted" />
          <Button
            onClick={() => currentLesson.pdf_url && smartOpenUrl(currentLesson.pdf_url, navigate)}
            className="rounded-full gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open PDF
          </Button>
        </div>
      ) : (
        <div className="w-full h-[50vh] bg-bg-warm rounded-2xl overflow-hidden">
          {currentLesson.pdf_url && <iframe src={currentLesson.pdf_url} className="w-full h-full" title={currentLesson.title} />}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-3xl shadow-ios p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-peach flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-brand" />
          </div>
          <h2 className="font-bold text-fg-warm flex-1 min-w-0 truncate">{currentLesson.title}</h2>
        </div>
        {body}
        {currentLesson.description && (
          <p className="text-sm text-fg-warm-muted">{currentLesson.description}</p>
        )}
        <Button
          onClick={handleMarkComplete}
          disabled={setComplete.isPending}
          className={cn(
            'w-full rounded-full gap-2 shadow-ios border-0',
            isCurrentComplete
              ? 'bg-mint text-fg-warm'
              : 'bg-brand text-white'
          )}
        >
          {setComplete.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isCurrentComplete ? 'Completed — tap to undo' : nextLesson ? 'Complete & continue' : 'Mark as complete'}
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-warm pb-24">
      <PageHeader
        title="Course"
        back
        subRow={
          total > 0 ? (
            <div className="flex items-center gap-2 w-full">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-xs text-fg-warm-muted shrink-0">{pct}%</span>
            </div>
          ) : undefined
        }
      />
      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : !content || flatLessons.length === 0 ? (
          <div className="bg-card-warm shadow-card-warm rounded-3xl p-8 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-peach flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-brand" />
            </div>
            <p className="font-semibold text-fg-warm">No lessons yet</p>
            <p className="text-sm text-fg-warm-muted">Lessons for this course will appear here soon.</p>
          </div>
        ) : (
          <>
            {renderPlayer()}

            {/* Curriculum */}
            <div className="space-y-3">
              <h3 className="font-bold text-fg-warm px-1">Curriculum</h3>
              {content.modules.map((mod, mi) => {
                const lessons = content.lessons.filter((l) => l.module_id === mod.id);
                const doneInModule = lessons.filter((l) => progress?.has(l.id)).length;
                const expanded = expandedModules.has(mod.id) || currentLesson?.module_id === mod.id;
                return (
                  <div key={mod.id} className="bg-white rounded-3xl shadow-ios overflow-hidden">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center gap-3 p-4 text-left active:bg-bg-warm transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-peach flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-brand">{mi + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-fg-warm truncate">{mod.title}</p>
                        <p className="text-xs text-fg-warm-muted">
                          {doneInModule}/{lessons.length} completed
                        </p>
                      </div>
                      <ChevronRight
                        className={cn('h-5 w-5 text-fg-warm-muted transition-transform', expanded && 'rotate-90')}
                      />
                    </button>
                    {expanded && (
                      <div className="px-3 pb-3 space-y-1">
                        {lessons.map((lesson) => {
                          const Icon = LESSON_ICONS[lesson.lesson_type];
                          const isDone = progress?.has(lesson.id);
                          const isCurrent = currentLesson?.id === lesson.id;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                setSelectedLessonId(lesson.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors active:bg-bg-warm',
                                isCurrent ? 'bg-peach' : ''
                              )}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5 text-brand shrink-0" />
                              ) : (
                                <Icon className="h-5 w-5 text-fg-warm-muted shrink-0" />
                              )}
                              <span
                                className={cn(
                                  'flex-1 min-w-0 truncate text-sm',
                                  isDone ? 'text-fg-warm-muted' : 'text-fg-warm font-medium'
                                )}
                              >
                                {lesson.title}
                              </span>
                              {lessonDuration(lesson) && (
                                <span className="text-xs text-fg-warm-muted shrink-0">
                                  {formatLessonDuration(lessonDuration(lesson))}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
