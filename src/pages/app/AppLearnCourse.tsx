import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Headphones, FileText, BookOpen, CheckCircle2,
  Loader2, ChevronRight, GraduationCap, Lock, Sparkles, Info, Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/app/ui/PageHeader';
import { cn } from '@/lib/utils';
import {
  useLearnCourse, useLearnCourseContent, useLearnProgress, useLearnCourseStartDate,
  lessonUnlockDate, formatUnlockLabel, formatLessonDuration, formatTotalDuration,
  lessonDurationSeconds, type LearnLesson, type LessonType,
} from '@/hooks/useLearn';

const LESSON_ICONS: Record<LessonType, typeof Play> = {
  video: Play,
  audio: Headphones,
  document: BookOpen,
  pdf: FileText,
};

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-peach overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function AppLearnCourse() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: course } = useLearnCourse(courseId);
  const { data: content, isLoading } = useLearnCourseContent(courseId);
  const { data: progress } = useLearnProgress();
  const { data: startDate } = useLearnCourseStartDate(courseId);

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [collapsedTouched, setCollapsedTouched] = useState(false);

  const flatLessons = useMemo(() => {
    if (!content) return [] as LearnLesson[];
    return content.modules.flatMap((m) => content.lessons.filter((l) => l.module_id === m.id));
  }, [content]);

  const total = flatLessons.length;
  const doneCount = flatLessons.filter((l) => progress?.has(l.id)).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const totalSeconds = flatLessons.reduce((s, l) => s + (lessonDurationSeconds(l) || 0), 0);

  const nextLesson = flatLessons.find(
    (l) => !progress?.has(l.id) && !lessonUnlockDate(l, startDate)
  );
  const nextIndex = nextLesson ? flatLessons.findIndex((l) => l.id === nextLesson.id) + 1 : 0;

  const toggleModule = (id: string) => {
    setCollapsedTouched(true);
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openLesson = (lessonId: string) => navigate(`/app/learn/${courseId}/${lessonId}`);

  return (
    <div className="app-theme min-h-screen bg-background pb-28">
      <PageHeader
        title={course?.title || 'Course'}
        back
        onBack={() => navigate('/app/learn')}
        subRow={
          total > 0 ? (
            <div className="flex items-center gap-2 w-full">
              <ProgressBar value={pct} className="flex-1" />
              <span className="text-xs font-medium text-fg-warm-muted shrink-0">{pct}%</span>
            </div>
          ) : undefined
        }
      />

      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <>
            {/* Course hero */}
            <div className="bg-card-warm shadow-card-warm rounded-3xl overflow-hidden">
              {course?.cover_image_url ? (
                <img src={course.cover_image_url} alt={course.title} className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-24 bg-gradient-orange flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              )}
              <div className="p-4 space-y-2.5">
                <h2 className="text-xl font-bold text-fg-warm leading-tight">{course?.title || 'Course'}</h2>
                {course?.subtitle && <p className="text-sm text-fg-warm-muted">{course.subtitle}</p>}

                <div className="flex items-center gap-3 text-xs text-fg-warm-muted flex-wrap">
                  <span>{content?.modules.length || 0} modules</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {total} lessons</span>
                  {totalSeconds > 0 && (
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatTotalDuration(totalSeconds)}</span>
                  )}
                </div>

                {course?.description && (
                  <p className="text-sm text-fg-warm-muted whitespace-pre-line pt-0.5">{course.description}</p>
                )}

                {total > 0 && (
                  <p className="text-sm font-semibold text-fg-warm pt-0.5">
                    {doneCount === total
                      ? 'Course completed 🎉'
                      : `Lesson ${Math.max(nextIndex, 1)} of ${total}`}
                  </p>
                )}

                {nextLesson && (
                  <button
                    onClick={() => openLesson(nextLesson.id)}
                    className="w-full flex items-center justify-center gap-2 bg-brand text-white rounded-full py-3.5 font-semibold shadow-ios active:scale-[0.98] transition-transform mt-1 min-h-[48px]"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    {doneCount === 0 ? 'Start course' : 'Continue'}
                  </button>
                )}
              </div>
            </div>

            {course?.intro_note && (
              <div className="bg-peach rounded-3xl p-4 flex gap-3">
                <Info className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                <p className="text-sm text-fg-warm whitespace-pre-line">{course.intro_note}</p>
              </div>
            )}

            {total === 0 ? (
              <div className="bg-card-warm shadow-card-warm rounded-3xl p-8 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-peach flex items-center justify-center">
                  <GraduationCap className="h-7 w-7 text-brand" />
                </div>
                <p className="font-semibold text-fg-warm">No lessons yet</p>
                <p className="text-sm text-fg-warm-muted">Lessons for this course will appear here soon.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-bold text-fg-warm px-1">Curriculum</h3>
                {content?.modules.map((mod, mi) => {
                  const lessons = content.lessons.filter((l) => l.module_id === mod.id);
                  if (lessons.length === 0) return null;
                  const doneInModule = lessons.filter((l) => progress?.has(l.id)).length;
                  const modPct = lessons.length ? Math.round((doneInModule / lessons.length) * 100) : 0;
                  const autoExpand = !collapsedTouched && nextLesson?.module_id === mod.id;
                  const expanded = expandedModules.has(mod.id) || autoExpand;
                  const modDone = doneInModule === lessons.length;
                  return (
                    <div key={mod.id} className="bg-card-warm shadow-card-warm rounded-3xl overflow-hidden">
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full flex items-center gap-3 p-4 text-left active:opacity-80 transition-opacity min-h-[60px]"
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                          modDone ? 'bg-brand' : 'bg-peach'
                        )}>
                          {modDone ? (
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          ) : (
                            <span className="text-sm font-bold text-brand">{mi + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-fg-warm line-clamp-2 break-words">{mod.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <ProgressBar value={modPct} className="max-w-[120px] flex-1" />
                            <p className="text-xs text-fg-warm-muted">{doneInModule}/{lessons.length}</p>
                          </div>
                        </div>
                        <ChevronRight
                          className={cn('h-5 w-5 text-fg-warm-muted transition-transform', expanded && 'rotate-90')}
                        />
                      </button>

                      {expanded && (
                        <div className="px-3 pb-3 space-y-1.5">
                          {lessons.map((lesson, li) => {
                            const Icon = LESSON_ICONS[lesson.lesson_type] || Play;
                            const isDone = progress?.has(lesson.id);
                            const unlockAt = lessonUnlockDate(lesson, startDate);
                            const isCurrent = nextLesson?.id === lesson.id;
                            const dur = lessonDurationSeconds(lesson);
                            return (
                              <button
                                key={lesson.id}
                                disabled={!!unlockAt}
                                onClick={() => openLesson(lesson.id)}
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all min-h-[52px]',
                                  unlockAt ? 'opacity-60' : 'active:scale-[0.99]',
                                  isCurrent ? 'bg-peach shadow-ios' : 'bg-background'
                                )}
                              >
                                <div className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                  isDone ? 'bg-brand' : isCurrent ? 'bg-white' : 'bg-peach'
                                )}>
                                  {unlockAt ? (
                                    <Lock className="h-4 w-4 text-fg-warm-muted" />
                                  ) : isDone ? (
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  ) : (
                                    <Icon className="h-4 w-4 text-brand" />
                                  )}
                                </div>
                                <span className="flex-1 min-w-0">
                                  <span
                                    className={cn(
                                      'block text-sm line-clamp-2 break-words',
                                      isDone ? 'text-fg-warm-muted' : 'text-fg-warm font-medium'
                                    )}
                                  >
                                    {li + 1}. {lesson.title}
                                  </span>
                                  <span className="flex items-center gap-2 text-xs text-fg-warm-muted">
                                    {unlockAt ? (
                                      formatUnlockLabel(unlockAt)
                                    ) : (
                                      <>
                                        <span className="capitalize">{lesson.lesson_type}</span>
                                        {dur ? <span>· {formatLessonDuration(dur)}</span> : null}
                                      </>
                                    )}
                                  </span>
                                </span>
                                {lesson.is_free_preview && !isDone && (
                                  <Sparkles className="h-4 w-4 text-brand shrink-0" />
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
