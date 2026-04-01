import { useNavigate } from 'react-router-dom';
import { usePublishedLessons, useReadingProgress } from '@/hooks/useReadingLessons';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { useLessonCards } from '@/hooks/useReadingLessons';

export default function AppRead() {
  const navigate = useNavigate();
  const { data: lessons = [], isLoading } = usePublishedLessons();
  const { data: progress = [] } = useReadingProgress();

  const getProgress = (lessonId: string) => progress.find(p => p.lesson_id === lessonId);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Read & Learn
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Bite-sized lessons from our courses</p>
      </div>

      {/* Lesson grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : lessons.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No lessons available yet</p>
          </div>
        ) : (
          lessons.map(lesson => {
            const prog = getProgress(lesson.id);
            const isCompleted = prog?.completed;
            return (
              <button
                key={lesson.id}
                onClick={() => navigate(`/app/read/${lesson.id}`)}
                className="relative rounded-2xl overflow-hidden text-left transition-transform active:scale-95"
                style={{ backgroundColor: '#F0E3FF' }}
              >
                <div className="p-4 min-h-[176px] flex flex-col justify-between">
                  <div>
                    <span className="text-3xl">{lesson.emoji}</span>
                    <h3 className="font-semibold text-gray-900 mt-2 text-sm leading-tight">{lesson.title}</h3>
                    {lesson.subtitle && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{lesson.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 capitalize">{lesson.category}</span>
                    {isCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
