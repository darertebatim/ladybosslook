import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/app/ui/PageHeader';
import { Progress } from '@/components/ui/progress';
import { useLearnCourses, useLearnCourseContent, useLearnProgress, type LearnCourse } from '@/hooks/useLearn';

function CourseCard({ course, onOpen }: { course: LearnCourse; onOpen: () => void }) {
  const { data: content } = useLearnCourseContent(course.id);
  const { data: progress } = useLearnProgress();

  const total = content?.lessons.length ?? 0;
  const done = content ? content.lessons.filter((l) => progress?.has(l.id)).length : 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-card-warm shadow-card-warm rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
    >
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
        {course.description && (
          <p className="text-sm text-fg-warm-muted line-clamp-2">{course.description}</p>
        )}
        {total > 0 && (
          <div className="space-y-1 pt-1">
            <Progress value={pct} className="h-1.5" />
            <p className="text-xs text-fg-warm-muted">
              {done} of {total} lessons completed
            </p>
          </div>
        )}
      </div>
    </button>
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
            <CourseCard key={c.id} course={c} onOpen={() => navigate(`/app/learn/${c.id}`)} />
          ))
        )}
      </div>
    </div>
  );
}
