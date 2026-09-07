import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, Play, BookOpen, Clock, CheckCircle2, Globe } from 'lucide-react';
import { PageHeader } from '@/components/app/ui/PageHeader';
import { HostBadges } from '@/components/app/HostBadges';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  useLearnCourses, useLearnCourseContent, useLearnProgress, useLearnCourseStartDate,
  lessonUnlockDate, formatTotalDuration, lessonDurationSeconds, type LearnCourse,
} from '@/hooks/useLearn';

const LANGUAGE_OPTIONS = [
  { code: '', label: 'Multilanguage' },
  { code: 'en', label: 'English' },
  { code: 'fa', label: 'Persian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'es', label: 'Spanish' },
];

function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'light' }) {
  return (
    <div className={cn('h-1.5 w-full rounded-full overflow-hidden', tone === 'brand' ? 'bg-peach' : 'bg-white/30')}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', tone === 'brand' ? 'bg-brand' : 'bg-white')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function CourseCard({ course, onOpen, onContinue, onShowDescription }: {
  course: LearnCourse;
  onOpen: () => void;
  onContinue: (lessonId: string) => void;
  onShowDescription: () => void;
}) {
  const { data: content } = useLearnCourseContent(course.id);
  const { data: progress } = useLearnProgress();
  const { data: startDate } = useLearnCourseStartDate(course.id);

  const ordered = content
    ? content.modules.flatMap((m) => content.lessons.filter((l) => l.module_id === m.id))
    : [];
  const total = ordered.length;
  const done = ordered.filter((l) => progress?.has(l.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const next = ordered.find((l) => !progress?.has(l.id) && !lessonUnlockDate(l, startDate));
  const totalSeconds = ordered.reduce((s, l) => s + (lessonDurationSeconds(l) || 0), 0);
  const finished = total > 0 && done === total;

  return (
    <div className="bg-card-warm shadow-card-warm rounded-3xl overflow-hidden">
      <button onClick={onOpen} className="w-full text-left active:opacity-90 transition-opacity">
        <div className="relative">
          {course.cover_image_url ? (
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-28 bg-gradient-orange flex items-center justify-center">
              <GraduationCap className="h-9 w-9 text-white" />
            </div>
          )}
          {finished && (
            <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand shadow-ios">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            </span>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          <h2 className="font-bold text-lg text-fg-warm leading-tight">{course.title}</h2>
          {(course.subtitle || course.description) && (
            <div className="relative">
              <p className="text-sm text-fg-warm-muted line-clamp-2 pr-[4.5em]">
                {course.subtitle || course.description}
              </p>
              {course.description && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDescription();
                  }}
                  className="absolute bottom-0 right-0 text-sm font-semibold text-brand active:opacity-70 transition-opacity bg-gradient-to-l from-card-warm via-card-warm to-transparent pl-8 pr-0"
                >
                  ...more
                </button>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-warm-muted">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> {total} {total === 1 ? 'lesson' : 'lessons'}
            </span>
            {totalSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatTotalDuration(totalSeconds)}
              </span>
            )}
            {course.language && (
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {LANGUAGE_OPTIONS.find((l) => l.code === course.language)?.label || course.language}
              </span>
            )}
            <HostBadges
              contentType="course"
              contentId={course.id}
              size="sm"
              prefix=""
              className="text-fg-warm-muted"
            />
          </div>
          {total > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <ProgressBar value={pct} />
              <p className="text-xs text-fg-warm-muted">{done} of {total} done · {pct}%</p>
            </div>
          )}
        </div>
      </button>

      <div className="px-4 pb-4">
        <button
          onClick={() => (next ? onContinue(next.id) : onOpen())}
          className="w-full flex items-center justify-center gap-2 bg-brand text-white rounded-full py-3.5 font-semibold shadow-ios active:scale-[0.98] transition-transform min-h-[48px]"
        >
          {next ? (
            <>
              <Play className="h-4 w-4 fill-white" />
              {done === 0 ? 'Start course' : 'Continue'}
            </>
          ) : (
            'View course'
          )}
        </button>
      </div>
    </div>
  );
}

export default function AppLearn() {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useLearnCourses();

  return (
    <div className="app-theme min-h-screen bg-background pb-28">
      <PageHeader title="Learn" back backStyle="plain" />
      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : !courses || courses.length === 0 ? (
          <div className="bg-card-warm shadow-card-warm rounded-3xl p-8 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-peach flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-brand" />
            </div>
            <p className="font-semibold text-fg-warm">No courses yet</p>
            <p className="text-sm text-fg-warm-muted">
              When you join a program with lessons, they'll show up here.
            </p>
          </div>
        ) : (
          courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onOpen={() => navigate(`/app/learn/${c.id}`)}
              onContinue={(lessonId) => navigate(`/app/learn/${c.id}/${lessonId}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
