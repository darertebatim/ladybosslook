import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, Play, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/app/ui/PageHeader';
import { Progress } from '@/components/ui/progress';
import {
  useLearnCourses, useLearnCourseContent, useLearnProgress,
  formatTotalDuration, lessonDurationSeconds, type LearnCourse,
} from '@/hooks/useLearn';

function CourseCard({ course, onOpen, onContinue }: {
  course: LearnCourse;
  onOpen: () => void;
  onContinue: (lessonId: string) => void;
}) {
  const { data: content } = useLearnCourseContent(course.id);
  const { data: progress } = useLearnProgress();

  const ordered = content
    ? content.modules.flatMap((m) => content.lessons.filter((l) => l.module_id === m.id))
    : [];
  const total = ordered.length;
  const done = ordered.filter((l) => progress?.has(l.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const next = ordered.find((l) => !progress?.has(l.id));
  const totalSeconds = ordered.reduce((s, l) => s + (lessonDurationSeconds(l) || 0), 0);

  return (
    <div className="bg-card-warm shadow-card-warm rounded-3xl overflow-hidden">
      <button onClick={onOpen} className="w-full text-left active:opacity-90 transition-opacity">
        {course.cover_image_url && (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-36 object-cover"
            loading="lazy"
          />
        )}
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-lg text-fg-warm">{course.title}</h3>
          {(course.subtitle || course.description) && (
            <p className="text-sm text-fg-warm-muted line-clamp-2">
              {course.subtitle || course.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-fg-warm-muted">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {total} lessons</span>
            {totalSeconds > 0 && <span>{formatTotalDuration(totalSeconds)}</span>}
          </div>
          {total > 0 && (
            <div className="space-y-1 pt-1">
              <Progress value={pct} className="h-1.5" />
              <p className="text-xs text-fg-warm-muted">{done} of {total} lessons completed</p>
            </div>
          )}
        </div>
      </button>
      {next && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onContinue(next.id)}
            className="w-full flex items-center justify-center gap-2 bg-brand text-white rounded-full py-3 font-semibold shadow-ios active:scale-[0.99] transition-transform"
          >
            <Play className="h-4 w-4 fill-white" />
            {done === 0 ? 'Start course' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppLearn() {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useLearnCourses();

  return (
    <div className="min-h-screen bg-bg-warm pb-24">
      <PageHeader title="Learn" back />
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
              When you enroll in a program with lessons, they'll show up here.
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
