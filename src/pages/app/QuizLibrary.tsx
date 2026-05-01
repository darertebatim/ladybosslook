import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Quiz {
  id: string;
  title: string;
  slug: string;
  overview: string;
  cover_url: string;
  theme_color: string;
}

export default function QuizLibrary() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('admin_quizzes').select('id, title, slug, overview, cover_url, theme_color')
      .eq('is_active', true).order('sort_order')
      .then(({ data }) => { setQuizzes(data || []); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1"><ChevronLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold">{t('quiz.title')}</h1>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        )) : quizzes.map(q => (
          <button
            key={q.id}
            onClick={() => navigate(`/app/quiz/${q.slug}`)}
            className="rounded-2xl overflow-hidden text-left shadow-ios border bg-card hover:shadow-md transition-shadow"
          >
            <div className="aspect-[6/4] overflow-hidden" style={{ backgroundColor: q.theme_color }}>
              {q.cover_url ? (
                <img src={q.cover_url} alt={q.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🧠</div>
              )}
            </div>
            <div className="p-3 space-y-1">
              <h3 className="text-sm font-semibold leading-tight line-clamp-2">{q.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{q.overview}</p>
              <span className="text-xs font-medium text-primary">{t('quiz.takeTest')}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
